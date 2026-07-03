// ==========================================
// THPS WIDGET: LARGE COMPARE SPEECH
// Compares two history attempts side-by-side
// ==========================================

class ThpsCompareSpeech extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-indigo-500 shadow-sm flex flex-col bg-white relative w-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <i data-lucide="scale" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Compare Speeches</h3>
                            <p class="text-[10px] text-slate-400 mt-0.5">Side-by-side metric breakdown</p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-4 mb-6">
                    <div class="flex-1">
                        <select id="compare-select-a" class="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer shadow-sm transition-all text-center appearance-none"></select>
                    </div>
                    <div class="flex-1">
                        <select id="compare-select-b" class="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer shadow-sm transition-all text-center appearance-none"></select>
                    </div>
                </div>

                <div id="compare-grid" class="flex flex-col gap-2">
                    </div>

            </div>
        `;

        this.selectA = this.querySelector('#compare-select-a');
        this.selectB = this.querySelector('#compare-select-b');
        this.grid = this.querySelector('#compare-grid');
        
        this.setupListeners();
        this.populateDropdowns();
    }

    disconnectedCallback() {
        // Clean up the global event listener to prevent memory leaks when the widget is deleted
        if (this.boundUpdate) {
            window.removeEventListener('thps-dashboard-update', this.boundUpdate);
        }
    }

    setupListeners() {
        // Close Button
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        // Dropdown changes trigger re-render
        this.selectA.addEventListener('change', () => this.renderComparison());
        this.selectB.addEventListener('change', () => this.renderComparison());

        // Listen for new speeches being analyzed to dynamically update dropdowns
        this.boundUpdate = () => this.populateDropdowns();
        window.addEventListener('thps-dashboard-update', this.boundUpdate);
    }

    populateDropdowns() {
        const history = window.thps_sessionHistory || [];
        
        // 1. Cache the current selection so it doesn't jarringly reset when a new attempt is recorded
        const currentA = this.selectA.value;
        const currentB = this.selectB.value;

        // Clear current options
        this.selectA.innerHTML = '';
        this.selectB.innerHTML = '';

        // 2. Handle Zero Attempts gracefully
        if (history.length === 0) {
            this.selectA.add(new Option("No attempts yet", ""));
            this.selectB.add(new Option("No attempts yet", ""));
            this.renderComparison();
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // 3. Populate options with just the Attempt Title
        history.forEach((attempt) => {
            this.selectA.add(new Option(attempt.title, attempt.id));
            this.selectB.add(new Option(attempt.title, attempt.id));
        });

        // 4. Restore previous selection if it still exists, otherwise set logical defaults
        if (currentA && Array.from(this.selectA.options).some(o => o.value === currentA)) {
            this.selectA.value = currentA;
        } else {
            this.selectA.selectedIndex = 0; // Top of history
        }

        if (currentB && Array.from(this.selectB.options).some(o => o.value === currentB)) {
            this.selectB.value = currentB;
        } else {
            this.selectB.selectedIndex = history.length > 1 ? 1 : 0; // Second in history if possible
        }
        
        this.renderComparison();
        if (window.lucide) window.lucide.createIcons();
    }

    getColorStyle(key, val) {
        if (val === undefined || val === null || isNaN(val)) return 'text-slate-400 bg-slate-50 border-slate-200';
        
        const pts = window.getMetricPoints ? window.getMetricPoints(key, val) : 0;
        
        // Special styling for the main Score
        if (key === 'totalPoints') {
            if (val >= 8.5) return 'text-emerald-700 bg-emerald-50 border-emerald-300 shadow-sm';
            if (val >= 7) return 'text-blue-700 bg-blue-50 border-blue-300 shadow-sm';
            return 'text-amber-700 bg-amber-50 border-amber-300 shadow-sm';
        }

        // Standard traffic light system for sub-metrics
        if (pts === 1) return 'text-emerald-600 bg-emerald-50/50 border-emerald-200';
        if (pts === 0.75) return 'text-amber-500 bg-amber-50/50 border-amber-200';
        if (pts === 0.25) return 'text-rose-500 bg-rose-50/50 border-rose-200';
        
        return 'text-slate-500 bg-slate-50 border-slate-200';
    }

    renderComparison() {
        const history = window.thps_sessionHistory || [];
        const idA = parseInt(this.selectA.value);
        const idB = parseInt(this.selectB.value);
        
        const attemptA = history.find(h => h.id === idA) || {};
        const attemptB = history.find(h => h.id === idB) || {};

        const metrics = [
            { label: 'Score', key: 'totalPoints' },
            { label: 'Time', key: 'time' },
            { label: 'Pers', key: 'personal' },
            { label: 'Vis', key: 'visual' },
            { label: 'Intg', key: 'intangible' },
            { label: 'WPM', key: 'wpm' },
            { label: 'SPS', key: 'sps' },
            { label: 'Pause', key: 'pause' },
            { label: 'W/Sen', key: 'wps' },
            { label: 'Comp', key: 'grade' },
            { label: 'Sim%', key: 'simple' }
        ];

        this.grid.innerHTML = '';

        metrics.forEach(m => {
            const valA = attemptA[m.key];
            const valB = attemptB[m.key];
            
            const displayA = window.formatMetric ? window.formatMetric(m.key, valA) : valA;
            const displayB = window.formatMetric ? window.formatMetric(m.key, valB) : valB;

            const styleA = this.getColorStyle(m.key, valA);
            const styleB = this.getColorStyle(m.key, valB);
            
            // Emphasize the total score row
            const isScore = m.key === 'totalPoints';
            const textSize = isScore ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base';
            const rowPadding = isScore ? 'py-3 border-b-2 border-slate-200 mb-2' : 'py-1 border-b border-slate-100 last:border-0';

            const rowHTML = `
                <div class="flex flex-row items-center w-full ${rowPadding}">
                    <div class="w-1/3 flex justify-end pr-2 sm:pr-4">
                        <div class="w-full max-w-[100px] text-center font-black ${textSize} p-1.5 rounded-lg border-2 ${styleA}">
                            ${displayA}
                        </div>
                    </div>
                    
                    <div class="w-1/3 text-center text-[9px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">
                        ${m.label}
                    </div>
                    
                    <div class="w-1/3 flex justify-start pl-2 sm:pl-4">
                        <div class="w-full max-w-[100px] text-center font-black ${textSize} p-1.5 rounded-lg border-2 ${styleB}">
                            ${displayB}
                        </div>
                    </div>
                </div>
            `;
            
            this.grid.insertAdjacentHTML('beforeend', rowHTML);
        });
    }
}

customElements.define('thps-compare-speech', ThpsCompareSpeech);

// ==========================================
// THPS WIDGET: LARGE EDIT MODE
// ==========================================

class ThpsEditMode extends HTMLElement {
    connectedCallback() {
        this.virtualDOM = [];
        this.currentMode = "chronological"; // Default mode

        this.innerHTML = `
            <style>
                .github-line { display: flex; font-size: 0.875rem; line-height: 1.5; border-bottom: 1px solid transparent; transition: background-color 0.15s; }
                .github-line:hover { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .github-gutter { width: 3rem; flex-shrink: 0; padding: 0.25rem 0.5rem; text-align: right; color: #94a3b8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; user-select: none; border-right: 1px solid #e2e8f0; margin-right: 1rem; align-items: flex-start; display: flex; justify-content: flex-end; }
                .github-content { flex-grow: 1; padding: 0.25rem 0; color: #334155; }
                .metric-highlight { color: #ef4444; font-weight: bold; } /* Highlights worst offenders */
                
                /* Filter placeholder styles */
                .filter-personal { border-bottom: 2px solid #3b82f6; }
                .filter-visual { border-bottom: 2px solid #ef4444; }
            </style>
            <div class="glass-panel p-4 sm:p-6 rounded-2xl shadow-sm relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <!-- TOOLBAR -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 border-slate-100 gap-3 pr-6 relative z-50">
                    <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-slate-700"><i data-lucide="edit-3" class="w-4 h-4 inline-block mr-1"></i>Edit Mode</h3>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4">
                        <!-- Mode Selector (Exclusive) -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Mode:</label>
                            <select id="edit-mode-select" class="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none hover:bg-slate-100 cursor-pointer">
                                <option value="chronological">Chronological (Off)</option>
                                <option value="long-short">Words / Sentence</option>
                                <option value="syllables" disabled>Syllables / Word (Soon)</option>
                            </select>
                        </div>

                        <!-- Filters Dropdown (Checkboxes - Placeholder for future logic) -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Filters:</label>
                            <div class="group/dropdown relative">
                                <button class="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1 outline-none hover:bg-slate-50 shadow-sm flex items-center gap-1 cursor-pointer">
                                    Select <i data-lucide="chevron-down" class="w-3 h-3"></i>
                                </button>
                                <div class="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 z-50 p-2 flex flex-col gap-2">
                                    <label class="flex items-center gap-2 text-xs text-slate-600 cursor-not-allowed opacity-50"><input type="checkbox" disabled> Personal</label>
                                    <label class="flex items-center gap-2 text-xs text-slate-600 cursor-not-allowed opacity-50"><input type="checkbox" disabled> Visual</label>
                                    <label class="flex items-center gap-2 text-xs text-slate-600 cursor-not-allowed opacity-50"><input type="checkbox" disabled> Overlap</label>
                                    <label class="flex items-center gap-2 text-xs text-slate-600 cursor-not-allowed opacity-50"><input type="checkbox" disabled> Simple</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CONTENT AREA -->
                <div class="thps-edit-content w-full h-80 sm:h-96 rounded-xl border border-slate-200 bg-white overflow-y-auto overflow-x-hidden">
                    <div class="p-4 text-center text-slate-400 italic text-sm mt-10">Waiting for text...</div>
                </div>
            </div>
        `;
        
        // Setup Close Event
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        // Setup Mode Change Event
        this.querySelector('#edit-mode-select').addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            this.renderDOM();
        });
        
        if (window.lucide) window.lucide.createIcons({ root: this });
        window.addEventListener('thps-dashboard-update', (e) => this.processData(e.detail));

        if (window.thps_lastPayload) {
            setTimeout(() => this.processData(window.thps_lastPayload), 50);
        }
    }

    processData(data) {
        if (!data.text || data.text.trim() === '') {
            this.virtualDOM = [];
            this.renderDOM();
            return;
        }

        // 1. Parse text into Virtual DOM Array
        // Using a regex fallback just in case Compromise isn't handling splits the exact way we want.
        const rawSentences = data.text.match(/[^.!?]+[.!?]*/g) || [data.text];
        
        this.virtualDOM = rawSentences.map((sentence, index) => {
            const cleanText = sentence.trim();
            const words = cleanText.split(/\s+/).filter(w => w.length > 0);
            return {
                originalIndex: index + 1,
                text: cleanText,
                wordCount: words.length
            };
        }).filter(item => item.wordCount > 0);

        // 2. Render based on current mode
        this.renderDOM();
    }

    renderDOM() {
        const container = this.querySelector('.thps-edit-content');
        
        if (this.virtualDOM.length === 0) {
            container.innerHTML = `<div class="p-4 text-center text-slate-400 italic text-sm mt-10">Waiting for text...</div>`;
            return;
        }

        // Clone array to safely sort without destroying original order
        let displayArray = [...this.virtualDOM];

        // Apply Mode Sorting
        if (this.currentMode === "long-short") {
            displayArray.sort((a, b) => b.wordCount - a.wordCount);
        }

        // Build HTML
        let htmlOutput = '<div class="py-2">';
        displayArray.forEach(item => {
            let gutterValue = item.originalIndex;
            let gutterClass = "text-slate-400";
            
            // Format gutter text based on mode
            if (this.currentMode === "long-short") {
                gutterValue = item.wordCount;
                // Highlight sentences with 15+ words in red
                if (item.wordCount >= 15) gutterClass = "metric-highlight";
            }

            htmlOutput += `
                <div class="github-line">
                    <div class="github-gutter ${gutterClass}">${gutterValue}</div>
                    <div class="github-content">${item.text}</div>
                </div>
            `;
        });
        htmlOutput += '</div>';

        container.innerHTML = htmlOutput;
    }
}
customElements.define('thps-edit-mode', ThpsEditMode);

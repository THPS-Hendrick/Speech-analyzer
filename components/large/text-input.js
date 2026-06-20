// ==========================================
// THPS WIDGET: LARGE TEXT INPUT
// Safely syncs with the background audio pipeline
// ==========================================

class ThpsTextInput extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-4 sm:p-6 rounded-2xl shadow-sm transition-all duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <label for="cba-inputText-widget" class="block text-sm font-semibold text-slate-700 mb-2 pr-6">Transcribed Audio / Manual Text Entry</label>
                <textarea id="cba-inputText-widget" class="w-full h-48 sm:h-64 p-3 sm:p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all text-slate-700 leading-relaxed text-sm sm:text-base bg-white/50 overflow-y-auto" placeholder="Use the Action Bar above to speak, or paste your own text here..."></textarea>
                
                <div class="mt-4 flex flex-col sm:flex-row flex-wrap items-center gap-3">
                    <button id="cba-analyzeBtn-widget" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                        Refresh Analysis
                    </button>
                    <button id="cba-clearBtn-widget" class="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm active:scale-95">
                        Clear text
                    </button>
                    <button id="cba-copyBtn-widget" class="hidden w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        <span id="cba-copyBtnText-widget">Copy Report</span>
                    </button>
                    <div class="w-full sm:w-auto sm:ml-auto flex items-center justify-center sm:justify-end gap-2 text-xs font-medium text-slate-500">
                        <span id="cba-dictDot-widget" class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span id="cba-dictText-widget">Loading Dictionaries...</span>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        const inputEl = this.querySelector('#cba-inputText-widget');
        const analyzeBtn = this.querySelector('#cba-analyzeBtn-widget');
        const clearBtn = this.querySelector('#cba-clearBtn-widget');
        const copyBtn = this.querySelector('#cba-copyBtn-widget');

        // Listen for the Dashboard Broadcast to sync UI state
        window.addEventListener('thps-dashboard-update', (e) => {
            if (document.activeElement !== inputEl) {
                inputEl.value = e.detail.text || '';
            }
            if (e.detail.text && e.detail.text.trim() !== '') {
                copyBtn.classList.remove('hidden');
                copyBtn.classList.add('flex');
            } else {
                copyBtn.classList.add('hidden');
                copyBtn.classList.remove('flex');
            }
        });

        window.addEventListener('thps-dicts-loaded', () => {
            const dot = this.querySelector('#cba-dictDot-widget');
            const txt = this.querySelector('#cba-dictText-widget');
            analyzeBtn.disabled = false;
            if(dot) { dot.classList.replace('bg-amber-500', 'bg-green-500'); dot.classList.remove('animate-pulse'); }
            if(txt) txt.textContent = "Dictionaries Active";
        });

        inputEl.addEventListener('input', (e) => {
            const hiddenEl = document.getElementById('cba-inputText');
            if (hiddenEl) hiddenEl.value = e.target.value;
            if (window.THPS && window.THPS.Audio) window.THPS.Audio.recordedAudio = false; 
            if (e.target.value.trim() === '') {
                if (window.analyze) window.analyze();
            }
        });

        analyzeBtn.addEventListener('click', () => { if(window.analyze) window.analyze(); });

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            if(window.clearAnalyzer) window.clearAnalyzer();
        });

        copyBtn.addEventListener('click', () => {
            if(window.copyReportToClipboard) window.copyReportToClipboard();
            const btnText = this.querySelector('#cba-copyBtnText-widget');
            if (btnText) {
                btnText.textContent = "Copied to Clipboard!";
                setTimeout(() => { btnText.textContent = "Copy Report"; }, 2500);
            }
        });
        
        if (window.THPS && window.THPS.NLP && window.THPS.NLP.dictsLoaded) {
            window.dispatchEvent(new Event('thps-dicts-loaded'));
        }
    }
}
customElements.define('thps-text-input', ThpsTextInput);

// ==========================================
// THPS WIDGET: MEDIUM SIGNAL-NOISE RATIO
// ==========================================

class ThpsSignalNoise extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Signal-Noise Ratio</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <div class="thps-val text-3xl sm:text-4xl font-bold text-slate-400">0.0</div>
                    <span class="text-sm text-slate-500">Avg words/sentence</span>
                </div>
                <div class="relative w-full mt-4">
                    <div class="absolute left-1/2 -top-1.5 w-0.5 h-5 bg-slate-300 z-10 rounded-full transform -translate-x-1/2"></div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div class="thps-progress h-full transition-all duration-500 bg-slate-300" style="width: 0%"></div>
                    </div>
                </div>
                <div class="flex justify-between items-center mt-3 cursor-pointer thps-toggle-btn">
                    <p class="thps-interpret text-xs sm:text-sm font-medium text-slate-600">Waiting...</p>
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide hover:bg-slate-200 transition-colors shrink-0 ml-2">More Metrics</span>
                </div>
                <div class="thps-accordion-content cba-accordion-content border-t border-slate-100 pt-3">
                    <div class="space-y-2 text-xs mb-5">
                        <div class="flex justify-between"><span class="text-slate-500">Total Words</span><span class="thps-stat-words font-bold text-slate-700">0</span></div>
                        <div class="flex justify-between"><span class="text-slate-500">Total Sentences</span><span class="thps-stat-sentences font-bold text-slate-700">0</span></div>
                        <div class="flex justify-between"><span class="text-slate-500">Total Syllables</span><span class="thps-stat-syllables font-bold text-slate-700">0</span></div>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        const toggleBtn = this.querySelector('.thps-toggle-btn');
        const content = this.querySelector('.thps-accordion-content');
        toggleBtn.addEventListener('click', () => content.classList.toggle('cba-accordion-open'));

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
        
        // NEW: THE "WAKE-UP" CATCH-UP CHECK
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }

    }

    update(data) {
        if (data.wps === undefined) return;
        
        const wps = Math.round(data.wps);
        const valEl = this.querySelector('.thps-val');
        const intEl = this.querySelector('.thps-interpret');
        const prog = this.querySelector('.thps-progress');
        const card = this.querySelector('.score-card');

        valEl.textContent = data.wps.toFixed(1);
        
        let snColor = wps <= 9 ? "#00B700" : wps <= 16 ? "#6366f1" : wps <= 25 ? "#f59e0b" : "#ef4444";
        intEl.textContent = wps <= 9 ? "Very high signal, low noise" : wps <= 16 ? "High signal; moderate noise" : wps <= 25 ? "Moderate signal; high noise" : "Low signal; very high noise";
        
        intEl.style.color = snColor;
        card.style.borderLeftColor = snColor;
        valEl.style.color = snColor;
        prog.style.backgroundColor = snColor;
        prog.style.width = `${Math.min(100, Math.max(0, (wps / 40) * 100))}%`;

        // Extended Metrics
        this.querySelector('.thps-stat-words').textContent = data.numWords || 0;
        this.querySelector('.thps-stat-sentences').textContent = data.numSentences || 0;
        this.querySelector('.thps-stat-syllables').textContent = data.totalSyllables || 0;
    }
}
customElements.define('thps-signal-noise', ThpsSignalNoise);

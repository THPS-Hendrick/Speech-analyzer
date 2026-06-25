// ==========================================
// THPS WIDGET: MEDIUM GOOGLE 10K BENCHMARK
// ==========================================

class ThpsGoogleBenchmark extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Google 10K Benchmark</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <div class="thps-val text-3xl sm:text-4xl font-bold text-slate-400">0%</div>
                    <span class="text-sm text-slate-500">of text</span>
                </div>
                <div class="relative w-full mt-4">
                    <div class="absolute left-1/2 -top-1.5 w-0.5 h-5 bg-slate-300 z-10 rounded-full transform -translate-x-1/2"></div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div class="thps-progress h-full transition-all duration-500 bg-slate-300" style="width: 0%"></div>
                    </div>
                </div>
                <p class="thps-interpret text-xs sm:text-sm font-medium mt-3 text-slate-600">Waiting...</p>
                <p class="thps-count text-[10px] sm:text-xs text-slate-400 mt-1">0 out of 0 words</p>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
        
        // NEW: THE "WAKE-UP" CATCH-UP CHECK
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }

    }

    update(data) {
        if (data.google10kCount === undefined || !data.numWords) return;
        
        let gPct = Math.round((data.google10kCount / data.numWords) * 100);
        
        const valEl = this.querySelector('.thps-val');
        const intEl = this.querySelector('.thps-interpret');
        const countEl = this.querySelector('.thps-count');
        const prog = this.querySelector('.thps-progress');
        const card = this.querySelector('.score-card');

        valEl.textContent = `${gPct}%`;
        countEl.textContent = `${data.google10kCount} out of ${data.numWords} words`;
        
        let gColor = gPct > 80 ? "#10b981" : gPct > 60 ? "#f59e0b" : "#ef4444";
        intEl.textContent = gPct > 80 ? "Highly Common" : gPct > 60 ? "Moderately Common" : "Highly Unique/Niche";
        
        card.style.borderLeftColor = gColor;
        prog.style.backgroundColor = gColor;
        valEl.style.color = gColor;
        prog.style.width = `${Math.min(100, Math.max(0, gPct))}%`;
    }
}
customElements.define('thps-google-benchmark', ThpsGoogleBenchmark);

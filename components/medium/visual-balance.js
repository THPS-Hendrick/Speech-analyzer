// ==========================================
// THPS WIDGET: MEDIUM VISUAL BALANCE
// ==========================================

class ThpsVisualBalance extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual Balance</h3>
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
            </div>
        `;
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (data.visual === undefined) return;
        const visualPercent = data.visual;
        const valEl = this.querySelector('.thps-val');
        const intEl = this.querySelector('.thps-interpret');
        const prog = this.querySelector('.thps-progress');
        const card = this.querySelector('.score-card');

        valEl.textContent = `${visualPercent}%`;
        let vColor = visualPercent <= 29 ? "#94a3b8" : visualPercent <= 44 ? "#10b981" : visualPercent <= 60 ? "#00B700" : "#a855f7";
        intEl.textContent = visualPercent <= 29 ? "Very Intangible" : visualPercent <= 44 ? "Good" : visualPercent <= 60 ? "Very Vivid" : "Reaching poetic levels";
        
        card.style.borderLeftColor = vColor;
        prog.style.backgroundColor = vColor;
        valEl.style.color = vColor;
        prog.style.width = `${Math.min(100, Math.max(0, visualPercent))}%`;
    }
}
customElements.define('thps-visual-balance', ThpsVisualBalance);

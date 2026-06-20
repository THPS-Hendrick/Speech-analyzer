// ==========================================
// THPS WIDGET: MEDIUM SIMPLE LANGUAGE %
// ==========================================

class ThpsSimpleLanguage extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Simple Language</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <div class="thps-val text-3xl sm:text-4xl font-bold text-slate-400">0%</div>
                    <span class="text-sm text-slate-500">Core Vocab</span>
                </div>
                <div class="relative w-full mt-4 flex h-2 rounded-full overflow-hidden bg-slate-100">
                    <div class="thps-bar-5yr h-full bg-slate-300 transition-all duration-500" style="width: 0%"></div>
                    <div class="thps-bar-esl h-full bg-slate-200 transition-all duration-500" style="width: 0%"></div>
                    <div class="thps-bar-kit h-full bg-slate-100 transition-all duration-500" style="width: 0%"></div>
                </div>
                <div class="flex justify-between items-center mt-3 cursor-pointer thps-toggle-btn">
                    <p class="thps-interpret text-xs sm:text-sm font-medium text-slate-600">Waiting...</p>
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide hover:bg-slate-200 transition-colors shrink-0 ml-2">More Metrics</span>
                </div>
                <div class="thps-accordion-content cba-accordion-content border-t border-slate-100 pt-3">
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between"><span class="text-slate-500">5yr Old 1000</span><span class="thps-stat-5yr font-bold text-slate-700">0%</span></div>
                        <div class="flex justify-between"><span class="text-slate-500">ESL 2000</span><span class="thps-stat-esl font-bold text-slate-700">0%</span></div>
                        <div class="flex justify-between"><span class="text-slate-500">Kitchen 1000</span><span class="thps-stat-kit font-bold text-slate-700">0%</span></div>
                        <div class="flex justify-between border-t border-slate-100 pt-1 mt-1"><span class="font-bold text-slate-500">Outside Vocab</span><span class="thps-stat-out font-bold text-slate-700">0%</span></div>
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
    }

    update(data) {
        if (data.simple === undefined || !data.simpleCounts || !data.numWords) return;
        
        const coreSimpleScore = data.simple;
        
        let s5yrPct = Math.round((data.simpleCounts['5yr Old 1000'] / data.numWords) * 100) || 0;
        let sEslPct = Math.round((data.simpleCounts['ESL 2000'] / data.numWords) * 100) || 0;
        let sKitPct = Math.round((data.simpleCounts['Kitchen 1000'] / data.numWords) * 100) || 0;
        let outsidePct = Math.round((data.simpleCounts['outside'] / data.numWords) * 100) || 0;

        this.querySelector('.thps-val').textContent = `${coreSimpleScore}%`;
        this.querySelector('.thps-bar-5yr').style.width = `${s5yrPct}%`;
        this.querySelector('.thps-bar-esl').style.width = `${sEslPct}%`;
        this.querySelector('.thps-bar-kit').style.width = `${sKitPct}%`;
        
        this.querySelector('.thps-interpret').textContent = coreSimpleScore > 85 ? "Extremely Accessible" : coreSimpleScore > 70 ? "Good Accessibility" : "Highly advanced vocabulary";

        // Extended Metrics
        this.querySelector('.thps-stat-5yr').textContent = `${s5yrPct}%`;
        this.querySelector('.thps-stat-esl').textContent = `${sEslPct}%`;
        this.querySelector('.thps-stat-kit').textContent = `${sKitPct}%`;
        this.querySelector('.thps-stat-out').textContent = `${outsidePct}%`;
    }
}
customElements.define('thps-simple-language', ThpsSimpleLanguage);

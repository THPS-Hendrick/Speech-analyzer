// ==========================================
// THPS WIDGET: LARGE "WHAT DOES THIS MEAN?"
// ==========================================

class ThpsWhatsThis extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm bg-blue-50/30 transition-all duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex items-center gap-2 mb-2 pr-6">
                    <i data-lucide="info" class="w-5 h-5 text-blue-600"></i>
                    <h3 id="cba-explanationTitle" class="text-sm font-bold text-blue-900 uppercase tracking-wider">What does this mean?</h3>
                </div>
                <div id="cba-explanationContent" class="text-sm text-slate-600 leading-relaxed border border-blue-100 bg-white/60 p-4 rounded-xl mt-3 min-h-[60px] flex items-center justify-center shadow-inner italic transition-opacity duration-300">
                    Click on any term to learn more...
                </div>
            </div>
        `;
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });
        if (window.lucide) window.lucide.createIcons();
    }
}
customElements.define('thps-whats-this', ThpsWhatsThis);

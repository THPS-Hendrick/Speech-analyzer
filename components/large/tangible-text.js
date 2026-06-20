// ==========================================
// THPS WIDGET: LARGE TANGIBLE TEXT MAP
// ==========================================

class ThpsTangibleText extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-4 sm:p-6 rounded-2xl shadow-sm relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 border-slate-100 gap-2 pr-6">
                    <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-slate-700">Tangible Text Map</h3>
                        <div class="group/tip relative z-50">
                            <span class="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded cursor-help">💡 Tip</span>
                            <div class="absolute left-0 w-56 sm:w-64 p-3 mt-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 pointer-events-none font-normal normal-case tracking-normal z-50">
                                Green text represents Personal content (a specific person doing a specific thing). Red text represents Visual content (things people can see, like colours, sizes, groups, or common objects).
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-3 text-[10px] sm:text-xs text-slate-600 font-medium">
                        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#00B700]/10 border border-[#00B700]"></span> Personal</div>
                        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500/10 border-b border-red-500"></span> Visual (Underlined)</div>
                        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#00B700]/10 border-b-2 border-red-500"></span> Overlap</div>
                    </div>
                </div>
                <div class="thps-highlighted-text w-full h-80 sm:h-96 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white overflow-y-auto text-slate-400 leading-relaxed text-sm sm:text-base italic">Waiting for text...</div>
            </div>
        `;
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        const textContainer = this.querySelector('.thps-highlighted-text');
        if (data.highlightedHTML && data.highlightedHTML.trim() !== '') {
            textContainer.innerHTML = data.highlightedHTML.replace(/\n/g, '<br>');
            textContainer.classList.remove('italic', 'text-slate-400');
            textContainer.classList.add('text-slate-700');
        } else {
            textContainer.innerHTML = "Waiting for text...";
            textContainer.classList.add('italic', 'text-slate-400');
            textContainer.classList.remove('text-slate-700');
        }
    }
}
customElements.define('thps-tangible-text', ThpsTangibleText);

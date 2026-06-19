// ==========================================
// THPS WIDGET: SMALL PACE PILL
// ==========================================

class ThpsPillPace extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-4 rounded-2xl border-t-4 border-amber-500 shadow-sm flex flex-col items-center justify-center bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <!-- SELF DESTRUCT BUTTON (Appears on Hover) -->
                <button class="thps-close-btn absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Speaking Pace</h3>
                <div class="flex items-baseline gap-1">
                    <span class="thps-wpm-val text-3xl sm:text-4xl font-black text-amber-500">-</span>
                    <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">WPM</span>
                </div>
            </div>
        `;

        // The Self-Destruct Logic
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); // Delete the grid slot so it collapses cleanly
            else this.remove(); // Fallback
        });

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (data.wpm === undefined) return;
        this.querySelector('.thps-wpm-val').innerText = data.wpm;
    }
}

customElements.define('thps-pill-pace', ThpsPillPace);

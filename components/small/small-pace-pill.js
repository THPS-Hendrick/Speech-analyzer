// ==========================================
// THPS WIDGET: SMALL PACE PILL
// A self-contained, 1x1 summary metric.
// ==========================================

class ThpsPillPace extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-[240px] transition-transform hover:-translate-y-1 hover:shadow-md">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pace</span>
                </div>
                <div class="flex items-baseline gap-1 text-right">
                    <span class="thps-pace-val text-2xl font-black text-slate-800">--</span>
                    <span class="text-[10px] text-slate-400 font-bold uppercase">WPM</span>
                </div>
            </div>
        `;

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (data.wpm === undefined) return;
        const wpm = data.wpm;
        
        const valEl = this.querySelector('.thps-pace-val');
        valEl.innerText = wpm;
        
        // Color code based on Trackman zones
        if (wpm < 100) {
            valEl.className = 'thps-pace-val text-2xl font-black text-amber-500';
        } else if (wpm > 150) {
            valEl.className = 'thps-pace-val text-2xl font-black text-rose-500';
        } else {
            valEl.className = 'thps-pace-val text-2xl font-black text-emerald-500';
        }
    }
}

customElements.define('thps-pill-pace', ThpsPillPace);

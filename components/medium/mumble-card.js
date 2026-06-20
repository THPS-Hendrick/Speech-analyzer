// ==========================================
// THPS WIDGET: MEDIUM MUMBLE CARD
// ==========================================

class ThpsMumbleCard extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Mumble Meter</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <div class="thps-val text-3xl sm:text-4xl font-bold text-slate-400">0.0</div>
                    <span class="text-sm text-slate-500">Syllables / Sec</span>
                </div>
                <div class="relative w-full h-2.5 rounded-full mt-5" style="background: linear-gradient(to right, #3b82f6, #10b981, #f97316, #ef4444);">
                    <div class="thps-marker absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-white border-2 border-slate-700 rounded-sm shadow-md transition-all duration-500" style="left: 0%; margin-left: -0.375rem;"></div>
                </div>
                <p class="thps-interpret text-xs sm:text-sm font-medium mt-3 text-slate-500">Waiting for Audio...</p>
                <p class="thps-stats text-[10px] sm:text-xs text-slate-400 mt-1">0.0s active / 0.0s pause / 0.0s total</p>
            </div>
        `;
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (data.sps === undefined) return;

        const valEl = this.querySelector('.thps-val');
        const intEl = this.querySelector('.thps-interpret');
        const card = this.querySelector('.score-card');
        const marker = this.querySelector('.thps-marker');
        const stats = this.querySelector('.thps-stats');

        if (!data.recordedAudio || data.time <= 0) {
            valEl.textContent = "0.0";
            valEl.className = 'thps-val text-3xl sm:text-4xl font-bold text-slate-400';
            intEl.textContent = "Waiting for Audio...";
            intEl.style.color = '#64748b'; // slate-500
            card.style.borderLeftColor = '#cbd5e1'; // slate-300
            stats.textContent = "0.0s active / 0.0s pause / 0.0s total";
            return;
        }

        const mumbleScore = data.sps;
        let mColor, mText;
        if (mumbleScore < 2.5) { mColor = "#3b82f6"; mText = "Slightly too slow"; } 
        else if (mumbleScore < 4.0) { mColor = "#10b981"; mText = "Very clear, no mumble"; } 
        else if (mumbleScore <= 5.5) { mColor = "#f97316"; mText = "Slight mumble"; } 
        else { mColor = "#ef4444"; mText = "High Mumbling Risk"; } 

        valEl.textContent = mumbleScore.toFixed(1);
        valEl.className = 'thps-val text-3xl sm:text-4xl font-bold';
        valEl.style.color = mColor;
        intEl.textContent = mText;
        intEl.style.color = mColor;
        card.style.borderLeftColor = mColor;
        marker.style.left = Math.min(100, Math.max(0, (mumbleScore / 8) * 100)) + "%";
        
        if (data.time > 0 && data.pause !== undefined) {
            let totalSecs = data.time;
            let pauseTime = totalSecs * (data.pause / 100);
            let activeSecs = totalSecs - pauseTime;
            stats.textContent = `${activeSecs.toFixed(1)}s active / ${pauseTime.toFixed(1)}s pause / ${totalSecs.toFixed(1)}s analyzed`;
        }
    }
}
customElements.define('thps-mumble-card', ThpsMumbleCard);

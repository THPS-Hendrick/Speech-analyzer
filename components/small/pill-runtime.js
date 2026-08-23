// ==========================================
// THPS WIDGET: SMALL RUNTIME PILL
// ==========================================

class THPSPillRuntime extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-4 rounded-2xl border-t-4 border-indigo-500 shadow-sm transition-colors duration-300 relative group cursor-move flex flex-col justify-center min-h-[100px] h-full">
                <button class="thps-close-btn absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="text-center cursor-help" onclick="window.explain('Runtime')">
                    <div class="text-3xl font-black text-slate-300 transition-colors duration-500" id="pill-runtime-val">-</div>
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Runtime</div>
                </div>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        this.updateHandler = (e) => this.update(e.detail);
        window.addEventListener('thps-dashboard-update', this.updateHandler);
        
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
    }

    update(data) {
        const valEl = this.querySelector('#pill-runtime-val');
        if (!data || !data.recordedAudio || data.time === 0) {
            valEl.innerText = "-";
            valEl.className = "text-3xl font-black text-slate-300 transition-colors duration-500";
            return;
        }

        // Legacy Fallback
        const meaningfulPauses = (data.pauseBuckets?.blue || 0) + (data.pauseBuckets?.green || 0) + (data.pauseBuckets?.orange || 0) + (data.pauseBuckets?.red || 0);
        const activeSecs = data.activeSpeakingSecs !== undefined ? data.activeSpeakingSecs : (data.time * (1 - ((data.pause || 0) / 100)));
        const fallbackRuntime = activeSecs ? (activeSecs / (meaningfulPauses + 1)) : 0;
        const runtimeVal = data.runtime !== undefined ? data.runtime : fallbackRuntime;

        valEl.innerText = `${runtimeVal.toFixed(1)}s`;

        // Color Logic
        let colorClass = "text-slate-800";
        if (runtimeVal >= 3.0 && runtimeVal <= 9.0) colorClass = "text-green-600";
        else if ((runtimeVal > 9.0 && runtimeVal <= 15.0) || (runtimeVal >= 1.5 && runtimeVal < 3.0)) colorClass = "text-amber-500";
        else colorClass = "text-red-500";

        valEl.className = `text-3xl font-black transition-colors duration-500 ${colorClass}`;
    }
}

customElements.define('thps-pill-runtime', THPSPillRuntime);

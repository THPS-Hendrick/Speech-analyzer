// ==========================================
// THPS WIDGET: MEDIUM MUMBLE GAUGE
// ==========================================

class ThpsGaugeMumble extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                .thps-gauge-container { width: 100%; height: 120px; overflow: hidden; position: relative; display: flex; justify-content: center; }
                .thps-gauge-bg { width: 240px; height: 240px; border-radius: 50%; position: absolute; top: 0; background: conic-gradient(from -90deg, #3b82f6 0 60deg, #10b981 60deg 120deg, #f97316 120deg 150deg, #ef4444 150deg 180deg, transparent 180deg 360deg); }
                .thps-gauge-needle { position: absolute; bottom: 0px; left: 50%; width: 4px; height: 100px; background-color: #1e293b; border-radius: 4px; transform-origin: bottom center; transform: translateX(-50%) rotate(-90deg); transition: transform 1.5s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 0 10px rgba(0,0,0,0.2); z-index: 10; }
                .thps-gauge-needle::after { content: ''; position: absolute; bottom: -6px; left: -4px; width: 12px; height: 12px; border-radius: 50%; background: #1e293b; box-shadow: 0 0 5px rgba(0,0,0,0.3); }
                .thps-gauge-cutout { position: absolute; bottom: 0; width: 160px; height: 80px; background-color: white; border-top-left-radius: 100px; border-top-right-radius: 100px; z-index: 5; }
            </style>
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-slate-300 shadow-sm flex flex-col gap-4 bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <!-- SELF DESTRUCT BUTTON (Appears on Hover) -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Mumble Meter</h3>
                        <div class="flex items-baseline gap-2 mt-1">
                            <span class="thps-mumble-val text-3xl sm:text-4xl font-bold text-slate-800">-</span>
                            <span class="text-sm text-slate-500">Syllables/Sec</span>
                        </div>
                    </div>
                    <div class="thps-mumble-label text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 mr-6">WAITING</div>
                </div>
                <div class="thps-gauge-container mt-2">
                    <div class="thps-gauge-bg"></div>
                    <div class="thps-gauge-cutout"></div>
                    <div class="thps-gauge-needle" style="transform: translateX(-50%) rotate(-90deg);"></div>
                </div>
                <div class="flex justify-between text-[10px] text-slate-400 font-bold uppercase px-4">
                    <span>Too Slow</span>
                    <span>Mumbling</span>
                </div>
            </div>
        `;

        // The Self-Destruct Logic
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
        
        // NEW: THE "WAKE-UP" CATCH-UP CHECK
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }

    }

    update(data) {
        if (data.sps === undefined) return;
        const sps = data.sps;
        
        this.querySelector('.thps-mumble-val').innerText = sps.toFixed(1);
        
        const labelEl = this.querySelector('.thps-mumble-label');
        const needleEl = this.querySelector('.thps-gauge-needle');

        let angle = -90; 
        let label = "WAITING";
        let colorClass = "bg-slate-100 text-slate-500";

        if (sps > 0) {
            if (sps < 2.5) {
                label = "TOO SLOW"; colorClass = "bg-blue-100 text-blue-700";
                angle = -90 + (sps / 2.5) * 45; 
            } else if (sps <= 4.0) {
                label = "VERY CLEAR"; colorClass = "bg-green-100 text-green-700";
                angle = -45 + ((sps - 2.5) / 1.5) * 60; 
            } else if (sps <= 5.5) {
                label = "SLIGHT MUMBLE"; colorClass = "bg-amber-100 text-amber-700";
                angle = 15 + ((sps - 4.0) / 1.5) * 45; 
            } else {
                label = "HIGH RISK"; colorClass = "bg-red-100 text-red-700";
                angle = 60 + Math.min(1, (sps - 5.5) / 2) * 30; 
            }
        }

        labelEl.innerText = label;
        labelEl.className = `thps-mumble-label text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide ${colorClass} mr-6`;
        needleEl.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
}

customElements.define('thps-gauge-mumble', ThpsGaugeMumble);

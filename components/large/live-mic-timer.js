// ==========================================
// THPS WIDGET: LARGE LIVE MIC TIMER
// ==========================================

class ThpsLiveMicTimer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group cursor-move">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Mic Timer</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Controls the Vercel Speech-to-Text Pipeline</p>
                    </div>
                </div>

                <!-- The Action Bar -->
                <div id="action-bar" class="relative w-full h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0" onclick="window.toggleRecording()">
                    <div id="timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all ease-linear overflow-hidden z-10"></div>
                    <div class="absolute inset-0 flex z-20 pointer-events-none">
                        <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 25%;"><span class="text-[9px] md:text-xs text-white/70 font-bold tracking-widest leading-none drop-shadow-md">0-1 min</span></div>
                        <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 25%;"><span class="text-[9px] md:text-xs text-white/70 font-bold tracking-widest leading-none drop-shadow-md">1-2 min</span></div>
                        <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 25%;"><span class="text-[9px] md:text-xs text-white/70 font-bold tracking-widest leading-none drop-shadow-md">2-3 min</span></div>
                        <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 20%;"><span class="text-[9px] md:text-xs text-white/70 font-bold tracking-widest leading-none drop-shadow-md">Wrap up</span></div>
                        <div class="flex flex-col items-center justify-end pb-2" style="width: 5%;"><span class="text-[9px] md:text-xs text-white/70 font-bold tracking-widest leading-none drop-shadow-md">error</span></div>
                    </div>
                    <span id="action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-sm md:text-lg drop-shadow-md flex items-center gap-2">
                        <i id="toggle-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                        <span id="toggle-text">TAP TO START RECORDING</span>
                    </span>
                </div>
                <p class="text-[10px] text-slate-400 text-center leading-tight mt-3">Clicking the bar starts the microphone and timers automatically.</p>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });
        
        if (window.lucide) window.lucide.createIcons();
    }
}

customElements.define('thps-live-mic-timer', ThpsLiveMicTimer);

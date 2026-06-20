// ==========================================
// THPS CORE WIDGET: GAME TIMER
// The segmented 90-second Action Bar tailored for daily challenges.
// ==========================================

class ThpsGameTimer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div id="action-bar" class="relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0" onclick="window.toggleTimerAndMic()">
                
                <!-- Progress Fill (Professional Indigo) -->
                <div id="timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all ease-linear overflow-hidden z-10"></div>
                
                <!-- Timing Zones & Markers (90s segmented structure) -->
                <div class="absolute inset-0 flex z-20 pointer-events-none">
                    <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                        <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-no score-</span>
                    </div>
                    <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                        <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">1/4pts</span>
                    </div>
                    <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                        <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">3/4pts</span>
                    </div>
                    <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                        <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">Perfect!</span>
                    </div>
                    <div class="flex flex-col items-center justify-end pb-1" style="width: 11.111%;">
                        <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-</span>
                    </div>
                </div>
                
                <!-- Action Text -->
                <span id="action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-sm md:text-lg drop-shadow-md flex items-center gap-2">
                    <i id="toggle-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                    <span id="toggle-text">TAP TO START GAME</span>
                </span>
            </div>
            
            <p class="text-[10px] text-slate-400 text-center leading-tight mt-3 mb-6">Clicking the bar starts the microphone and timers automatically.</p>
            
            <div id="cba-recordingIndicator" class="hidden mx-auto h-4 w-4 relative mb-4">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}
customElements.define('thps-game-timer', ThpsGameTimer);

// ==========================================
// THPS WIDGET: MEDIUM LIVE MIC TIMER
// Circular 80s SVG Timer with milestone icons
// ==========================================

class THPSTimerMed extends HTMLElement {
    constructor() {
        super();
        this.animationFrame = null;
        this.circumference = 251.2; // 2 * pi * 40 (r=40 in viewBox 100x100)
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 rounded-2xl border-t-4 border-red-500 shadow-sm flex flex-col items-center justify-center bg-white relative w-full h-full min-h-[280px] group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="text-center mb-2 absolute top-4 left-0 w-full">
                    <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Live Timer</h3>
                </div>
                
                <div class="relative w-48 h-48 mx-auto mt-6">
                    <!-- SVG Circular Progress -->
                    <svg class="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                        <!-- Track -->
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" stroke-width="6" fill="none" />
                        <!-- Red Progress Bar -->
                        <circle id="med-timer-progress" cx="50" cy="50" r="40" stroke="#ef4444" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="${this.circumference}" stroke-dashoffset="${this.circumference}" class="transition-all duration-75 ease-linear" />
                    </svg>
                    
                    <!-- 25% Milestone (20s) at 3 o'clock (X: 90%, Y: 50%) -->
                    <div id="med-star-25" class="absolute text-slate-200 transition-colors duration-300 z-0 bg-white rounded-full p-0.5" style="top: 50%; left: 90%; transform: translate(-50%, -50%);">
                        <i data-lucide="star-half" class="w-6 h-6 fill-current"></i>
                    </div>
                    
                    <!-- 75% Milestone (60s) at 9 o'clock (X: 10%, Y: 50%) -->
                    <div id="med-star-75" class="absolute text-slate-200 transition-colors duration-300 z-0 bg-white rounded-full p-0.5" style="top: 50%; left: 10%; transform: translate(-50%, -50%);">
                        <i data-lucide="star" class="w-6 h-6 fill-current"></i>
                    </div>

                    <!-- Center Play/Stop Button -->
                    <button id="med-btn-toggle-mic" class="absolute inset-0 m-auto w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 z-10 border-4 border-white">
                        <i data-lucide="mic" id="med-icon-mic" class="w-7 h-7 pointer-events-none"></i>
                        <i data-lucide="square" id="med-icon-stop" class="w-6 h-6 pointer-events-none hidden fill-current"></i>
                    </button>
                </div>

                <div class="mt-4 text-center">
                    <span id="med-timer-readout" class="font-mono text-xl font-black text-slate-700 tracking-tight">00:00</span>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Close Button
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        // Sync local button to the global toggle function
        this.querySelector('#med-btn-toggle-mic').addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') {
                window.toggleRecording();
            }
        });

        this.startSyncLoop();
    }

    disconnectedCallback() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    startSyncLoop() {
        const progressCircle = this.querySelector('#med-timer-progress');
        const star25 = this.querySelector('#med-star-25');
        const star75 = this.querySelector('#med-star-75');
        const readout = this.querySelector('#med-timer-readout');
        const toggleBtn = this.querySelector('#med-btn-toggle-mic');
        const iconMic = this.querySelector('#med-icon-mic');
        const iconStop = this.querySelector('#med-icon-stop');

        const loop = () => {
            const isActive = window.isActive || false;
            let elapsedSecs = 0;

            if (isActive && window.THPS?.Audio?.recordStartTime) {
                elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
            }

            // Button UI Sync
            if (isActive) {
                toggleBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                toggleBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'animate-pulse');
                iconMic.classList.add('hidden');
                iconStop.classList.remove('hidden');
            } else {
                toggleBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                toggleBtn.classList.remove('bg-red-500', 'hover:bg-red-600', 'animate-pulse');
                iconMic.classList.remove('hidden');
                iconStop.classList.add('hidden');
            }

            // Math: 80 Seconds Max
            const maxTime = 80;
            const cappedSecs = Math.min(elapsedSecs, maxTime);
            const percent = cappedSecs / maxTime;
            
            // SVG Stroke Math
            const offset = this.circumference - (percent * this.circumference);
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = offset;
            }

            // Time formatting
            const mins = Math.floor(cappedSecs / 60).toString().padStart(2, '0');
            const secs = Math.floor(cappedSecs % 60).toString().padStart(2, '0');
            if (readout) readout.innerText = `${mins}:${secs}`;

            // Milestone Stars Logic (20s = 25%, 60s = 75%)
            if (star25) {
                if (elapsedSecs >= 20) {
                    star25.classList.remove('text-slate-200');
                    star25.classList.add('text-yellow-400');
                } else {
                    star25.classList.add('text-slate-200');
                    star25.classList.remove('text-yellow-400');
                }
            }

            if (star75) {
                if (elapsedSecs >= 60) {
                    star75.classList.remove('text-slate-200');
                    star75.classList.add('text-yellow-400');
                } else {
                    star75.classList.add('text-slate-200');
                    star75.classList.remove('text-yellow-400');
                }
            }

            this.animationFrame = requestAnimationFrame(loop);
        };

        this.animationFrame = requestAnimationFrame(loop);
    }
}

customElements.define('thps-timer-med', THPSTimerMed);

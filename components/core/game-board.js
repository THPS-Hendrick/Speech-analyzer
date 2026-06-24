// ==========================================
// THPS WIDGET: LARGE GAME BOARD (VISUAL TWEAKS)
// Contains Cards, Mad-Lib Engine, and Timer Bar
// ==========================================

class ThpsGameBoard extends HTMLElement {
    connectedCallback() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.dataSource = this.getAttribute('data-source') || "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json";
        
        this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };
        this.gameState = 'IDLE'; 
        this.todayData = { challenge: "Entertain us", sponsor: "Socks", script: "Near Far", micCheck: "No hands at all" };
        this.currentStars = 0;
        this.currentDate = this.getAdelaideDateString();

        this.render();
        this.setupListeners();
        
        window.addEventListener('thps-load-date', (e) => {
            this.currentDate = e.detail.dateStr || this.getAdelaideDateString();
            this.fetchDailyCards();
        });

        // Hooks for the Master Application to control the Game Board
        window.addEventListener('thps-game-start', () => this.setGameState('PLAYING'));
        window.addEventListener('thps-game-stop', () => {
            if (this.gameState === 'PLAYING') this.setGameState('ANALYZING');
        });
        
        // RECONNECTED: The Game Board now listens for the score data!
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));

        this.fetchDailyCards();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = formatter.formatToParts(new Date());
        return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
    }

    render() {
        const VERSION_TAG = "v.FINAL.05";

        this.innerHTML = `
            <style>
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg) !important; }
                .card-container { perspective: 1000px; }
            </style>

            <div class="glass-panel p-2 sm:p-4 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50" title="${VERSION_TAG}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col items-center w-full">
                    
                    <div id="gb-board-header-row" class="w-full flex flex-col items-center justify-center mb-4 md:mb-8 mt-2 transition-all duration-500">
                        <h1 id="gb-board-title" class="text-3xl sm:text-4xl uppercase tracking-wider text-slate-900 leading-none transition-colors text-center" style="font-family: 'Permanent Marker', cursive;">
                            Daily Mic-Check
                        </h1>
                        <p class="text-xs md:text-sm text-slate-500 font-medium transition-colors mt-1">
                            Date: <span id="gb-board-date">${this.currentDate}</span>
                        </p>
                    </div>

                    <div id="gb-board-loading" class="max-w-6xl mx-auto text-center text-slate-500 mb-4 text-sm hidden">
                        Fetching challenge...
                    </div>

                    <div class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-1.5 md:gap-4 mb-3 md:mb-6 perspective-1000">
                        
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                            <div id="gb-card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 text-center pointer-events-none thps-chest-bg">
                                    <div class="thps-chest-initial w-full flex flex-col items-center transition-opacity duration-300">
                                        <span class="text-[7px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5">Challenge</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5 shrink-0">Challenge</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-2 md:mb-4">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-challenge"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5 shrink-0">Content</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-1 md:mb-2">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                            <div id="gb-card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 text-center pointer-events-none thps-chest-bg">
                                    <div class="thps-chest-initial w-full flex flex-col items-center transition-opacity duration-300">
                                        <span class="text-[7px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5">Sponsor</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-0.5 shrink-0">Sponsor</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-2 md:mb-4">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-sponsor"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-0.5 shrink-0">Delivery</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-1 md:mb-2">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                            <div id="gb-card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 text-center pointer-events-none thps-chest-bg">
                                    <div class="thps-chest-initial w-full flex flex-col items-center transition-opacity duration-300">
                                        <span class="text-[7px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5">Script</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5 shrink-0">Script</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-2 md:mb-4">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-script"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5 shrink-0">Simplicity</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 mb-1 md:mb-2">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                            <div id="gb-card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-red-800 via-red-900 to-black text-amber-400 rounded-lg md:rounded-xl shadow-md md:shadow-xl border-[1.5px] md:border-[3px] border-amber-400 flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 text-center pointer-events-none thps-chest-bg">
                                    <div class="thps-chest-initial w-full flex flex-col items-center transition-opacity duration-300">
                                        <span class="text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Mic-Check</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 gap-0.5">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-[1.5px] md:border-[3px] border-amber-400 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-red-800 uppercase tracking-widest mb-0.5 shrink-0">Mic-Check</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 gap-0.5 mb-2 md:mb-4">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-micCheck"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-red-800 uppercase tracking-widest mb-0.5 shrink-0">Time & Score</span>
                                        <div class="flex items-center justify-center text-amber-400 fill-amber-400 gap-0.5 mb-1 md:mb-2">
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                            <i data-lucide="star" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </div>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="gb-board-adlib-panel" class="max-w-5xl mx-auto w-full px-2 md:px-4 flex flex-col items-center transition-all duration-500">
                        <div class="w-full bg-slate-50 p-3 md:p-5 rounded-xl border border-slate-200 text-center transition-all duration-500">
                            <h2 class="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 transition-colors">Today's Daily Mic-Check (Level: <span id="gb-board-level-title">Beginner</span>)</h2>
                            <p id="gb-board-adlib" class="text-sm md:text-xl font-serif text-slate-700 leading-snug transition-colors">
                                Loading...
                            </p>
                        </div>
                    </div>

                    <div id="gb-action-bar" data-action="timer-click" class="relative w-full max-w-4xl mx-auto mt-6 md:mt-8 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0 group/action">
                        <div id="gb-timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out overflow-hidden z-10"></div>
                        
                        <div id="gb-timer-markers" class="absolute inset-0 flex z-20 pointer-events-none opacity-100 transition-opacity">
                            <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                                <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-no score-</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                                <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">1/4pts</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                                <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">3/4pts</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-2 border-r-[1.5px] border-white/30" style="width: 22.222%;">
                                <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">Perfect!</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-2" style="width: 11.111%;">
                                <span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-</span>
                            </div>
                        </div>

                        <span id="gb-action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-xs md:text-lg drop-shadow-md flex items-center gap-2 transition-all pointer-events-none">
                            <i id="gb-action-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span id="gb-action-label">TAP TO START GAME</span>
                        </span>

                        <div id="gb-action-restart" data-action="timer-restart" class="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 p-2 rounded-full opacity-0 pointer-events-none transition-all hover:scale-110 active:scale-95 text-white">
                            <i data-lucide="rotate-ccw" class="w-4 h-4 md:w-5 md:h-5"></i>
                        </div>
                    </div>

                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    setupListeners() {
        this.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.thps-close-btn');
            if (closeBtn) {
                const wrapper = this.closest('.cursor-move');
                if (wrapper) wrapper.remove(); 
                else this.remove(); 
                return;
            }

            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            const action = actionEl.getAttribute('data-action');
            
            if (action === 'toggle-card' && this.gameState === 'IDLE') {
                this.toggleCard(actionEl.getAttribute('data-card'));
            } else if (action === 'timer-click') {
                this.handleActionBarClick();
            } else if (action === 'timer-restart') {
                e.stopPropagation();
                this.resetBoardToIdle();
            }
        });
    }

    handleActionBarClick() {
        if (this.gameState === 'IDLE') {
            this.setGameState('PLAYING');
            try {
                if (window.toggleTimerAndMic) window.toggleTimerAndMic();
            } catch (e) {
                console.error("External timer toggle failed:", e);
            }
        } else if (this.gameState === 'PLAYING') {
            this.setGameState('ANALYZING');
            try {
                if (window.toggleTimerAndMic) window.toggleTimerAndMic();
            } catch (e) {
                console.error("External timer stop failed:", e);
            }
        }
    }

    setGameState(newState, finalScoreNum = 0) {
        this.gameState = newState;
        const bar = this.querySelector('#gb-action-bar');
        const textLabel = this.querySelector('#gb-action-label');
        const icon = this.querySelector('#gb-action-icon');
        const prog = this.querySelector('#gb-timer-progress');
        const markers = this.querySelector('#gb-timer-markers');
        const restartBtn = this.querySelector('#gb-action-restart');

        if (newState === 'PLAYING') {
            textLabel.innerText = "TAP TO STOP";
            icon.setAttribute('data-lucide', 'square');
            bar.classList.replace('bg-slate-800', 'bg-rose-600');
            bar.classList.replace('hover:bg-slate-700', 'hover:bg-rose-500');
            prog.style.width = '0%';
            
            this.playStartTime = Date.now();
            if (this.internalTimer) clearInterval(this.internalTimer);
            this.internalTimer = setInterval(() => {
                let elapsed = (Date.now() - this.playStartTime) / 1000;
                if (elapsed <= 90) {
                    prog.style.width = `${(elapsed / 90) * 100}%`;
                } else {
                    clearInterval(this.internalTimer);
                    if (this.gameState === 'PLAYING') {
                        this.setGameState('ANALYZING');
                        try {
                            if (window.toggleTimerAndMic) window.toggleTimerAndMic();
                        } catch (e) {
                            console.error("Auto-stop failed:", e);
                        }
                    }
                }
            }, 50);

            if (window.lucide) window.lucide.createIcons();
        } 
        else if (newState === 'ANALYZING') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            
            textLabel.innerText = "CHECKING YOUR MIC-CHECK SCORES...";
            icon.setAttribute('data-lucide', 'loader-2');
            icon.classList.add('animate-spin');
            
            bar.classList.remove('bg-rose-600', 'hover:bg-rose-500');
            bar.classList.add('bg-slate-800', 'hover:bg-slate-800');
            prog.style.width = '0%';
            markers.classList.add('opacity-0');

            this.querySelectorAll('.thps-chest-initial').forEach(el => el.classList.add('opacity-0'));
            
            ['challenge', 'sponsor', 'script', 'micCheck'].forEach((key) => {
                const cardEl = this.querySelector(`#gb-card-${key}`);
                if (cardEl) {
                    cardEl.classList.remove('rotate-y-180');
                    const backFace = cardEl.querySelector('.thps-chest-bg');
                    if (backFace) {
                        backFace.classList.add('bg-slate-900', 'border-slate-700');
                        backFace.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-emerald-700', 'bg-gradient-to-br', 'from-red-800', 'via-red-900', 'to-black');
                    }
                }
            });

            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 300);

            if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout);
            this.analyzingTimeout = setTimeout(() => {
                if (this.gameState === 'ANALYZING') {
                    this.setGameState('SCORED', -1);
                }
            }, 15000); 
        }
        else if (newState === 'SCORED') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout);

            icon.classList.remove('animate-spin');
            icon.classList.add('hidden'); 
            
            restartBtn.classList.remove('opacity-0', 'pointer-events-none');
            restartBtn.classList.add('opacity-100', 'pointer-events-auto');

            prog.style.width = '100%';
            let msg = "";
            if (finalScoreNum === -1) {
                prog.className = 'absolute left-0 top-0 h-full bg-slate-600 transition-all duration-500 ease-out overflow-hidden z-10';
                msg = "CHECK YOUR SCORES";
                textLabel.classList.replace('text-white', 'text-slate-200');
            } else if (finalScoreNum < 5.0) {
                prog.className = 'absolute left-0 top-0 h-full bg-slate-600 transition-all duration-500 ease-out overflow-hidden z-10';
                msg = `SCORE: ${finalScoreNum.toFixed(2)} - CHECK YOUR SCORES`;
                textLabel.classList.replace('text-white', 'text-slate-200');
            } else if (finalScoreNum < 8.5) {
                prog.className = 'absolute left-0 top-0 h-full bg-amber-500 transition-all duration-500 ease-out overflow-hidden z-10';
                msg = `SCORE: ${finalScoreNum.toFixed(2)} - SO CLOSE!`;
            } else {
                prog.className = 'absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500 ease-out overflow-hidden z-10';
                msg = `SCORE: ${finalScoreNum.toFixed(2)} - YOU DID IT!`;
            }

            textLabel.innerText = msg;

            ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
                const cardEl = this.querySelector(`#gb-card-${key}`);
                if (cardEl) {
                    cardEl.classList.remove('rotate-y-180');
                    void cardEl.offsetWidth; 
                    
                    const promptView = cardEl.querySelector('.thps-prompt-view');
                    const resultView = cardEl.querySelector('.thps-result-view');
                    
                    if (promptView) promptView.classList.add('hidden');
                    if (resultView) {
                        resultView.classList.remove('hidden');
                        resultView.classList.add('flex');
                    }
                    
                    cardEl.classList.add('rotate-y-180'); 
                }
            });

            if (window.lucide) window.lucide.createIcons();
        }
    }

    resetBoardToIdle() {
        this.gameState = 'IDLE';
        if (this.internalTimer) clearInterval(this.internalTimer);
        if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout);
        
        const bar = this.querySelector('#gb-action-bar');
        const textLabel = this.querySelector('#gb-action-label');
        const icon = this.querySelector('#gb-action-icon');
        const prog = this.querySelector('#gb-timer-progress');
        const markers = this.querySelector('#gb-timer-markers');
        const restartBtn = this.querySelector('#gb-action-restart');
        
        textLabel.innerText = "TAP TO START GAME";
        textLabel.classList.replace('text-slate-200', 'text-white');
        icon.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'play');
        
        bar.className = 'relative w-full max-w-4xl mx-auto mt-6 md:mt-8 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0 group/action';
        
        prog.className = 'absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out overflow-hidden z-10';
        prog.style.width = '0%';
        
        markers.classList.remove('opacity-0');
        
        restartBtn.classList.remove('opacity-100', 'pointer-events-auto');
        restartBtn.classList.add('opacity-0', 'pointer-events-none');

        const cardData = [
            { id: 'challenge', bg: 'bg-blue-600' },
            { id: 'sponsor', bg: 'bg-purple-600' },
            { id: 'script', bg: 'bg-emerald-700' },
            { id: 'micCheck', bg: 'bg-gradient-to-br', extra: ['from-red-800', 'via-red-900', 'to-black'] }
        ];

        cardData.forEach(c => {
            const cardEl = this.querySelector(`#gb-card-${c.id}`);
            if (cardEl) {
                const backFace = cardEl.querySelector('.thps-chest-bg');
                if (backFace) {
                    backFace.classList.remove('bg-slate-900', 'border-slate-700');
                    backFace.classList.add(c.bg);
                    if (c.extra) c.extra.forEach(ext => backFace.classList.add(ext));
                    
                    const initialEl = backFace.querySelector('.thps-chest-initial');
                    const resultsEl = backFace.querySelector('.thps-card-results');
                    
                    if (initialEl) initialEl.classList.remove('opacity-0');
                    if (resultsEl) {
                        resultsEl.innerHTML = ''; 
                        resultsEl.classList.add('opacity-0');
                    }
                }

                const promptView = cardEl.querySelector('.thps-prompt-view');
                const resultView = cardEl.querySelector('.thps-result-view');
                if (promptView) promptView.classList.remove('hidden');
                if (resultView) {
                    resultView.classList.add('hidden');
                    resultView.classList.remove('flex');
                }
                
                if (this.cardStates[c.id]) cardEl.classList.add('rotate-y-180');
                else cardEl.classList.remove('rotate-y-180');
            }
        });

        if (window.lucide) window.lucide.createIcons();
        if (window.clearAnalyzer) window.clearAnalyzer();
    }

    update(data) {
        try {
            if (this.gameState !== 'ANALYZING') return;
            if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout); 
            
            const containers = this.querySelectorAll('.thps-card-results');
            if (containers.length < 4) return; 
            
            const cContent = containers[0];
            const cDelivery = containers[1];
            const cSimplicity = containers[2];
            const cTime = containers[3];

            // RESTORED CUSTOM BADGE DESIGN
            const makeRow = (label, val, pts, color) => `
                <div class="flex flex-col items-center justify-center w-full shrink-0">
                    <span class="text-[7px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 text-center">${label}</span>
                    <div class="flex items-center gap-1 md:gap-1.5">
                        <span class="text-xs md:text-base font-black text-slate-700 leading-none">${val}</span>
                        <span class="text-[7px] md:text-[9px] font-bold px-1.5 py-0.5 rounded text-white bg-transparent border border-transparent ${color}">${pts}</span>
                    </div>
                </div>
            `;

            let personal = data.personal || 0;
            let visual = data.visual || 0;
            let intangible = data.intangible || 0;

            let pPts = '+1', pColor = 'text-emerald-400';
            if (personal < 30) { pPts = '+0.25'; pColor = 'text-rose-400'; }
            else if (personal > 60) { pPts = '+0.75'; pColor = 'text-amber-400'; }
            
            let vPts = '+1', vColor = 'text-emerald-400';
            if (visual < 20) { vPts = '+0.25'; vColor = 'text-rose-400'; }
            else if (visual > 50) { vPts = '+0.75'; vColor = 'text-amber-400'; }

            let iPts = '+1', iColor = 'text-emerald-400';
            if (intangible > 45) { iPts = '+0.25'; iColor = 'text-rose-400'; }
            else if (intangible >= 30) { iPts = '+0.75'; iColor = 'text-amber-400'; }

            cContent.innerHTML = `
                <div class="w-full h-full flex flex-col justify-evenly items-center pb-1">
                    ${makeRow('Personal', Math.round(personal) + '%', pPts, pColor)}
                    ${makeRow('Visual', Math.round(visual) + '%', vPts, vColor)}
                    ${makeRow('Intangible', Math.round(intangible) + '%', iPts, iColor)}
                </div>
            `;

            let wpm = data.wpm || 0;
            let sps = data.sps || 0;
            let pause = data.pause || 0;

            let wpmPts = '+1', wpmColor = 'text-emerald-400';
            if (wpm < 100) { wpmPts = '+0.75'; wpmColor = 'text-amber-400'; }
            else if (wpm > 150) { wpmPts = '+0.25'; wpmColor = 'text-rose-400'; }

            let spsPts = '+1', spsColor = 'text-emerald-400';
            if (sps < 3) { spsPts = '+0.75'; spsColor = 'text-amber-400'; }
            else if (sps > 5) { spsPts = '+0.25'; spsColor = 'text-rose-400'; }

            let pzPts = '+1', pzColor = 'text-emerald-400';
            if (pause < 10) { pzPts = '+0.25'; pzColor = 'text-rose-400'; }
            else if (pause > 30) { pzPts = '+0.75'; pzColor = 'text-amber-400'; }

            cDelivery.innerHTML = `
                <div class="w-full h-full flex flex-col justify-evenly items-center pb-1">
                    ${makeRow('Words / min', wpm, wpmPts, wpmColor)}
                    ${makeRow('Mumble', sps.toFixed(1), spsPts, spsColor)}
                    ${makeRow('Pause', pause.toFixed(0) + '%', pzPts, pzColor)}
                </div>
            `;

            let wps = data.wps || 0;
            let grade = data.grade || 0;
            let simple = data.simple || 0;

            let wpsPts = '+1', wpsColor = 'text-emerald-400';
            if (wps < 5) { wpsPts = '+0.75'; wpsColor = 'text-amber-400'; }
            else if (wps > 15) { wpsPts = '+0.25'; wpsColor = 'text-rose-400'; }

            let gradePts = '+1', gradeColor = 'text-emerald-400';
            if (grade < 5) { gradePts = '+0.75'; gradeColor = 'text-amber-400'; }
            else if (grade > 10) { gradePts = '+0.25'; gradeColor = 'text-rose-400'; }

            let simplePts = '+1', simpleColor = 'text-emerald-400';
            if (simple < 85) { simplePts = '+0.25'; simpleColor = 'text-rose-400'; }
            else if (simple > 95) { simplePts = '+0.75'; simpleColor = 'text-amber-400'; }

            cSimplicity.innerHTML = `
                <div class="w-full h-full flex flex-col justify-evenly items-center pb-1">
                    ${makeRow('Words / idea', wps.toFixed(1), wpsPts, wpsColor)}
                    ${makeRow('Reading Lvl', grade.toFixed(1), gradePts, gradeColor)}
                    ${makeRow('Simple Vocab', simple + '%', simplePts, simpleColor)}
                </div>
            `;

            let time = data.time || 0;
            let totalPoints = data.totalPoints || 0;
            let overrideGrade = data.overrideGrade || false;

            let timePts = '', timeColor = '';
            if (time < 20 || time >= 80) { timePts = '0'; timeColor = 'text-slate-500'; }
            else if (time >= 20 && time < 40) { timePts = '+0.25'; timeColor = 'text-rose-400'; }
            else if (time >= 40 && time < 60) { timePts = '+0.75'; timeColor = 'text-amber-400'; }
            else if (time >= 60 && time < 80) { timePts = '+1'; timeColor = 'text-emerald-400'; }

            let finalGrade = overrideGrade ? "-" : (totalPoints % 1 === 0 ? totalPoints : totalPoints.toFixed(2));
            let finalGradeNum = overrideGrade ? -1 : totalPoints;

            cTime.innerHTML = `
                <div class="w-full h-full flex flex-col justify-evenly items-center pb-1">
                    ${overrideGrade ? '' : makeRow('Time', time.toFixed(0) + 's', timePts, timeColor)}
                    <div class="flex flex-col items-center justify-center w-full mt-1 md:mt-2 shrink-0">
                        <span class="text-[6px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1 md:mb-1.5">Final Grade</span>
                        <span class="text-2xl md:text-4xl font-black text-blue-600 leading-none">${finalGrade}</span>
                    </div>
                </div>
            `;

            this.setGameState('SCORED', finalGradeNum);

        } catch (err) {
            console.error("Game Board Update Error:", err);
            this.setGameState('SCORED', -1);
        }
    }

    setDifficulty(stars) {
        if (stars === 1) this.cardStates = { challenge: false, sponsor: true, script: false, micCheck: false };
        else if (stars === 2) this.cardStates = { challenge: false, sponsor: true, script: true, micCheck: false };
        else if (stars === 3) this.cardStates = { challenge: true, sponsor: true, script: true, micCheck: false };
        else if (stars === 4) this.cardStates = { challenge: false, sponsor: true, script: true, micCheck: true };
        else if (stars === 5) this.cardStates = { challenge: true, sponsor: true, script: true, micCheck: true };
        else this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };

        ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
            const cardEl = this.querySelector(`#gb-card-${key}`);
            if (cardEl) {
                if (this.cardStates[key]) cardEl.classList.add('rotate-y-180');
                else cardEl.classList.remove('rotate-y-180');
            }
        });

        this.updateDifficultyVisuals();
        this.updateAdLib();
    }

    toggleCard(key) {
        this.cardStates[key] = !this.cardStates[key];
        const cardEl = this.querySelector(`#gb-card-${key}`);
        if (cardEl) {
            if (this.cardStates[key]) cardEl.classList.add('rotate-y-180');
            else cardEl.classList.remove('rotate-y-180');
        }
        this.updateDifficultyVisuals();
        this.updateAdLib();
    }

    updateDifficultyVisuals() {
        let stars = 0;
        if (this.cardStates.challenge) stars += 1;
        if (this.cardStates.sponsor) stars += 1;
        if (this.cardStates.script) stars += 1;
        if (this.cardStates.micCheck) stars += 2;
        
        stars = Math.max(0, Math.min(5, stars));
        this.currentStars = stars;

        const levelLabels = { 0: "Blank", 1: "Beginner", 2: "Better", 3: "Brave", 4: "Bold", 5: "Brilliant!" };
        const levelTextEl = this.querySelector('#gb-board-level-title'); 
        if (levelTextEl) levelTextEl.innerText = levelLabels[stars] || 'Blank';

        this.dispatchEvent(new CustomEvent('thps-game-state', { 
            detail: { stars: this.currentStars, date: this.currentDate }, 
            bubbles: true, 
            composed: true 
        }));
    }

    async fetchDailyCards() {
        const dateEl = this.querySelector('#gb-board-date');
        const loadingEl = this.querySelector('#gb-board-loading');
        
        if (dateEl) dateEl.innerText = this.currentDate;
        if (loadingEl) loadingEl.classList.remove('hidden');

        try {
            if (!this.dataSource.includes("YOUR_USERNAME")) {
                const response = await fetch(this.dataSource + '?nocache=' + new Date().getTime());
                if (response.ok) {
                    const data = await response.json();
                    if (data[this.currentDate]) {
                        this.todayData = data[this.currentDate];
                    }
                }
            }
        } catch (error) {
            console.warn("Could not load JSON. Using fallback data.");
        } finally {
            if (loadingEl) loadingEl.classList.add('hidden');
        }

        this.querySelector('#gb-text-challenge').innerText = this.todayData?.challenge || 'Talk';
        this.querySelector('#gb-text-sponsor').innerText = this.todayData?.sponsor || 'Something';
        this.querySelector('#gb-text-script').innerText = this.todayData?.script || 'Near Far';
        this.querySelector('#gb-text-micCheck').innerText = this.todayData?.micCheck || 'Use your hands';

        this.setDifficulty(1);
    }

    updateAdLib() {
        const blankStyle = "font-medium text-slate-400 underline decoration-slate-300 decoration-dashed underline-offset-8";
        
        const cText = this.todayData?.challenge || 'Talk';
        const sText = this.todayData?.sponsor || 'something you like';
        const scText = this.todayData?.script || 'any';
        const mText = this.todayData?.micCheck || 'to have fun';

        const formattedScText = String(scText).trim().split(/\s+/).join(' + ');
        
        const challengeStr = this.cardStates.challenge ? `<span class="font-bold text-blue-700">${cText}</span>` : `<span class="${blankStyle}">Talk</span>`;
        const sponsorStr = this.cardStates.sponsor ? `<span class="font-bold text-purple-700">${sText}</span>` : `<span class="${blankStyle}">something you like</span>`;
        const scriptStr = this.cardStates.script ? `<span class="font-bold text-emerald-700">${formattedScText}</span>` : `<span class="${blankStyle}">any</span>`;
        const micCheckStr = this.cardStates.micCheck ? `to <span class="font-bold text-rose-600">${mText}</span>` : `<span class="${blankStyle}">to have fun</span>`;

        const adlibEl = this.querySelector('#gb-board-adlib');
        if (adlibEl) {
            adlibEl.innerHTML = `${challengeStr} about ${sponsorStr}, with ${scriptStr} examples, and don't forget ${micCheckStr}!`;
        }
    }
}

customElements.define('thps-game-board', ThpsGameBoard);

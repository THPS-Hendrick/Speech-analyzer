// ==========================================
// THPS WIDGET: LARGE GAME BOARD (FINAL UI POLISH)
// Contains Cards, Star Selector, Mad-Lib Engine, and Timer Bar
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
        const VERSION_TAG = "v.FINAL.02";

        this.innerHTML = `
            <style>
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg) !important; }
                .card-container { perspective: 1000px; }
                .star-filled { fill: #eab308; color: #eab308; } 
                .star-empty { fill: transparent; color: #94a3b8; } 
                .star-hover { fill: #fde047 !important; color: #fde047 !important; } 
            </style>

            <div class="glass-panel p-5 sm:p-8 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50" title="${VERSION_TAG}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col items-center w-full">
                    
                    <div id="gb-board-header-row" class="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6 md:mb-10 mt-2 px-2 md:px-8 transition-all duration-500">
                        <div class="flex flex-col items-center gap-2">
                            <h1 id="gb-board-title" class="text-4xl md:text-5xl uppercase tracking-wider text-slate-900 transition-colors flex items-center justify-center gap-3" style="font-family: 'Permanent Marker', cursive;">
                                <span class="flex flex-col text-center leading-[0.9]">
                                    <span>Daily</span>
                                    <span>Mic-Check</span>
                                </span>
                            </h1>
                            <p class="text-sm md:text-lg text-slate-500 font-medium transition-colors mt-2">
                                Date: <span id="gb-board-date">${this.currentDate}</span>
                            </p>
                        </div>
                        <div id="gb-board-star-panel" class="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg bg-white border border-slate-200 gap-2 transition-all duration-500 w-auto">
                            <span id="gb-board-level" class="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">Level: Beginner</span>
                            <div class="flex gap-2 md:gap-3 mt-1" id="gb-board-stars">
                                <div data-action="set-stars" data-stars="1" class="cursor-pointer"><i data-lucide="star" data-stars="1" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="2" class="cursor-pointer"><i data-lucide="star" data-stars="2" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="3" class="cursor-pointer"><i data-lucide="star" data-stars="3" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="4" class="cursor-pointer"><i data-lucide="star" data-stars="4" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="5" class="cursor-pointer"><i data-lucide="star" data-stars="5" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                            </div>
                        </div>
                    </div>

                    <div id="gb-board-loading" class="max-w-6xl mx-auto text-center text-slate-500 mb-4 text-sm hidden">
                        Fetching challenge...
                    </div>

                    <!-- CARDS (Dual-Layer Architecture) -->
                    <div class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-2 md:gap-6 mb-8 md:mb-12 perspective-1000">
                        
                        <!-- Challenge Card -->
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                            <div id="gb-card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Challenge</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Challenge</span>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-challenge"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 md:mb-2 shrink-0">Content</span>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sponsor Card -->
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                            <div id="gb-card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Sponsor</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-xs font-bold text-purple-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Sponsor</span>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-sponsor"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1 md:mb-2 shrink-0">Delivery</span>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Script Card -->
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                            <div id="gb-card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl shadow-md md:shadow-xl border-2 md:border-4 border-white flex flex-col items-center justify-center p-1 text-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Script</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Script</span>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-script"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 md:mb-2 shrink-0">Simplicity</span>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mic-Check Card -->
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                            <div id="gb-card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl shadow-md md:shadow-xl border-[1.5px] md:border-[3px] border-amber-400 bg-gradient-to-br from-red-800 via-red-900 to-black flex flex-col items-center justify-center p-1 md:p-6 text-center pointer-events-none">
                                    <i data-lucide="mic" class="text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-3 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i>
                                    <span class="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">Mic-Check</span>
                                    <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-2 inline-block shadow-sm border border-amber-200">2 STARS</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-[1.5px] md:border-[3px] border-amber-400 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1 md:px-3 rotate-y-180 shadow-md md:shadow-xl pointer-events-none overflow-hidden">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-xs font-bold text-red-800 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Mic-Check</span>
                                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                            <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="gb-text-micCheck"></span>
                                        </div>
                                    </div>
                                    <div class="thps-result-view hidden flex-col items-center w-full h-full">
                                        <span class="text-[7px] md:text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1 md:mb-2 shrink-0">Time & Score</span>
                                        <div class="thps-card-results flex-1 w-full flex flex-col justify-evenly pb-1 md:pb-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AD-LIB PANEL -->
                    <div id="gb-board-adlib-panel" class="max-w-5xl mx-auto w-full px-4 flex flex-col items-center transition-all duration-500">
                        <div class="w-full bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 text-center transition-all duration-500">
                            <h2 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 transition-colors">Today's Daily Mic-Check is...</h2>
                            <p id="gb-board-adlib" class="text-lg md:text-3xl font-serif text-slate-700 leading-relaxed md:leading-loose transition-colors">
                                Loading...
                            </p>
                        </div>
                    </div>

                    <!-- ACTION BAR (Integrated Timer & Sequence Engine) -->
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

                        <!-- Restart Button -->
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
            } else if (action === 'set-stars' && this.gameState === 'IDLE') {
                this.setDifficulty(parseInt(actionEl.getAttribute('data-stars')));
            } else if (action === 'timer-click') {
                this.handleActionBarClick();
            } else if (action === 'timer-restart') {
                e.stopPropagation();
                this.resetBoardToIdle();
            }
        });

        this.addEventListener('mouseover', (e) => {
            if (this.gameState !== 'IDLE') return;
            const actionEl = e.target.closest('[data-action="set-stars"]');
            if (actionEl) {
                const count = parseInt(actionEl.getAttribute('data-stars'));
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`.board-star[data-stars="${i}"]`);
                    if (s) s.classList[i <= count ? 'add' : 'remove']('star-hover');
                }
            }
        });

        this.addEventListener('mouseout', (e) => {
            if (this.gameState !== 'IDLE') return;
            if (e.target.closest('#gb-board-stars')) {
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`.board-star[data-stars="${i}"]`);
                    if (s) s.classList.remove('star-hover');
                }
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

            // Hide initial faces, wait for data
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

            // 15 Second failsafe so the board doesn't freeze if data never comes
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

            // SYNCHRONIZED FLIP REVEAL
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

            // TWEAKED FOR SMALLER HEIGHT: Compressed margins, padding, and text sizing
            const makeRow = (label, val, pts, color) => `
                <div class="flex flex-col items-center justify-center w-full shrink-0">
                    <span class="text-[6px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1 text-center">${label}</span>
                    <div class="flex items-center gap-1 md:gap-1.5">
                        <span class="text-[10px] md:text-[13px] font-black text-slate-700 leading-none">${val}</span>
                        <span class="text-[6px] md:text-[9px] font-bold px-1 py-0.5 md:px-1.5 rounded text-white bg-slate-800 border border-slate-700 ${color}">${pts}</span>
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

            // Compressed height for Final Grade section
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
        const levelTextEl = this.querySelector('#gb-board-level');
        if (levelTextEl) levelTextEl.innerText = `Level: ${levelLabels[stars] || 'Blank'}`;

        for (let i = 1; i <= 5; i++) {
            const starEl = this.querySelector(`.board-star[data-stars="${i}"]`);
            if (starEl) {
                if (i <= stars) {
                    starEl.classList.remove('star-empty');
                    starEl.classList.add('star-filled');
                } else {
                    starEl.classList.remove('star-filled');
                    starEl.classList.add('star-empty');
                }
            }
        }

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

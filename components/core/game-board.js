// ==========================================
// THPS WIDGET: LARGE GAME BOARD
// Contains Cards, Star Selector, and Mad-Lib Engine
// ==========================================

class ThpsGameBoard extends HTMLElement {
    connectedCallback() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.dataSource = this.getAttribute('data-source') || "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json";
        
        this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };
        this.gameState = 'IDLE'; 
        this.todayData = {
            challenge: "Entertain us",
            sponsor: "Socks",
            script: "Near Far",
            micCheck: "No hands at all"
        };
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
        window.addEventListener('thps-timer-tick', (e) => {
            if (this.gameState === 'PLAYING') this.updateProgress(e.detail.elapsed);
        });
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));

        this.fetchDailyCards();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { 
            timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' 
        });
        const parts = formatter.formatToParts(new Date());
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    }

    render() {
        this.innerHTML = `
            <style>
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg) !important; }
                .card-container { perspective: 1000px; }
                .star-filled { fill: #eab308; color: #eab308; } 
                .star-empty { fill: transparent; color: #94a3b8; } 
                .star-hover { fill: #fde047 !important; color: #fde047 !important; } 
                @keyframes thps-pulse-glow {
                    0%, 100% { box-shadow: 0 0 15px rgba(251,191,36,0.3); border-color: rgba(251,191,36,0.4); }
                    50% { box-shadow: 0 0 35px rgba(251,191,36,0.8); border-color: rgba(251,191,36,1); }
                }
                .animate-zelda-glow { animation: thps-pulse-glow 2.5s ease-in-out infinite; }
            </style>

            <div class="glass-panel p-5 sm:p-8 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col items-center w-full">
                    
                    <!-- HEADER & STARS -->
                    <div id="board-header-row" class="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6 md:mb-10 mt-2 px-2 md:px-8 transition-all duration-500">
                        <div class="flex flex-col items-center gap-2">
                            <h1 id="board-title" class="text-4xl md:text-5xl uppercase tracking-wider text-slate-900 transition-colors flex items-center justify-center gap-3" style="font-family: 'Permanent Marker', cursive;">
                                <span class="flex flex-col text-center leading-[0.9]">
                                    <span>Daily</span>
                                    <span>Mic-Check</span>
                                </span>
                            </h1>
                            <p class="text-sm md:text-lg text-slate-500 font-medium transition-colors mt-2">
                                Date: <span id="board-date">${this.currentDate}</span>
                            </p>
                        </div>
                        <div id="board-star-panel" class="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg bg-white border border-slate-200 gap-2 transition-all duration-500 w-auto">
                            <span id="board-level" class="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">Level: Beginner</span>
                            <div class="flex gap-2 md:gap-3 mt-1" id="board-stars">
                                <div data-action="set-stars" data-stars="1" class="cursor-pointer"><i data-lucide="star" data-stars="1" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="2" class="cursor-pointer"><i data-lucide="star" data-stars="2" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="3" class="cursor-pointer"><i data-lucide="star" data-stars="3" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="4" class="cursor-pointer"><i data-lucide="star" data-stars="4" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="5" class="cursor-pointer"><i data-lucide="star" data-stars="5" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                            </div>
                        </div>
                    </div>

                    <div id="board-loading" class="max-w-6xl mx-auto text-center text-slate-500 mb-4 text-sm hidden">
                        Fetching challenge...
                    </div>

                    <!-- CARDS -->
                    <div class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-2 md:gap-6 mb-8 md:mb-12 perspective-1000">
                        
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                            <div id="card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Challenge</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                                    <span class="text-[7px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Challenge</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-challenge"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                            <div id="card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Sponsor</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                                    <span class="text-[7px] md:text-xs font-bold text-purple-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Sponsor</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-sponsor"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                            <div id="card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                                    <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Script</span>
                                    <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                                    <span class="text-[7px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Script</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-script"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                            <div id="card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-1 md:p-6 text-center bg-gradient-to-br from-red-800 via-red-900 to-black pointer-events-none transition-all duration-500">
                                    <i data-lucide="mic" class="text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-3 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i>
                                    <span class="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">Mic-Check</span>
                                    <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-2 inline-block shadow-sm border border-amber-200">2 STARS</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center pointer-events-none">
                                    <span class="text-[7px] md:text-xs font-bold text-red-800 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Mic-Check</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-micCheck"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AD-LIB PANEL -->
                    <div id="board-adlib-panel" class="max-w-5xl mx-auto w-full px-4 flex flex-col items-center transition-all duration-500">
                        <div class="w-full bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 text-center transition-all duration-500">
                            <h2 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 transition-colors">Today's Daily Mic-Check is...</h2>
                            <p id="board-adlib" class="text-lg md:text-3xl font-serif text-slate-700 leading-relaxed md:leading-loose transition-colors">
                                Loading...
                            </p>
                        </div>
                    </div>

                    <!-- ACTION BAR (Integrated Timer & Sequence Engine) -->
                    <div id="action-bar" data-action="timer-click" class="relative w-full max-w-4xl mx-auto mt-6 md:mt-8 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0 group/action">
                        <div id="timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-300 ease-out overflow-hidden z-10"></div>
                        
                        <div id="timer-markers" class="absolute inset-0 flex z-20 pointer-events-none opacity-100 transition-opacity">
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

                        <!-- 8.5 Success Notch -->
                        <div id="success-notch" class="absolute top-0 bottom-0 w-1 bg-yellow-400 z-20 shadow-[0_0_8px_rgba(250,204,21,0.8)] opacity-0 transition-opacity" style="left: 85%;"></div>

                        <span id="action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-xs md:text-lg drop-shadow-md flex items-center gap-2 transition-all">
                            <i id="action-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span id="action-label">TAP TO START GAME</span>
                        </span>

                        <div id="action-restart" data-action="timer-restart" class="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 p-2 rounded-full opacity-0 pointer-events-none transition-all hover:scale-110 active:scale-95 text-white">
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
            if (e.target.closest('#board-stars')) {
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
            if (window.toggleTimerAndMic) window.toggleTimerAndMic();
        } else if (this.gameState === 'PLAYING') {
            this.setGameState('ANALYZING');
            if (window.toggleTimerAndMic) window.toggleTimerAndMic();
        } else if (this.gameState === 'SCORED') {
            // Must use the restart button now!
        }
    }

    setGameState(newState, finalScoreNum = 0) {
        this.gameState = newState;
        const bar = this.querySelector('#action-bar');
        const textLabel = this.querySelector('#action-label');
        const icon = this.querySelector('#action-icon');
        const prog = this.querySelector('#timer-progress');
        const markers = this.querySelector('#timer-markers');
        const notch = this.querySelector('#success-notch');
        const restartBtn = this.querySelector('#action-restart');
        
        const title = this.querySelector('#board-title');
        const starPanel = this.querySelector('#board-star-panel');

        if (newState === 'PLAYING') {
            textLabel.innerText = "TAP TO STOP";
            icon.setAttribute('data-lucide', 'square');
            bar.classList.replace('bg-slate-800', 'bg-rose-600');
            bar.classList.replace('hover:bg-slate-700', 'hover:bg-rose-500');
            prog.style.width = '0%';
            if (window.lucide) window.lucide.createIcons();
        } 
        else if (newState === 'ANALYZING') {
            textLabel.innerText = "CHECKING YOUR MIC-CHECK SCORES...";
            icon.setAttribute('data-lucide', 'loader-2');
            icon.classList.add('animate-spin');
            
            bar.classList.remove('bg-rose-600', 'hover:bg-rose-500');
            bar.classList.add('bg-slate-800', 'hover:bg-slate-800', 'border-amber-400');
            bar.style.boxShadow = '0 0 20px rgba(251,191,36,0.4)';
            prog.style.width = '0%';
            markers.classList.add('opacity-0');
            
            title.classList.add('text-amber-500', 'drop-shadow-md');
            title.classList.remove('text-slate-900');
            starPanel.classList.add('shadow-[0_0_20px_rgba(251,191,36,0.4)]', 'border-amber-300');

            const titles = ['CONTENT', 'DELIVERY', 'SIMPLICITY', 'TIME'];
            ['challenge', 'sponsor', 'script', 'micCheck'].forEach((key, index) => {
                const cardEl = this.querySelector(`#card-${key}`);
                if (cardEl) {
                    cardEl.classList.remove('rotate-y-180');
                    
                    setTimeout(() => {
                        const backFace = cardEl.querySelector('.thps-chest-bg');
                        if (backFace) {
                            backFace.innerHTML = `
                                <i data-lucide="loader-2" class="w-4 h-4 md:w-8 md:h-8 opacity-30 mb-1 md:mb-2 animate-spin"></i>
                                <span class="text-[8px] md:text-sm font-bold uppercase tracking-widest opacity-50">${titles[index]}</span>
                                <div class="thps-card-results absolute inset-0 w-full h-full flex flex-col justify-center items-center opacity-0 transition-opacity duration-500 pt-6 px-1 md:px-4"></div>
                            `;
                            backFace.className = 'thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl shadow-md md:shadow-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 transition-all duration-1000 bg-slate-900 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-zelda-glow';
                        }
                    }, 250);
                }
            });

            if (window.lucide) {
                setTimeout(() => window.lucide.createIcons(), 300);
            }
        }
        else if (newState === 'SCORED') {
            icon.classList.remove('animate-spin');
            icon.setAttribute('data-lucide', 'rotate-ccw'); 
            icon.classList.add('hidden'); 
            
            bar.classList.remove('animate-zelda-glow', 'border-amber-400');
            bar.style.boxShadow = '';
            
            title.classList.remove('text-amber-500', 'drop-shadow-md');
            title.classList.add('text-slate-900');
            starPanel.classList.remove('shadow-[0_0_20px_rgba(251,191,36,0.4)]', 'border-amber-300');

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
            } else if (finalScoreNum < 10) {
                prog.className = 'absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500 ease-out overflow-hidden z-10';
                msg = `SCORE: ${finalScoreNum.toFixed(2)} - YOU DID IT!`;
            } else {
                prog.className = 'absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-500 ease-out overflow-hidden z-10 shadow-[0_0_30px_rgba(250,204,21,1)]';
                msg = `PERFECT 10`;
                textLabel.classList.replace('text-white', 'text-yellow-950');
            }

            textLabel.innerText = msg;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    resetBoardToIdle() {
        this.gameState = 'IDLE';
        
        const bar = this.querySelector('#action-bar');
        const textLabel = this.querySelector('#action-label');
        const icon = this.querySelector('#action-icon');
        const prog = this.querySelector('#timer-progress');
        const markers = this.querySelector('#timer-markers');
        const notch = this.querySelector('#success-notch');
        const restartBtn = this.querySelector('#action-restart');
        
        textLabel.innerText = "TAP TO START GAME";
        textLabel.classList.replace('text-slate-200', 'text-white');
        textLabel.classList.replace('text-yellow-950', 'text-white');
        icon.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'play');
        
        bar.className = 'relative w-full max-w-4xl mx-auto mt-6 md:mt-8 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all hover:bg-slate-700 shrink-0 group/action';
        bar.style.boxShadow = '';
        
        prog.className = 'absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-300 ease-out overflow-hidden z-10';
        prog.style.width = '0%';
        
        markers.classList.remove('opacity-0');
        notch.classList.remove('opacity-100');
        notch.classList.add('opacity-0');
        
        restartBtn.classList.remove('opacity-100', 'pointer-events-auto');
        restartBtn.classList.add('opacity-0', 'pointer-events-none');

        const cardData = [
            { id: 'challenge', bg: 'bg-blue-600', title: 'Challenge', star: '1 Star', icon: 'refresh-cw' },
            { id: 'sponsor', bg: 'bg-purple-600', title: 'Sponsor', star: '1 Star', icon: 'refresh-cw' },
            { id: 'script', bg: 'bg-emerald-700', title: 'Script', star: '1 Star', icon: 'refresh-cw' },
            { id: 'micCheck', bg: 'bg-gradient-to-br from-red-800 via-red-900 to-black', title: 'Mic-Check', star: '2 STARS', icon: 'mic', special: true }
        ];

        cardData.forEach(c => {
            const cardEl = this.querySelector(`#card-${c.id}`);
            if (cardEl) {
                const backFace = cardEl.querySelector('.thps-chest-bg');
                if (backFace) {
                    backFace.className = `thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center pointer-events-none transition-all duration-500`;
                    if (c.special) {
                        backFace.classList.add('bg-gradient-to-br', 'from-red-800', 'via-red-900', 'to-black', 'border-[1.5px]', 'md:border-[3px]', 'border-amber-400', 'shadow-[0_0_8px_rgba(251,191,36,0.6)]', 'md:shadow-[0_0_15px_rgba(251,191,36,0.6)]');
                        backFace.innerHTML = `
                            <i data-lucide="${c.icon}" class="text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-3 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i>
                            <span class="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">${c.title}</span>
                            <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-2 inline-block shadow-sm border border-amber-200">${c.star}</span>
                        `;
                    } else {
                        backFace.classList.add(c.bg, 'text-white', 'border-2', 'md:border-4', 'border-white', 'shadow-md', 'md:shadow-xl');
                        backFace.innerHTML = `
                            <i data-lucide="${c.icon}" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                            <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">${c.title}</span>
                            <span class="text-white/70 text-[6px] md:text-xs mt-1 block">${c.star}</span>
                        `;
                    }
                }
                if (this.cardStates[c.id]) cardEl.classList.add('rotate-y-180');
                else cardEl.classList.remove('rotate-y-180');
            }
        });

        if (window.lucide) window.lucide.createIcons();
        if (window.clearAnalyzer) window.clearAnalyzer();
    }

    updateProgress(elapsedSecs) {
        const prog = this.querySelector('#timer-progress');
        if (prog) prog.style.width = `${(elapsedSecs / 90) * 100}%`;
    }

    update(data) {
        if (this.gameState !== 'ANALYZING') return;
        this.setGameState('REVEAL_PENDING'); 
        
        const containers = this.querySelectorAll('.thps-card-results');
        if (containers.length < 4) return;
        
        const cContent = containers[0];
        const cDelivery = containers[1];
        const cSimplicity = containers[2];
        const cTime = containers[3];
        
        [cContent, cDelivery, cSimplicity, cTime].forEach(c => {
            c.classList.remove('opacity-0');
            c.parentElement.querySelector('i').style.display = 'none';
            c.parentElement.querySelector('span').style.display = 'none';
        });

        const makeRow = (label, val, pts, color) => `
            <div class="score-row flex flex-col items-center justify-center w-full opacity-0 scale-75 transition-all duration-500 ease-out">
                <span class="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 text-center">${label}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-xs md:text-base font-black text-slate-100 leading-none">${val}</span>
                    <span class="text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded text-white bg-slate-800 border border-slate-700 ${color}">${pts}</span>
                </div>
            </div>
        `;

        // Content Math
        let pPts = '+1', pColor = 'text-emerald-400';
        if (data.personal < 30) { pPts = '+0.25'; pColor = 'text-rose-400'; }
        else if (data.personal > 60) { pPts = '+0.75'; pColor = 'text-amber-400'; }
        
        let vPts = '+1', vColor = 'text-emerald-400';
        if (data.visual < 20) { vPts = '+0.25'; vColor = 'text-rose-400'; }
        else if (data.visual > 50) { vPts = '+0.75'; vColor = 'text-amber-400'; }

        let iPts = '+1', iColor = 'text-emerald-400';
        if (data.intangible > 45) { iPts = '+0.25'; iColor = 'text-rose-400'; }
        else if (data.intangible >= 30) { iPts = '+0.75'; iColor = 'text-amber-400'; }

        cContent.innerHTML = `
            <div class="w-full flex flex-col justify-evenly h-full pb-2">
                ${makeRow('Personal', Math.round(data.personal) + '%', pPts, pColor)}
                ${makeRow('Visual', Math.round(data.visual) + '%', vPts, vColor)}
                ${makeRow('Intangible', Math.round(data.intangible) + '%', iPts, iColor)}
            </div>
        `;

        // Delivery Math
        let wpmPts = '+1', wpmColor = 'text-emerald-400';
        if (data.wpm < 100) { wpmPts = '+0.75'; wpmColor = 'text-amber-400'; }
        else if (data.wpm > 150) { wpmPts = '+0.25'; wpmColor = 'text-rose-400'; }

        let spsPts = '+1', spsColor = 'text-emerald-400';
        if (data.sps < 3) { spsPts = '+0.75'; spsColor = 'text-amber-400'; }
        else if (data.sps > 5) { spsPts = '+0.25'; spsColor = 'text-rose-400'; }

        let pzPts = '+1', pzColor = 'text-emerald-400';
        if (data.pause < 10) { pzPts = '+0.25'; pzColor = 'text-rose-400'; }
        else if (data.pause > 30) { pzPts = '+0.75'; pzColor = 'text-amber-400'; }

        cDelivery.innerHTML = `
            <div class="w-full flex flex-col justify-evenly h-full pb-2">
                ${makeRow('Words / min', data.wpm, wpmPts, wpmColor)}
                ${makeRow('Mumble', data.sps.toFixed(1), spsPts, spsColor)}
                ${makeRow('Pause', data.pause.toFixed(0) + '%', pzPts, pzColor)}
            </div>
        `;

        // Simplicity Math
        let wpsPts = '+1', wpsColor = 'text-emerald-400';
        if (data.wps < 5) { wpsPts = '+0.75'; wpsColor = 'text-amber-400'; }
        else if (data.wps > 15) { wpsPts = '+0.25'; wpsColor = 'text-rose-400'; }

        let gradePts = '+1', gradeColor = 'text-emerald-400';
        if (data.grade < 5) { gradePts = '+0.75'; gradeColor = 'text-amber-400'; }
        else if (data.grade > 10) { gradePts = '+0.25'; gradeColor = 'text-rose-400'; }

        let simplePts = '+1', simpleColor = 'text-emerald-400';
        if (data.simple < 85) { simplePts = '+0.25'; simpleColor = 'text-rose-400'; }
        else if (data.simple > 95) { simplePts = '+0.75'; simpleColor = 'text-amber-400'; }

        cSimplicity.innerHTML = `
            <div class="w-full flex flex-col justify-evenly h-full pb-2">
                ${makeRow('Words / idea', data.wps.toFixed(1), wpsPts, wpsColor)}
                ${makeRow('Reading Lvl', data.grade.toFixed(1), gradePts, gradeColor)}
                ${makeRow('Simple Vocab', data.simple + '%', simplePts, simpleColor)}
            </div>
        `;

        // Time & Final Grade
        let timePts = '+1', timeColor = 'text-emerald-400';
        if (data.time < 40) { timePts = '+0.25'; timeColor = 'text-rose-400'; }
        else if (data.time < 60) { timePts = '+0.75'; timeColor = 'text-amber-400'; }

        let finalGrade = data.overrideGrade ? "-" : (data.totalPoints % 1 === 0 ? data.totalPoints : data.totalPoints.toFixed(2));
        let finalGradeNum = data.overrideGrade ? -1 : data.totalPoints;

        cTime.innerHTML = `
            <div class="w-full flex flex-col justify-evenly h-full pb-2">
                ${data.overrideGrade ? '' : makeRow('Time', data.time.toFixed(0) + 's', timePts, timeColor)}
                <div class="score-row flex flex-col items-center justify-center w-full mt-auto opacity-0 scale-75 transition-all duration-500 ease-out">
                    <span class="text-[7px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-2">Final Grade</span>
                    <span class="text-3xl md:text-5xl font-black text-white leading-none">${finalGrade}</span>
                </div>
            </div>
        `;

        this.querySelectorAll('.thps-chest-bg').forEach(bg => {
            bg.classList.remove('animate-zelda-glow', 'border-amber-400/50');
            bg.classList.add('border-slate-700/50');
            bg.style.boxShadow = 'none';
        });

        const notch = this.querySelector('#success-notch');
        if (notch) notch.classList.replace('opacity-0', 'opacity-100');

        const allRows = this.querySelectorAll('.score-row');
        let delay = 350;
        
        allRows.forEach((row, i) => {
            setTimeout(() => {
                row.classList.remove('opacity-0', 'scale-75');
                row.classList.add('opacity-100', 'scale-100');
                
                const prog = this.querySelector('#timer-progress');
                if (prog) prog.style.width = `${((i + 1) / allRows.length) * 100}%`;

                if (i === allRows.length - 1) {
                    setTimeout(() => {
                        this.setGameState('SCORED', finalGradeNum);
                    }, 600);
                }
            }, delay * (i + 1));
        });
    }

    async fetchDailyCards() {
        const dateEl = this.querySelector('#board-date');
        const loadingEl = this.querySelector('#board-loading');
        
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

        this.querySelector('#text-challenge').innerText = this.todayData.challenge || 'Talk';
        this.querySelector('#text-sponsor').innerText = this.todayData.sponsor || 'Something';
        this.querySelector('#text-script').innerText = this.todayData.script || 'Near Far';
        this.querySelector('#text-micCheck').innerText = this.todayData.micCheck || 'Use your hands';

        this.setDifficulty(1);
    }

    updateAdLib() {
        const blankStyle = "font-medium text-slate-400 underline decoration-slate-300 decoration-dashed underline-offset-8";
        
        const cText = this.todayData.challenge || 'Talk';
        const sText = this.todayData.sponsor || 'something you like';
        const scText = this.todayData.script || 'any';
        const mText = this.todayData.micCheck || 'to have fun';

        const formattedScText = String(scText).trim().split(/\s+/).join(' + ');
        
        const challengeStr = this.cardStates.challenge ? `<span class="font-bold text-blue-700">${cText}</span>` : `<span class="${blankStyle}">Talk</span>`;
        const sponsorStr = this.cardStates.sponsor ? `<span class="font-bold text-purple-700">${sText}</span>` : `<span class="${blankStyle}">something you like</span>`;
        const scriptStr = this.cardStates.script ? `<span class="font-bold text-emerald-700">${formattedScText}</span>` : `<span class="${blankStyle}">any</span>`;
        const micCheckStr = this.cardStates.micCheck ? `to <span class="font-bold text-rose-600">${mText}</span>` : `<span class="${blankStyle}">to have fun</span>`;

        const adlibEl = this.querySelector('#board-adlib');
        if (adlibEl) {
            adlibEl.innerHTML = `${challengeStr} about ${sponsorStr}, with ${scriptStr} examples, and don't forget ${micCheckStr}!`;
        }
    }
}

customElements.define('thps-game-board', ThpsGameBoard);

// ==========================================
// THPS CORE WIDGET: GAME BOARD
// Contains Cards, Star Selector, Mad-Libs, Action Bar, and The Zelda Drip-Feed Engine
// ==========================================

class ThpsGameBoard extends HTMLElement {
    connectedCallback() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.dataSource = this.getAttribute('data-source') || "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json";
        
        this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };
        this.todayData = { challenge: "Entertain us", sponsor: "Socks", script: "Near Far", micCheck: "No hands at all" };
        this.currentStars = 0;
        this.currentDate = this.getAdelaideDateString();
        
        // State Machine: IDLE -> PLAYING -> ANALYZING -> REVEAL_PENDING -> REVEAL -> SCORED
        this.gameState = 'IDLE'; 
        this.analyzingStartTime = 0;
        this.timerInterval = null;

        this.render();
        this.setupListeners();
        
        window.addEventListener('thps-load-date', (e) => {
            this.currentDate = e.detail.dateStr || this.getAdelaideDateString();
            this.fetchDailyCards();
        });

        // The Event Listener that catches the Analyzer's scores
        window.addEventListener('thps-dashboard-update', (e) => this.handleScorePayload(e.detail));

        this.fetchDailyCards();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = formatter.formatToParts(new Date());
        return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
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

                /* Zelda Anticipation Glows */
                @keyframes golden-breath {
                    0%, 100% { box-shadow: 0 0 15px rgba(251,191,36,0.3); border-color: rgba(251,191,36,0.4); transform: scale(1); }
                    50% { box-shadow: 0 0 35px rgba(251,191,36,0.8); border-color: rgba(251,191,36,1); transform: scale(1.02); }
                }
                .golden-glow { animation: golden-breath 2.5s ease-in-out infinite; }
                
                @keyframes text-breath {
                    0%, 100% { text-shadow: 0 0 10px rgba(251,191,36,0.4); color: #f59e0b; }
                    50% { text-shadow: 0 0 25px rgba(251,191,36,1); color: #fde68a; }
                }
                .text-glow { animation: text-breath 2.5s ease-in-out infinite; }

                /* Drip Feed Pops */
                @keyframes pop-green { 0% { transform: scale(0.8); background-color: #dcfce7; } 50% { transform: scale(1.15); background-color: #22c55e; color: white; } 100% { transform: scale(1); background-color: #dcfce7; } }
                @keyframes pop-amber { 0% { transform: scale(0.8); background-color: #fef3c7; } 50% { transform: scale(1.1); background-color: #f59e0b; color: white; } 100% { transform: scale(1); background-color: #fef3c7; } }
                @keyframes pop-red { 0% { transform: scale(0.8); background-color: #ffe4e6; } 50% { transform: scale(1.05); background-color: #ef4444; color: white; } 100% { transform: scale(1); background-color: #ffe4e6; } }
                
                .pop-green { animation: pop-green 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .pop-amber { animation: pop-amber 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .pop-red { animation: pop-red 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

                /* Pre-allocated Row Reveal */
                @keyframes row-reveal {
                    0% { opacity: 0; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.02); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .row-reveal { animation: row-reveal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

                /* Custom Scrollbar for Results */
                .res-scroll::-webkit-scrollbar { width: 4px; }
                .res-scroll::-webkit-scrollbar-track { background: transparent; }
                .res-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
            </style>

            <div id="board-master-wrapper" class="glass-panel p-5 sm:p-8 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full transition-all duration-700 group cursor-move">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col items-center w-full">
                    
                    <!-- HEADER & STARS -->
                    <div class="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6 md:mb-10 mt-2 px-2 md:px-8">
                        <div class="flex flex-col items-center gap-2">
                            <h1 id="board-title" class="text-4xl md:text-5xl uppercase tracking-wider text-slate-900 transition-all duration-700 flex items-center justify-center gap-3" style="font-family: 'Permanent Marker', cursive;">
                                <span class="flex flex-col text-center leading-[0.9]"><span>Daily</span><span>Mic-Check</span></span>
                            </h1>
                            <p class="text-sm md:text-lg text-slate-500 font-medium mt-2">Date: <span id="board-date">${this.currentDate}</span></p>
                        </div>

                        <div id="board-stars-panel" class="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg bg-white border border-slate-200 gap-2 transition-all duration-700 w-auto">
                            <span id="board-level" class="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">Level: Beginner</span>
                            <div class="flex gap-2 md:gap-3 mt-1" id="board-stars">
                                <i data-lucide="star" data-action="set-stars" data-stars="1" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 cursor-pointer star-empty"></i>
                                <i data-lucide="star" data-action="set-stars" data-stars="2" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 cursor-pointer star-empty"></i>
                                <i data-lucide="star" data-action="set-stars" data-stars="3" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 cursor-pointer star-empty"></i>
                                <i data-lucide="star" data-action="set-stars" data-stars="4" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 cursor-pointer star-empty"></i>
                                <i data-lucide="star" data-action="set-stars" data-stars="5" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 cursor-pointer star-empty"></i>
                            </div>
                        </div>
                    </div>

                    <!-- CARDS CONTAINER -->
                    <div id="board-cards-container" class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-1 md:gap-6 mb-6">
                        
                        <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                            <div id="card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-[800ms] transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 border-white shadow-md md:shadow-xl hover:brightness-110 pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="thps-chest-icon w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2 transition-all"></i>
                                    <span class="thps-chest-title text-[8px] md:text-lg font-bold uppercase tracking-widest transition-all">Challenge</span>
                                    <span class="thps-chest-sub text-white/70 text-[6px] md:text-xs mt-1 block transition-all">1 Star</span>
                                </div>
                                <div class="thps-front-face absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none transition-all duration-500">
                                    <span class="text-[7px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0 transition-all">Challenge</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6 transition-all">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center transition-all" id="text-challenge"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                            <div id="card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-[800ms] transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 border-white shadow-md md:shadow-xl hover:brightness-110 pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="thps-chest-icon w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2 transition-all"></i>
                                    <span class="thps-chest-title text-[8px] md:text-lg font-bold uppercase tracking-widest transition-all">Sponsor</span>
                                    <span class="thps-chest-sub text-white/70 text-[6px] md:text-xs mt-1 block transition-all">1 Star</span>
                                </div>
                                <div class="thps-front-face absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none transition-all duration-500">
                                    <span class="text-[7px] md:text-xs font-bold text-purple-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0 transition-all">Sponsor</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6 transition-all">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center transition-all" id="text-sponsor"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                            <div id="card-script" class="relative w-full h-full cursor-pointer transition-all duration-[800ms] transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 border-white shadow-md md:shadow-xl hover:brightness-110 pointer-events-none transition-all duration-500">
                                    <i data-lucide="refresh-cw" class="thps-chest-icon w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2 transition-all"></i>
                                    <span class="thps-chest-title text-[8px] md:text-lg font-bold uppercase tracking-widest transition-all">Script</span>
                                    <span class="thps-chest-sub text-white/70 text-[6px] md:text-xs mt-1 block transition-all">1 Star</span>
                                </div>
                                <div class="thps-front-face absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none transition-all duration-500">
                                    <span class="text-[7px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0 transition-all">Script</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6 transition-all">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center transition-all" id="text-script"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                            <div id="card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-[800ms] transform-gpu preserve-3d">
                                <div class="thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 shadow-md md:shadow-xl hover:brightness-110 transition-all duration-500 border-amber-400 bg-gradient-to-br from-red-800 via-red-900 to-black shadow-[0_0_15px_rgba(251,191,36,0.5)] pointer-events-none">
                                    <i data-lucide="mic" class="thps-chest-icon w-4 h-4 md:w-8 md:h-8 mb-1 md:mb-2 text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-all"></i>
                                    <span class="thps-chest-title text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)] transition-all">Mic-Check</span>
                                    <span class="thps-chest-sub bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-1 inline-block shadow-sm border border-amber-200 transition-all">2 STARS</span>
                                </div>
                                <div class="thps-front-face absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none transition-all duration-500">
                                    <span class="text-[7px] md:text-xs font-bold text-red-800 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0 transition-all">Mic-Check</span>
                                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6 transition-all">
                                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center transition-all" id="text-micCheck"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AD-LIB PANEL -->
                    <div id="adlib-wrapper" class="max-w-5xl mx-auto w-full px-4 flex flex-col items-center transition-all duration-500">
                        <div class="w-full bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 text-center">
                            <h2 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Today's Daily Mic-Check is...</h2>
                            <p id="board-adlib" class="text-lg md:text-3xl font-serif text-slate-700 leading-relaxed md:leading-loose">Loading...</p>
                        </div>
                    </div>

                    <!-- ACTION BAR (Absorbed Timer & Progress Bar) -->
                    <div id="action-bar" class="relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all duration-500 shrink-0 hover:bg-slate-700">
                        
                        <!-- Dynamic Background Fills -->
                        <div id="timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all ease-linear overflow-hidden z-10"></div>
                        <div id="pb-fill" class="absolute left-0 top-0 h-full w-0 bg-blue-500 transition-all duration-[400ms] ease-out z-10 hidden"></div>
                        
                        <!-- Progress Bar Notch (8.5 target) -->
                        <div id="pb-notch" class="absolute left-[85%] top-0 h-full w-1 bg-yellow-400/80 z-20 shadow-[0_0_10px_rgba(250,204,21,0.8)] hidden"></div>

                        <!-- 90s Timer Segments -->
                        <div id="timer-segments" class="absolute inset-0 flex z-20 pointer-events-none transition-opacity duration-300">
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-no score-</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">1/4pts</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">3/4pts</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">Perfect!</span></div>
                            <div class="flex flex-col items-center justify-end pb-1" style="width: 11.111%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-</span></div>
                        </div>

                        <!-- Text & Icons -->
                        <span id="action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-sm md:text-lg drop-shadow-md flex items-center gap-2 transition-all duration-300 pointer-events-none">
                            <i id="toggle-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span id="toggle-text">TAP TO START GAME</span>
                        </span>
                        <!-- Score Display Label for Progress Bar Mode -->
                        <span id="pb-text" class="hidden relative z-30 text-white font-black tracking-widest uppercase text-sm md:text-lg drop-shadow-md flex items-center gap-2 transition-all duration-300 pointer-events-none"></span>

                        <!-- Restart Icon -->
                        <i id="action-bar-restart" data-lucide="rotate-ccw" class="absolute right-4 md:right-6 w-5 h-5 md:w-6 md:h-6 text-white opacity-0 pointer-events-none transition-opacity duration-300 z-40"></i>

                        <!-- Confetti & Golden Mic -->
                        <div id="confetti-container" class="absolute inset-0 pointer-events-none z-10 overflow-visible"></div>
                        <svg id="golden-mic" class="absolute right-12 md:right-16 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 text-yellow-400 opacity-0 scale-50 transition-all duration-1000 ease-out drop-shadow-[0_0_15px_rgba(250,204,21,1)] z-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>

                    </div>
                    
                    <div id="cba-recordingIndicator" class="hidden mx-auto h-4 w-4 relative mt-4">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
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
                if (wrapper) wrapper.remove(); else this.remove(); 
                return;
            }

            const actionEl = e.target.closest('[data-action]');
            if (actionEl && this.gameState === 'IDLE') {
                const action = actionEl.getAttribute('data-action');
                if (action === 'toggle-card') this.toggleCard(actionEl.getAttribute('data-card'));
                else if (action === 'set-stars') this.setDifficulty(parseInt(actionEl.getAttribute('data-stars')));
            }
        });

        // The Action Bar intercepts the click to control the global audio AND the internal states
        const actionBar = this.querySelector('#action-bar');
        actionBar.addEventListener('click', () => this.handleActionBarClick());

        // Hover logic for stars
        this.addEventListener('mouseover', (e) => {
            if (this.gameState !== 'IDLE') return;
            const star = e.target.closest('.board-star');
            if (star) {
                const count = parseInt(star.getAttribute('data-stars'));
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

    // ==========================================
    // THE STATE MACHINE & ANIMATION LOGIC
    // ==========================================
    handleActionBarClick() {
        if (this.gameState === 'SCORED') {
            this.resetBoardToIdle();
            return; // Stop here! Let the user breathe before clicking again to record.
        }

        if (this.gameState === 'IDLE') {
            if (window.clearAnalyzer) window.clearAnalyzer();
            if (window.THPS && window.THPS.Audio && typeof window.THPS.Audio.startRecordingProcess === 'function') {
                window.THPS.Audio.startRecordingProcess();
            }
            this.setGameState('PLAYING');
            
        } else if (this.gameState === 'PLAYING') {
            if (window.THPS && window.THPS.Audio && typeof window.THPS.Audio.stopRecordingProcess === 'function') {
                window.THPS.Audio.stopRecordingProcess();
            }
            this.setGameState('ANALYZING');
        }
    }

    setGameState(newState) {
        this.gameState = newState;
        const actionBar = this.querySelector('#action-bar');
        const actionText = this.querySelector('#action-text');
        const timerProgress = this.querySelector('#timer-progress');
        const recInd = this.querySelector('#cba-recordingIndicator');

        if (newState === 'PLAYING') {
            // Action Bar -> Red
            actionBar.classList.replace('bg-slate-800', 'bg-rose-600');
            actionBar.classList.replace('hover:bg-slate-700', 'hover:bg-rose-500');
            actionText.innerHTML = `<i data-lucide="square" class="w-4 h-4 md:w-5 md:h-5"></i> <span id="toggle-text">TAP TO STOP</span>`;
            recInd.classList.remove('hidden');
            timerProgress.style.width = '0%';
            
            // Start Local 90s Timer
            let elapsed = 0;
            this.timerInterval = setInterval(() => {
                elapsed += 0.05;
                timerProgress.style.width = `${(elapsed / 90) * 100}%`;
                if (elapsed >= 90) {
                    // Limit Reached: Automatically hit stop
                    this.handleActionBarClick(); 
                }
            }, 50);

        } else if (newState === 'ANALYZING') {
            // Stop internal timer
            clearInterval(this.timerInterval);
            this.analyzingStartTime = Date.now();
            
            // UI -> Zelda Glow
            actionBar.className = "relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-900 cursor-default overflow-hidden flex items-center justify-center rounded-2xl border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] z-30 golden-glow shrink-0";
            timerProgress.style.width = '100%';
            timerProgress.className = "absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 opacity-20";
            this.querySelector('#timer-segments').classList.add('hidden');
            
            actionText.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 md:w-5 md:h-5 animate-spin text-amber-300"></i> <span class="text-glow tracking-widest text-[10px] md:text-sm">CHECKING YOUR MIC-CHECK SCORES...</span>`;
            
            recInd.classList.add('hidden');
            this.querySelector('#board-title').classList.add('text-glow');
            this.querySelector('#board-stars-panel').classList.add('golden-glow', 'border-amber-400');
            // We NO LONGER hide the adlib wrapper here so the user can see it in their recording reel!

            // Flip all cards to Chests (back face) with Glowing Borders
            ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
                const cardEl = this.querySelector(`#card-${key}`);
                if (cardEl) {
                    cardEl.classList.remove('rotate-y-180');
                    
                    // Target the properly assigned chest background class
                    const bg = cardEl.querySelector('.thps-chest-bg');
                    if(bg) bg.className = "thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center border-2 md:border-4 shadow-md md:shadow-xl transition-all duration-500 border-amber-400 bg-gradient-to-br from-slate-900 to-black shadow-[0_0_15px_rgba(251,191,36,0.5)] golden-glow pointer-events-none";
                    
                    const icon = cardEl.querySelector('.thps-chest-icon');
                    if(icon) {
                        icon.className = "thps-chest-icon w-5 h-5 md:w-10 md:h-10 mb-2 text-amber-400 animate-pulse transition-all";
                        icon.setAttribute('data-lucide', 'sparkles');
                    }
                    
                    const title = cardEl.querySelector('.thps-chest-title');
                    if(title) title.className = "thps-chest-title font-bold uppercase tracking-widest text-[8px] md:text-sm text-amber-200 transition-all";
                    
                    const sub = cardEl.querySelector('.thps-chest-sub');
                    if(sub) {
                        sub.className = "thps-chest-sub mt-2 block text-[10px] md:text-lg font-serif text-amber-500/80 transition-all";
                        sub.innerText = "Calculating...";
                    }
                }
            });

            this.querySelector('#card-challenge .thps-chest-title').innerText = "CONTENT";
            this.querySelector('#card-sponsor .thps-chest-title').innerText = "DELIVERY";
            this.querySelector('#card-script .thps-chest-title').innerText = "SIMPLICITY";
            this.querySelector('#card-micCheck .thps-chest-title').innerText = "TIME";
        }
        if (window.lucide) window.lucide.createIcons();
    }

    resetBoardToIdle() {
        this.gameState = 'IDLE';
        
        // 1. Restore the Action Bar exactly
        const actionBar = this.querySelector('#action-bar');
        actionBar.className = "relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all duration-500 shrink-0 hover:bg-slate-700";
        
        const timerProgress = this.querySelector('#timer-progress');
        timerProgress.classList.remove('hidden');
        timerProgress.style.width = '0%';
        timerProgress.className = "absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all ease-linear overflow-hidden z-10";

        this.querySelector('#pb-fill').classList.add('hidden');
        this.querySelector('#pb-notch').classList.add('hidden');
        this.querySelector('#timer-segments').classList.remove('hidden');
        
        const actionText = this.querySelector('#action-text');
        actionText.classList.remove('hidden');
        actionText.innerHTML = `<i id="toggle-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i> <span id="toggle-text">TAP TO START GAME</span>`;
        
        const pbText = this.querySelector('#pb-text');
        pbText.classList.add('hidden');
        pbText.innerHTML = '';
        
        // Hide Restart Icon
        const restartIcon = this.querySelector('#action-bar-restart');
        if (restartIcon) {
            restartIcon.classList.add('opacity-0', 'pointer-events-none');
            restartIcon.classList.remove('opacity-100', 'pointer-events-auto');
        }

        // Hide Golden Mic
        const mic = this.querySelector('#golden-mic');
        if (mic) {
            mic.classList.add('opacity-0', 'scale-50');
            mic.classList.remove('opacity-100', 'scale-100', 'rotate-12');
        }

        // 2. Rebuild the Original Cards (Front and Back)
        const restoreFrontFace = (key, colorClass, title, text) => {
            const face = this.querySelector(`#card-${key} .thps-front-face`);
            if (face) {
                face.className = `thps-front-face absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none transition-all duration-500`;
                face.innerHTML = `
                    <span class="text-[7px] md:text-xs font-bold ${colorClass} uppercase tracking-widest mb-1.5 md:mb-4 shrink-0 transition-all">${title}</span>
                    <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6 transition-all">
                        <span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center transition-all" id="text-${key}">${text}</span>
                    </div>
                `;
            }
            
            // Restore Chest BG styling (remove golden glow)
            const bg = this.querySelector(`#card-${key} .thps-chest-bg`);
            if (bg) {
                if (key === 'challenge') bg.className = "thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none transition-all duration-500";
                if (key === 'sponsor') bg.className = "thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none transition-all duration-500";
                if (key === 'script') bg.className = "thps-chest-bg absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none transition-all duration-500";
                if (key === 'micCheck') bg.className = "thps-chest-bg absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-1 md:p-6 text-center bg-gradient-to-br from-red-800 via-red-900 to-black hover:brightness-110 pointer-events-none transition-all duration-500";
                
                const titleEl = bg.querySelector('.thps-chest-title');
                if (titleEl) {
                    if (key !== 'micCheck') titleEl.className = "thps-chest-title text-[8px] md:text-lg font-bold uppercase tracking-widest transition-all";
                    else titleEl.className = "thps-chest-title text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)] transition-all";
                    titleEl.innerText = key === 'micCheck' ? 'Mic-Check' : key.charAt(0).toUpperCase() + key.slice(1);
                }

                const subEl = bg.querySelector('.thps-chest-sub');
                if (subEl) {
                    if (key !== 'micCheck') subEl.className = "thps-chest-sub text-white/70 text-[6px] md:text-xs mt-1 block transition-all";
                    else subEl.className = "thps-chest-sub bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-2 inline-block shadow-sm border border-amber-200 transition-all";
                    subEl.innerText = key === 'micCheck' ? '2 STARS' : '1 Star';
                }
                
                const iconEl = bg.querySelector('.thps-chest-icon');
                if (iconEl) {
                    if (key !== 'micCheck') {
                        iconEl.className = "thps-chest-icon w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2 transition-all";
                        iconEl.setAttribute('data-lucide', 'refresh-cw');
                    } else {
                        iconEl.className = "thps-chest-icon text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-3 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-all";
                        iconEl.setAttribute('data-lucide', 'mic');
                    }
                }
            }
        };

        restoreFrontFace('challenge', 'text-blue-600', 'Challenge', this.todayData.challenge);
        restoreFrontFace('sponsor', 'text-purple-600', 'Sponsor', this.todayData.sponsor);
        restoreFrontFace('script', 'text-emerald-600', 'Script', this.todayData.script);
        restoreFrontFace('micCheck', 'text-red-800', 'Mic-Check', this.todayData.micCheck);

        // Re-apply flip states exactly as they were according to `this.cardStates`
        ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
            const cardEl = this.querySelector(`#card-${key}`);
            if (cardEl) {
                if (this.cardStates[key]) cardEl.classList.add('rotate-y-180');
                else cardEl.classList.remove('rotate-y-180');
            }
        });
        
        // Wipe confetti
        const confettiContainer = this.querySelector('#confetti-container');
        if (confettiContainer) confettiContainer.innerHTML = '';

        if (window.lucide) window.lucide.createIcons();
    }

    // ==========================================
    // THE DRIP FEED SEQUENCE
    // ==========================================
    handleScorePayload(data) {
        // LOCK: Ignore Vercel updates unless we are actively waiting for the first one!
        if (this.gameState !== 'ANALYZING') return;
        this.gameState = 'REVEAL_PENDING'; // Locks out subsequent updates

        // Ensure the "Zelda Glow" plays for at least 2.5 seconds to build tension
        const timeElapsed = Date.now() - this.analyzingStartTime;
        if (timeElapsed < 2500) {
            setTimeout(() => this.executeDripFeed(data), 2500 - timeElapsed);
        } else {
            this.executeDripFeed(data);
        }
    }

    executeDripFeed(data) {
        this.gameState = 'REVEAL';
        const override = data.overrideGrade || false;

        // 1. Calculate the 10 Points Locally & Standardize the IDs
        const evalMetric = (cat, id, label, val, raw, evalFn) => {
            const pts = evalFn(raw);
            return { cat, id, label, val, pts };
        };

        const metrics = [
            evalMetric('content', 'personal', 'Personal', Math.round(data.personal)+'%', data.personal, v => v<30?0.25:v>60?0.75:1),
            evalMetric('content', 'visual', 'Visual', Math.round(data.visual)+'%', data.visual, v => v<20?0.25:v>50?0.75:1),
            evalMetric('content', 'intangible', 'Intangible', Math.round(data.intangible)+'%', data.intangible, v => v>45?0.25:v>=30?0.75:1),
            
            evalMetric('delivery', 'wpm', 'Words / min', Math.round(data.wpm), data.wpm, v => v<100?0.75:v>150?0.25:1),
            evalMetric('delivery', 'mumble', 'Mumble', data.sps.toFixed(1), data.sps, v => v<3?0.75:v>5?0.25:1),
            evalMetric('delivery', 'pause', 'Pause', Math.round(data.pause)+'%', data.pause, v => v<10?0.25:v>30?0.75:1),

            evalMetric('simplicity', 'wps', 'Words / idea', data.wps.toFixed(1), data.wps, v => v<5?0.75:v>15?0.25:1),
            evalMetric('simplicity', 'grade', 'Reading Lvl', data.grade.toFixed(1), data.grade, v => v<5?0.75:v>10?0.25:1),
            evalMetric('simplicity', 'simple', 'Simple %', Math.round(data.simple)+'%', data.simple, v => v<85?0.25:v>95?0.75:1)
        ];
        // Time evaluates last
        metrics.push(evalMetric('time', 'time', 'Time', Math.round(data.time)+'s', data.time, v => (v<30||v>90)?0:v<60?0.75:1));

        // 2. Pre-Allocate the Front Faces for Results (Stops Twitchy Re-positioning)
        const setFront = (cardId, title, targetId, metricsForCard) => {
            const el = this.querySelector(`#${cardId} .thps-front-face`);
            if (el) {
                // Generate the hidden rows instantly
                let rowsHtml = metricsForCard.map(m => `
                    <div id="row-${m.id}" class="flex flex-col items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm opacity-0 transform scale-95 shrink-0 w-full mb-1">
                        <span class="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">${m.label}</span>
                        <div class="flex items-center gap-1.5 w-full justify-center">
                            <span class="text-[10px] md:text-xs font-black text-slate-800" id="val-${m.id}">-</span>
                            <span class="text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-400" id="pts-${m.id}">-</span>
                        </div>
                    </div>
                `).join('');

                el.innerHTML = `
                    <span class="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2 shrink-0 border-b border-slate-200 w-full pb-1">${title}</span>
                    <div id="${targetId}" class="flex-1 w-full flex flex-col pb-1 overflow-y-auto res-scroll justify-start pt-1">
                        ${rowsHtml}
                    </div>
                `;
                el.className = "thps-front-face absolute inset-0 w-full h-full backface-hidden bg-slate-50 border-2 md:border-4 border-slate-300 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-4 px-1.5 md:px-3 rotate-y-180 text-center shadow-inner pointer-events-auto transition-all duration-500";
            }
        };

        setFront('card-challenge', 'Content', 'res-content', metrics.filter(m => m.cat === 'content'));
        setFront('card-sponsor', 'Delivery', 'res-delivery', metrics.filter(m => m.cat === 'delivery'));
        setFront('card-script', 'Simplicity', 'res-simplicity', metrics.filter(m => m.cat === 'simplicity'));
        setFront('card-micCheck', 'Time & Score', 'res-time', metrics.filter(m => m.cat === 'time'));

        // Stop Zelda glows
        this.querySelector('#board-title').classList.remove('text-glow');
        this.querySelector('#board-stars-panel').classList.remove('golden-glow', 'border-amber-400');

        // 3. Flip Cards to Front!
        setTimeout(() => {
            ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
                const cardEl = this.querySelector(`#card-${key}`);
                if (cardEl) cardEl.classList.add('rotate-y-180');
            });
        }, 100);

        // 4. Setup Progress Bar UI
        const actionBar = this.querySelector('#action-bar');
        const pbFill = this.querySelector('#pb-fill');
        const pbNotch = this.querySelector('#pb-notch');
        const actionText = this.querySelector('#action-text');
        const pbText = this.querySelector('#pb-text');
        
        actionBar.className = "relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-800 overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-700 shadow-xl z-30 transition-all duration-500 shrink-0 cursor-pointer hover:bg-slate-700";
        this.querySelector('#timer-progress').classList.add('hidden');
        actionText.classList.add('hidden');
        pbFill.classList.remove('hidden');
        pbNotch.classList.remove('hidden');
        pbText.classList.remove('hidden');
        
        let currentTotal = 0;
        let index = 0;

        // 5. The Drip-Feed Interval (Fires the reveal animations without shifting layout)
        const dripInterval = setInterval(() => {
            if (index >= metrics.length) {
                clearInterval(dripInterval);
                this.triggerFinalVerdict(currentTotal, override, pbFill, pbText, actionBar);
                return;
            }

            const m = metrics[index];
            currentTotal += m.pts;

            // Target the pre-allocated row
            const row = this.querySelector(`#row-${m.id}`);
            const valSpan = this.querySelector(`#val-${m.id}`);
            const ptsSpan = this.querySelector(`#pts-${m.id}`);

            if (row && valSpan && ptsSpan) {
                valSpan.innerText = m.val;
                ptsSpan.innerText = m.pts > 0 ? '+'+m.pts : '0';
                
                let bgClass = m.pts === 1 ? 'bg-green-100 text-green-700 pop-green' : m.pts === 0.75 ? 'bg-amber-100 text-amber-700 pop-amber' : 'bg-red-100 text-red-700 pop-red';
                if (m.pts === 0) bgClass = 'bg-slate-200 text-slate-600 pop-red';
                
                ptsSpan.className = `text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${bgClass}`;
                
                // Pop the row in (using our custom CSS keyframe)
                row.classList.remove('opacity-0', 'scale-95');
                row.classList.add('row-reveal');
            }

            // Update Progress Bar
            if (!override) {
                pbFill.style.width = `${Math.min(100, (currentTotal / 10) * 100)}%`;
                pbText.innerText = `${currentTotal.toFixed(2)} / 10`;
            } else {
                pbText.innerText = `Calculating...`;
            }

            index++;
        }, 400);
    }

    triggerFinalVerdict(total, override, pbFill, pbText, actionBar) {
        this.gameState = 'SCORED';

        // Add big final score to the Time card
        const timeContainer = this.querySelector('#res-time');
        if (timeContainer) {
            timeContainer.innerHTML += `
                <div class="mt-auto pt-2 border-t border-slate-200 flex flex-col items-center justify-center transform scale-0 transition-transform duration-500 w-full" id="final-score-pop">
                    <span class="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Final Grade</span>
                    <span class="text-3xl md:text-4xl font-black text-slate-800">${override ? '- / 10' : total.toFixed(2)}</span>
                </div>
            `;
            setTimeout(() => {
                const pop = this.querySelector('#final-score-pop');
                if(pop) pop.classList.remove('scale-0');
            }, 100);
        }

        // Show the Restart Icon
        const restartIcon = this.querySelector('#action-bar-restart');
        if (restartIcon) {
            restartIcon.classList.remove('opacity-0', 'pointer-events-none');
            restartIcon.classList.add('opacity-100', 'pointer-events-auto');
        }

        if (override) {
            pbFill.style.width = '100%';
            pbFill.className = "absolute left-0 top-0 h-full bg-slate-600 transition-all duration-500";
            actionBar.classList.replace('border-slate-700', 'border-slate-800');
            pbText.innerHTML = `CHECK YOUR SCORES`;
        } else if (total < 5.0) {
            pbFill.className = "absolute left-0 top-0 h-full bg-slate-500 transition-all duration-500";
            actionBar.classList.replace('border-slate-700', 'border-slate-600');
            pbText.innerHTML = `SCORE: ${total.toFixed(2)} - CHECK YOUR SCORES`;
        } else if (total < 8.5) {
            pbFill.className = "absolute left-0 top-0 h-full bg-amber-500 transition-all duration-500";
            actionBar.classList.replace('border-slate-700', 'border-amber-600');
            pbText.innerHTML = `SCORE: ${total.toFixed(2)} - SO CLOSE!`;
        } else if (total < 10.0) {
            pbFill.className = "absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500";
            actionBar.classList.replace('border-slate-700', 'border-emerald-600');
            pbText.innerHTML = `SCORE: ${total.toFixed(2)} - YOU DID IT!`;
            this.fireConfetti();
        } else {
            // PERFECT 10
            pbFill.className = "absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-500";
            actionBar.classList.replace('border-slate-700', 'border-yellow-500');
            pbText.innerHTML = `PERFECT 10!`;
            pbText.className = "relative z-30 text-yellow-900 font-black tracking-widest uppercase text-sm md:text-2xl drop-shadow-sm transition-all duration-300 flex items-center pointer-events-none";
            
            // Golden Mic Reveal
            const mic = this.querySelector('#golden-mic');
            if (mic) {
                mic.classList.remove('opacity-0', 'scale-50');
                mic.classList.add('opacity-100', 'scale-100', 'rotate-12');
            }
            this.fireConfetti(true);
        }
        if (window.lucide) window.lucide.createIcons();
    }

    fireConfetti(massive = false) {
        const container = this.querySelector('#confetti-container');
        if (!container) return;
        const colors = ['#fde047', '#86efac', '#60a5fa', '#f472b6', '#a78bfa'];
        const amount = massive ? 100 : 40;
        
        for (let i = 0; i < amount; i++) {
            const conf = document.createElement('div');
            conf.className = 'absolute top-1/2 left-1/2 w-1.5 h-3 rounded-sm opacity-0';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random trajectory
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 50; 
            
            conf.animate([
                { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${Math.random()*720}deg) scale(0.5)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            });
            
            container.appendChild(conf);
        }
    }

    // ==========================================
    // DATA FETCHING & UI HELPERS
    // ==========================================
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

        this.querySelector('#text-challenge').innerText = this.todayData.challenge;
        this.querySelector('#text-sponsor').innerText = this.todayData.sponsor;
        this.querySelector('#text-script').innerText = this.todayData.script;
        this.querySelector('#text-micCheck').innerText = this.todayData.micCheck;

        this.setDifficulty(1);
    }

    setDifficulty(stars) {
        if (stars === 1) this.cardStates = { challenge: false, sponsor: true, script: false, micCheck: false };
        else if (stars === 2) this.cardStates = { challenge: false, sponsor: true, script: true, micCheck: false };
        else if (stars === 3) this.cardStates = { challenge: true, sponsor: true, script: true, micCheck: false };
        else if (stars === 4) this.cardStates = { challenge: false, sponsor: true, script: true, micCheck: true };
        else if (stars === 5) this.cardStates = { challenge: true, sponsor: true, script: true, micCheck: true };
        else this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };

        ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
            const cardEl = this.querySelector(`#card-${key}`);
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
        const cardEl = this.querySelector(`#card-${key}`);
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
        const levelTextEl = this.querySelector('#board-level');
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
            detail: { stars: this.currentStars, date: this.currentDate }, bubbles: true, composed: true 
        }));
    }

    updateAdLib() {
        const blankStyle = "font-medium text-slate-400 underline decoration-slate-300 decoration-dashed underline-offset-8";
        const cText = this.todayData.challenge;
        const sText = this.todayData.sponsor;
        const scText = this.todayData.script;
        const mText = this.todayData.micCheck;

        const formattedScText = scText.trim().split(/\s+/).join(' + ');
        
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

// ==========================================
// THPS CORE WIDGET: GAME BOARD v2.0
// Contains Cards, Stars, Timer, and Anticipation Engine
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
        this.gameState = 'IDLE'; // IDLE -> PLAYING -> ANALYZING -> SCORED

        this.render();
        this.setupListeners();
        
        window.addEventListener('thps-load-date', (e) => {
            this.currentDate = e.detail.dateStr || this.getAdelaideDateString();
            this.fetchDailyCards();
        });

        // The Event Listeners that connect the Hub Logic to our Visual Engine
        window.addEventListener('thps-game-start', () => this.setGameState('PLAYING'));
        window.addEventListener('thps-game-stop', () => this.setGameState('ANALYZING'));
        window.addEventListener('thps-dashboard-update', (e) => this.handleScorePayload(e.detail));
        
        window.addEventListener('thps-timer-tick', (e) => {
            if (this.gameState === 'PLAYING') {
                const progress = this.querySelector('#timer-progress');
                if (progress) progress.style.width = `${(e.detail.elapsed / 90) * 100}%`;
            }
        });

        this.fetchDailyCards();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = formatter.formatToParts(new Date());
        return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
    }

    // ==========================================
    // THE RENDER ENGINE
    // ==========================================
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
            </style>

            <div class="glass-panel p-5 sm:p-8 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full transition-transform group">
                
                <!-- Close Button -->
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
                                <div data-action="set-stars" data-stars="1" class="cursor-pointer"><i data-lucide="star" data-stars="1" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="2" class="cursor-pointer"><i data-lucide="star" data-stars="2" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="3" class="cursor-pointer"><i data-lucide="star" data-stars="3" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="4" class="cursor-pointer"><i data-lucide="star" data-stars="4" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="5" class="cursor-pointer"><i data-lucide="star" data-stars="5" class="board-star w-8 h-8 md:w-10 md:h-10 transition-colors duration-300 star-empty pointer-events-none"></i></div>
                            </div>
                        </div>
                    </div>

                    <!-- DYNAMIC CARDS CONTAINER -->
                    <div id="board-cards-container" class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-1 md:gap-6 mb-8 md:mb-12">
                        ${this.generateGameCardsHTML()}
                    </div>

                    <!-- AD-LIB PANEL -->
                    <div id="adlib-wrapper" class="max-w-5xl mx-auto w-full px-4 flex flex-col items-center transition-opacity duration-500">
                        <div class="w-full bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 text-center">
                            <h2 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Today's Daily Mic-Check is...</h2>
                            <p id="board-adlib" class="text-lg md:text-3xl font-serif text-slate-700 leading-relaxed md:leading-loose">Loading...</p>
                        </div>
                    </div>

                    <!-- THE ACTION BAR (Absorbed into Game Board) -->
                    <div id="action-bar" class="relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-slate-900 shadow-xl z-30 transition-all duration-700 shrink-0" onclick="window.toggleTimerAndMic()">
                        <div id="timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all ease-linear overflow-hidden z-10"></div>
                        <div id="timer-segments" class="absolute inset-0 flex z-20 pointer-events-none transition-opacity duration-500">
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-no score-</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">1/4pts</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">3/4pts</span></div>
                            <div class="flex flex-col items-center justify-end pb-1 border-r-[1.5px] border-white/30" style="width: 22.222%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">Perfect!</span></div>
                            <div class="flex flex-col items-center justify-end pb-1" style="width: 11.111%;"><span class="text-[7px] md:text-[9px] text-white/70 font-bold tracking-widest leading-none drop-shadow-md">-</span></div>
                        </div>
                        <span id="action-text" class="relative z-30 text-white font-black tracking-widest uppercase text-sm md:text-lg drop-shadow-md flex items-center gap-2 transition-all duration-300">
                            <i id="toggle-icon" data-lucide="play" class="w-4 h-4 md:w-5 md:h-5"></i>
                            <span id="toggle-text">TAP TO START GAME</span>
                        </span>
                    </div>

                    <div id="cba-recordingIndicator" class="hidden mx-auto h-4 w-4 relative mt-4">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
                    </div>

                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        this.updateAdLib(); // Ensure text populates
    }

    // ==========================================
    // THE STATE MACHINE (THE ZELDA GLOW)
    // ==========================================
    setGameState(newState) {
        this.gameState = newState;
        
        const actionBar = this.querySelector('#action-bar');
        const actionText = this.querySelector('#action-text');
        const timerProgress = this.querySelector('#timer-progress');
        const segments = this.querySelector('#timer-segments');
        const recInd = this.querySelector('#cba-recordingIndicator');
        const title = this.querySelector('#board-title');
        const starPanel = this.querySelector('#board-stars-panel');
        const adlibWrapper = this.querySelector('#adlib-wrapper');
        const cardsContainer = this.querySelector('#board-cards-container');

        if (newState === 'IDLE') {
            this.render(); // Resets back to clean slate
            this.setDifficulty(this.currentStars); // Restore card flips
        } 
        
        else if (newState === 'PLAYING') {
            actionBar.className = "relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-rose-600 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl border-2 border-rose-700 shadow-xl z-30 transition-all hover:bg-rose-500 shrink-0";
            timerProgress.style.width = '0%';
            actionText.innerHTML = `<i data-lucide="square" class="w-4 h-4 md:w-5 md:h-5"></i> TAP TO STOP`;
            recInd.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        } 
        
        else if (newState === 'ANALYZING') {
            // 1. The Pulse (Action Bar, Title, Star Panel)
            actionBar.className = "relative w-full max-w-3xl mx-auto mt-6 h-16 md:h-20 bg-slate-900 cursor-default overflow-hidden flex items-center justify-center rounded-2xl border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] z-30 golden-glow shrink-0";
            timerProgress.style.width = '100%';
            timerProgress.className = "absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 opacity-20";
            segments.classList.add('hidden');
            actionText.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 md:w-5 md:h-5 animate-spin text-amber-300"></i> <span class="text-glow tracking-widest text-[10px] md:text-sm">CHECKING YOUR MIC-CHECK SCORES...</span>`;
            
            recInd.classList.add('hidden');
            title.classList.add('text-glow');
            starPanel.classList.add('golden-glow', 'border-amber-400');
            adlibWrapper.classList.add('opacity-0', 'pointer-events-none');

            // 2. The Zelda Chest Flip
            cardsContainer.innerHTML = this.generateScoreCardsHTML();
            if (window.lucide) window.lucide.createIcons();

            // Force reflow, then apply the 3D flip class to all 4 cards simultaneously for dramatic effect
            void cardsContainer.offsetWidth; 
            setTimeout(() => {
                this.querySelectorAll('.thps-score-flipper').forEach(el => el.classList.add('rotate-y-180'));
            }, 100);
        }

        else if (newState === 'SCORED') {
            // Phase 2 Drip-Feed will go here. For now, stop the glow so the user can review scores.
            actionBar.classList.remove('golden-glow');
            title.classList.remove('text-glow');
            starPanel.classList.remove('golden-glow');
            actionText.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 md:w-5 md:h-5 text-emerald-400"></i> <span class="text-emerald-100 tracking-widest text-[10px] md:text-sm">SCORES CALCULATED</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    handleScorePayload(data) {
        // We received the data from the Analyzer! Move to SCORED state.
        if (this.gameState === 'ANALYZING') {
            this.setGameState('SCORED');
        }
    }

    // ==========================================
    // HTML GENERATORS
    // ==========================================
    generateGameCardsHTML() {
        return `
            <!-- Challenge -->
            <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                <div id="card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none">
                        <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                        <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Challenge</span>
                        <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                    </div>
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                        <span class="text-[7px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Challenge</span>
                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6"><span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-challenge">${this.todayData.challenge}</span></div>
                    </div>
                </div>
            </div>
            <!-- Sponsor -->
            <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                <div id="card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none">
                        <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                        <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Sponsor</span>
                        <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                    </div>
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                        <span class="text-[7px] md:text-xs font-bold text-purple-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Sponsor</span>
                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6"><span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-sponsor">${this.todayData.sponsor}</span></div>
                    </div>
                </div>
            </div>
            <!-- Script -->
            <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                <div id="card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110 pointer-events-none">
                        <i data-lucide="refresh-cw" class="w-4 h-4 md:w-8 md:h-8 opacity-70 mb-1 md:mb-2"></i>
                        <span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Script</span>
                        <span class="text-white/70 text-[6px] md:text-xs mt-1 block">1 Star</span>
                    </div>
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 md:border-4 border-slate-200 text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center shadow-md md:shadow-xl pointer-events-none">
                        <span class="text-[7px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Script</span>
                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6"><span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-script">${this.todayData.script}</span></div>
                    </div>
                </div>
            </div>
            <!-- Mic-Check -->
            <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                <div id="card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                    <div class="absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-1 md:p-6 text-center bg-gradient-to-br from-red-800 via-red-900 to-black hover:brightness-110 pointer-events-none">
                        <i data-lucide="mic" class="text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-1 md:mb-3 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i>
                        <span class="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-black text-[8px] md:text-lg uppercase tracking-tighter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">Mic-Check</span>
                        <span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-red-950 font-bold px-2 py-0.5 rounded-full text-[6px] md:text-xs mt-2 inline-block shadow-sm border border-amber-200">2 STARS</span>
                    </div>
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] text-slate-800 rounded-lg md:rounded-xl flex flex-col items-center pt-2 md:pt-6 px-1 md:px-4 rotate-y-180 text-center pointer-events-none">
                        <span class="text-[7px] md:text-xs font-bold text-red-800 uppercase tracking-widest mb-1.5 md:mb-4 shrink-0">Mic-Check</span>
                        <div class="flex-1 w-full flex items-center justify-center pb-2 md:pb-6"><span class="text-[9px] sm:text-sm md:text-xl font-serif font-bold leading-tight text-center" id="text-micCheck">${this.todayData.micCheck}</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    generateScoreCardsHTML() {
        // The beautiful Zelda anticipation chests! Notice the 1.5s flip duration!
        const buildChest = (title) => `
            <div class="card-container h-36 sm:h-56 md:h-80">
                <div class="thps-score-flipper relative w-full h-full transition-all duration-[1500ms] transform-gpu preserve-3d">
                    <div class="absolute inset-0 w-full h-full backface-hidden bg-slate-800 border-2 md:border-4 border-slate-700 rounded-lg md:rounded-xl shadow-md flex items-center justify-center pointer-events-none">
                        <i data-lucide="lock" class="w-6 h-6 md:w-10 md:h-10 text-slate-600"></i>
                    </div>
                    <div class="absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl border-2 md:border-4 border-amber-400 bg-gradient-to-br from-slate-900 to-black rotate-y-180 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(251,191,36,0.5)] golden-glow pointer-events-none">
                        <i data-lucide="sparkles" class="text-amber-400 w-5 h-5 md:w-10 md:h-10 mb-2 animate-pulse"></i>
                        <span class="text-amber-200 font-bold text-[8px] md:text-sm uppercase tracking-widest">${title}</span>
                        <span class="text-amber-500/80 font-serif text-[10px] md:text-lg mt-2">Calculating...</span>
                    </div>
                </div>
            </div>
        `;
        return buildChest('Content') + buildChest('Delivery') + buildChest('Simplicity') + buildChest('Time');
    }

    // ==========================================
    // LOGIC & LISTENERS
    // ==========================================
    setupListeners() {
        this.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.thps-close-btn');
            if (closeBtn) {
                const wrapper = this.closest('.cursor-move');
                if (wrapper) wrapper.remove(); 
                else this.remove(); 
                return;
            }

            if (this.gameState !== 'IDLE') return; // Lock clicks during animation!

            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            const action = actionEl.getAttribute('data-action');
            if (action === 'toggle-card') this.toggleCard(actionEl.getAttribute('data-card'));
            else if (action === 'set-stars') this.setDifficulty(parseInt(actionEl.getAttribute('data-stars')));
        });

        this.addEventListener('mouseover', (e) => {
            if (this.gameState !== 'IDLE') return;
            const actionEl = e.target.closest('[data-action="set-stars"]');
            if (actionEl) {
                const count = parseInt(actionEl.getAttribute('data-stars'));
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`i[data-stars="${i}"]`);
                    if (s) s.classList[i <= count ? 'add' : 'remove']('star-hover');
                }
            }
        });

        this.addEventListener('mouseout', (e) => {
            if (this.gameState !== 'IDLE') return;
            if (e.target.closest('#board-stars')) {
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`i[data-stars="${i}"]`);
                    if (s) s.classList.remove('star-hover');
                }
            }
        });
    }

    async fetchDailyCards() {
        const loadingEl = this.querySelector('#board-loading');
        if (loadingEl) loadingEl.classList.remove('hidden');

        try {
            if (!this.dataSource.includes("YOUR_USERNAME")) {
                const response = await fetch(this.dataSource + '?nocache=' + new Date().getTime());
                if (response.ok) {
                    const data = await response.json();
                    if (data[this.currentDate]) this.todayData = data[this.currentDate];
                }
            }
        } catch (error) {
            console.warn("Could not load JSON. Using fallback data.");
        } finally {
            if (loadingEl) loadingEl.classList.add('hidden');
        }

        if (this.gameState === 'IDLE') {
            this.querySelector('#text-challenge').innerText = this.todayData.challenge;
            this.querySelector('#text-sponsor').innerText = this.todayData.sponsor;
            this.querySelector('#text-script').innerText = this.todayData.script;
            this.querySelector('#text-micCheck').innerText = this.todayData.micCheck;
            this.setDifficulty(1);
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
            const starEl = this.querySelector(`i[data-stars="${i}"]`);
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

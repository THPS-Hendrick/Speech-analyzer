// ==========================================
// THPS WIDGET: LARGE GAME BOARD (DIAGNOSTIC MODE)
// Game Board is disconnected from data pipeline for testing.
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
        
        // LOBOTOMIZED: The Game Board will intentionally ignore the data broadcast!
        // window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));

        this.fetchDailyCards();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = formatter.formatToParts(new Date());
        return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
    }

    render() {
        const VERSION_TAG = "v.04:20:00 ACST";

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

            <div class="glass-panel p-5 sm:p-8 rounded-2xl border-t-4 border-slate-800 shadow-sm flex flex-col items-center bg-white relative w-full h-full group">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 rounded-full opacity-0 group-hover:opacity-100 z-50" title="${VERSION_TAG}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col items-center w-full">
                    <div id="gb-board-header-row" class="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6 mt-2 px-2">
                        <div class="flex flex-col items-center gap-2">
                            <h1 class="text-4xl md:text-5xl uppercase tracking-wider text-slate-900" style="font-family: 'Permanent Marker', cursive;">
                                <span class="flex flex-col text-center leading-[0.9]"><span>Daily</span><span>Mic-Check</span></span>
                            </h1>
                            <p class="text-sm md:text-lg text-slate-500 font-medium mt-2">Date: <span id="gb-board-date">${this.currentDate}</span></p>
                        </div>
                        <div id="gb-board-star-panel" class="flex flex-col items-center p-4 md:p-6 rounded-2xl shadow-lg bg-white border border-slate-200 gap-2">
                            <span id="gb-board-level" class="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">Level: Beginner</span>
                            <div class="flex gap-2 md:gap-3 mt-1" id="gb-board-stars">
                                <div data-action="set-stars" data-stars="1" class="cursor-pointer"><i data-lucide="star" data-stars="1" class="board-star w-8 h-8 md:w-10 md:h-10 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="2" class="cursor-pointer"><i data-lucide="star" data-stars="2" class="board-star w-8 h-8 md:w-10 md:h-10 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="3" class="cursor-pointer"><i data-lucide="star" data-stars="3" class="board-star w-8 h-8 md:w-10 md:h-10 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="4" class="cursor-pointer"><i data-lucide="star" data-stars="4" class="board-star w-8 h-8 md:w-10 md:h-10 star-empty pointer-events-none"></i></div>
                                <div data-action="set-stars" data-stars="5" class="cursor-pointer"><i data-lucide="star" data-stars="5" class="board-star w-8 h-8 md:w-10 md:h-10 star-empty pointer-events-none"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-2 md:gap-6 mb-8 md:mb-12 perspective-1000">
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                            <div id="gb-card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg flex flex-col items-center justify-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 opacity-70 mb-1"></i><span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Challenge</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white text-slate-800 rounded-lg flex flex-col items-center pt-2 px-1 rotate-y-180 shadow-md pointer-events-none">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full"><span class="text-[7px] md:text-xs font-bold text-blue-600 uppercase mb-1">Challenge</span><div class="flex-1 w-full flex items-center justify-center"><span class="text-[9px] md:text-xl font-serif font-bold text-center" id="gb-text-challenge"></span></div></div>
                                </div>
                            </div>
                        </div>
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                            <div id="gb-card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg flex flex-col items-center justify-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 opacity-70 mb-1"></i><span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Sponsor</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white text-slate-800 rounded-lg flex flex-col items-center pt-2 px-1 rotate-y-180 shadow-md pointer-events-none">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full"><span class="text-[7px] md:text-xs font-bold text-purple-600 uppercase mb-1">Sponsor</span><div class="flex-1 w-full flex items-center justify-center"><span class="text-[9px] md:text-xl font-serif font-bold text-center" id="gb-text-sponsor"></span></div></div>
                                </div>
                            </div>
                        </div>
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                            <div id="gb-card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg flex flex-col items-center justify-center pointer-events-none">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 opacity-70 mb-1"></i><span class="text-[8px] md:text-lg font-bold uppercase tracking-widest">Script</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white text-slate-800 rounded-lg flex flex-col items-center pt-2 px-1 rotate-y-180 shadow-md pointer-events-none">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full"><span class="text-[7px] md:text-xs font-bold text-emerald-600 uppercase mb-1">Script</span><div class="flex-1 w-full flex items-center justify-center"><span class="text-[9px] md:text-xl font-serif font-bold text-center" id="gb-text-script"></span></div></div>
                                </div>
                            </div>
                        </div>
                        <div class="card-container h-40 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                            <div id="gb-card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-red-900 text-amber-400 rounded-lg flex flex-col items-center justify-center pointer-events-none border-2 border-amber-400">
                                    <i data-lucide="mic" class="w-5 h-5 mb-1"></i><span class="text-[8px] md:text-lg font-black uppercase">Mic-Check</span>
                                </div>
                                <div class="absolute inset-0 w-full h-full backface-hidden bg-white text-slate-800 rounded-lg flex flex-col items-center pt-2 px-1 rotate-y-180 shadow-md pointer-events-none border-2 border-amber-400">
                                    <div class="thps-prompt-view flex flex-col items-center w-full h-full"><span class="text-[7px] md:text-xs font-bold text-red-800 uppercase mb-1">Mic-Check</span><div class="flex-1 w-full flex items-center justify-center"><span class="text-[9px] md:text-xl font-serif font-bold text-center" id="gb-text-micCheck"></span></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="gb-action-bar" data-action="timer-click" class="relative w-full max-w-4xl mx-auto h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl shadow-xl z-30">
                        <div id="gb-timer-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out z-10"></div>
                        <span id="gb-action-text" class="relative z-30 text-white font-black tracking-widest uppercase flex items-center gap-2 pointer-events-none">
                            <i id="gb-action-icon" data-lucide="play" class="w-4 h-4"></i><span id="gb-action-label">TAP TO START GAME</span>
                        </span>
                        <div id="gb-action-restart" data-action="timer-restart" class="absolute right-4 z-40 bg-white/20 p-2 rounded-full opacity-0 pointer-events-none text-white">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    setupListeners() {
        this.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            const action = actionEl.getAttribute('data-action');
            if (action === 'toggle-card' && this.gameState === 'IDLE') this.toggleCard(actionEl.getAttribute('data-card'));
            else if (action === 'set-stars' && this.gameState === 'IDLE') this.setDifficulty(parseInt(actionEl.getAttribute('data-stars')));
            else if (action === 'timer-click') this.handleActionBarClick();
            else if (action === 'timer-restart') { e.stopPropagation(); this.resetBoardToIdle(); }
        });
    }

    handleActionBarClick() {
        if (this.gameState === 'IDLE') {
            this.setGameState('PLAYING');
            if (window.toggleTimerAndMic) window.toggleTimerAndMic();
        } else if (this.gameState === 'PLAYING') {
            this.setGameState('ANALYZING');
            if (window.toggleTimerAndMic) window.toggleTimerAndMic();
        }
    }

    setGameState(newState) {
        this.gameState = newState;
        const bar = this.querySelector('#gb-action-bar');
        const textLabel = this.querySelector('#gb-action-label');
        const icon = this.querySelector('#gb-action-icon');
        const prog = this.querySelector('#gb-timer-progress');
        const restartBtn = this.querySelector('#gb-action-restart');

        if (newState === 'PLAYING') {
            textLabel.innerText = "TAP TO STOP";
            icon.setAttribute('data-lucide', 'square');
            bar.classList.replace('bg-slate-800', 'bg-rose-600');
            prog.style.width = '0%';
            
            this.playStartTime = Date.now();
            if (this.internalTimer) clearInterval(this.internalTimer);
            this.internalTimer = setInterval(() => {
                let elapsed = (Date.now() - this.playStartTime) / 1000;
                if (elapsed <= 90) prog.style.width = `${(elapsed / 90) * 100}%`;
                else {
                    clearInterval(this.internalTimer);
                    if (this.gameState === 'PLAYING') {
                        this.setGameState('ANALYZING');
                        if (window.toggleTimerAndMic) window.toggleTimerAndMic();
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
            bar.classList.replace('bg-rose-600', 'bg-slate-800');
            prog.style.width = '0%';
            if (window.lucide) window.lucide.createIcons();

            // 12-second failsafe to flip cards just so UI doesn't stick
            if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout);
            this.analyzingTimeout = setTimeout(() => this.setGameState('SCORED'), 12000); 
        }
        else if (newState === 'SCORED') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            if (this.analyzingTimeout) clearTimeout(this.analyzingTimeout);
            icon.classList.remove('animate-spin');
            icon.classList.add('hidden'); 
            restartBtn.classList.remove('opacity-0', 'pointer-events-none');
            restartBtn.classList.add('opacity-100', 'pointer-events-auto');
            prog.style.width = '100%';
            prog.className = 'absolute left-0 top-0 h-full w-full bg-slate-600 z-10';
            textLabel.innerText = "CHECK YOUR SCORES BELOW";
            textLabel.classList.replace('text-white', 'text-slate-200');

            ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
                const cardEl = this.querySelector(`#gb-card-${key}`);
                if (cardEl) cardEl.classList.add('rotate-y-180');
            });
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
        const restartBtn = this.querySelector('#gb-action-restart');
        
        textLabel.innerText = "TAP TO START GAME";
        textLabel.classList.replace('text-slate-200', 'text-white');
        icon.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'play');
        bar.className = 'relative w-full max-w-4xl mx-auto h-16 md:h-20 bg-slate-800 cursor-pointer overflow-hidden flex items-center justify-center rounded-2xl shadow-xl z-30';
        prog.className = 'absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out z-10';
        prog.style.width = '0%';
        restartBtn.classList.remove('opacity-100', 'pointer-events-auto');
        restartBtn.classList.add('opacity-0', 'pointer-events-none');

        ['challenge', 'sponsor', 'script', 'micCheck'].forEach(key => {
            const cardEl = this.querySelector(`#gb-card-${key}`);
            if (cardEl) {
                if (this.cardStates[key]) cardEl.classList.add('rotate-y-180');
                else cardEl.classList.remove('rotate-y-180');
            }
        });

        if (window.lucide) window.lucide.createIcons();
        if (window.clearAnalyzer) window.clearAnalyzer();
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
        for (let i = 1; i <= 5; i++) {
            const starEl = this.querySelector(`.board-star[data-stars="${i}"]`);
            if (starEl) {
                if (i <= stars) { starEl.classList.remove('star-empty'); starEl.classList.add('star-filled'); } 
                else { starEl.classList.remove('star-filled'); starEl.classList.add('star-empty'); }
            }
        }
    }

    async fetchDailyCards() {
        try {
            if (!this.dataSource.includes("YOUR_USERNAME")) {
                const response = await fetch(this.dataSource + '?nocache=' + new Date().getTime());
                if (response.ok) {
                    const data = await response.json();
                    if (data[this.currentDate]) this.todayData = data[this.currentDate];
                }
            }
        } catch (error) {}
        this.querySelector('#gb-text-challenge').innerText = this.todayData?.challenge || 'Talk';
        this.querySelector('#gb-text-sponsor').innerText = this.todayData?.sponsor || 'Something';
        this.querySelector('#gb-text-script').innerText = this.todayData?.script || 'Near Far';
        this.querySelector('#gb-text-micCheck').innerText = this.todayData?.micCheck || 'Use your hands';
        this.setDifficulty(1);
    }

    updateAdLib() {
        const cText = this.todayData?.challenge || 'Talk';
        const sText = this.todayData?.sponsor || 'something you like';
        const scText = this.todayData?.script || 'any';
        const mText = this.todayData?.micCheck || 'to have fun';
        const adlibEl = this.querySelector('#gb-board-adlib');
        if (adlibEl) {
            adlibEl.innerHTML = `<span class="font-bold text-blue-700">${cText}</span> about <span class="font-bold text-purple-700">${sText}</span>, with <span class="font-bold text-emerald-700">${scText}</span> examples, and don't forget to <span class="font-bold text-red-600">${mText}</span>!`;
        }
    }
}
customElements.define('thps-game-board', ThpsGameBoard);

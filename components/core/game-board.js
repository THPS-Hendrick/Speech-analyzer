// ==========================================
// THPS CORE WIDGET: GAME BOARD
// Contains Cards, Star Selector, and Mad-Lib Engine
// ==========================================

class ThpsGameBoard extends HTMLElement {
    connectedCallback() {
        this.dataSource = this.getAttribute('data-source') || "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json";
        
        this.cardStates = { challenge: false, sponsor: false, script: false, micCheck: false };
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
        
        // Listen for the hub telling us to load a specific date
        window.addEventListener('thps-load-date', (e) => {
            this.currentDate = e.detail.dateStr || this.getAdelaideDateString();
            this.fetchDailyCards();
        });

        // Auto-fetch if dropped on a page standalone
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
            <div class="flex flex-col items-center w-full">
                
                <!-- HEADER & STARS -->
                <div class="max-w-6xl mx-auto w-full flex flex-col items-center justify-center gap-6 mb-6 md:mb-10 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <h1 class="text-4xl md:text-5xl uppercase tracking-wider text-slate-900 transition-colors flex items-center justify-center gap-3" style="font-family: 'Permanent Marker', cursive;">
                            <span class="flex flex-col text-center leading-[0.9]">
                                <span>Daily</span>
                                <span>Mic-Check</span>
                            </span>
                        </h1>
                        <p class="text-sm md:text-lg text-slate-500 font-medium transition-colors mt-2">
                            Date: <span id="board-date">${this.currentDate}</span>
                        </p>
                    </div>

                    <div class="flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg bg-white border border-slate-200 gap-2 transition-all duration-300 w-auto">
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

                <div id="board-loading" class="max-w-6xl mx-auto text-center text-slate-500 mb-4 text-sm hidden">
                    Fetching challenge...
                </div>

                <!-- CARDS -->
                <div class="max-w-6xl mx-auto w-full grid grid-cols-4 gap-1 md:gap-6 mb-8 md:mb-12">
                    
                    <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="challenge">
                        <div id="card-challenge" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                            <div class="absolute inset-0 w-full h-full backface-hidden bg-blue-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110">
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

                    <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="sponsor">
                        <div id="card-sponsor" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                            <div class="absolute inset-0 w-full h-full backface-hidden bg-purple-600 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110">
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

                    <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="script">
                        <div id="card-script" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                            <div class="absolute inset-0 w-full h-full backface-hidden bg-emerald-700 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md md:shadow-xl border-2 md:border-4 border-white hover:brightness-110">
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

                    <div class="card-container h-36 sm:h-56 md:h-80" data-action="toggle-card" data-card="micCheck">
                        <div id="card-micCheck" class="relative w-full h-full cursor-pointer transition-all duration-500 transform-gpu preserve-3d">
                            <div class="absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl border-[1.5px] md:border-[3px] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] md:shadow-[0_0_15px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-1 md:p-6 text-center bg-gradient-to-br from-red-800 via-red-900 to-black hover:brightness-110">
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
                <div class="max-w-5xl mx-auto w-full px-4 flex flex-col items-center">
                    <div class="w-full bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-lg border border-slate-200 text-center transition-all duration-500">
                        <h2 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 transition-colors">Today's Daily Mic-Check is...</h2>
                        <p id="board-adlib" class="text-lg md:text-3xl font-serif text-slate-700 leading-relaxed md:leading-loose transition-colors">
                            Loading...
                        </p>
                    </div>
                </div>

            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    setupListeners() {
        // Handle all clicks safely inside the component
        this.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            const action = actionEl.getAttribute('data-action');
            if (action === 'toggle-card') {
                this.toggleCard(actionEl.getAttribute('data-card'));
            } else if (action === 'set-stars') {
                this.setDifficulty(parseInt(actionEl.getAttribute('data-stars')));
            }
        });

        // Hover effects for stars
        this.addEventListener('mouseover', (e) => {
            const star = e.target.closest('.board-star');
            if (star) {
                const count = parseInt(star.getAttribute('data-stars'));
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`[data-stars="${i}"]`);
                    if (s) s.classList[i <= count ? 'add' : 'remove']('star-hover');
                }
            }
        });

        this.addEventListener('mouseout', (e) => {
            if (e.target.closest('#board-stars')) {
                for (let i = 1; i <= 5; i++) {
                    const s = this.querySelector(`[data-stars="${i}"]`);
                    if (s) s.classList.remove('star-hover');
                }
            }
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

        // Apply text to cards
        this.querySelector('#text-challenge').innerText = this.todayData.challenge;
        this.querySelector('#text-sponsor').innerText = this.todayData.sponsor;
        this.querySelector('#text-script').innerText = this.todayData.script;
        this.querySelector('#text-micCheck').innerText = this.todayData.micCheck;

        // Reset to Level 1
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
        // Calculate stars based on flipped cards
        let stars = 0;
        if (this.cardStates.challenge) stars += 1;
        if (this.cardStates.sponsor) stars += 1;
        if (this.cardStates.script) stars += 1;
        if (this.cardStates.micCheck) stars += 2;
        
        stars = Math.max(0, Math.min(5, stars));
        this.currentStars = stars;

        // Update Labels & Icons
        const levelLabels = { 0: "Blank", 1: "Beginner", 2: "Better", 3: "Brave", 4: "Bold", 5: "Brilliant!" };
        const levelTextEl = this.querySelector('#board-level');
        if (levelTextEl) levelTextEl.innerText = `Level: ${levelLabels[stars] || 'Blank'}`;

        for (let i = 1; i <= 5; i++) {
            const starEl = this.querySelector(`[data-stars="${i}"]`);
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

        // Broadcast to the rest of the App so the Timer/Firebase knows the wager!
        this.dispatchEvent(new CustomEvent('thps-game-state', { 
            detail: { stars: this.currentStars, date: this.currentDate }, 
            bubbles: true, 
            composed: true 
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

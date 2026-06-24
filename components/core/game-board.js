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
        const VERSION_TAG = "v.FINAL.04";

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
                        
                        <div class="card-container h-36 sm:h-48 md:h-64" data-action="toggle-card" data-card="challenge">
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
                                            <i data-lucide="star" class="w-3 h-3 md:w-

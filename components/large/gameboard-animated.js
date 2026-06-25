// ==========================================
// THPS WIDGET: ANIMATED STUDIO GAME BOARD (9:16)
// The ultimate TikTok/Shorts UI for recording.
// ==========================================

class ThpsGameboardAnimated extends HTMLElement {
    connectedCallback() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.dataSource = this.getAttribute('data-source') || "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json";
        this.gameState = 'IDLE'; 
        this.currentDate = this.getAdelaideDateString();
        this.timerSeconds = 0;
        this.timerInterval = null;

        this.render();
        this.setupListeners();
        this.fetchDailyData();
    }

    getAdelaideDateString() {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Adelaide', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = formatter.formatToParts(new Date());
        return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
    }

    render() {
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
                
                /* Custom Animations */
                @keyframes slideUpFade {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { 
                    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                    opacity: 0; 
                }
                
                @keyframes pulseDark {
                    0%, 100% { opacity: 1; background-color: #1e293b; border-color: transparent;}
                    50% { opacity: 0.7; background-color: #0f172a; border-color: transparent;}
                }
                .animate-pulse-dark { animation: pulseDark 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-pulse-dark * { opacity: 0.5; color: white !important; fill: white !important; }

                /* Hiding elements smoothly */
                .hide-smooth {
                    height: 0 !important;
                    opacity: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                }
            </style>

            <div class="relative w-full max-w-[368px] aspect-[9/16] max-h-[850px] mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ring-8 ring-slate-800">
                
                <div class="pt-6 pb-2 text-center shrink-0">
                    <h1 class="text-4xl text-[#1a2332] tracking-wide leading-none" style="font-family: 'Permanent Marker', cursive;">DAILY MIC-CHECK</h1>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Date: <span id="studio-date">${this.currentDate}</span></p>
                </div>

                <div id="stats-container" class="px-4 w-full transition-all duration-500 ease-in-out flex flex-col justify-center h-[110px]">
                    
                    <div id="setup-cards" class="grid grid-cols-4 gap-2 h-full transition-all duration-300">
                        <div class="rounded-xl flex flex-col items-center justify-center p-2 text-white bg-blue-600 shadow-md setup-card">
                            <span class="text-[9px] font-bold tracking-wider mb-1">CHALLENGE</span>
                            <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                        </div>
                        <div class="rounded-xl flex flex-col items-center justify-center p-2 text-white bg-purple-600 shadow-md setup-card">
                            <span class="text-[9px] font-bold tracking-wider mb-1">SPONSOR</span>
                            <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                        </div>
                        <div class="rounded-xl flex flex-col items-center justify-center p-2 text-white bg-emerald-700 shadow-md setup-card">
                            <span class="text-[9px] font-bold tracking-wider mb-1">SCRIPT</span>
                            <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                        </div>
                        <div class="rounded-xl flex flex-col items-center justify-center p-2 text-amber-400 bg-gradient-to-b from-red-800 to-black shadow-md setup-card border border-amber-400/30">
                            <span class="text-[8px] font-bold tracking-wider mb-1 leading-tight text-center">MIC-CHECK</span>
                            <div class="flex gap-0.5">
                                <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                                <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                            </div>
                        </div>
                    </div>

                    <div id="results-cards" class="hidden h-full flex-col w-full">
                        <div class="flex flex-col items-center justify-center mb-3 animate-slide-up" style="animation-delay: 0.1s;">
                            <div class="flex items-center gap-2 mb-1" id="res-stars"></div>
                            <h2 class="text-[48px] font-black text-slate-800 leading-none tracking-tighter" id="res-score-hero">0.0</h2>
                            <p class="text-[11px] font-bold tracking-widest text-blue-600 uppercase" id="res-msg">Checking...</p>
                        </div>

                        <div class="grid grid-cols-2 gap-2 flex-grow">
                            <div class="bg-blue-50 border border-blue-100 rounded-xl p-2 flex flex-col justify-between animate-slide-up" style="animation-delay: 0.5s;">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-blue-700 tracking-wider">CONTENT</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-personal">0</span>%</span>
                                </div>
                                <div class="text-[9px] text-slate-500 flex justify-between font-medium">
                                    <span>P: <span id="res-p-sub">0</span></span> 
                                    <span>V: <span id="res-v-sub">0</span></span> 
                                    <span>I: <span id="res-i-sub">0</span></span>
                                </div>
                            </div>
                            <div class="bg-purple-50 border border-purple-100 rounded-xl p-2 flex flex-col justify-between animate-slide-up" style="animation-delay: 0.9s;">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-purple-700 tracking-wider">DELIVERY</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-wpm">0</span> <span class="text-[8px] text-slate-500 font-bold">WPM</span></span>
                                </div>
                                <div class="text-[9px] text-slate-500 flex justify-between font-medium">
                                    <span>Mum: <span id="res-mum">0</span></span> 
                                    <span>Pau: <span id="res-pau">0</span>%</span>
                                </div>
                            </div>
                            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-2 flex flex-col justify-between animate-slide-up" style="animation-delay: 1.3s;">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-emerald-700 tracking-wider">SIMPLIFY</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-simp">0</span>%</span>
                                </div>
                                <div class="text-[9px] text-slate-500 flex justify-between font-medium">
                                    <span>W/S: <span id="res-wps">0</span></span> 
                                    <span>RDL: <span id="res-rdl">0</span></span>
                                </div>
                            </div>
                            <div class="bg-amber-50 border border-amber-100 rounded-xl p-2 flex flex-col justify-between animate-slide-up" style="animation-delay: 1.7s;">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[10px] font-bold text-amber-700 tracking-wider">TIME</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-time">0</span>s</span>
                                </div>
                                <button data-action="retry" class="w-full bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-slate-700 transition-colors shadow-sm active:scale-95">
                                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> RETRY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-4 py-3 shrink-0">
                    <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 shadow-sm text-center flex flex-col justify-center min-h-[90px]">
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Today's Mic-Check (Beginner)</p>
                        <p id="studio-adlib" class="text-[13px] font-medium leading-snug text-slate-600">Loading...</p>
                    </div>
                </div>

                <div id="action-bar-container" class="px-4 shrink-0 transition-all duration-500 ease-in-out h-[64px] overflow-visible">
                    <button data-action="toggle" id="main-action-btn" class="w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-slate-800 hover:bg-slate-700 active:scale-95 group/btn">
                        
                        <div id="action-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out z-0"></div>

                        <div id="action-markers" class="absolute inset-0 flex z-10 pointer-events-none opacity-100 transition-opacity">
                            <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;">
                                <span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">-no score-</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;">
                                <span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">1/4pts</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;">
                                <span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">3/4pts</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;">
                                <span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">Perfect!</span>
                            </div>
                            <div class="flex flex-col items-center justify-end pb-1.5" style="width: 11.111%;"></div>
                        </div>

                        <div id="btn-state-start" class="flex items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                            <i data-lucide="play" class="w-4 h-4"></i> TAP TO START GAME
                        </div>
                        <div id="btn-state-recording" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                            <i data-lucide="square" class="w-4 h-4"></i> TAP TO STOP (<span id="timer-display">00:00</span>)
                        </div>
                        <div id="btn-state-processing" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                            <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> CHECKING SCORES...
                        </div>
                    </button>
                </div>

                <div class="px-4 pb-4 pt-3 flex-grow flex flex-col min-h-0">
                    <div class="w-full h-full bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-700 shadow-inner">
                        <video id="studio-video" class="w-full h-full object-cover transform -scale-x-100 hidden" autoplay muted playsinline></video>
                        
                        <div id="studio-rec-dot" class="hidden absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm z-10">
                            <span class="animate-pulse w-2 h-2 rounded-full bg-rose-500"></span>
                            <span class="text-[8px] font-bold text-rose-400 uppercase tracking-widest">REC</span>
                        </div>

                        <div id="studio-cam-off" class="text-slate-600 flex flex-col items-center">
                            <i data-lucide="camera-off" class="w-8 h-8 mb-2 opacity-50"></i>
                            <span class="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">CAMERA OFF</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    setupListeners() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            if (btn.dataset.action === 'toggle') {
                if (this.gameState === 'IDLE') {
                    this.dispatchEvent(new CustomEvent('thps-studio-start', { bubbles: true, composed: true }));
                } else if (this.gameState === 'PLAYING') {
                    this.dispatchEvent(new CustomEvent('thps-studio-stop', { bubbles: true, composed: true }));
                }
            } else if (btn.dataset.action === 'retry') {
                this.dispatchEvent(new CustomEvent('thps-studio-retry', { bubbles: true, composed: true }));
            }
        });

        window.addEventListener('thps-dashboard-update', (e) => {
            if (this.gameState === 'ANALYZING') {
                this.processIncomingScores(e.detail);
            }
        });
    }

    // Number Counter Animation
    animateValue(id, start, end, duration, decimals) {
        const obj = this.querySelector(`#${id}`);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            obj.innerHTML = (easeOut * end).toFixed(decimals);
            if (progress < 1) window.requestAnimationFrame(step);
            else obj.innerHTML = end.toFixed(decimals);
        };
        window.requestAnimationFrame(step);
    }

    setGameState(state) {
        this.gameState = state;
        
        const btnMain = this.querySelector('#main-action-btn');
        const prog = this.querySelector('#action-progress');
        const stStart = this.querySelector('#btn-state-start');
        const stRec = this.querySelector('#btn-state-recording');
        const stProc = this.querySelector('#btn-state-processing');
        const setupCards = this.querySelectorAll('.setup-card');

        if (state === 'PLAYING') {
            btnMain.classList.replace('bg-slate-800', 'bg-rose-600');
            btnMain.classList.replace('hover:bg-slate-700', 'hover:bg-rose-500');
            stStart.classList.add('hidden');
            stRec.classList.remove('hidden');
            
            this.timerSeconds = 0;
            this.querySelector('#timer-display').innerText = "00:00";
            
            this.playStartTime = Date.now();
            if (this.internalTimer) clearInterval(this.internalTimer);
            this.internalTimer = setInterval(() => {
                let elapsed = (Date.now() - this.playStartTime) / 1000;
                this.timerSeconds = Math.floor(elapsed);
                const m = Math.floor(this.timerSeconds / 60);
                const s = this.timerSeconds % 60;
                this.querySelector('#timer-display').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                
                if (elapsed <= 90) prog.style.width = `${(elapsed / 90) * 100}%`;
                else this.dispatchEvent(new CustomEvent('thps-studio-stop', { bubbles: true, composed: true }));
            }, 50);
        } 
        else if (state === 'ANALYZING') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            btnMain.classList.replace('bg-rose-600', 'bg-slate-800');
            btnMain.classList.replace('hover:bg-rose-500', 'hover:bg-slate-700');
            btnMain.style.pointerEvents = 'none';
            
            stRec.classList.add('hidden');
            stProc.classList.remove('hidden');
            prog.style.width = '0%';
            this.querySelector('#action-markers').classList.add('opacity-0');

            setupCards.forEach(card => {
                card.classList.add('animate-pulse-dark');
                card.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-emerald-700', 'bg-gradient-to-b');
            });
        }
        else if (state === 'SCORED') {
            // Smoothly collapse action bar and reveal results
            this.querySelector('#action-bar-container').classList.add('hide-smooth');
            this.querySelector('#setup-cards').classList.add('hidden');
            this.querySelector('#stats-container').classList.replace('h-[110px]', 'h-[220px]');
            
            const resultsCards = this.querySelector('#results-cards');
            resultsCards.classList.remove('hidden');
            resultsCards.classList.add('flex');
        }
        else if (state === 'IDLE') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            btnMain.style.pointerEvents = 'auto';
            btnMain.classList.replace('bg-rose-600', 'bg-slate-800');
            btnMain.classList.replace('hover:bg-rose-500', 'hover:bg-slate-700');
            
            stStart.classList.remove('hidden');
            stRec.classList.add('hidden');
            stProc.classList.add('hidden');
            prog.style.width = '0%';
            this.querySelector('#action-markers').classList.remove('opacity-0');
            
            this.querySelector('#action-bar-container').classList.remove('hide-smooth');
            this.querySelector('#setup-cards').classList.remove('hidden');
            this.querySelector('#stats-container').classList.replace('h-[220px]', 'h-[110px]');
            
            const resultsCards = this.querySelector('#results-cards');
            resultsCards.classList.add('hidden');
            resultsCards.classList.remove('flex');

            setupCards.forEach((card, idx) => {
                card.classList.remove('animate-pulse-dark');
                if (idx === 0) card.classList.add('bg-blue-600');
                if (idx === 1) card.classList.add('bg-purple-600');
                if (idx === 2) card.classList.add('bg-emerald-700');
                if (idx === 3) card.classList.add('bg-gradient-to-b');
            });
        }
    }

    processIncomingScores(data) {
        this.setGameState('SCORED');

        let total = data.overrideGrade ? -1 : (data.totalPoints || 0);
        let msg = "Check Scores";
        if (total === -1) msg = "Did not register";
        else if (total < 5) msg = "Keep Practicing";
        else if (total < 8.5) msg = "So Close!";
        else msg = "You Did It!";
        
        this.querySelector('#res-msg').innerText = msg;
        
        // Stars
        let diffStars = 1; // Default
        let starsHtml = '';
        for(let i=0; i<diffStars; i++) starsHtml += `<i data-lucide="star" class="w-4 h-4 text-amber-500 fill-amber-500"></i>`;
        this.querySelector('#res-stars').innerHTML = starsHtml;
        if (window.lucide) window.lucide.createIcons();

        // Staggered Animation Logic
        if (total > 0) setTimeout(() => this.animateValue("res-score-hero", 0, total, 1800, 1), 100);
        else this.querySelector('#res-score-hero').innerText = "-";

        setTimeout(() => {
            this.animateValue("res-personal", 0, Math.round(data.personal || 0), 1200, 0);
            this.querySelector('#res-p-sub').innerText = Math.round(data.personal || 0);
            this.querySelector('#res-v-sub').innerText = Math.round(data.visual || 0);
            this.querySelector('#res-i-sub').innerText = Math.round(data.intangible || 0);
        }, 500);

        setTimeout(() => {
            this.animateValue("res-wpm", 0, Math.round(data.wpm || 0), 1200, 0);
            this.querySelector('#res-mum').innerText = (data.sps || 0).toFixed(1);
            this.querySelector('#res-pau').innerText = Math.round(data.pause || 0);
        }, 900);

        setTimeout(() => {
            this.animateValue("res-simp", 0, Math.round(data.simple || 0), 1200, 0);
            this.querySelector('#res-wps').innerText = (data.wps || 0).toFixed(1);
            this.querySelector('#res-rdl').innerText = (data.grade || 0).toFixed(1);
        }, 1300);

        setTimeout(() => {
            this.animateValue("res-time", 0, Math.round(data.time || 0), 1200, 0);
        }, 1700);
    }

    async fetchDailyData() {
        try {
            const response = await fetch(this.dataSource + '?nocache=' + new Date().getTime());
            if (response.ok) {
                const data = await response.json();
                if (data[this.currentDate]) {
                    const d = data[this.currentDate];
                    this.querySelector('#studio-adlib').innerHTML = `<strong class="text-blue-600">${d.challenge}</strong> about <strong class="text-purple-600">${d.sponsor}</strong>, with <strong class="text-emerald-700">${d.script}</strong> examples, and <strong class="text-rose-600">${d.micCheck}!</strong>`;
                }
            }
        } catch (error) {
            console.warn("Could not load JSON.");
        }
    }
}

customElements.define('thps-gameboard-animated', ThpsGameboardAnimated);

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
        this.currentStars = 5; // Default difficulty for studio board

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
            </style>

            <!-- NEW WRAPPER -->
            <div class="relative w-full max-w-[368px] mx-auto flex flex-col items-center">
            
                <!-- THE ORIGINAL WIDGET (Removed mx-auto, added to wrapper) -->
                <div class="relative w-full aspect-[9/16] max-h-[850px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ring-8 ring-slate-800 z-10">

                <!-- 2. STATS & SETUP AREA -->
                <div id="stats-container" class="px-4 pt-4 w-full transition-all duration-500 ease-in-out flex flex-col justify-center shrink-0 h-[150px]">
                    
                    <!-- Phase 1-3: Setup Cards -->
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

                    <!-- Phase 4: Final Results (Hidden) -->
                    <div id="results-cards" class="hidden h-full flex-col w-full">
                        <!-- Hero Score (Split Layout) -->
                        <div class="relative w-full h-16 sm:h-20 mb-3 animate-slide-up" style="animation-delay: 0.1s;">
                            <!-- Stars (30% from left) -->
                            <div class="absolute top-1/2 -translate-y-1/2 left-[30%] -translate-x-1/2 flex flex-col items-center gap-0.5 w-24">
                                <div class="flex justify-center gap-1 w-full" id="res-stars-top"></div>
                                <div class="flex justify-center gap-1 w-full" id="res-stars-bottom"></div>
                            </div>
                            <!-- Grade (60% from left, nudged up) -->
                            <div class="absolute top-1/2 -translate-y-1/2 left-[60%] -translate-x-1/2 flex flex-col items-center justify-center -mt-2">
                                <h2 class="text-[48px] sm:text-[56px] font-black text-slate-800 leading-none tracking-tighter drop-shadow-sm" id="res-score-hero">0.0</h2>
                                <p class="text-[10px] font-bold tracking-widest text-blue-600 uppercase mt-1 leading-none" id="res-msg">Checking...</p>
                            </div>
                        </div>

                        <!-- Granular Stats (2x2 Grid) -->
                        <div class="grid grid-cols-2 gap-2 flex-grow">
                            <!-- Content -->
                            <div class="bg-blue-50 border border-blue-100 rounded-xl p-2 flex flex-col justify-center gap-1 animate-slide-up" style="animation-delay: 0.5s;">
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
                            <!-- Delivery -->
                            <div class="bg-purple-50 border border-purple-100 rounded-xl p-2 flex flex-col justify-center gap-1 animate-slide-up" style="animation-delay: 0.9s;">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-purple-700 tracking-wider">DELIVERY</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-wpm">0</span> <span class="text-[8px] text-slate-500 font-bold">WPM</span></span>
                                </div>
                                <div class="text-[9px] text-slate-500 flex justify-between font-medium">
                                    <span>Mum: <span id="res-mum">0</span></span> 
                                    <span>Pau: <span id="res-pau">0</span>%</span>
                                </div>
                            </div>
                            <!-- Simplify -->
                            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-2 flex flex-col justify-center gap-1 animate-slide-up" style="animation-delay: 1.3s;">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-emerald-700 tracking-wider">SIMPLIFY</span>
                                    <span class="text-[16px] font-black text-slate-800"><span id="res-simp">0</span>%</span>
                                </div>
                                <div class="text-[9px] text-slate-500 flex justify-between font-medium">
                                    <span>W/S: <span id="res-wps">0</span></span> 
                                    <span>RDL: <span id="res-rdl">0</span></span>
                                </div>
                            </div>
                            <!-- Time (Clean Display) -->
                            <div class="bg-amber-50 border border-amber-100 rounded-xl p-2 flex flex-col justify-center items-center animate-slide-up" style="animation-delay: 1.7s;">
                                <span class="text-[10px] font-bold text-amber-700 tracking-wider mb-1">TIME</span>
                                <span class="text-[20px] font-black text-slate-800"><span id="res-time">0</span>s</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- NEW: THE FLEX GAP CONTAINER -->
                <div class="relative flex-1 w-full pointer-events-none">
                    
                    <!-- 3. PROMPT AREA (Anchored to 1/3 of the gap) -->
                    <div id="madlib-panel" class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] z-30 pointer-events-none transition-all duration-500 ease-in-out">
                        <div class="w-full bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 shadow-2xl text-center flex flex-col justify-center min-h-[70px]">
                            <p id="studio-adlib" class="text-[14px] font-medium leading-snug text-slate-800 pointer-events-auto">Loading...</p>
                        </div>
                    </div>

                    <!-- 4. CREATOR SEQUENCE ACTION BAR (Top-center anchored to 2/3 of the gap) -->
                    <div id="action-bar-container" class="absolute top-2/3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] shrink-0 transition-all duration-500 ease-in-out h-[64px] overflow-visible pointer-events-auto">
                        <button data-action="toggle" id="main-action-btn" class="w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-slate-800 hover:bg-slate-700 active:scale-95 group/btn">
                            
                            <div id="action-progress" class="absolute left-0 top-0 h-full w-0 bg-indigo-600 transition-all duration-100 ease-out z-0"></div>

                            <div id="action-markers" class="absolute inset-0 flex z-10 pointer-events-none opacity-0 transition-opacity">
                                <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;"><span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">-no score-</span></div>
                                <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;"><span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">1/4pts</span></div>
                                <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;"><span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">3/4pts</span></div>
                                <div class="flex flex-col items-center justify-end pb-1.5 border-r-[1.5px] border-white/20" style="width: 22.222%;"><span class="text-[7px] text-white/50 font-bold tracking-widest leading-none">Perfect!</span></div>
                                <div class="flex flex-col items-center justify-end pb-1.5" style="width: 11.111%;"></div>
                            </div>

                            <!-- Sequence States -->
                            <div id="btn-state-idle" class="flex items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                                <i data-lucide="play" class="w-4 h-4"></i> TAP TO START
                            </div>
                            <div id="btn-state-start" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                                <i data-lucide="play" class="w-4 h-4"></i> TAP TO START
                            </div>
                            <div id="btn-state-recording" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                                <i data-lucide="square" class="w-4 h-4"></i> TAP TO STOP (<span id="timer-display">00:00</span>)
                            </div>
                            <div id="btn-state-processing" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                                <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> CHECKING SCORES...
                            </div>
                            <div id="btn-state-save" class="hidden items-center gap-2 z-20 font-black tracking-widest text-[11px] uppercase">
                                <i data-lucide="check" class="w-4 h-4"></i> SCORES READY
                            </div>
                        </button>
                    </div>

                </div>

                <!-- 5. CAMERA FEED (Increased to 40%) -->
                <div class="px-4 pb-4 h-[40%] w-full flex flex-col shrink-0 pointer-events-auto z-10">
                    <div data-action="toggle-camera" class="w-full h-full bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-700 shadow-inner cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                        <video id="studio-video" class="w-full h-full object-cover transform -scale-x-100 hidden" autoplay muted playsinline></video>

                        <div id="studio-cam-off" class="text-slate-600 flex flex-col items-center pointer-events-none">
                            <i data-lucide="camera-off" class="w-8 h-8 mb-2 opacity-50"></i>
                            <span class="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">TAP TO TURN ON</span>
                        </div>
                    </div>
                </div>
                
                </div> <!-- END ORIGINAL WIDGET -->

                <!-- 6. THE SLIDE-OUT TRAY (Reset Only) -->
                <div id="slide-out-tray" class="w-[50%] flex transition-all duration-500 ease-in-out h-0 opacity-0 overflow-hidden mt-0 z-0 mx-auto">
                    <button data-action="reset" class="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex justify-center items-center shadow-lg active:scale-95 transition-transform">
                        <i data-lucide="rotate-ccw" class="w-6 h-6"></i>
                    </button>
                </div>
                
            </div> <!-- END NEW WRAPPER -->
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    setupListeners() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            // Step-by-step state machine delegator
            if (btn.dataset.action === 'toggle-camera') {
                if (this.gameState === 'IDLE') {
                    this.dispatchEvent(new CustomEvent('thps-studio-start-camera', { bubbles: true, composed: true }));
                } else if (this.gameState === 'CAMERA_ON') {
                    this.dispatchEvent(new CustomEvent('thps-studio-stop-camera', { bubbles: true, composed: true }));
                }
            } else if (btn.dataset.action === 'toggle') {
                if (this.gameState === 'IDLE' || this.gameState === 'CAMERA_ON') {
                    this.dispatchEvent(new CustomEvent('thps-studio-start-game', { bubbles: true, composed: true }));
                } else if (this.gameState === 'PLAYING') {
                    this.dispatchEvent(new CustomEvent('thps-studio-stop-game', { bubbles: true, composed: true }));
                } 
            } else if (btn.dataset.action === 'reset') {
                this.dispatchEvent(new CustomEvent('thps-studio-reset-game', { bubbles: true, composed: true }));
            }
        });

        window.addEventListener('thps-dashboard-update', (e) => {
            if (this.gameState === 'ANALYZING') {
                this.processIncomingScores(e.detail);
            }
        });
    }

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
        const markers = this.querySelector('#action-markers');
        const actionBarContainer = this.querySelector('#action-bar-container');
        const tray = this.querySelector('#slide-out-tray');
        const madlibPanel = this.querySelector('#madlib-panel'); 
        
        // The Two-Element Swap Animation
        if (state === 'SCORED') {
            // 1. Hide internal action bar completely
            actionBarContainer.classList.replace('h-[64px]', 'h-0');
            actionBarContainer.classList.add('opacity-0', 'pointer-events-none');
            
            // 2. Slide out the external tray
            tray.classList.replace('h-0', 'h-[52px]');
            tray.classList.replace('mt-0', 'mt-4');
            tray.classList.replace('opacity-0', 'opacity-100');

            // 3. Drop the Mad-Lib panel to the exact mathematical center
            if (madlibPanel) madlibPanel.classList.replace('top-1/3', 'top-1/2');
        } else {
            // 1. Restore internal action bar
            actionBarContainer.classList.replace('h-0', 'h-[64px]');
            actionBarContainer.classList.remove('opacity-0', 'pointer-events-none');
            
            // 2. Hide external tray
            tray.classList.replace('h-[52px]', 'h-0');
            tray.classList.replace('mt-4', 'mt-0');
            tray.classList.replace('opacity-100', 'opacity-0');

            // 3. Restore the Mad-Lib panel to the top third
            if (madlibPanel && madlibPanel.classList.contains('top-1/2')) {
                madlibPanel.classList.replace('top-1/2', 'top-1/3');
            }
        }
        
        // Grab all states
        const states = {
            idle: this.querySelector('#btn-state-idle'),
            start: this.querySelector('#btn-state-start'),
            recording: this.querySelector('#btn-state-recording'),
            processing: this.querySelector('#btn-state-processing'),
            save: this.querySelector('#btn-state-save')
        };

        // Helper to show just one state text
        const showState = (activeKey) => {
            Object.keys(states).forEach(k => {
                if (k === activeKey) { states[k].classList.remove('hidden'); states[k].classList.add('flex'); }
                else { states[k].classList.add('hidden'); states[k].classList.remove('flex'); }
            });
        };

        if (state === 'IDLE') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            btnMain.style.pointerEvents = 'auto';
            btnMain.className = 'w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-slate-800 hover:bg-slate-700 active:scale-95 group/btn';
            
            showState('idle');
            prog.style.width = '0%';
            markers.classList.add('opacity-0');
            
            this.querySelector('#setup-cards').classList.remove('hidden');
            this.querySelector('#stats-container').classList.replace('h-[320px]', 'h-[150px]');
            
            const resultsCards = this.querySelector('#results-cards');
            resultsCards.classList.add('hidden');
            resultsCards.classList.remove('flex');
        }
        else if (state === 'CAMERA_ON') {
            btnMain.className = 'w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-blue-600 hover:bg-blue-500 active:scale-95 group/btn';
            showState('start');
            markers.classList.remove('opacity-0');
        }
        else if (state === 'PLAYING') {
            btnMain.className = 'w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-rose-600 hover:bg-rose-500 active:scale-95 group/btn';
            showState('recording');
            
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
                else this.dispatchEvent(new CustomEvent('thps-studio-stop-game', { bubbles: true, composed: true }));
            }, 50);
        } 
        else if (state === 'ANALYZING') {
            if (this.internalTimer) clearInterval(this.internalTimer);
            btnMain.className = 'w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-slate-800 hover:bg-slate-700 group/btn pointer-events-none';
            showState('processing');
            prog.style.width = '0%';
            markers.classList.add('opacity-0');
        }
        else if (state === 'SCORED') {
            btnMain.style.pointerEvents = 'auto';
            btnMain.className = 'w-full h-full rounded-2xl flex flex-col items-center justify-center text-white transition-all duration-300 relative overflow-hidden shadow-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 group/btn';
            showState('save');
            prog.style.width = '100%';
            
            this.querySelector('#setup-cards').classList.add('hidden');
            this.querySelector('#stats-container').classList.replace('h-[150px]', 'h-[320px]');
            
            const resultsCards = this.querySelector('#results-cards');
            resultsCards.classList.remove('hidden');
            resultsCards.classList.add('flex');
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
        
        // Dynamic Star Layout (Top row: max 3, Bottom row: remainder)
        let actualStars = window.thps_currentGameStars || 5; 
        let topRowHtml = '';
        let bottomRowHtml = '';
        
        for(let i = 0; i < actualStars; i++) {
            let starIcon = `<i data-lucide="star" class="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow-sm"></i>`;
            if (i < 3) topRowHtml += starIcon;
            else bottomRowHtml += starIcon;
        }
        
        this.querySelector('#res-stars-top').innerHTML = topRowHtml;
        this.querySelector('#res-stars-bottom').innerHTML = bottomRowHtml;
        if (window.lucide) window.lucide.createIcons();

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

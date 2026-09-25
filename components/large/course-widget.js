class THPSCourseWidget extends HTMLElement {
    constructor() {
        super();
        this.isMenuOpen = false;
        this.currentStep = 0; 
        this.courseData = null;
        this.evaluations = {}; 
        this.prompts = null;
        
        // Mic-Check Daily Specific State
        this.micCheckFullData = null;
        this.micCheckDates = [];
        this.micCheckCurrentDateIndex = 0;
        
        // ESL Specific State
        this.eslCategory = null;
        this.eslSentences = [];
        this.eslIndex = 0;

        // Voice Choice Specific State
        this.vcActiveSpeechIndex = 0;
        this.vcLineIndex = 0;

        // Say What You See Specific State
        this.swysLevel = 1;
        this.swysImageIndex = 0;

        // Repeat + Count Specific State
        this.rcData = null;
        this.rcMenuIndex = 0;
        this.rcActiveLevel = 0; 
        this.rcSetIndex = 0; 
        this.rcState = 'prompt'; // 'prompt' or 'grade'
        this.rcLatestTelemetry = null; // Caches the 9 metrics
    }

    connectedCallback() {
        this.renderCourseSelector();
        this.syncLoop = setInterval(() => this.updateTimerUI(), 50);
        
        this.payloadHandler = this.processPayload.bind(this);
        window.addEventListener('thps-dashboard-update', this.payloadHandler);
    }

    disconnectedCallback() {
        if (this.syncLoop) clearInterval(this.syncLoop);
        window.removeEventListener('thps-dashboard-update', this.payloadHandler);
    }

    renderCourseSelector() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <i data-lucide="graduation-cap" class="w-8 h-8 pointer-events-none"></i>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">Training Courses</h2>
                <p class="text-slate-500 text-sm mb-8 text-center max-w-sm">Select a module to begin your training and analysis.</p>
                
                <div class="grid grid-cols-1 gap-4 w-full max-w-md">
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="mic-check-daily">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Mic-Check Daily</span>
                        <i data-lucide="calendar" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>

                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/esl-level-1/esl-level-1.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">ESL Level 1: Pronunciation</span>
                        <i data-lucide="mic-2" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>

                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-type="repeat-count" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/repeat-count/repeat-count-levels.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Repeat + Count</span>
                        <i data-lucide="gamepad-2" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>

                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/voice-choices/voice-choices.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Voice Choice: Intensity</span>
                        <i data-lucide="sliders" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>

                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/say-what-you-see.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Say What You See</span>
                        <i data-lucide="image" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        this.attachSelectorListeners();
    }

    attachSelectorListeners() {
        const btns = this.querySelectorAll('.thps-course-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                const type = e.currentTarget.getAttribute('data-type');
                
                if (url === 'mic-check-daily') {
                    this.fetchMicCheckDaily();
                } else if (type === 'repeat-count') {
                    this.fetchRepeatCountData(url);
                } else {
                    this.fetchCourse(url);
                }
            });
        });
    }

    // ==========================================
    // REPEAT + COUNT LOGIC (10-LEVEL PROGRESSION)
    // ==========================================
    async fetchRepeatCountData(url) {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Level Data...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        try {
            const response = await fetch(`${url}?t=${Date.now()}`);
            if (!response.ok) throw new Error("Failed to load Repeat + Count JSON.");
            this.rcData = await response.json();
            
            this.rcMenuIndex = 0;
            this.currentStep = 'rc-menu';
            this.renderRepeatCountMenu();
        } catch (e) {
            console.error("Repeat + Count Fetch Error:", e);
            this.innerHTML = `
                <div class="relative w-full h-[650px] bg-rose-50 border border-rose-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                    <i data-lucide="alert-triangle" class="w-10 h-10 text-rose-600 mb-4"></i>
                    <h3 class="text-lg font-bold text-rose-800 mb-2">Failed to load Repeat + Count Levels</h3>
                    <button class="thps-back-btn mt-4 bg-white border border-rose-200 text-rose-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-100 transition-colors">Go Back</button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: this });
            this.querySelector('.thps-back-btn').addEventListener('click', () => this.renderCourseSelector());
        }
    }

    renderRepeatCountMenu() {
        const level = this.rcData[this.rcMenuIndex];

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-6 md:p-8 justify-center items-center">
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <div class="text-center mb-10">
                    <h2 class="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Repeat + Count</h2>
                    <p class="text-slate-500 text-sm md:text-base mt-2">Select your difficulty level to begin.</p>
                </div>

                <div class="flex items-center justify-between w-full max-w-3xl mx-auto px-2 md:px-6">
                    <button id="rc-menu-prev" class="p-3 bg-white border-2 border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 rounded-full transition-all active:scale-90 shadow-sm shrink-0">
                        <i data-lucide="chevron-left" class="w-6 h-6 pointer-events-none"></i>
                    </button>
                    
                    <div id="rc-menu-select" class="flex-1 max-w-sm mx-4 bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-2xl shadow-md p-8 text-center cursor-pointer transition-all active:scale-95 group">
                        <span class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block">Level ${this.rcMenuIndex + 1} of 10</span>
                        <h3 class="text-2xl font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">${level.title}</h3>
                        <p class="text-sm font-bold text-slate-500 leading-relaxed">${level.description}</p>
                        <div class="mt-6 inline-flex items-center justify-center bg-indigo-50 text-indigo-700 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            Start Level
                        </div>
                    </div>

                    <button id="rc-menu-next" class="p-3 bg-white border-2 border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 rounded-full transition-all active:scale-90 shadow-sm shrink-0">
                        <i data-lucide="chevron-right" class="w-6 h-6 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            this.rcData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        this.querySelector('#rc-menu-prev').addEventListener('click', () => {
            const len = this.rcData.length;
            this.rcMenuIndex = (this.rcMenuIndex - 1 + len) % len;
            this.renderRepeatCountMenu();
        });

        this.querySelector('#rc-menu-next').addEventListener('click', () => {
            const len = this.rcData.length;
            this.rcMenuIndex = (this.rcMenuIndex + 1) % len;
            this.renderRepeatCountMenu();
        });

        this.querySelector('#rc-menu-select').addEventListener('click', () => {
            this.rcActiveLevel = this.rcMenuIndex;
            this.rcSetIndex = 0;
            this.rcState = 'prompt'; 
            this.currentStep = 'rc-drill';
            this.renderRepeatCountDrill();
        });
    }

    renderRepeatCountDrill() {
        const level = this.rcData[this.rcActiveLevel];
        const set = level.sets[this.rcSetIndex];
        const isFlipped = this.rcState === 'grade';

        this.innerHTML = `
            <style>
                .rc-flip-card { perspective: 1000px; }
                .rc-flip-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1); transform-style: preserve-3d; }
                .rc-flipped .rc-flip-inner { transform: rotateY(180deg); }
                .rc-flip-front, .rc-flip-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; }
                .rc-flip-back { transform: rotateY(180deg); }
            </style>
            
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                
                <!-- TOP HEADER -->
                <div class="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-20">
                    <button class="thps-rc-back text-slate-300 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Levels
                    </button>
                    <div class="text-center truncate px-4">
                        <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Level ${level.id}</span>
                        <span class="block text-sm font-bold truncate">${level.title}</span>
                    </div>
                    <button class="thps-exit-course text-slate-300 hover:text-rose-400 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                        Exit <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>

                <!-- 3D FLIPPABLE CARDS -->
                <!-- FIX: Reduced margins (mb-3/mt-3) and gap (gap-2) to prevent flexbox overflow -->
                <div class="flex-1 flex flex-col gap-2 max-w-lg mx-auto w-full mb-3 mt-3 px-4 md:px-0 justify-center min-h-0">
                    
                    <!-- CARD 1: QUESTION / MANUAL GRADING -->
                    <div class="rc-flip-card flex-1 min-h-[110px] ${isFlipped ? 'rc-flipped' : ''}" id="rc-card-1">
                        <div class="rc-flip-inner">
                            <div class="rc-flip-front bg-white border-2 border-indigo-100 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4">
                                <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest absolute top-3 left-4">Question Prompt</span>
                                <span class="text-sm md:text-base font-bold text-slate-700 text-center leading-snug w-[90%] mx-auto line-clamp-3">${set.question}</span>
                            </div>
                            <div class="rc-flip-back bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-sm flex flex-col items-start justify-center p-4 sm:p-5">
                                <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 w-full text-center">Manual Adherence Check</span>
                                <label class="flex items-center gap-3 cursor-pointer mb-1 w-full hover:bg-slate-700 p-1.5 sm:p-2 rounded-lg transition-colors">
                                    <input type="checkbox" id="chk-question" class="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-700 border-slate-600">
                                    <span class="text-sm font-bold text-white">Answered Question</span>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer mb-1 w-full hover:bg-slate-700 p-1.5 sm:p-2 rounded-lg transition-colors">
                                    <input type="checkbox" id="chk-repeat" class="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-700 border-slate-600">
                                    <span class="text-sm font-bold text-white">Followed Repeat Rule</span>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer w-full hover:bg-slate-700 p-1.5 sm:p-2 rounded-lg transition-colors">
                                    <input type="checkbox" id="chk-count" class="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-700 border-slate-600">
                                    <span class="text-sm font-bold text-white">Followed Count Rule</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- CARD 2: REPEAT / CONTENT & DELIVERY -->
                    <div class="rc-flip-card flex-1 min-h-[110px] ${isFlipped ? 'rc-flipped' : ''}" id="rc-card-2">
                        <div class="rc-flip-inner">
                            <div class="rc-flip-front bg-white border-2 border-emerald-100 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4">
                                <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest absolute top-3 left-4">Repeat Framework</span>
                                <span class="text-sm md:text-base font-bold text-slate-700 text-center leading-snug w-[90%] mx-auto line-clamp-3">${set.repeat}</span>
                            </div>
                            <div class="rc-flip-back bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-sm flex flex-col justify-center p-4">
                                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-left w-full h-full content-center">
                                    <div class="flex justify-between items-center border-b border-slate-700 pb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">Personal</span>
                                        <span class="text-sm font-black text-emerald-400" id="rc-val-pers">--%</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-slate-700 pb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">WPM</span>
                                        <span class="text-sm font-black text-amber-400" id="rc-val-wpm">--</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-slate-700 pb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">Visual</span>
                                        <span class="text-sm font-black text-emerald-400" id="rc-val-vis">--%</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-slate-700 pb-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">SPS</span>
                                        <span class="text-sm font-black text-amber-400" id="rc-val-sps">--</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">Intangible</span>
                                        <span class="text-sm font-black text-slate-200" id="rc-val-intg">--%</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase">Pause</span>
                                        <span class="text-sm font-black text-amber-400" id="rc-val-pause">--%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CARD 3: COUNT / SIMPLICITY & ACTIONS -->
                    <div class="rc-flip-card flex-1 min-h-[110px] ${isFlipped ? 'rc-flipped' : ''}" id="rc-card-3">
                        <div class="rc-flip-inner">
                            <div class="rc-flip-front bg-white border-2 border-amber-100 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4">
                                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest absolute top-3 left-4">Count Sequence</span>
                                <span class="text-sm md:text-base font-bold text-slate-700 text-center leading-snug w-[90%] mx-auto line-clamp-3">${set.count}</span>
                            </div>
                            <div class="rc-flip-back bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-sm flex flex-col p-4 justify-between">
                                <div class="grid grid-cols-3 gap-2 mb-3 mt-1">
                                    <div class="text-center">
                                        <span class="block text-[9px] font-bold text-slate-400 uppercase">Runtime</span>
                                        <span class="text-sm font-black text-cyan-400" id="rc-val-run">--</span>
                                    </div>
                                    <div class="text-center border-l border-slate-700">
                                        <span class="block text-[9px] font-bold text-slate-400 uppercase">Grade</span>
                                        <span class="text-sm font-black text-cyan-400" id="rc-val-grade">--</span>
                                    </div>
                                    <div class="text-center border-l border-slate-700">
                                        <span class="block text-[9px] font-bold text-slate-400 uppercase">Simple</span>
                                        <span class="text-sm font-black text-cyan-400" id="rc-val-simp">--%</span>
                                    </div>
                                </div>
                                <div class="flex gap-2 w-full mt-auto">
                                    <button id="btn-rc-retry" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-slate-600">Retry</button>
                                    <button id="btn-rc-save" class="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-md flex items-center justify-center gap-1">
                                        <i data-lucide="check" class="w-3 h-3"></i> Save to CRM
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SLEEK ARCADE TIMER BAR PANEL -->
                <!-- FIX: Shrunk height slightly to guarantee vertical fit -->
                <div class="w-full max-w-lg mx-auto relative h-[60px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800 mb-3 px-2">
                    <div id="arcade-progress" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                    
                    <button id="arcade-record-btn" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                        <i data-lucide="mic" id="arcade-record-icon" class="w-5 h-5 pointer-events-none transition-transform"></i>
                    </button>
                </div>

                <!-- BOTTOM MASTER NAVIGATION -->
                <!-- FIX: Now guaranteed to display within the 650px container -->
                <div class="bg-white border-t border-slate-200 p-3 flex justify-between items-center shrink-0 z-20">
                    <button id="rc-drill-prev" class="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 active:scale-95 shadow-sm">
                        <i data-lucide="chevron-left" class="w-4 h-4 pointer-events-none"></i> Prev Set
                    </button>
                    <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Set ${this.rcSetIndex + 1} / 10</span>
                    <button id="rc-drill-next" class="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 active:scale-95 shadow-md">
                        Next Set <i data-lucide="chevron-right" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        // Listeners
        this.querySelector('.thps-rc-back').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            this.currentStep = 'rc-menu';
            this.renderRepeatCountMenu();
        });

        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            this.rcData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        this.querySelector('#rc-drill-prev').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            const len = level.sets.length;
            this.rcSetIndex = (this.rcSetIndex - 1 + len) % len;
            this.rcState = 'prompt';
            this.rcLatestTelemetry = null;
            this.renderRepeatCountDrill();
        });

        this.querySelector('#rc-drill-next').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            const len = level.sets.length;
            this.rcSetIndex = (this.rcSetIndex + 1) % len;
            this.rcState = 'prompt';
            this.rcLatestTelemetry = null;
            this.renderRepeatCountDrill();
        });

        this.querySelector('#arcade-record-btn').addEventListener('click', () => {
            // Prevent recording if currently in grading view
            if (this.rcState === 'grade') return;
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        });

        // Retry & Save Action Listeners (Only active when flipped)
        const btnRetry = this.querySelector('#btn-rc-retry');
        if (btnRetry) {
            btnRetry.addEventListener('click', () => {
                this.rcState = 'prompt';
                this.rcLatestTelemetry = null;
                this.renderRepeatCountDrill();
            });
        }

        const btnSave = this.querySelector('#btn-rc-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveRcAttemptToCRM(btnSave));
        }
        
        // Auto-hydrate the telemetry numbers if rendering in flipped state
        if (this.rcState === 'grade' && this.rcLatestTelemetry) {
            this.updateRcTelemetryUI();
        }
    }

    updateRcTelemetryUI() {
        if (!this.rcLatestTelemetry) return;
        const d = this.rcLatestTelemetry;
        
        const setVal = (id, val) => {
            const el = this.querySelector(id);
            if (el) el.innerText = val;
        };

        setVal('#rc-val-pers', `${Math.round(d.personal)}%`);
        setVal('#rc-val-vis', `${Math.round(d.visual)}%`);
        setVal('#rc-val-intg', `${Math.round(d.intangible)}%`);
        setVal('#rc-val-wpm', Math.round(d.wpm));
        setVal('#rc-val-sps', d.sps.toFixed(1));
        setVal('#rc-val-pause', `${Math.round(d.pause)}%`);
        setVal('#rc-val-run', `${d.runtime.toFixed(1)}s`);
        setVal('#rc-val-grade', d.compGrade.toFixed(1));
        setVal('#rc-val-simp', `${Math.round(d.simple)}%`);
    }

    async saveRcAttemptToCRM(btnEl) {
        const clientId = localStorage.getItem('thps_crm_client_id');
        if (!clientId) {
            alert("No CRM Client ID linked! Click 'Guest' at the top left to link a session first.");
            return;
        }

        const chkQuestion = this.querySelector('#chk-question')?.checked || false;
        const chkRepeat = this.querySelector('#chk-repeat')?.checked || false;
        const chkCount = this.querySelector('#chk-count')?.checked || false;

        const payload = {
            clientId: clientId,
            levelId: this.rcData[this.rcActiveLevel].id,
            setIndex: this.rcSetIndex,
            timestamp: new Date().toISOString(),
            manualGrades: {
                questionAdherence: chkQuestion,
                repeatAdherence: chkRepeat,
                countAdherence: chkCount
            },
            telemetry: this.rcLatestTelemetry
        };

        // UI Loading State
        const originalHtml = btnEl.innerHTML;
        btnEl.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Saving...`;
        if (window.lucide) window.lucide.createIcons({ root: btnEl });
        btnEl.disabled = true;

        try {
            const response = await fetch('/api/save-rc-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('CRM Sync Failed');

            // Success State - Automatically progress to the next set
            btnEl.classList.replace('bg-emerald-600', 'bg-blue-600');
            btnEl.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i> Saved!`;
            if (window.lucide) window.lucide.createIcons({ root: btnEl });
            
            setTimeout(() => {
                const len = this.rcData[this.rcActiveLevel].sets.length;
                this.rcSetIndex = (this.rcSetIndex + 1) % len;
                this.rcState = 'prompt';
                this.rcLatestTelemetry = null;
                this.renderRepeatCountDrill();
            }, 800);

        } catch (error) {
            console.error(error);
            alert("Failed to save to CRM. Please check your connection.");
            btnEl.innerHTML = originalHtml;
            btnEl.disabled = false;
            if (window.lucide) window.lucide.createIcons({ root: btnEl });
        }
    }

    // ==========================================
    // MIC-CHECK DAILY COURSE LOGIC
    // ==========================================
    async fetchMicCheckDaily() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Daily Prompts...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        try {
            const res = await fetch(`https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/mic-check-daily.json?t=${Date.now()}`);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            
            this.micCheckFullData = data;
            this.micCheckDates = Object.keys(data).sort();
            
            if (this.micCheckDates.length === 0) throw new Error("No dates available in JSON");

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            
            let index = this.micCheckDates.indexOf(todayStr);

            if (index === -1) {
                index = this.micCheckDates.length - 1; 
            }
            
            this.micCheckCurrentDateIndex = index;
            this.currentStep = 'mic-check';
            this.renderMicCheckUI();
            
        } catch (e) {
            console.error("Mic-Check Fetch Error:", e);
            this.innerHTML = `
                <div class="relative w-full h-[650px] bg-rose-50 border border-rose-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                    <i data-lucide="alert-triangle" class="w-10 h-10 text-rose-600 mb-4"></i>
                    <h3 class="text-lg font-bold text-rose-800 mb-2">Failed to load daily prompts</h3>
                    <button class="thps-back-btn mt-4 bg-white border border-rose-200 text-rose-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-100 transition-colors">Go Back</button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: this });
            this.querySelector('.thps-back-btn').addEventListener('click', () => this.renderCourseSelector());
        }
    }

    renderMicCheckUI() {
        const activeDate = this.micCheckDates[this.micCheckCurrentDateIndex];
        const activePrompts = this.micCheckFullData[activeDate];

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-5 sm:p-6">
                <!-- MINI EXIT BUTTON -->
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <!-- INTERACTIVE DATE NAVIGATION HEADER -->
                <div class="flex items-center justify-center gap-3 mb-5 mt-3">
                    <button id="mic-check-prev" class="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" ${this.micCheckCurrentDateIndex === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-left" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    
                    <div class="relative flex items-center justify-center gap-2 bg-white border-2 border-slate-200 px-4 py-2 rounded-xl shadow-sm cursor-pointer hover:border-indigo-400 transition-colors group min-w-[170px]">
                        <i data-lucide="calendar" class="w-4 h-4 text-indigo-500 pointer-events-none"></i>
                        <select id="mic-check-date-select" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Jump to Date">
                            ${this.micCheckDates.map((dateStr, idx) => `
                                <option value="${idx}" ${idx === this.micCheckCurrentDateIndex ? 'selected' : ''}>${dateStr}</option>
                            `).join('')}
                        </select>
                        <span class="text-sm font-black text-slate-700 pointer-events-none tracking-wide">${activeDate}</span>
                        <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 group-hover:text-indigo-500 pointer-events-none"></i>
                    </div>

                    <button id="mic-check-next" class="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" ${this.micCheckCurrentDateIndex === this.micCheckDates.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-right" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <!-- FOUR RESPONSIVE PROMPT FIELDS -->
                <div class="flex-1 flex flex-col gap-2.5 max-w-lg mx-auto w-full mb-4 justify-center">
                    
                    <div class="flex-1 max-h-[85px] min-h-[70px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-3 relative">
                        <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest absolute top-2 left-4">Challenge</span>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2">${activePrompts.challenge}</span>
                    </div>

                    <div class="flex-1 max-h-[85px] min-h-[70px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-3 relative">
                        <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest absolute top-2 left-4">Sponsor</span>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2">${activePrompts.sponsor}</span>
                    </div>

                    <div class="flex-1 max-h-[85px] min-h-[70px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-3 relative">
                        <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest absolute top-2 left-4">Script</span>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2">${activePrompts.script}</span>
                    </div>

                    <div class="flex-1 max-h-[85px] min-h-[70px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-3 relative">
                        <span class="text-[9px] font-black text-rose-500 uppercase tracking-widest absolute top-2 left-4">Mic Check</span>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2">${activePrompts.micCheck}</span>
                    </div>
                </div>

                <!-- SLEEK ARCADE TIMER BAR PANEL -->
                <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800 mb-2">
                    <div id="arcade-progress" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                    
                    <button id="arcade-record-btn" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                        <i data-lucide="mic" id="arcade-record-icon" class="w-5 h-5 pointer-events-none transition-transform"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        
        const exitBtn = this.querySelector('.thps-exit-course');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
                this.micCheckFullData = null;
                this.micCheckDates = [];
                this.currentStep = 0;
                this.renderCourseSelector();
            });
        }

        const prevBtn = this.querySelector('#mic-check-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.micCheckCurrentDateIndex > 0) {
                    this.micCheckCurrentDateIndex--;
                    this.renderMicCheckUI();
                }
            });
        }

        const nextBtn = this.querySelector('#mic-check-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.micCheckCurrentDateIndex < this.micCheckDates.length - 1) {
                    this.micCheckCurrentDateIndex++;
                    this.renderMicCheckUI();
                }
            });
        }

        const dateSelect = this.querySelector('#mic-check-date-select');
        if (dateSelect) {
            dateSelect.addEventListener('change', (e) => {
                this.micCheckCurrentDateIndex = parseInt(e.target.value);
                this.renderMicCheckUI();
            });
        }

        const recordBtn = this.querySelector('#arcade-record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                if (typeof window.toggleRecording === 'function') window.toggleRecording();
            });
        }
    }

    // ==========================================
    // VOICE CHOICE: MENU & GLIDING PROMPTER
    // ==========================================
    renderVoiceChoiceMenu() {
        const speechOptions = this.courseData.speeches.map((speech, index) => `
            <button class="thps-vc-select-btn group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-start justify-center text-left transition-all shadow-sm active:scale-95 w-full" data-index="${index}">
                <span class="text-sm font-black text-slate-700 group-hover:text-indigo-600 mb-1 pointer-events-none">${speech.title}</span>
                <span class="text-xs font-bold text-slate-400 pointer-events-none">${speech.description}</span>
            </button>
        `).join('');

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-6 md:p-8">
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <div class="text-center mb-6 mt-4">
                    <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Voice Choice</h2>
                    <p class="text-slate-500 text-sm mt-1">Select a script to practice intensity modulation.</p>
                </div>

                <div class="flex flex-col gap-4 w-full max-w-xl mx-auto flex-1 overflow-y-auto custom-scrollbar p-2">
                    ${speechOptions}
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            this.courseData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        this.querySelectorAll('.thps-vc-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.vcActiveSpeechIndex = parseInt(e.currentTarget.getAttribute('data-index'));
                this.vcLineIndex = 0;
                this.currentStep = 'vc-prompter';
                this.renderVoiceChoicePrompter();
            });
        });
    }

    renderVoiceChoicePrompter() {
        const speech = this.courseData.speeches[this.vcActiveSpeechIndex];
        
        const getStyle = (intensity) => {
            switch(parseInt(intensity)) {
                case 0: return { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-200' };
                case 1: return { bg: 'bg-purple-600', text: 'text-white', ring: 'ring-purple-600' };
                case 2: return { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-500' };
                case 3: return { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-500' };
                case 4: return { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-500' };
                case 5: return { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-600' };
                default: return { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-200' };
            }
        };

        const linesHTML = speech.lines.map((line, index) => {
            const style = getStyle(line.intensity);
            return `
                <div class="vc-line-wrapper py-3 w-full" id="vc-line-${index}">
                    <div class="vc-line-content flex gap-4 p-4 rounded-2xl border-2 border-transparent transition-all duration-300 ${index === this.vcLineIndex ? 'opacity-100 bg-white shadow-sm ring-1 ' + style.ring : 'opacity-40'}">
                        <div class="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-inner ${style.bg} ${style.text}">
                            <span class="text-xl font-black leading-none">${line.intensity}</span>
                        </div>
                        <div class="flex-1 flex items-center">
                            <p class="text-lg md:text-xl font-bold text-slate-800 leading-snug">${line.text}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                <!-- TOP HEADER -->
                <div class="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-20">
                    <button class="thps-vc-back text-slate-300 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Scripts
                    </button>
                    <div class="text-center truncate px-4">
                        <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">VOICE CHOICE</span>
                        <span class="block text-sm font-bold truncate">${speech.title}</span>
                    </div>
                    <div class="w-16"></div> <!-- Spacer -->
                </div>

                <!-- GLIDING PROMPTER AREA -->
                <div class="flex-1 relative flex flex-col min-h-0">
                    <div id="vc-scroll-viewport" class="flex-1 overflow-hidden scroll-smooth relative px-4 md:px-12 py-10">
                        <div class="max-w-2xl mx-auto flex flex-col pb-48"> 
                            ${linesHTML}
                        </div>
                    </div>
                    
                    <div class="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10"></div>
                    <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10"></div>
                </div>

                <!-- CONTROLS & RECORDING PANEL -->
                <div class="bg-white border-t border-slate-200 p-4 shrink-0 z-20 flex flex-col">
                    <div class="flex justify-between items-center max-w-2xl mx-auto w-full mb-3">
                        <button class="thps-vc-up p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors active:scale-90" ${this.vcLineIndex === 0 ? 'disabled' : ''}>
                            <i data-lucide="chevron-up" class="w-6 h-6 pointer-events-none"></i>
                        </button>
                        
                        <div class="flex flex-col items-center">
                            <div class="thps-vc-timer text-3xl font-mono font-black text-slate-800 tracking-wider mb-2">00:00</div>
                            <button id="vc-record-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95 flex items-center gap-2">
                                <i data-lucide="mic" id="vc-record-icon" class="w-4 h-4 pointer-events-none transition-transform"></i> <span id="vc-record-text">Start Performance</span>
                            </button>
                        </div>

                        <button class="thps-vc-down p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors active:scale-90" ${this.vcLineIndex === speech.lines.length - 1 ? 'disabled' : ''}>
                            <i data-lucide="chevron-down" class="w-6 h-6 pointer-events-none"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        this.querySelector('.thps-vc-back').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            this.currentStep = 'vc-menu';
            this.renderVoiceChoiceMenu();
        });

        const updateScrollAndStyles = () => {
            const viewport = this.querySelector('#vc-scroll-viewport');
            const lines = this.querySelectorAll('.vc-line-content');
            
            lines.forEach((line, idx) => {
                if (idx === this.vcLineIndex) {
                    line.classList.remove('opacity-40');
                    line.classList.add('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
                } else {
                    line.classList.add('opacity-40');
                    line.classList.remove('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
                }
            });

            const targetWrapper = this.querySelector(`#vc-line-${this.vcLineIndex}`);
            if (targetWrapper && viewport) {
                viewport.scrollTo({ top: targetWrapper.offsetTop - 40, behavior: 'smooth' });
            }

            this.querySelector('.thps-vc-up').disabled = this.vcLineIndex === 0;
            this.querySelector('.thps-vc-down').disabled = this.vcLineIndex === speech.lines.length - 1;
        };

        this.querySelector('.thps-vc-up').addEventListener('click', () => {
            if (this.vcLineIndex > 0) {
                this.vcLineIndex--;
                updateScrollAndStyles();
            }
        });

        this.querySelector('.thps-vc-down').addEventListener('click', () => {
            if (this.vcLineIndex < speech.lines.length - 1) {
                this.vcLineIndex++;
                updateScrollAndStyles();
            }
        });

        this.querySelector('#vc-record-btn').addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') {
                window.toggleRecording();
            }
        });
    }

    // ==========================================
    // ESL LEVEL 1: VOCAL FITNESS ARCADE
    // ==========================================
    renderEslMenu() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-6 md:p-8">
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <div class="text-center mb-6 mt-4">
                    <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Vocal Fitness</h2>
                    <p class="text-slate-500 text-sm mt-1">Select a phonetic category to train.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto flex-1 content-center">
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="stops">
                        <span class="text-lg font-black text-slate-700 group-hover:text-indigo-600 mb-1 pointer-events-none">Stops</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">P, B, T, D, K, G</span>
                    </button>
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="hiss">
                        <span class="text-lg font-black text-slate-700 group-hover:text-emerald-600 mb-1 pointer-events-none">Hiss</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">F, V, S, Z, SH, TH</span>
                    </button>
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="slice">
                        <span class="text-lg font-black text-slate-700 group-hover:text-amber-600 mb-1 pointer-events-none">Slice</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">CH, J</span>
                    </button>
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-rose-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="humm">
                        <span class="text-lg font-black text-slate-700 group-hover:text-rose-600 mb-1 pointer-events-none">Humm</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">M, N, NG</span>
                    </button>
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="glide">
                        <span class="text-lg font-black text-slate-700 group-hover:text-blue-600 mb-1 pointer-events-none">Glide</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">L, R, Y, W</span>
                    </button>
                    <button class="thps-esl-cat-btn group bg-white border-2 border-slate-200 hover:border-violet-400 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-cat="advanced">
                        <span class="text-lg font-black text-slate-700 group-hover:text-violet-600 mb-1 pointer-events-none">Advanced</span>
                        <span class="text-xs font-bold text-slate-400 pointer-events-none">Complex Clusters</span>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            this.courseData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        const btns = this.querySelectorAll('.thps-esl-cat-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-cat');
                this.loadEslCategory(category);
            });
        });
    }

    async loadEslCategory(category) {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Sentences...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        try {
            const url = `https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/esl-level-1/${category}.json`;
            const res = await fetch(`${url}?t=${Date.now()}`);
            if (!res.ok) throw new Error("Could not load category");
            this.eslSentences = await res.json();
            this.eslCategory = category.toUpperCase();
            this.eslIndex = 0;
            this.currentStep = 'esl-drill';
            this.renderEslDrill();
        } catch (e) {
            console.error("ESL Prompt Fetch Error:", e);
            alert("Failed to load sentences for this category.");
            this.renderEslMenu();
        }
    }

    renderEslDrill() {
        const sentence = this.eslSentences[this.eslIndex];

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                <!-- TOP HEADER -->
                <div class="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-20">
                    <button class="thps-esl-back text-slate-300 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Back
                    </button>
                    <div class="text-center">
                        <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">${this.eslCategory} PRACTICE</span>
                        <span class="block text-sm font-bold">Drill ${this.eslIndex + 1} of ${this.eslSentences.length}</span>
                    </div>
                    <div class="w-16"></div> <!-- Spacer -->
                </div>

                <!-- MAIN DRILL AREA -->
                <div class="flex-1 flex flex-col items-center justify-center p-6 relative">
                    <div class="w-full max-w-2xl bg-white border-2 border-indigo-100 rounded-2xl p-6 md:p-8 shadow-sm text-center mb-8">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Target Sentence</span>
                        <p class="text-2xl md:text-3xl font-bold text-slate-800 leading-tight w-[95%] mx-auto line-clamp-3">${sentence}</p>
                    </div>

                    <div class="flex flex-col items-center justify-center mb-8">
                        <div class="thps-esl-timer text-5xl md:text-6xl font-mono font-black text-slate-800 tracking-wider mb-4 drop-shadow-sm transition-colors">0.00<span class="text-2xl text-slate-400">s</span></div>
                        <button id="esl-record-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white w-16 h-16 rounded-full font-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] active:scale-90">
                            <i data-lucide="mic" id="esl-record-icon" class="w-6 h-6 pointer-events-none transition-transform"></i>
                        </button>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3" id="esl-record-text">Tap to Start</span>
                    </div>

                    <div class="w-full max-w-md bg-slate-100 border border-slate-200 rounded-xl p-4 relative">
                        <span class="absolute -top-2.5 left-4 bg-slate-100 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">What we heard:</span>
                        <p id="esl-transcript" class="text-sm font-medium text-slate-600 text-center min-h-[1.25rem] italic">...</p>
                    </div>
                </div>

                <!-- BOTTOM NAVIGATION -->
                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0 z-20">
                    <button class="thps-esl-prev px-6 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 active:scale-95 ${this.eslIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.eslIndex === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-left" class="w-4 h-4 pointer-events-none"></i> Prev
                    </button>
                    <button class="thps-esl-next px-6 py-3 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-md flex items-center gap-2 active:scale-95 ${this.eslIndex === this.eslSentences.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.eslIndex === this.eslSentences.length - 1 ? 'disabled' : ''}>
                        Next <i data-lucide="chevron-right" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        
        this.querySelector('.thps-esl-back').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording(); 
            this.currentStep = 'esl-menu';
            this.renderEslMenu();
        });

        this.querySelector('.thps-esl-prev').addEventListener('click', () => {
            if (this.eslIndex > 0) {
                if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
                this.eslIndex--;
                this.renderEslDrill();
            }
        });

        this.querySelector('.thps-esl-next').addEventListener('click', () => {
            if (this.eslIndex < this.eslSentences.length - 1) {
                if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
                this.eslIndex++;
                this.renderEslDrill();
            }
        });

        this.querySelector('#esl-record-btn').addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') {
                window.toggleRecording();
                if (!window.isActive) {
                    const tBox = this.querySelector('#esl-transcript');
                    if (tBox) tBox.innerText = 'Listening...';
                }
            }
        });
    }

    // ==========================================
    // SAY WHAT YOU SEE UI
    // ==========================================
    renderSayWhatYouSee() {
        const getMaskClass = (level) => {
            if (level === 1) return "w-0 opacity-0";
            if (level === 2) return "w-1/2 opacity-100";
            return "w-full opacity-100";
        };

        const currentImage = this.courseData.images[this.swysImageIndex];
        const currentInstruction = this.courseData.instructions[this.swysLevel];

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-5 sm:p-6">
                <!-- EXIT BUTTON -->
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <div class="flex-1 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center mb-6 mt-12 w-full max-w-5xl mx-auto">
                    <div class="relative w-full md:flex-1 aspect-video bg-slate-200 rounded-none md:rounded-r-2xl overflow-hidden shadow-md group shrink-0 -mx-5 sm:-mx-6 md:mx-0 md:-ml-6">
                        <img src="${currentImage}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" id="swys-img-el">
                        
                        <div id="swys-mask-el" class="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[2px] transition-all duration-300 pointer-events-none z-10 ${getMaskClass(this.swysLevel)}"></div>
                        
                        <button id="swys-prev-img" class="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2 rounded-full backdrop-blur-md transition-all z-20 active:scale-90 shadow-md">
                            <i data-lucide="chevron-left" class="w-5 h-5 md:w-6 md:h-6 pointer-events-none"></i>
                        </button>
                        <button id="swys-next-img" class="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2 rounded-full backdrop-blur-md transition-all z-20 active:scale-90 shadow-md">
                            <i data-lucide="chevron-right" class="w-5 h-5 md:w-6 md:h-6 pointer-events-none"></i>
                        </button>
                    </div>

                    <div class="flex flex-col w-full max-w-[300px] gap-4 shrink-0 px-4 md:px-0">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty Level</label>
                            <select id="swys-level-select" class="w-full p-3.5 rounded-xl border-2 border-slate-200 shadow-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors cursor-pointer">
                                <option value="1" ${this.swysLevel === 1 ? 'selected' : ''}>Level 1: Full Image</option>
                                <option value="2" ${this.swysLevel === 2 ? 'selected' : ''}>Level 2: Half Hidden</option>
                                <option value="3" ${this.swysLevel === 3 ? 'selected' : ''}>Level 3: Fully Hidden</option>
                            </select>
                        </div>

                        <div class="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm min-h-[6rem] flex items-center justify-center text-center">
                            <p id="swys-instruction-text" class="text-sm font-bold text-slate-600 leading-relaxed">${currentInstruction}</p>
                        </div>
                    </div>
                </div>

                <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800 mb-2">
                    <div id="swys-progress" class="absolute top-0 bottom-0 left-0 bg-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                    
                    <div class="absolute text-slate-500 w-5 h-5 -ml-2.5 z-10 flex items-center justify-center pointer-events-none" style="left: 25%;">
                        <i data-lucide="star-half" id="swys-star-25" class="w-5 h-5 text-slate-400/50 transition-colors"></i>
                    </div>
                    <div class="absolute text-slate-500 w-5 h-5 -ml-2.5 z-10 flex items-center justify-center pointer-events-none" style="left: 75%;">
                        <i data-lucide="star" id="swys-star-75" class="w-5 h-5 text-slate-400/50 transition-colors"></i>
                    </div>
                    
                    <button id="swys-record-btn" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                        <i data-lucide="play" id="swys-record-icon" class="w-5 h-5 pointer-events-none transition-transform ml-1"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            this.courseData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        this.querySelector('#swys-prev-img').addEventListener('click', () => {
            const len = this.courseData.images.length;
            this.swysImageIndex = (this.swysImageIndex - 1 + len) % len;
            this.querySelector('#swys-img-el').src = this.courseData.images[this.swysImageIndex];
        });

        this.querySelector('#swys-next-img').addEventListener('click', () => {
            this.swysImageIndex = (this.swysImageIndex + 1) % this.courseData.images.length;
            this.querySelector('#swys-img-el').src = this.courseData.images[this.swysImageIndex];
        });

        this.querySelector('#swys-level-select').addEventListener('change', (e) => {
            this.swysLevel = parseInt(e.target.value);
            this.querySelector('#swys-instruction-text').innerText = this.courseData.instructions[this.swysLevel];
            this.querySelector('#swys-mask-el').className = `absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[2px] transition-all duration-300 pointer-events-none z-10 ${getMaskClass(this.swysLevel)}`;
        });

        this.querySelector('#swys-record-btn').addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        });
    }

    // ==========================================
    // LINEAR COURSE UI SCREEN
    // ==========================================
    async fetchCourse(url) {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Course Data...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        try {
            const response = await fetch(`${url}?t=${Date.now()}`);
            if (!response.ok) throw new Error("Network response was not ok");
            this.courseData = await response.json();
            this.evaluations = {}; 

            if (this.courseData.mode === 'esl') {
                this.currentStep = 'esl-menu';
                this.renderEslMenu();
            } else if (this.courseData.mode === 'voice-choice') {
                this.currentStep = 'vc-menu';
                this.renderVoiceChoiceMenu();
            } else if (this.courseData.mode === 'say-what-you-see') {
                this.currentStep = 'swys-main';
                this.swysLevel = 1; 
                this.swysImageIndex = 0; 
                this.renderSayWhatYouSee();
            } else {
                this.currentStep = 1; 
                this.renderCourseUI();
            }
        } catch (error) {
            console.error("Course Load Error:", error);
            this.innerHTML = `
                <div class="relative w-full h-[650px] bg-rose-50 border border-rose-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                    <i data-lucide="alert-triangle" class="w-10 h-10 text-rose-600 mb-4"></i>
                    <h3 class="text-lg font-bold text-rose-800 mb-2">Failed to load course</h3>
                    <button class="thps-back-btn mt-4 bg-white border border-rose-200 text-rose-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-100 transition-colors">Go Back</button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: this });
            this.querySelector('.thps-back-btn').addEventListener('click', () => this.renderCourseSelector());
        }
    }

    renderCourseUI() {
        if (!this.courseData) return;

        const activeModule = this.courseData.modules.find(m => m.step === this.currentStep) || this.courseData.modules[0];
        const currentEval = this.evaluations[this.currentStep];

        const navItemsHTML = this.courseData.modules.map(mod => {
            const isActive = mod.step === this.currentStep;
            const isCompleted = this.evaluations[mod.step] !== undefined;
            return `
                <div class="thps-nav-item flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}" data-step="${mod.step}">
                    <span class="truncate pr-2 pointer-events-none">${mod.title}</span>
                    <i data-lucide="${isActive ? 'circle-dot' : (isCompleted ? 'check-circle' : 'circle')}" class="w-4 h-4 opacity-50 shrink-0 pointer-events-none"></i>
                </div>
            `;
        }).join('');

        let activityAreaHTML = "";
        
        if (activeModule.type === 'recording') {
            if (currentEval) {
                const isPass = currentEval.passed;
                const resultColor = isPass ? 'emerald' : 'amber';
                const resultIcon = isPass ? 'check-circle' : 'alert-circle';
                const resultTitle = isPass ? 'Goal Achieved!' : 'Keep Trying!';
                
                let breakdownHTML = currentEval.results.map(res => {
                    return `
                        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span class="text-xs font-bold text-slate-600">${res.label}</span>
                            <div class="flex items-center gap-3">
                                <span class="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">Target: ${res.min}-${res.max}</span>
                                <span class="text-sm font-black ${res.passed ? 'text-emerald-600' : 'text-rose-600'}">${res.actual}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                activityAreaHTML = `
                    <div class="bg-white border-2 border-${resultColor}-200 rounded-2xl p-6 shadow-sm">
                        <div class="flex items-center justify-center gap-2 text-${resultColor}-600 mb-4">
                            <i data-lucide="${resultIcon}" class="w-6 h-6"></i>
                            <h3 class="text-xl font-black uppercase tracking-tight">${resultTitle}</h3>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                            ${breakdownHTML}
                        </div>
                        <button class="thps-retry-btn bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all w-full flex items-center justify-center gap-2 active:scale-95">
                            <i data-lucide="refresh-cw" class="w-4 h-4 pointer-events-none"></i> Try Again
                        </button>
                    </div>
                `;
            } else {
                activityAreaHTML = `
                    <div class="mt-8 bg-slate-900 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 pointer-events-none"></div>
                        <div class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Speak to achieve goals</div>
                        <div class="thps-course-timer text-5xl md:text-6xl font-mono font-black text-white tracking-wider mb-6 drop-shadow-md">00:00</div>
                        <button class="thps-course-record-btn bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 flex items-center justify-center gap-2 mx-auto w-full max-w-[250px]">
                            <i data-lucide="mic" class="w-5 h-5 pointer-events-none"></i> <span class="thps-course-record-text pointer-events-none">Start Task</span>
                        </button>
                    </div>
                `;
            }
        } else {
            activityAreaHTML = `
                <div class="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-200 rounded-xl">
                    [ Activity Area: ${activeModule.type} ]
                </div>
            `;
        }

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                
                <button class="thps-course-menu-toggle absolute top-0 left-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-br-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest z-30 transition-colors shadow-md flex items-center gap-2 active:scale-95 origin-top-left">
                    <i data-lucide="menu" class="w-3 h-3 sm:w-4 sm:h-4 pointer-events-none"></i> 
                    <span class="pointer-events-none">Step ${this.currentStep} / ${this.courseData.totalSteps}</span>
                </button>

                <button class="thps-exit-course absolute top-0 right-0 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 active:scale-95 origin-top-right">
                    Exit <i data-lucide="x" class="w-3 h-3 sm:w-4 sm:h-4 pointer-events-none"></i>
                </button>

                <div class="thps-course-drawer absolute inset-y-0 left-0 w-full md:w-72 bg-slate-900 text-slate-300 transform -translate-x-full transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl">
                    <div class="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
                        <span class="font-black text-white tracking-widest uppercase text-xs truncate pr-2">${this.courseData.title}</span>
                        <button class="thps-course-menu-toggle text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                            <i data-lucide="chevron-left" class="w-4 h-4 pointer-events-none"></i> Hide
                        </button>
                    </div>
                    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
                        ${navItemsHTML}
                    </nav>
                </div>

                <div class="flex-1 overflow-y-auto bg-slate-50 pt-16 px-4 md:px-8 pb-8 relative">
                    <div class="max-w-2xl mx-auto space-y-8">
                        <div>
                            <h2 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-2">${activeModule.title}</h2>
                            <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-900 leading-relaxed shadow-sm">
                                <strong class="text-indigo-700 uppercase tracking-widest text-[10px] block mb-1">Instructions</strong>
                                ${activeModule.instructions}
                            </div>
                        </div>
                        
                        <div class="thps-course-content-area space-y-6">
                            ${activityAreaHTML}
                        </div>
                    </div>
                </div>

                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button class="thps-nav-prev px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 ${this.currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentStep === 1 ? 'disabled' : ''}>
                        <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Prev
                    </button>
                    <button class="thps-nav-next px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2 ${this.currentStep === this.courseData.totalSteps ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentStep === this.courseData.totalSteps ? 'disabled' : ''}>
                        Next <i data-lucide="arrow-right" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        this.attachCourseListeners();
        this.updateTimerUI(); 
    }

    attachCourseListeners() {
        const toggleBtns = this.querySelectorAll('.thps-course-menu-toggle');
        const drawer = this.querySelector('.thps-course-drawer');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.isMenuOpen = !this.isMenuOpen;
                if (this.isMenuOpen) drawer.classList.remove('-translate-x-full');
                else drawer.classList.add('-translate-x-full');
            });
        });

        const exitBtn = this.querySelector('.thps-exit-course');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.courseData = null;
                this.currentStep = 0;
                this.isMenuOpen = false;
                this.evaluations = {}; 
                this.renderCourseSelector();
            });
        }

        const navItems = this.querySelectorAll('.thps-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.currentStep = parseInt(e.currentTarget.getAttribute('data-step'));
                this.isMenuOpen = false; 
                this.renderCourseUI();
            });
        });

        const prevBtn = this.querySelector('.thps-nav-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.renderCourseUI();
                }
            });
        }
        
        const nextBtn = this.querySelector('.thps-nav-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentStep < this.courseData.totalSteps) {
                    this.currentStep++;
                    this.renderCourseUI();
                }
            });
        }

        const recordBtn = this.querySelector('.thps-course-record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                if (typeof window.toggleRecording === 'function') {
                    window.toggleRecording();
                }
            });
        }

        const retryBtn = this.querySelector('.thps-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                delete this.evaluations[this.currentStep];
                this.renderCourseUI();
            });
        }
    }

    processPayload(e) {
        if (!this.courseData && !this.micCheckFullData && !this.rcData || this.currentStep === 0) return;
        
        const payload = e.detail;

        // Catch and process the Repeat+Count Telemetry
        if (this.currentStep === 'rc-drill' && payload.text && payload.text.trim() !== '') {
            this.rcLatestTelemetry = {
                personal: payload.personal || 0,
                visual: payload.visual || 0,
                intangible: payload.intangible || 0,
                wpm: payload.wpm || 0,
                sps: payload.sps || 0,
                pause: payload.pause || 0,
                runtime: payload.runtime || 0,
                compGrade: payload.grade || 0,
                simple: payload.simple || 0
            };
            this.rcState = 'grade';
            this.renderRepeatCountDrill(); // Re-render triggers the flip animation
            return;
        }

        // Bypass grading metrics if inside independent modules
        const bypassModes = ['rc-menu', 'rc-drill', 'mic-check', 'esl-menu', 'esl-drill', 'vc-menu', 'vc-prompter', 'swys-main'];
        if (bypassModes.includes(this.currentStep)) return;

        const isHistoryLoad = payload.id !== undefined; 

        if (isHistoryLoad) {
            let matchedStep = null;
            for (const [stepStr, evalData] of Object.entries(this.evaluations)) {
                if (evalData.payloadId === payload.id) {
                    matchedStep = parseInt(stepStr);
                    break;
                }
            }
            
            if (matchedStep !== null) {
                this.currentStep = matchedStep; 
                this.renderCourseUI();
            }
            return; 
        }

        const activeModule = this.courseData.modules.find(m => m.step === this.currentStep);
        if (activeModule && activeModule.type === 'recording' && payload.text && payload.text.trim() !== '') {
            const assignedId = window.thps_currentAttemptId; 
            this.evaluatePerformance(payload, activeModule, assignedId);
        }
    }

    evaluatePerformance(payload, module, assignedId) {
        if (!module.targets) return;
        let allPassed = true;
        let breakdown = [];

        for (const [key, rules] of Object.entries(module.targets)) {
            const actualValue = payload[key]; 
            
            if (actualValue !== undefined) {
                const passed = actualValue >= rules.min && actualValue <= rules.max;
                if (!passed) allPassed = false;
                
                breakdown.push({
                    label: rules.label,
                    min: rules.min,
                    max: rules.max,
                    actual: (key === 'time' ? window.formatMetric('time', actualValue) : (key.includes('Percent') || ['visual', 'personal', 'intangible', 'simple', 'pause'].includes(key) ? Math.round(actualValue) + '%' : Number(actualValue).toFixed(1))),
                    passed: passed
                });
            }
        }

        this.evaluations[this.currentStep] = {
            step: this.currentStep,
            passed: allPassed,
            results: breakdown,
            payloadId: assignedId 
        };
        
        this.renderCourseUI();
    }

    updateTimerUI() {
        const timerDisplay = this.querySelector('.thps-course-timer');
        const recordBtn = this.querySelector('.thps-course-record-btn');
        const recordText = this.querySelector('.thps-course-record-text');
        
        if (timerDisplay && recordBtn) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                let m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
                let s = Math.floor(elapsedSecs % 60).toString().padStart(2, '0');
                
                timerDisplay.innerText = `${m}:${s}`;
                timerDisplay.classList.add('text-emerald-400');
                
                if (!recordBtn.classList.contains('bg-rose-500')) {
                    recordBtn.classList.replace('bg-emerald-500', 'bg-rose-500');
                    recordBtn.classList.replace('hover:bg-emerald-400', 'hover:bg-rose-400');
                    recordBtn.style.boxShadow = "0 0 20px rgba(243, 24, 73, 0.4)";
                    if (recordText) recordText.innerText = "Stop Task";
                    recordBtn.innerHTML = `<i data-lucide="square" class="w-5 h-5 pointer-events-none"></i> <span class="thps-course-record-text pointer-events-none">Stop Task</span>`;
                    if (window.lucide) window.lucide.createIcons({ root: recordBtn });
                }
            } else {
                timerDisplay.classList.remove('text-emerald-400');
                
                if (recordBtn.classList.contains('bg-rose-500')) {
                    recordBtn.classList.replace('bg-rose-500', 'bg-emerald-500');
                    recordBtn.classList.replace('hover:bg-rose-400', 'hover:bg-emerald-400');
                    recordBtn.style.boxShadow = "0 0 20px rgba(16,185,129,0.4)";
                    if (recordText) recordText.innerText = "Start Task";
                    recordBtn.innerHTML = `<i data-lucide="mic" class="w-5 h-5 pointer-events-none"></i> <span class="thps-course-record-text pointer-events-none">Start Task</span>`;
                    if (window.lucide) window.lucide.createIcons({ root: recordBtn });
                }
            }
        }

        const arcadeProgress = this.querySelector('#arcade-progress');
        const arcadeBtn = this.querySelector('#arcade-record-btn');
        const arcadeIcon = this.querySelector('#arcade-record-icon');
        const star20 = this.querySelector('#star-marker-20');
        const star60 = this.querySelector('#star-marker-60');
        
        if (arcadeProgress && arcadeBtn && arcadeIcon) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                
                const fillPct = Math.min((elapsedSecs / 80) * 100, 100);
                arcadeProgress.style.width = `${fillPct}%`;
                
                if (elapsedSecs >= 20 && star20) star20.className = "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]";
                if (elapsedSecs >= 60 && star60) star60.className = "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]";
                
                if (!arcadeIcon.classList.contains('text-rose-500')) {
                    arcadeIcon.setAttribute('data-lucide', 'square');
                    arcadeIcon.className = "w-5 h-5 pointer-events-none text-rose-500 scale-95";
                    if (window.lucide) window.lucide.createIcons({ root: arcadeBtn });
                }
            } else {
                arcadeProgress.style.width = `0%`; 
                if (star20) star20.className = "w-4 h-4 text-slate-400/50 transition-colors";
                if (star60) star60.className = "w-4 h-4 text-slate-400/50 transition-colors";
                
                if (arcadeIcon.getAttribute('data-lucide') !== 'mic') {
                    arcadeIcon.setAttribute('data-lucide', 'mic');
                    arcadeIcon.className = "w-5 h-5 pointer-events-none text-white transition-transform";
                    if (window.lucide) window.lucide.createIcons({ root: arcadeBtn });
                }
            }
        }

        const eslTimer = this.querySelector('.thps-esl-timer');
        const eslRecordBtn = this.querySelector('#esl-record-btn');
        const eslRecordIcon = this.querySelector('#esl-record-icon');
        const eslRecordText = this.querySelector('#esl-record-text');
        const eslTranscript = this.querySelector('#esl-transcript');

        if (eslTimer && eslRecordBtn) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                eslTimer.innerHTML = `${elapsedSecs.toFixed(2)}<span class="text-2xl text-slate-400">s</span>`;
                eslTimer.classList.add('text-indigo-600');

                const liveText = document.getElementById('cba-inputText') ? document.getElementById('cba-inputText').value : '';
                if (eslTranscript && liveText) eslTranscript.innerText = liveText;

                if (!eslRecordBtn.classList.contains('bg-rose-500')) {
                    eslRecordBtn.classList.replace('bg-indigo-600', 'bg-rose-500');
                    eslRecordBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-rose-400');
                    eslRecordBtn.style.boxShadow = "0 0 15px rgba(243, 24, 73, 0.4)";
                    if (eslRecordText) eslRecordText.innerText = "Stop Drill";
                    
                    if (eslRecordIcon) {
                        eslRecordIcon.setAttribute('data-lucide', 'square');
                        if (window.lucide) window.lucide.createIcons({ root: eslRecordBtn });
                    }
                }
            } else {
                eslTimer.classList.remove('text-indigo-600');
                
                const finalLiveText = document.getElementById('cba-inputText') ? document.getElementById('cba-inputText').value : '';
                if (eslTranscript && finalLiveText) eslTranscript.innerText = finalLiveText;

                if (eslRecordBtn.classList.contains('bg-rose-500')) {
                    eslRecordBtn.classList.replace('bg-rose-500', 'bg-indigo-600');
                    eslRecordBtn.classList.replace('hover:bg-rose-400', 'hover:bg-indigo-500');
                    eslRecordBtn.style.boxShadow = "0 0 15px rgba(79,70,229,0.4)";
                    if (eslRecordText) eslRecordText.innerText = "Tap to Start";
                    
                    if (eslRecordIcon) {
                        eslRecordIcon.setAttribute('data-lucide', 'mic');
                        if (window.lucide) window.lucide.createIcons({ root: eslRecordBtn });
                    }
                }
            }
        }

        const vcTimer = this.querySelector('.thps-vc-timer');
        const vcRecordBtn = this.querySelector('#vc-record-btn');
        const vcRecordIcon = this.querySelector('#vc-record-icon');
        const vcRecordText = this.querySelector('#vc-record-text');

        if (vcTimer && vcRecordBtn) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                let m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
                let s = Math.floor(elapsedSecs % 60).toString().padStart(2, '0');
                
                vcTimer.innerText = `${m}:${s}`;
                vcTimer.classList.add('text-rose-500');

                if (!vcRecordBtn.classList.contains('bg-rose-500')) {
                    vcRecordBtn.classList.replace('bg-indigo-600', 'bg-rose-500');
                    vcRecordBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-rose-400');
                    vcRecordBtn.style.boxShadow = "0 0 15px rgba(243, 24, 73, 0.4)";
                    if (vcRecordText) vcRecordText.innerText = "Finish";
                    
                    if (vcRecordIcon) {
                        vcRecordIcon.setAttribute('data-lucide', 'square');
                        if (window.lucide) window.lucide.createIcons({ root: vcRecordBtn });
                    }
                }
            } else {
                vcTimer.classList.remove('text-rose-500');

                if (vcRecordBtn.classList.contains('bg-rose-500')) {
                    vcRecordBtn.classList.replace('bg-rose-500', 'bg-indigo-600');
                    vcRecordBtn.classList.replace('hover:bg-rose-400', 'hover:bg-indigo-500');
                    vcRecordBtn.style.boxShadow = "0 0 15px rgba(79,70,229,0.4)";
                    if (vcRecordText) vcRecordText.innerText = "Start Performance";
                    
                    if (vcRecordIcon) {
                        vcRecordIcon.setAttribute('data-lucide', 'mic');
                        if (window.lucide) window.lucide.createIcons({ root: vcRecordBtn });
                    }
                }
            }
        }

        const swysProgress = this.querySelector('#swys-progress');
        const swysBtn = this.querySelector('#swys-record-btn');
        const swysIcon = this.querySelector('#swys-record-icon');
        const swysStar25 = this.querySelector('#swys-star-25');
        const swysStar75 = this.querySelector('#swys-star-75');
        
        if (swysProgress && swysBtn && swysIcon) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                
                const fillPct = Math.min((elapsedSecs / 80) * 100, 100);
                swysProgress.style.width = `${fillPct}%`;
                
                if (elapsedSecs >= 20 && swysStar25) swysStar25.className = "w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)] transition-all";
                if (elapsedSecs >= 60 && swysStar75) swysStar75.className = "w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)] transition-all";
                
                if (swysIcon.getAttribute('data-lucide') !== 'square') {
                    swysIcon.setAttribute('data-lucide', 'square');
                    swysIcon.classList.remove('ml-1'); 
                    if (window.lucide) window.lucide.createIcons({ root: swysBtn });
                }
            } else {
                swysProgress.style.width = `0%`; 
                if (swysStar25) swysStar25.className = "w-5 h-5 text-slate-400/50 transition-colors";
                if (swysStar75) swysStar75.className = "w-5 h-5 text-slate-400/50 transition-colors";
                
                if (swysIcon.getAttribute('data-lucide') !== 'play') {
                    swysIcon.setAttribute('data-lucide', 'play');
                    swysIcon.classList.add('ml-1'); 
                    if (window.lucide) window.lucide.createIcons({ root: swysBtn });
                }
            }
        }
    }
}

customElements.define('thps-course-widget', THPSCourseWidget);

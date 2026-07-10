class THPSCourseWidget extends HTMLElement {
    constructor() {
        super();
        this.isMenuOpen = false;
        this.currentStep = 0; 
        this.courseData = null;
        this.evaluations = {}; // The CourseRecordBook
        this.prompts = null;
    }

    connectedCallback() {
        this.renderCourseSelector();
        this.syncLoop = setInterval(() => this.updateTimerUI(), 50);
        
        // Listen for the Analyzer App's payload broadcast
        this.payloadHandler = this.processPayload.bind(this);
        window.addEventListener('thps-dashboard-update', this.payloadHandler);
    }

    disconnectedCallback() {
        if (this.syncLoop) clearInterval(this.syncLoop);
        window.removeEventListener('thps-dashboard-update', this.payloadHandler);
    }

    // STATE 0: THE COURSE SELECTION MENU
    renderCourseSelector() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <i data-lucide="graduation-cap" class="w-8 h-8 pointer-events-none"></i>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">Training Courses</h2>
                <p class="text-slate-500 text-sm mb-8 text-center max-w-sm">Select a module to begin your training and analysis.</p>
                
                <div class="grid grid-cols-1 gap-4 w-full max-w-md">
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/courses/repeat-count/repeat-count.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Repeat + Count</span>
                        <i data-lucide="gamepad-2" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/courses/dummy-course.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Pitching Level 1</span>
                        <i data-lucide="arrow-right" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors group-hover:translate-x-1 pointer-events-none"></i>
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
                this.fetchCourse(url);
            });
        });
    }

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

            // THE ROUTER SECTION
            if (this.courseData.mode === 'arcade') {
                this.currentStep = 'arcade';
                this.renderArcadeUI();
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

    // ARCADE MODE: REPEAT + COUNT UI
    async renderArcadeUI() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Custom Prompts...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        // Fetch custom prompts in parallel from subfolder
        try {
            const baseUrl = 'https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/courses/repeat-count/';
            const [qRes, rRes, cRes] = await Promise.all([
                fetch(`${baseUrl}prompts-questions.json?t=${Date.now()}`),
                fetch(`${baseUrl}prompts-repeat.json?t=${Date.now()}`),
                fetch(`${baseUrl}prompts-count.json?t=${Date.now()}`)
            ]);
            this.prompts = {
                question: await qRes.json(),
                repeat: await rRes.json(),
                count: await cRes.json()
            };
        } catch (e) {
            console.error("Prompt Fetch Error, loading defaults:", e);
            this.prompts = {
                question: ["What's better: unlimited time or money?"],
                repeat: ["Problem + Options + Solution"],
                count: ["1. First, 2. Second, 3. Third"]
            };
        }

        const getRandomPrompt = (arr) => arr[Math.floor(Math.random() * arr.length)];

        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans p-5 sm:p-6">
                <!-- MINI EXIT BUTTON -->
                <button class="thps-exit-course absolute top-0 right-0 bg-white border-l border-b border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 px-4 py-2.5 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-30 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                    Exit <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                </button>

                <h2 class="text-2xl font-black text-slate-800 tracking-tight mb-5 mt-4 text-center">${this.courseData.title}</h2>

                <!-- THREE RESPONSIVE PROMPT FIELDS -->
                <div class="flex-1 flex flex-col gap-3.5 max-w-lg mx-auto w-full mb-6 justify-center">
                    
                    <!-- Question Prompt Field (Max 40 chars spacing optimized) -->
                    <div id="btn-prompt-q" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest absolute top-2.5 left-4">Question Prompt</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-indigo-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 px-2 leading-snug max-w-[28rem] truncate" id="text-prompt-q">${getRandomPrompt(this.prompts.question)}</span>
                    </div>

                    <!-- Repeat Prompt Field (Max 30 chars spacing optimized) -->
                    <div id="btn-prompt-r" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest absolute top-2.5 left-4">Repeat Framework</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-emerald-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 px-2 leading-snug max-w-[22rem] truncate" id="text-prompt-r">${getRandomPrompt(this.prompts.repeat)}</span>
                    </div>

                    <!-- Count Prompt Field (Max 30 chars spacing optimized) -->
                    <div id="btn-prompt-c" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-amber-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest absolute top-2.5 left-4">Count Sequence</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-amber-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 px-2 leading-snug max-w-[22rem] truncate" id="text-prompt-c">${getRandomPrompt(this.prompts.count)}</span>
                    </div>
                </div>

                <!-- SLEEK ARCADE TIMER BAR PANEL -->
                <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800 mb-2">
                    <!-- Progress Progression Bar Fill -->
                    <div id="arcade-progress" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                    
                    <!-- Pacing Target Indicators (Stars positioned relative to 80s ceiling) -->
                    <div class="absolute text-slate-500 w-5 h-5 -ml-2.5 z-10 flex items-center justify-center pointer-events-none" style="left: 37.5%;" title="30 Second Milestone">
                        <i data-lucide="star" id="star-marker-30" class="w-4 h-4 text-slate-400/50 transition-colors"></i>
                    </div>
                    <div class="absolute text-slate-500 w-5 h-5 -ml-2.5 z-10 flex items-center justify-center pointer-events-none" style="left: 75%;" title="60 Second Target Goal">
                        <i data-lucide="star" id="star-marker-60" class="w-4 h-4 text-slate-400/50 transition-colors"></i>
                    </div>
                    
                    <!-- Shared Combined Toggle Trigger Button -->
                    <button id="arcade-record-btn" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                        <i data-lucide="mic" id="arcade-record-icon" class="w-5 h-5 pointer-events-none transition-transform"></i>
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        
        // Wire click selectors
        this.querySelector('.thps-exit-course').addEventListener('click', () => {
            this.courseData = null;
            this.currentStep = 0;
            this.renderCourseSelector();
        });

        this.querySelector('#btn-prompt-q').addEventListener('click', () => { this.querySelector('#text-prompt-q').innerText = getRandomPrompt(this.prompts.question); });
        this.querySelector('#btn-prompt-r').addEventListener('click', () => { this.querySelector('#text-prompt-r').innerText = getRandomPrompt(this.prompts.repeat); });
        this.querySelector('#btn-prompt-c').addEventListener('click', () => { this.querySelector('#text-prompt-c').innerText = getRandomPrompt(this.prompts.count); });

        this.querySelector('#arcade-record-btn').addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        });
    }

    // LINEAR COURSE UI SCREEN
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
        if (!this.courseData || this.currentStep === 0) return;
        
        // Bypass grading metrics if inside independent Arcade mode
        if (this.currentStep === 'arcade') return;

        const payload = e.detail;
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
        // 1. Sync Linear Course UI Timer elements
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

        // 2. Sync Independent Arcade Mode Timer Elements
        const arcadeProgress = this.querySelector('#arcade-progress');
        const arcadeBtn = this.querySelector('#arcade-record-btn');
        const arcadeIcon = this.querySelector('#arcade-record-icon');
        const star30 = this.querySelector('#star-marker-30');
        const star60 = this.querySelector('#star-marker-60');
        
        if (arcadeProgress && arcadeBtn && arcadeIcon) {
            if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                
                // Max 80 seconds scaling ceiling for visual progress mapping
                const fillPct = Math.min((elapsedSecs / 80) * 100, 100);
                arcadeProgress.style.width = `${fillPct}%`;
                
                // Highlight pacing target milestone star nodes dynamically
                if (elapsedSecs >= 30 && star30) star30.className = "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]";
                if (elapsedSecs >= 60 && star60) star60.className = "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]";
                
                if (!arcadeIcon.classList.contains('text-rose-500')) {
                    arcadeIcon.setAttribute('data-lucide', 'square');
                    arcadeIcon.className = "w-5 h-5 pointer-events-none text-rose-500 scale-95";
                    if (window.lucide) window.lucide.createIcons({ root: arcadeBtn });
                }
            } else {
                // Clear bar states on stop transitions
                arcadeProgress.style.width = `0%`; 
                if (star30) star30.className = "w-4 h-4 text-slate-400/50";
                if (star60) star60.className = "w-4 h-4 text-slate-400/50";
                
                if (arcadeIcon.getAttribute('data-lucide') !== 'mic') {
                    arcadeIcon.setAttribute('data-lucide', 'mic');
                    arcadeIcon.className = "w-5 h-5 pointer-events-none text-white";
                    if (window.lucide) window.lucide.createIcons({ root: arcadeBtn });
                }
            }
        }
    }
}

customElements.define('thps-course-widget', THPSCourseWidget);

class THPSCourseWidget extends HTMLElement {
    constructor() {
        super();
        this.isMenuOpen = false;
        this.currentStep = 0; // 0 = Selection Menu, 1+ = Course Modules
        this.courseData = null;
    }

    connectedCallback() {
        this.renderCourseSelector();
        // Start the sync loop to mirror the global recording state
        this.syncLoop = setInterval(() => this.updateTimerUI(), 100);
    }

    disconnectedCallback() {
        // Clean up memory if the widget is removed from the dashboard
        if (this.syncLoop) clearInterval(this.syncLoop);
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

    // THE FETCH ENGINE
    async fetchCourse(url) {
        // Loading State
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 font-sans">
                <i data-lucide="loader-2" class="w-10 h-10 text-indigo-600 animate-spin mb-4"></i>
                <p class="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Course Data...</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons({ root: this });

        try {
            // Cache buster included
            const response = await fetch(`${url}?t=${Date.now()}`);
            if (!response.ok) throw new Error("Network response was not ok");
            this.courseData = await response.json();
            this.currentStep = 1; 
            this.renderCourseUI();
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

    // STATE 1+: THE ACTIVE COURSE UI
    renderCourseUI() {
        if (!this.courseData) return;

        const activeModule = this.courseData.modules.find(m => m.step === this.currentStep) || this.courseData.modules[0];

        // Generate dynamic nav drawer items
        const navItemsHTML = this.courseData.modules.map(mod => {
            const isActive = mod.step === this.currentStep;
            return `
                <div class="thps-nav-item flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}" data-step="${mod.step}">
                    <span class="truncate pr-2 pointer-events-none">${mod.title}</span>
                    <i data-lucide="${isActive ? 'check-circle' : 'circle'}" class="w-4 h-4 opacity-50 shrink-0 pointer-events-none"></i>
                </div>
            `;
        }).join('');

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
                            ${activeModule.type === 'recording' ? `
                                <div class="mt-8 bg-slate-900 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 pointer-events-none"></div>
                                    
                                    <div class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Goal: 60 Seconds</div>
                                    <div class="thps-course-timer text-5xl md:text-6xl font-mono font-black text-white tracking-wider mb-6 drop-shadow-md">00:00</div>
                                    
                                    <button class="thps-course-record-btn bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 flex items-center justify-center gap-2 mx-auto w-full max-w-[250px]">
                                        <i data-lucide="mic" class="w-5 h-5 pointer-events-none"></i> <span class="thps-course-record-text pointer-events-none">Start Task</span>
                                    </button>
                                </div>
                            ` : `
                                <div class="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-200 rounded-xl">
                                    [ Activity Area: ${activeModule.type} ]
                                </div>
                            `}
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
        this.updateTimerUI(); // Ensure immediate sync on render
    }

    attachCourseListeners() {
        // Toggle Drawer
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

        // Exit Course (Return to menu)
        const exitBtn = this.querySelector('.thps-exit-course');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.courseData = null;
                this.currentStep = 0;
                this.isMenuOpen = false;
                this.renderCourseSelector();
            });
        }

        // Nav Drawer Items
        const navItems = this.querySelectorAll('.thps-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.getAttribute('data-step'));
                this.currentStep = step;
                this.isMenuOpen = false; // Auto close on selection
                this.renderCourseUI();
            });
        });

        // Footer Prev/Next
        const prevBtn = this.querySelector('.thps-nav-prev');
        const nextBtn = this.querySelector('.thps-nav-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.renderCourseUI();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentStep < this.courseData.totalSteps) {
                    this.currentStep++;
                    this.renderCourseUI();
                }
            });
        }

        // Start/Stop Recording Trigger
        const recordBtn = this.querySelector('.thps-course-record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                if (typeof window.toggleRecording === 'function') {
                    window.toggleRecording();
                } else {
                    console.error("Global toggleRecording function not found.");
                }
            });
        }
    }

    // Mirror the global window.isActive state
    updateTimerUI() {
        const timerDisplay = this.querySelector('.thps-course-timer');
        const recordBtn = this.querySelector('.thps-course-record-btn');
        const recordText = this.querySelector('.thps-course-record-text');
        
        if (!timerDisplay || !recordBtn) return;

        if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
            // App is actively recording
            const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
            let m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
            let s = Math.floor(elapsedSecs % 60).toString().padStart(2, '0');
            
            timerDisplay.innerText = `${m}:${s}`;
            timerDisplay.classList.add('text-emerald-400');
            
            // Morph button to Stop state
            if (!recordBtn.classList.contains('bg-rose-500')) {
                recordBtn.classList.replace('bg-emerald-500', 'bg-rose-500');
                recordBtn.classList.replace('hover:bg-emerald-400', 'hover:bg-rose-400');
                recordBtn.style.boxShadow = "0 0 20px rgba(243, 24, 73, 0.4)";
                if (recordText) recordText.innerText = "Stop Task";
                recordBtn.innerHTML = `<i data-lucide="square" class="w-5 h-5 pointer-events-none"></i> <span class="thps-course-record-text pointer-events-none">Stop Task</span>`;
                if (window.lucide) window.lucide.createIcons({ root: recordBtn });
            }
        } else {
            // App is NOT recording
            timerDisplay.classList.remove('text-emerald-400');
            
            // Morph button to Start state
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
}

customElements.define('thps-course-widget', THPSCourseWidget);

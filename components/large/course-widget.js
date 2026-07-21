class THPSCourseWidget extends HTMLElement {
    constructor() {
        super();
        this.isMenuOpen = false;
        this.currentStep = 0; 
        this.courseData = null;
        this.evaluations = {}; // The CourseRecordBook
        this.prompts = null;
        
        // ESL Specific State
        this.eslCategory = null;
        this.eslSentences = [];
        this.eslIndex = 0;

        // Voice Choice Specific State
        this.vcActiveSpeechIndex = 0;
        this.vcLineIndex = 0;
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
                    <!-- ESL LEVEL 1 BUTTON -->
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/esl-level-1/esl-level-1.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">ESL Level 1: Pronunciation</span>
                        <i data-lucide="mic-2" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>
                    <!-- REPEAT + COUNT ARCADE -->
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/repeat-count/repeat-count.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Repeat + Count</span>
                        <i data-lucide="gamepad-2" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
                    </button>
                    <!-- NEW VOICE CHOICE COURSE -->
                    <button class="thps-course-btn group flex items-center justify-between bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm active:scale-95" data-url="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/voice-choices/voice-choices.json">
                        <span class="group-hover:text-indigo-700 transition-colors pointer-events-none">Voice Choice: Intensity</span>
                        <i data-lucide="sliders" class="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"></i>
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
            } else if (this.courseData.mode === 'esl') {
                this.currentStep = 'esl-menu';
                this.renderEslMenu();
            } else if (this.courseData.mode === 'voice-choice') {
                this.currentStep = 'vc-menu';
                this.renderVoiceChoiceMenu();
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
        
        // Generate Color based on Intensity
        const getStyle = (intensity) => {
            switch(parseInt(intensity)) {
                case 0: return { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-200' };
                case 1: return { bg: 'bg-slate-700', text: 'text-white', ring: 'ring-slate-700' };
                case 2: return { bg: 'bg-sky-500', text: 'text-white', ring: 'ring-sky-500' };
                case 3: return { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-500' };
                case 4: return { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-500' };
                case 5: return { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-600' };
                default: return { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-200' };
            }
        };

        const linesHTML = speech.lines.map((line, index) => {
            const style = getStyle(line.intensity);
            // We use padding block to ensure smooth scroll snapping/gliding anchors.
            return `
                <div class="vc-line-wrapper py-3 w-full" id="vc-line-${index}">
                    <div class="vc-line-content flex gap-4 p-4 rounded-2xl border-2 border-transparent transition-all duration-300 ${index === this.vcLineIndex ? 'opacity-100 bg-white shadow-sm ring-1 ' + style.ring : 'opacity-40 grayscale'}">
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
                <div class="flex-1 relative flex flex-col">
                    
                    <!-- Scroll Viewport -->
                    <div id="vc-scroll-viewport" class="flex-1 overflow-hidden scroll-smooth relative px-4 md:px-12 py-10">
                        <div class="max-w-2xl mx-auto flex flex-col pb-48"> <!-- Extra padding bottom so last line can hit top -->
                            ${linesHTML}
                        </div>
                    </div>
                    
                    <!-- Overlay Gradients to focus the center/top view -->
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
            
            // Update visual styles (opacity and highlight)
            lines.forEach((line, idx) => {
                if (idx === this.vcLineIndex) {
                    line.classList.remove('opacity-40', 'grayscale');
                    line.classList.add('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
                } else {
                    line.classList.add('opacity-40', 'grayscale');
                    line.classList.remove('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
                }
            });

            // Smooth glide to the wrapper
            const targetWrapper = this.querySelector(`#vc-line-${this.vcLineIndex}`);
            if (targetWrapper && viewport) {
                // Scroll the wrapper to the top of the viewport (with a small padding buffer)
                viewport.scrollTo({
                    top: targetWrapper.offsetTop - 40,
                    behavior: 'smooth'
                });
            }

            // Update button states
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

    // ... (Keep renderEslMenu, renderEslDrill, renderArcadeUI, renderCourseUI here identically as before)
    // [I have omitted them in this view purely to keep the code block focused, but they remain intact in the logic exactly as provided in your prompt above. Ensure you keep them when pasting this replacement!]
    
    // ==========================================
    // ESL LEVEL 1: VOCAL FITNESS ARCADE
    // ==========================================
    
    renderEslMenu() {
        // [Existing code from prompt]
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
                    <!-- NEW ADVANCED OPTION -->
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
                    <div class="w-16"></div> <!-- Spacer for flex alignment -->
                </div>

                <!-- MAIN DRILL AREA -->
                <div class="flex-1 flex flex-col items-center justify-center p-6 relative">
                    
                    <!-- Target Sentence -->
                    <div class="w-full max-w-2xl bg-white border-2 border-indigo-100 rounded-2xl p-6 md:p-8 shadow-sm text-center mb-8">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Target Sentence</span>
                        <p class="text-2xl md:text-3xl font-bold text-slate-800 leading-tight w-[95%] mx-auto line-clamp-3">${sentence}</p>
                    </div>

                    <!-- Precision Timer & Controls -->
                    <div class="flex flex-col items-center justify-center mb-8">
                        <div class="thps-esl-timer text-5xl md:text-6xl font-mono font-black text-slate-800 tracking-wider mb-4 drop-shadow-sm transition-colors">0.00<span class="text-2xl text-slate-400">s</span></div>
                        <button id="esl-record-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white w-16 h-16 rounded-full font-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] active:scale-90">
                            <i data-lucide="mic" id="esl-record-icon" class="w-6 h-6 pointer-events-none transition-transform"></i>
                        </button>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3" id="esl-record-text">Tap to Start</span>
                    </div>

                    <!-- Live Transcript Output -->
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
        
        // Listeners
        this.querySelector('.thps-esl-back').addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording(); // Safety stop
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
                // Clear the transcript box manually on new start
                if (!window.isActive) {
                    const tBox = this.querySelector('#esl-transcript');
                    if (tBox) tBox.innerText = 'Listening...';
                }
            }
        });
    }

    // ==========================================
    // ARCADE MODE: REPEAT + COUNT UI
    // ==========================================
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
            const baseUrl = 'https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/repeat-count/';
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
                    
                    <!-- Question Prompt Field -->
                    <div id="btn-prompt-q" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest absolute top-2.5 left-4">Question Prompt</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-indigo-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2" id="text-prompt-q">${getRandomPrompt(this.prompts.question)}</span>
                    </div>

                    <!-- Repeat Prompt Field -->
                    <div id="btn-prompt-r" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest absolute top-2.5 left-4">Repeat Framework</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-emerald-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2" id="text-prompt-r">${getRandomPrompt(this.prompts.repeat)}</span>
                    </div>

                    <!-- Count Prompt Field -->
                    <div id="btn-prompt-c" class="flex-1 max-h-[110px] min-h-[90px] bg-white border border-slate-200 hover:border-amber-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 cursor-pointer transition-all group relative active:scale-[0.99]">
                        <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest absolute top-2.5 left-4">Count Sequence</span>
                        <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-300 group-hover:text-amber-500 absolute top-2.5 right-4 opacity-40 group-hover:opacity-100 transition-all group-hover:rotate-45"></i>
                        <span class="text-sm md:text-base font-bold text-slate-700 text-center mt-3 leading-snug w-[90%] mx-auto line-clamp-2" id="text-prompt-c">${getRandomPrompt(this.prompts.count)}</span>
                    </div>
                </div>

                <!-- SLEEK ARCADE TIMER BAR PANEL -->
                <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800 mb-2">
                    <!-- Progress Progression Bar Fill -->
                    <div id="arcade-progress" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                    
                    <!-- Pacing Target Indicators (Stars positioned relative to 80s ceiling) -->
                    <div class="absolute text-slate-500 w-5 h-5 -ml-2.5 z-10 flex items-center justify-center pointer-events-none" style="left: 25%;" title="20 Second Milestone">
                        <i data-lucide="star" id="star-marker-20" class="w-4 h-4 text-slate-400/50 transition-colors"></i>
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

    // ==========================================
    // LINEAR COURSE UI SCREEN
    // ==========================================
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
        
        // Bypass grading metrics if inside independent Arcade, ESL, or Voice Choice modes
        if (this.currentStep === 'arcade' || this.currentStep === 'esl-menu' || this.currentStep === 'esl-drill' || this.currentStep === 'vc-menu' || this.currentStep === 'vc-prompter') return;

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

        // 3. Sync ESL Level 1 Timer & Transcript
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

        // 4. NEW: Sync Voice Choice Timer
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
    }
}

customElements.define('thps-course-widget', THPSCourseWidget);

class THPSDiagnostic extends HTMLElement {
    constructor() {
        super();
        this.TOTAL_PAGES = 13;
        this.currentPage = 1;
        this.activeTimers = {};
        this.isPlayingTTS = false;
        this.ttsUtterance = null;
        
        // SAMS Explanation Data
        this.samsExplanations = null;
        
        // Single continuous data slot for Test 3
        this.vocalInhibitionData = { recorded: false, wpm: 0, sps: 0, pause: 0, db: -40, text: "" };
        this.pendingT3Payload = false; 

        // Test 3 State Variables
        this.t3Slide = 0; 
        this.t3LineIndex = 0; 
        
        this.pacinoBlocks = [
            { level: 1, color: "purple-600", lines: ["You know, when you get old in life things get taken from you. I mean that's...part of life.", "You find out life's this game of inches"] },
            { level: 2, color: "blue-500", lines: ["So is football. Because in either game, life or football, the margin for error is so small.", "One-half a step too late, or too early, and you don't quite make it."] },
            { level: 3, color: "emerald-500", lines: ["But the inches we need are everywhere.", "They're in every break of the game, every minute, every second."] },
            { level: 4, color: "orange-500", lines: ["On this team, we fight for that inch.", "On this team, we tear ourselves and everyone else around us to pieces for that inch."] },
            { level: 5, color: "rose-600", lines: ["We claw with our fingernails for that inch, because we know when we add up all those inches that's gonna make the difference between winning and losing!", "Between livin' and dyin'!"] }
        ];

        // Flatten the blocks into a single array of lines for the prompter
        this.t3Lines = [];
        this.pacinoBlocks.forEach(block => {
            block.lines.forEach(line => this.t3Lines.push({ intensity: block.level, text: line }));
        });

        // Tracks values from the two Stage 5 transcription passes
        this.stage5DataSlots = {
            A: { wpm: 0, visual: 0, recorded: false },
            B: { wpm: 0, visual: 0, recorded: false }
        };
        this.currentStage5Slot = null;
        
        this.navItems = [
            { id: 1, icon: 'fa-user', label: 'Client Details' },
            { id: 2, icon: 'fa-heartbeat', label: 'Test 1: SAMS' },
            { id: 3, icon: 'fa-eye', label: 'Test 2: VVIQ' },
            { id: 4, icon: 'fa-volume-up', label: 'Test 3: Vocal Inhibition' },
            { id: 5, icon: 'fa-image', label: 'Test 4: Visual Pt 1' },
            { id: 6, icon: 'fa-camera', label: 'Test 4: Visual Pt 2' },
            { id: 7, icon: 'fa-list-ol', label: 'Test 5: P1' },
            { id: 8, icon: 'fa-list-ol', label: 'Test 5: P2' },
            { id: 9, icon: 'fa-question', label: 'Test 5: P3' },
            { id: 10, icon: 'fa-quote-left', label: 'Test 5: P4' },
            { id: 11, icon: 'fa-compress-arrows-alt', label: 'Test 5: P5' },
            { id: 12, icon: 'fa-exchange-alt', label: 'Test 5: P6' },
            { id: 13, icon: 'fa-flag-checkered', label: 'Generate Summary' }
        ];

        this.test5Data = [
            { pageId: 7, title: "Test 5: Word (underlined)", name: "Underline", questions: ["1. Would you invest in a <u>bakery</u>?", "2. Would you <u>invest</u> in a theme park?", "3. Would you rather <u>coffee or tea</u>?", "4. Would you rather have <u>a home</u> by the beach or in the mountains?", "5. What's your <u>dream job</u> if money didn't matter?"] },
            { pageId: 8, title: "Test 5: Word (no underline)", name: "No Underline", questions: ["1. What does the ideal Sunday look like?", "2. Would you invest in a board game?", "3. Would you invest in a fashion store?", "4. What's better: summer or winter?", "5. Would you rather lose a phone or wallet?"] },
            { pageId: 9, title: "Test 5: Question", name: "Question", questions: ["1. What does the ideal birthday look like?", "2. What's the best way to spend a rainy day?", "3. Would you invest in a jazz club?", "4. Would you invest in a rooftop bar?", "5. What's better: skydiving or scuba diving?"] },
            { pageId: 10, title: "Test 5: Statement", name: "Statement", questions: ["1. Would you rather live on a boat or bus?", "2. What's your go-to comfort food?", "3. What's your dream festival or event?", "4. Would you invest in a yoga studio?", "5. Would you invest in an indie movie?"] },
            { pageId: 11, title: "Test 5: Clarify in 2 (Small Big)", name: "Small Big", questions: ["1. What's your ideal daily routine?", "2. What makes a perfect morning?", "3. Would you invest in a chocolate factory?", "4. Could you live without the internet?", "5. What's better: unlimited travel or time?"] },
            { pageId: 12, title: "Test 5: Clarify in 2 (opposites)", name: "Opposites", questions: ["1. Would you invest in a local newspaper?", "2. What's better: famous or anonymous?", "3. Would you invest in a casino?", "4. Would you invest in a cooking school?", "5. What's better: early or fashionably late?"] }
        ];
    }

    connectedCallback() {
        this.render();
        this.initApp();
        this.attachListeners();
        this.updateT3Tutorial();
        
        // Active Sync Loops
        this.syncLoop = setInterval(() => this.updateT3TimerUI(), 50);
        this.s5SyncLoop = setInterval(() => this.updateS5TimerUI(), 50);
    }

    disconnectedCallback() {
        if (this.isPlayingTTS || (window.speechSynthesis && window.speechSynthesis.speaking)) {
            window.speechSynthesis.cancel();
        }
        Object.values(this.activeTimers).forEach(t => clearInterval(t.interval));
        if (this.syncLoop) clearInterval(this.syncLoop);
        if (this.s5SyncLoop) clearInterval(this.s5SyncLoop);
    }

    async fetchSamsExplanations() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/Explainers/SAMS-test.json');
            this.samsExplanations = await response.json();
        } catch (error) {
            console.warn("Could not load SAMS explanations JSON.", error);
        }
    }

    initApp() {
        this.fetchSamsExplanations();

        const navMenu = this.querySelector('[data-ref="nav-menu"]');
        this.navItems.forEach(item => {
            const a = document.createElement('a');
            a.href = '#';
            a.setAttribute('data-action', 'navTo');
            a.setAttribute('data-page', item.id);
            a.setAttribute('data-ref', `nav-item-${item.id}`);
            a.className = `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.id === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;
            a.innerHTML = `<i class="fas ${item.icon} w-6 text-center ${item.id === 1 ? 'text-white' : 'text-slate-500'}"></i> <span class="hidden md:block truncate ml-2">${item.label}</span>`;
            navMenu.appendChild(a);
        });

        const t5Container = this.querySelector('[data-ref="test5-pages-container"]');
        this.test5Data.forEach(block => {
            const section = document.createElement('section');
            section.setAttribute('data-ref', `page-${block.pageId}`);
            section.className = 'thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100';
            
            let html = `
                <h3 class="text-2xl font-bold mb-2 text-slate-800">${block.title}</h3>
                <p class="text-slate-500 mb-6">Word Association Categories. Tick applicable observations.</p>
                <div class="space-y-4">
            `;

            block.questions.forEach((q, idx) => {
                const qId = `t5_p${block.pageId}_q${idx+1}`;
                html += `
                    <div class="bg-slate-50 border border-slate-200 rounded-lg p-5">
                        <p class="font-semibold text-slate-800 mb-3">${q}</p>
                        <div class="flex flex-wrap gap-4">
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" data-ref="${qId}_correct" class="t5-cb w-4 h-4 text-indigo-600 rounded"><span class="text-sm text-slate-600">Correct</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" data-ref="${qId}_nodelay" class="t5-cb w-4 h-4 text-indigo-600 rounded"><span class="text-sm text-slate-600">No Delay</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" data-ref="${qId}_voice" class="t5-cb w-4 h-4 text-indigo-600 rounded"><span class="text-sm text-slate-600">Voice Added</span></label>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
            section.innerHTML = html;
            t5Container.appendChild(section);
        });

        const dateEl = this.querySelector('[data-ref="assessmentDate"]');
        if (dateEl) dateEl.valueAsDate = new Date();

        // Render the Al Pacino Gliding Prompter Lines
        const getStyle = (intensity) => {
            switch(parseInt(intensity)) {
                case 1: return { bg: 'bg-purple-600', text: 'text-white', ring: 'ring-purple-600' };
                case 2: return { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-500' };
                case 3: return { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-500' };
                case 4: return { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-500' };
                case 5: return { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-600' };
                default: return { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-200' };
            }
        };

        const prompterContainer = this.querySelector('#t3-scroll-viewport');
        prompterContainer.innerHTML = `<div class="max-w-2xl mx-auto flex flex-col pb-48">` + 
            this.t3Lines.map((line, index) => {
                const style = getStyle(line.intensity);
                return `
                    <div class="t3-line-wrapper py-3 w-full" id="t3-line-${index}">
                        <div class="t3-line-content flex gap-4 p-4 rounded-2xl border-2 border-transparent transition-all duration-300 ${index === this.t3LineIndex ? 'opacity-100 bg-white shadow-sm ring-1 ' + style.ring : 'opacity-40'}">
                            <div class="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-inner ${style.bg} ${style.text}">
                                <span class="text-xl font-black leading-none">${line.intensity}</span>
                            </div>
                            <div class="flex-1 flex items-center">
                                <p class="text-lg md:text-xl font-bold text-slate-800 leading-snug">${line.text}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') + `</div>`;

        if (window.lucide) window.lucide.createIcons({ root: this });
        this.updateUI();
    }

    attachListeners() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            e.preventDefault();
            
            const action = btn.getAttribute('data-action');
            if (action === 'nextPage') this.nextPage();
            if (action === 'prevPage') this.prevPage();
            if (action === 'navTo') this.goToPage(parseInt(btn.getAttribute('data-page')));
            if (action === 'startTimer') this.startTimer(btn.getAttribute('data-timer'), 60);
            if (action === 'resetTimer') this.resetTimer(btn.getAttribute('data-timer'), 60);
            if (action === 'toggleTTS') this.toggleTTS();
            
            // SAMS Update Hooks
            if (action === 'incrementSams') this.adjustSams(btn.getAttribute('data-target'), 1);
            if (action === 'decrementSams') this.adjustSams(btn.getAttribute('data-target'), -1);
            
            // Custom Pipeline Listeners
            if (action === 'toggleVisualRecord') this.toggleVisualRecord(btn.getAttribute('data-slot'));
            if (action === 'compileReportCard') this.compileReportCard();

            // Test 3 specific listeners
            if (action === 't3PrevSlide') { if (this.t3Slide > 0) { this.t3Slide--; this.updateT3Tutorial(); } }
            if (action === 't3NextSlide') { if (this.t3Slide < 5) { this.t3Slide++; this.updateT3Tutorial(); } }
            if (action === 't3StartPrompter') this.startT3Prompter();
            if (action === 't3GlideUp') { if (this.t3LineIndex > 0) { this.t3LineIndex--; this.updateT3PrompterScroll(); } }
            if (action === 't3GlideDown') { if (this.t3LineIndex < this.t3Lines.length - 1) { this.t3LineIndex++; this.updateT3PrompterScroll(); } }
            if (action === 'toggleT3Record') this.toggleT3Record();
        });

        // Track global engine execution returns
        window.addEventListener('thps-dashboard-update', (e) => {
            const payload = e.detail;
            if (!payload || !payload.text) return;

            // Catch and route execution frames for Vocal Inhibition (Stage 4)
            if (this.pendingT3Payload) {
                let linearSum = 0, dbCount = 0;
                if (payload.volumeData && payload.volumeData.length > 0) {
                    payload.volumeData.forEach(v => { linearSum += Math.pow(10, v.db / 10); dbCount++; });
                }
                const avgDb = dbCount > 0 ? (10 * Math.log10(linearSum / dbCount)) : -40;
            
                this.vocalInhibitionData = {
                    recorded: true,
                    wpm: payload.wpm || 0,
                    sps: payload.sps || 0,
                    pause: payload.pause || 0,
                    db: avgDb,
                    text: payload.text
                };
                
                console.log("Vocal Inhibition Data Saved:", this.vocalInhibitionData);
                this.pendingT3Payload = false; 
            }

            // Catch and route execution frames for Visual Association targets (Stage 5)
            if (this.currentStage5Slot !== null) {
                const slot = this.currentStage5Slot;
                
                // Save to the memory slot for Report Card later
                this.stage5DataSlots[slot] = {
                    recorded: true,
                    wpm: payload.wpm || 0,
                    visual: payload.visual || 0
                };
            
                // Inject data directly into the UI pills
                const wpmPill = this.querySelector(`#s5-wpm-${slot}`);
                const visPill = this.querySelector(`#s5-vis-${slot}`);
                
                if (wpmPill) wpmPill.innerText = `${payload.wpm || 0} WPM`;
                if (visPill) visPill.innerText = `${Math.round(payload.visual || 0)}% VIS`;
            
                this.currentStage5Slot = null; // Un-prime the slot
            }
        });
    }

    adjustSams(target, delta) {
        const valEl = this.querySelector(`[data-ref="val-${target}"]`);
        if (!valEl) return;
        
        let currentVal = parseInt(valEl.innerText);
        let newVal = currentVal + delta;
        
        if (newVal >= 1 && newVal <= 10) {
            valEl.innerText = newVal;
            this.updateSamsExplanation(target, newVal);
        }
    }
    
    updateSamsExplanation(target, val) {
        const explanationEl = this.querySelector('[data-ref="sams-explanation"]');
        if (!explanationEl || !this.samsExplanations) return;
    
        const keyMap = {
            'q1': 'Preparation Discomfort',
            'q2': 'Presentation Discomfort',
            'q3': 'Bad News Discomfort',
            'q4': 'Heckling Discomfort'
        };
        
        const category = keyMap[target];
        if (!category || !this.samsExplanations[category]) return;
    
        let bucket = "";
        if (val >= 0 && val <= 4) bucket = "nil (0-4)";
        else if (val >= 5 && val <= 6) bucket = "low (5-6)";
        else if (val >= 7 && val <= 8) bucket = "med (7-8)";
        else if (val >= 9 && val <= 10) bucket = "high (9-10)";
    
        const data = this.samsExplanations[category];
        const text = data[bucket] || data[bucket + " "] || "Explanation missing for this range.";
        
        explanationEl.innerText = text;
    }

    // --- TEST 3 INLINE STATE MACHINE METHODS ---

    updateT3Tutorial() {
        const slides = [
            { icon: '<i class="fas fa-volume-up text-5xl text-slate-300"></i>', text: 'This is a Vocal Inhibition test. You will record yourself presenting lines from a famous speech. The numbers next to each line indicate how intensely you need to deliver those lines in terms of speed and volume.' },
            { icon: '<div class="w-20 h-20 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-4xl font-black shadow-inner">1</div>', text: '"1" means extremely slow and quiet. You can include lots of long 1 to 3 second pauses.<br><br><i class="text-slate-400 font-medium tracking-wide">Deadly Serious or Depressed</i>' },
            { icon: '<div class="w-20 h-20 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-4xl font-black shadow-inner">2</div>', text: '"2" means speak slowly and quietly. Whereas 1 was extreme and dramatic, a 2 is only slightly but noticeably slower or quieter than your usual speaking voice.<br><br><i class="text-slate-400 font-medium tracking-wide">Thoughtful or Sad</i>' },
            { icon: '<div class="w-20 h-20 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-4xl font-black shadow-inner">3</div>', text: '"3" means speak normally.' },
            { icon: '<div class="w-20 h-20 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-4xl font-black shadow-inner">4</div>', text: '"4" means speak slightly but noticeably faster and louder than your normal voice.<br><br><i class="text-slate-400 font-medium tracking-wide">Frustrated or Passionate</i>' },
            { icon: '<div class="w-20 h-20 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-4xl font-black shadow-inner">5</div>', text: '"5" means extremely fast and loud.<br><br><i class="text-slate-400 font-medium tracking-wide">Volcanic or Elated</i>' }
        ];

        this.querySelector('#t3-slide-content').innerHTML = `
            ${slides[this.t3Slide].icon}
            <p class="text-base md:text-lg font-bold mt-8 max-w-md leading-relaxed px-4">${slides[this.t3Slide].text}</p>
        `;
        this.querySelector('#t3-slide-indicator').innerText = `${this.t3Slide + 1} / 6`;
    }

    startT3Prompter() {
        this.querySelector('#t3-tutorial-container').classList.add('hidden');
        this.querySelector('#t3-prompter-container').classList.remove('hidden');
        
        requestAnimationFrame(() => this.updateT3PrompterScroll());
    }

    updateT3PrompterScroll() {
        const viewport = this.querySelector('#t3-scroll-viewport');
        const lines = this.querySelectorAll('.t3-line-content');
        
        lines.forEach((line, idx) => {
            if (idx === this.t3LineIndex) {
                line.classList.remove('opacity-40');
                line.classList.add('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
            } else {
                line.classList.add('opacity-40');
                line.classList.remove('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
            }
        });
    
        const targetWrapper = this.querySelector(`#t3-line-${this.t3LineIndex}`);
        if (targetWrapper && viewport) viewport.scrollTo({ top: targetWrapper.offsetTop - 40, behavior: 'smooth' });
    
        this.querySelector('.thps-t3-up').disabled = this.t3LineIndex === 0;
        this.querySelector('.thps-t3-down').disabled = this.t3LineIndex === this.t3Lines.length - 1;
    }

    toggleT3Record() {
        if (typeof window.toggleRecording === 'function') window.toggleRecording();
        
        if (window.isActive) {
            this.t3LineIndex = 0;
            this.updateT3PrompterScroll();
            this.pendingT3Payload = true;
        }
    }

    updateT3TimerUI() {
        const timerDisplay = this.querySelector('#t3-timer-display');
        const recordBtn = this.querySelector('#t3-record-btn');
        const recordIcon = this.querySelector('#t3-record-icon');
        const recordText = this.querySelector('#t3-record-text');
        
        if (timerDisplay && recordBtn) {
            if (window.isActive && this.pendingT3Payload && window.THPS?.Audio?.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                let m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
                let s = Math.floor(elapsedSecs % 60).toString().padStart(2, '0');
                
                timerDisplay.innerText = `${m}:${s}`;
                timerDisplay.classList.add('text-rose-500');
    
                if (!recordBtn.classList.contains('bg-rose-500')) {
                    recordBtn.classList.replace('bg-indigo-600', 'bg-rose-500');
                    recordBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-rose-400');
                    if (recordText) recordText.innerText = "Finish";
                    if (recordIcon) recordIcon.className = "fas fa-square mr-1 pointer-events-none";
                }
            } else {
                timerDisplay.classList.remove('text-rose-500');
                if (recordBtn.classList.contains('bg-rose-500')) {
                    recordBtn.classList.replace('bg-rose-500', 'bg-indigo-600');
                    recordBtn.classList.replace('hover:bg-rose-400', 'hover:bg-indigo-500');
                    if (recordText) recordText.innerText = "Start Performance";
                    if (recordIcon) recordIcon.className = "fas fa-mic mr-1 pointer-events-none";
                }
            }
        }
    }

    // --- TEST 4 VISUAL ASSOCIATION METHODS ---

    toggleVisualRecord(slot) {
        if (!window.isActive) {
            this.currentStage5Slot = slot; 
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        } else {
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        }
    }

    updateS5TimerUI() {
        if (this.currentStage5Slot !== null) {
            const slot = this.currentStage5Slot;
            const progressEl = this.querySelector(`#s5-progress-${slot}`);
            const btnEl = this.querySelector(`#s5-btn-${slot}`);
            const iconEl = this.querySelector(`#s5-icon-${slot}`);
    
            if (window.isActive && window.THPS?.Audio?.recordStartTime) {
                const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
                
                // Scale mapped to 80 seconds (so 20s = 25% mark, 60s = 75% mark)
                const fillPct = Math.min((elapsedSecs / 80) * 100, 100);
                if (progressEl) progressEl.style.width = `${fillPct}%`;
                
                // Swap icon to stop square
                if (iconEl && iconEl.getAttribute('data-lucide') !== 'square') {
                    iconEl.setAttribute('data-lucide', 'square');
                    if (window.lucide) window.lucide.createIcons({ root: btnEl });
                }
            } else {
                if (progressEl) progressEl.style.width = '0%';
                
                // Revert icon to mic
                if (iconEl && iconEl.getAttribute('data-lucide') !== 'mic') {
                    iconEl.setAttribute('data-lucide', 'mic');
                    if (window.lucide) window.lucide.createIcons({ root: btnEl });
                }
            }
        }
    }

    goToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.TOTAL_PAGES) return;
        
        if (this.currentPage === 3 && typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.resetTTSButton();
        }

        const oldPage = this.querySelector(`[data-ref="page-${this.currentPage}"]`);
        if (oldPage) oldPage.classList.remove('thps-diag-active');
        
        const oldNav = this.querySelector(`[data-ref="nav-item-${this.currentPage}"]`);
        if(oldNav) {
            oldNav.className = oldNav.className.replace('bg-indigo-600 text-white shadow-md', 'text-slate-400 hover:bg-slate-800 hover:text-white');
            const icon = oldNav.querySelector('i');
            if (icon) icon.classList.replace('text-white', 'text-slate-500');
        }

        this.currentPage = pageNum;

        const newPage = this.querySelector(`[data-ref="page-${this.currentPage}"]`);
        if (newPage) newPage.classList.add('thps-diag-active');
        
        const newNav = this.querySelector(`[data-ref="nav-item-${this.currentPage}"]`);
        if(newNav) {
            newNav.className = newNav.className.replace('text-slate-400 hover:bg-slate-800 hover:text-white', 'bg-indigo-600 text-white shadow-md');
            const icon = newNav.querySelector('i');
            if (icon) icon.classList.replace('text-slate-500', 'text-white');
        }

        const container = this.querySelector('[data-ref="form-container"]');
        if (container) container.scrollTop = 0;

        this.updateUI();
    }

    nextPage() { this.goToPage(this.currentPage + 1); }
    prevPage() { this.goToPage(this.currentPage - 1); }

    updateUI() {
        this.querySelector('[data-ref="current-step"]').innerText = this.currentPage;
        const currentNav = this.navItems.find(n => n.id === this.currentPage);
        this.querySelector('[data-ref="header-title"]').innerText = currentNav ? currentNav.label : 'Diagnostic';

        this.querySelector('[data-ref="btn-prev"]').disabled = this.currentPage === 1;
        
        const nextBtn = this.querySelector('[data-ref="btn-next"]');
        if (this.currentPage === this.TOTAL_PAGES) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            nextBtn.innerHTML = `Next <i class="fas fa-arrow-right ml-2 pointer-events-none"></i>`;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    startTimer(id, duration) {
        if (this.activeTimers[id]) clearInterval(this.activeTimers[id].interval);
        const display = this.querySelector(`[data-ref="${id}-display"]`);
        let time = duration;
        display.innerText = this.formatTime(time);
        display.classList.add('text-emerald-400');

        this.activeTimers[id] = {
            interval: setInterval(() => {
                time--;
                display.innerText = this.formatTime(time);
                if (time <= 10) display.classList.replace('text-emerald-400', 'text-red-500');
                if (time <= 0) clearInterval(this.activeTimers[id].interval);
            }, 1000)
        };
    }

    resetTimer(id, duration) {
        if (this.activeTimers[id]) clearInterval(this.activeTimers[id].interval);
        const display = this.querySelector(`[data-ref="${id}-display"]`);
        display.innerText = this.formatTime(duration);
        display.classList.remove('text-emerald-400', 'text-red-500');
    }

    resetTTSButton() {
        this.isPlayingTTS = false;
        const btn = this.querySelector('[data-ref="tts-btn"]');
        if (btn) {
            btn.classList.replace('bg-red-500', 'bg-indigo-600');
            this.querySelector('[data-ref="tts-icon"]').className = 'fas fa-play mr-2 pointer-events-none';
            this.querySelector('[data-ref="tts-label"]').innerText = 'Play Audio Script';
        }
    }

    toggleTTS() {
        const textToRead = this.querySelector('[data-ref="phantasia-script"]').innerText;
        const btn = this.querySelector('[data-ref="tts-btn"]');

        if (this.isPlayingTTS || window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.resetTTSButton();
            return;
        }

        this.ttsUtterance = new SpeechSynthesisUtterance(textToRead);
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Neural'));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en-'));
        if (selectedVoice) this.ttsUtterance.voice = selectedVoice;

        this.ttsUtterance.rate = 0.85;
        this.ttsUtterance.onend = () => this.resetTTSButton();

        window.speechSynthesis.speak(this.ttsUtterance);
        this.isPlayingTTS = true;
        
        btn.classList.replace('bg-indigo-600', 'bg-red-500');
        this.querySelector('[data-ref="tts-icon"]').className = 'fas fa-stop mr-2 pointer-events-none';
        this.querySelector('[data-ref="tts-label"]').innerText = 'Stop Audio';
    }

    compileReportCard() {
        const clientName = this.querySelector('[data-ref="clientName"]').value || 'Unspecified';
        const date = this.querySelector('[data-ref="assessmentDate"]').value || new Date().toLocaleDateString();
        const goals = this.querySelector('[data-ref="goalsChallenges"]').value || 'None recorded.';

        const t1q1 = parseInt(this.querySelector('[data-ref="val-q1"]').innerText);
        const t1q2 = parseInt(this.querySelector('[data-ref="val-q2"]').innerText);
        const t1q3 = parseInt(this.querySelector('[data-ref="val-q3"]').innerText);
        const t1q4 = parseInt(this.querySelector('[data-ref="val-q4"]').innerText);
        const totalNervesScore = t1q1 + t1q2 + t1q3 + t1q4;

        const phantasiaSelection = this.querySelector('input[name="vviq"]:checked')?.value || 'Phantasia';

        const stage6Metrics = [];
        this.test5Data.forEach(block => {
            let correct = 0, noDelay = 0, voice = 0;
            block.questions.forEach((_, idx) => {
                const qId = `t5_p${block.pageId}_q${idx+1}`;
                if (this.querySelector(`[data-ref="${qId}_correct"]`)?.checked) correct++;
                if (this.querySelector(`[data-ref="${qId}_nodelay"]`)?.checked) noDelay++;
                if (this.querySelector(`[data-ref="${qId}_voice"]`)?.checked) voice++;
            });
            stage6Metrics.push({ name: block.name, correct, noDelay, voice });
        });

        window.thps_diagnosticData = {
            client: { name: clientName, date: date, goals: goals },
            nervesScore: totalNervesScore,
            phantasia: phantasiaSelection,
            vocalInhibition: this.vocalInhibitionData, 
            visualAssociation: this.stage5DataSlots,
            repeatCount: stage6Metrics
        };

        window.dispatchEvent(new CustomEvent('thps-diagnostic-complete', { detail: window.thps_diagnosticData }));

        if (window.THPS?.Dashboard?.spawnWidget) {
            window.THPS.Dashboard.spawnWidget('thps-report-card', 'w-full mt-4');
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
        }
    }

    render() {
        this.innerHTML = `
        <style>
            .thps-diag-page { display: none; animation: thpsFadeIn 0.3s ease-in-out; }
            .thps-diag-page.thps-diag-active { display: block; }
            @keyframes thpsFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .thps-diag-scroll::-webkit-scrollbar { width: 8px; }
            .thps-diag-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
            .thps-diag-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            .thps-diag-range { -webkit-appearance: none; width: 100%; background: transparent; }
            .thps-diag-range::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #4f46e5; cursor: pointer; margin-top: -8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .thps-diag-range::-webkit-slider-runnable-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        </style>
        
        <div class="flex flex-row w-full h-[700px] min-h-[700px] overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-slate-50 font-['Inter',sans-serif]">
            <aside class="w-20 md:w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-xl z-20 flex-shrink-0 thps-diag-scroll overflow-y-auto">
                <nav class="flex-1 py-4 flex flex-col gap-1 px-2" data-ref="nav-menu"></nav>
            </aside>

            <main class="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
                <header class="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 class="text-xl font-semibold text-slate-700" data-ref="header-title">Client Details</h2>
                    <div class="text-sm font-medium text-slate-400">Step <span data-ref="current-step">1</span> of 13</div>
                </header>

                <div class="flex-1 overflow-y-auto p-4 md:p-8 relative thps-diag-scroll" data-ref="form-container">
                    
                    <!-- PAGE 1 -->
                    <section data-ref="page-1" class="thps-diag-page thps-diag-active max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-6 text-slate-800">1. Client Information</h3>
                        <div class="space-y-5">
                            <div><label class="block text-sm font-semibold text-slate-700 mb-1">Client Name</label><input type="text" data-ref="clientName" class="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Enter client's full name"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 mb-1">Date</label><input type="date" data-ref="assessmentDate" class="w-full border border-slate-300 rounded-lg p-3 outline-none"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 mb-1">Goals & Challenges (Max 250 characters)</label><textarea data-ref="goalsChallenges" maxlength="250" rows="4" class="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Record objects and hurdles..."></textarea></div>
                        </div>
                    </section>

                    <!-- PAGE 2: TEST 1 SAMS -->
                    <section data-ref="page-2" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <div class="space-y-4"> 
                            
                            <!-- Question 1 -->
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center gap-4">
                                <label class="font-semibold text-slate-700 flex-1">1. How much discomfort before a big presentation?</label>
                                <div class="flex items-center gap-3 shrink-0">
                                    <div class="flex flex-col gap-1">
                                        <button data-action="incrementSams" data-target="q1" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-up text-xs pointer-events-none"></i></button>
                                        <button data-action="decrementSams" data-target="q1" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-down text-xs pointer-events-none"></i></button>
                                    </div>
                                    <span class="text-2xl font-black text-indigo-600 w-8 text-center" data-ref="val-q1">5</span>
                                </div>
                            </div>

                            <!-- Question 2 -->
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center gap-4">
                                <label class="font-semibold text-slate-700 flex-1">2. How much discomfort at start of presentation?</label>
                                <div class="flex items-center gap-3 shrink-0">
                                    <div class="flex flex-col gap-1">
                                        <button data-action="incrementSams" data-target="q2" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-up text-xs pointer-events-none"></i></button>
                                        <button data-action="decrementSams" data-target="q2" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-down text-xs pointer-events-none"></i></button>
                                    </div>
                                    <span class="text-2xl font-black text-indigo-600 w-8 text-center" data-ref="val-q2">5</span>
                                </div>
                            </div>

                            <!-- Question 3 -->
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center gap-4">
                                <label class="font-semibold text-slate-700 flex-1">3. How much discomfort communicating bad feedback?</label>
                                <div class="flex items-center gap-3 shrink-0">
                                    <div class="flex flex-col gap-1">
                                        <button data-action="incrementSams" data-target="q3" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-up text-xs pointer-events-none"></i></button>
                                        <button data-action="decrementSams" data-target="q3" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-down text-xs pointer-events-none"></i></button>
                                    </div>
                                    <span class="text-2xl font-black text-indigo-600 w-8 text-center" data-ref="val-q3">5</span>
                                </div>
                            </div>

                            <!-- Question 4 -->
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center gap-4">
                                <label class="font-semibold text-slate-700 flex-1">4. How much discomfort receiving bad feedback?</label>
                                <div class="flex items-center gap-3 shrink-0">
                                    <div class="flex flex-col gap-1">
                                        <button data-action="incrementSams" data-target="q4" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-up text-xs pointer-events-none"></i></button>
                                        <button data-action="decrementSams" data-target="q4" class="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded p-1.5 flex items-center justify-center transition-colors"><i class="fas fa-chevron-down text-xs pointer-events-none"></i></button>
                                    </div>
                                    <span class="text-2xl font-black text-indigo-600 w-8 text-center" data-ref="val-q4">5</span>
                                </div>
                            </div>

                            <!-- Dynamic Explanation Footer -->
                            <div class="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-lg min-h-[90px] flex items-center">
                                <p data-ref="sams-explanation" class="text-indigo-900 text-sm font-medium leading-relaxed italic">Adjust a score above to see its meaning.</p>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 3 -->
                    <section data-ref="page-3" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 2: Phantasia Mind Eye</h3>
                        <div class="bg-slate-100 p-6 rounded-xl mb-8 flex flex-col items-center">
                            <button data-action="toggleTTS" data-ref="tts-btn" class="mb-4 px-6 py-3 rounded-full font-bold text-white bg-indigo-600 flex items-center justify-center w-full max-w-xs"><i class="fas fa-play mr-2 pointer-events-none" data-ref="tts-icon"></i><span data-ref="tts-label">Play Audio Script</span></button>
                            <div data-ref="phantasia-script" class="thps-diag-scroll w-full h-48 overflow-y-auto bg-white rounded p-4 text-slate-700 text-sm leading-relaxed">
                                <p>This test goes for about 4 minutes. This is a Phantasia Test. Phantasia means ‘to make visable images in your mind’. The Phantasia test is about whether seeing images in your mind is easy or hard for you. Speakers that struggle to see images in their mind are likely to struggle to speak easily without a script. However, speakers that are very good at creating images in their head may struggle to speak slowly or stay on topic. Imagining images effortlessly and involuntarily is called Hyper-phantasia. Struggling to see images in your mind is called Hypo-phantasia. Being unable to see images in your mind at all is called Aphantasia, and is perfectly normal. Everyone is somewhere from Aphantasia (unable to see images in their mind) to Hyper-phantasia (involuntarily sees lots of images in their mind). In this test, I need you to keep your eyes open, and try to see everything that is described. Let’s begin the Phantasia Test. All I want you to see in your mind is the colour black. 
                                Like a room with no light in it at all. Your mind is entirely black. Now, see an apple. It's a normal Apple, about the size of your fist, in the middle of that black screen. The Apple is Red. Growing from that Red Apple, is a short brown wooden stem. The brown wooden stem is about half the size of your smallest finger. Growing from that brown stem on top of the red apple, is a small green leaf. The green leaf starts small, about the size of your finger nail. 
                                Then, the green leaf grows bigger, until it is about the size of your longest finger. See Red Apple, with brown wooden stem, with green leaf. Now, remove the Red Apple, but keep the brown wooden stem, and keep the green leaf. Only the brown stem and green leaf remain. 
                                Now, replace the ordinary red apple with a diamond. The wooden stem and the green leaf are now growing from that diamond. Make the diamond the colour Red and about the size of your fist. Now, imagine cutting the red diamond into the shape of an apple. Notice the surface of the red diamond, how it is shiny, almost transparent, and now crafted into the shape of an apple. You now have a red apple-shaped diamond, with wooden stem and green leaf. Now, imagine rotating that entire object (apple-diamond, stem and leaf) together as slowly as you can. Control the spin, as slowly as you can. Notice how the surface of the red apple-diamond gives off light as it rotates slowly - like a disco-ball. And stop. Your answers to these 2 questions will determine if you are Aphantasia (cannot see images), Hypo-phantasia (struggle to see images), Phantasia (easily see images), Hyper-phantasia (effortlessly and involuntarily see images). Question one: was it difficult to see everything I described? If you saw absolutely nothing at all, then you have Aphantasia. Aphantasia is the inability to generate images in your head. If trying to see the objects in your head was a challenge or a strain, then you have Hypo-phantasia. Hypo-phantasia is a difficulty or delay with image generation in your head.  Question two: did you see more than what was described without trying to see more? If seeing everything that was described was almost effortless, then you have Phantasia. Phantasia or near-effortless and compliant image generation is what about 60% of the population has. However, if seeing what was described was effortless, and you saw more than what was described without trying, then you have Hyper-phantasia. Hyperphantasia is characterised by effortless and involuntary image generation. For example, you may not have been able to stop yourself from seeing a worm come out of the apple - or an orchard of apple trees. Select which of the 4 options best described your experience and move on to the next activity. If you didn’t understand the test, try it again.</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Aphantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Aphantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Hypophantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Hypophantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Phantasia" checked class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Phantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Hyperphantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Hyperphantasia</span></label>
                        </div>
                    </section>

                    <!-- PAGE 4: OVERHAULED INLINE PROMPTER APP -->
                    <section data-ref="page-4" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-6 text-slate-800">Test 3: Progressive Intensity</h3>
                        
                        <!-- PHASE 1: TUTORIAL CAROUSEL -->
                        <div id="t3-tutorial-container" class="relative w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden flex flex-col justify-between p-6 shadow-inner">
                            <div id="t3-slide-content" class="flex-1 text-white text-center flex flex-col justify-center items-center">
                                <!-- JS Dynamic Injection -->
                            </div>
                            <div class="flex justify-between items-center mt-4">
                                <button data-action="t3PrevSlide" class="text-white hover:text-indigo-400 font-bold px-4 py-2">&lt; Prev</button>
                                <span id="t3-slide-indicator" class="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full"></span>
                                <button data-action="t3NextSlide" class="text-white hover:text-indigo-400 font-bold px-4 py-2">Next &gt;</button>
                            </div>
                            <button data-action="t3StartPrompter" class="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full shadow-md transition-colors active:scale-95">Skip to Test</button>
                        </div>

                        <!-- PHASE 2: AL PACINO GLIDING PROMPTER -->
                        <div id="t3-prompter-container" class="hidden relative w-full h-[550px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-inner">
                            
                            <div class="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-20">
                                <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2">Voice Choice: Intensity</span>
                            </div>

                            <div class="flex-1 relative flex flex-col min-h-0">
                                <div id="t3-scroll-viewport" class="flex-1 overflow-hidden scroll-smooth relative px-4 md:px-12 py-10 custom-scrollbar">
                                    <!-- JS Dynamic Injection -->
                                </div>
                                <div class="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10"></div>
                                <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10"></div>
                            </div>

                            <div class="bg-white border-t border-slate-200 p-4 shrink-0 z-20 flex flex-col">
                                <div class="flex justify-between items-center max-w-2xl mx-auto w-full mb-3">
                                    
                                    <button data-action="t3GlideUp" class="thps-t3-up w-12 h-12 rounded-full bg-white border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors active:scale-90 shadow-sm flex items-center justify-center disabled:opacity-30" disabled>
                                        <i class="fas fa-chevron-up text-lg pointer-events-none"></i>
                                    </button>
                                    
                                    <div class="flex flex-col items-center">
                                        <div id="t3-timer-display" class="text-3xl font-mono font-black text-slate-800 tracking-wider mb-2">00:00</div>
                                        <button id="t3-record-btn" data-action="toggleT3Record" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95 flex items-center gap-2">
                                            <i class="fas fa-mic mr-1 pointer-events-none" id="t3-record-icon"></i> <span id="t3-record-text">Start Performance</span>
                                        </button>
                                    </div>

                                    <button data-action="t3GlideDown" class="thps-t3-down w-12 h-12 rounded-full bg-white border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors active:scale-90 shadow-sm flex items-center justify-center disabled:opacity-30">
                                        <i class="fas fa-chevron-down text-lg pointer-events-none"></i>
                                    </button>

                                </div>
                            </div>
                        </div>

                    </section>

                    <!-- PAGE 5: VISUAL PT 1 -->
                    <section data-ref="page-5" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
                        <!-- Image Container -->
                        <div class="w-full flex-1 min-h-[250px] bg-slate-200 rounded-xl overflow-hidden shadow-inner mb-6 relative">
                            <img src="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_1.png" class="w-full h-full object-cover">
                        </div>

                        <!-- Goal Text & Live Pills -->
                        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
                            <p class="text-sm font-semibold text-slate-700 flex-1 leading-relaxed">
                                <b class="text-indigo-600">Goal:</b> Visually describe the house slowly for 60 sec (under 100 WPM, over 50% visual words).
                            </p>
                            <div class="flex items-center gap-3 shrink-0">
                                <div class="px-4 py-2 bg-indigo-100 text-indigo-700 font-black rounded-full text-xs tracking-wider shadow-sm" id="s5-wpm-A">0 WPM</div>
                                <div class="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-full text-xs tracking-wider shadow-sm" id="s5-vis-A">0% VIS</div>
                            </div>
                        </div>

                        <!-- Sleek Arcade Timer Bar (With Markers) -->
                        <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800">
                            <div id="s5-progress-A" class="absolute top-0 bottom-0 left-0 bg-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                            
                            <div class="absolute top-0 bottom-0 w-[2px] bg-rose-500/60 z-10" style="left: 25%;"></div>
                            <div class="absolute top-0 bottom-0 w-[2px] bg-rose-500/60 z-10" style="left: 75%;"></div>
                            
                            <button data-action="toggleVisualRecord" data-slot="A" id="s5-btn-A" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                                <i data-lucide="mic" id="s5-icon-A" class="w-5 h-5 pointer-events-none transition-transform"></i>
                            </button>
                        </div>
                    </section>

                    <!-- PAGE 6: VISUAL PT 2 -->
                    <section data-ref="page-6" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
                        <!-- Blank Prompt Card -->
                        <div class="w-full flex-1 min-h-[250px] bg-slate-300 rounded-xl overflow-hidden shadow-inner mb-6 flex items-center justify-center">
                            <span class="text-slate-500 font-black text-xl md:text-2xl tracking-widest uppercase">Memory Prompt Card</span>
                        </div>

                        <!-- Goal Text & Live Pills -->
                        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
                            <p class="text-sm font-semibold text-slate-700 flex-1 leading-relaxed">
                                <b class="text-amber-600">Goal:</b> Visually describe building an imaginary house for 60 sec (over 170 WPM, over 50% visual words).
                            </p>
                            <div class="flex items-center gap-3 shrink-0">
                                <div class="px-4 py-2 bg-indigo-100 text-indigo-700 font-black rounded-full text-xs tracking-wider shadow-sm" id="s5-wpm-B">0 WPM</div>
                                <div class="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-full text-xs tracking-wider shadow-sm" id="s5-vis-B">0% VIS</div>
                            </div>
                        </div>

                        <!-- Sleek Arcade Timer Bar (With Markers) -->
                        <div class="w-full max-w-lg mx-auto relative h-[68px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center shrink-0 border border-slate-800">
                            <div id="s5-progress-B" class="absolute top-0 bottom-0 left-0 bg-rose-600 w-0 transition-all duration-[50ms] ease-linear"></div>
                            
                            <div class="absolute top-0 bottom-0 w-[2px] bg-rose-500/60 z-10" style="left: 25%;"></div>
                            <div class="absolute top-0 bottom-0 w-[2px] bg-rose-500/60 z-10" style="left: 75%;"></div>
                            
                            <button data-action="toggleVisualRecord" data-slot="B" id="s5-btn-B" class="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all active:scale-90 shadow-md">
                                <i data-lucide="mic" id="s5-icon-B" class="w-5 h-5 pointer-events-none transition-transform"></i>
                            </button>
                        </div>
                    </section>

                    <div data-ref="test5-pages-container"></div>

                    <!-- PAGE 13 -->
                    <section data-ref="page-13" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-lg border border-slate-200 text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4"><i class="fas fa-flag-checkered text-3xl"></i></div>
                        <h3 class="text-3xl font-bold text-slate-800">Diagnostic Stages Complete</h3>
                        <p class="text-slate-500 mt-2 mb-6">Compile dataset vectors and construct the 2x A4 Print Report card widget on dashboard.</p>
                        <button data-action="compileReportCard" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition duration-300">Generate PDF Report Card</button>
                    </section>
                </div>

                <footer class="bg-white border-t border-slate-200 p-4 flex justify-between z-10">
                    <button data-action="prevPage" data-ref="btn-prev" class="px-6 py-2 bg-slate-100 rounded-lg font-semibold text-slate-600 disabled:opacity-50">Previous</button>
                    <button data-action="nextPage" data-ref="btn-next" class="px-6 py-2 bg-indigo-600 rounded-lg font-semibold text-white">Next</button>
                </footer>
            </main>
        </div>
        `;
    }
}
customElements.define('thps-diagnostic', THPSDiagnostic);

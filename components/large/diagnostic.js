class THPSDiagnostic extends HTMLElement {
    constructor() {
        super();
        this.TOTAL_PAGES = 13;
        this.currentPage = 1;
        this.activeTimers = {};
        this.isPlayingTTS = false;
        this.ttsUtterance = null;
        
        // Track unique metrics across 5 distinct Vercel pipeline audio passes
        this.stage4AudioSlots = {
            1: { recorded: false, wpm: 0, sps: 0, pause: 0, text: "" },
            2: { recorded: false, wpm: 0, sps: 0, pause: 0, text: "" },
            3: { recorded: false, wpm: 0, sps: 0, pause: 0, text: "" },
            4: { recorded: false, wpm: 0, sps: 0, pause: 0, text: "" },
            5: { recorded: false, wpm: 0, sps: 0, pause: 0, text: "" }
        };
        this.currentRecordingLevel = null;

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
            { pageId: 7, title: "Test 5: Word (underlined)", name: "Underline", questions: [
                "1. Would you invest in a <u>bakery</u>?", "2. Would you <u>invest</u> in a theme park?", "3. Would you rather <u>coffee or tea</u>?", "4. Would you rather have <u>a home</u> by the beach or in the mountains?", "5. What's your <u>dream job</u> if money didn't matter?"
            ]},
            { pageId: 8, title: "Test 5: Word (no underline)", name: "No Underline", questions: [
                "1. What does the ideal Sunday look like?", "2. Would you invest in a board game?", "3. Would you invest in a fashion store?", "4. What's better: summer or winter?", "5. Would you rather lose a phone or wallet?"
            ]},
            { pageId: 9, title: "Test 5: Question", name: "Question", questions: [
                "1. What does the ideal birthday look like?", "2. What's the best way to spend a rainy day?", "3. Would you invest in a jazz club?", "4. Would you invest in a rooftop bar?", "5. What's better: skydiving or scuba diving?"
            ]},
            { pageId: 10, title: "Test 5: Statement", name: "Statement", questions: [
                "1. Would you rather live on a boat or bus?", "2. What's your go-to comfort food?", "3. What's your dream festival or event?", "4. Would you invest in a yoga studio?", "5. Would you invest in an indie movie?"
            ]},
            { pageId: 11, title: "Test 5: Clarify in 2 (Small Big)", name: "Small Big", questions: [
                "1. What's your ideal daily routine?", "2. What makes a perfect morning?", "3. Would you invest in a chocolate factory?", "4. Could you live without the internet?", "5. What's better: unlimited travel or time?"
            ]},
            { pageId: 12, title: "Test 5: Clarify in 2 (opposites)", name: "Opposites", questions: [
                "1. Would you invest in a local newspaper?", "2. What's better: famous or anonymous?", "3. Would you invest in a casino?", "4. Would you invest in a cooking school?", "5. What's better: early or fashionably late?"
            ]}
        ];
    }

    connectedCallback() {
        this.render();
        this.initApp();
        this.attachListeners();
    }

    disconnectedCallback() {
        if (this.isPlayingTTS || (window.speechSynthesis && window.speechSynthesis.speaking)) {
            window.speechSynthesis.cancel();
        }
        Object.values(this.activeTimers).forEach(t => clearInterval(t.interval));
    }

    initApp() {
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
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" data-ref="${qId}_correct" class="t5-cb w-4 h-4 text-indigo-600 rounded">
                                <span class="text-sm text-slate-600">Correct</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" data-ref="${qId}_nodelay" class="t5-cb w-4 h-4 text-indigo-600 rounded">
                                <span class="text-sm text-slate-600">No Delay</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" data-ref="${qId}_voice" class="t5-cb w-4 h-4 text-indigo-600 rounded">
                                <span class="text-sm text-slate-600">Voice Added</span>
                            </label>
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
            if (action === 'toggleAcc') this.toggleAcc(btn.getAttribute('data-target'), btn.getAttribute('data-icon'));
            if (action === 'startTimer') this.startTimer(btn.getAttribute('data-timer'), 60);
            if (action === 'resetTimer') this.resetTimer(btn.getAttribute('data-timer'), 60);
            if (action === 'toggleTTS') this.toggleTTS();
            
            // Custom Pipeline Listeners
            if (action === 'toggleLevelRecord') this.toggleLevelRecord(parseInt(btn.getAttribute('data-level')));
            if (action === 'toggleVisualRecord') this.toggleVisualRecord(btn.getAttribute('data-slot'));
            if (action === 'compileReportCard') this.compileReportCard();
        });

        // Track global engine execution returns
        window.addEventListener('thps-dashboard-update', (e) => {
            const payload = e.detail;
            if (!payload || !payload.text) return;

            // Catch and route execution frames for Vocal Inhibition (Stage 4)
            if (this.currentRecordingLevel !== null) {
                const lvl = this.currentRecordingLevel;
                this.stage4AudioSlots[lvl] = {
                    recorded: true,
                    wpm: payload.wpm || 0,
                    sps: payload.sps || 0,
                    pause: payload.pause || 0,
                    text: payload.text
                };
                
                const statusEl = this.querySelector(`[data-ref="s4-status-${lvl}"]`);
                if (statusEl) {
                    statusEl.innerHTML = `<span class="text-emerald-600 font-bold">✓ Processed</span> — Pace: ${payload.wpm} WPM | Mumble: ${payload.sps.toFixed(1)} SPS`;
                }
                this.currentRecordingLevel = null;
            }

            // Catch and route execution frames for Visual Association targets (Stage 5)
            if (this.currentStage5Slot !== null) {
                const slot = this.currentStage5Slot;
                this.stage5DataSlots[slot] = {
                    recorded: true,
                    wpm: payload.wpm || 0,
                    visual: payload.visual || 0
                };

                const displayEl = this.querySelector(`[data-ref="s5-status-${slot}"]`);
                if (displayEl) {
                    displayEl.innerHTML = `<span class="text-emerald-600 font-bold">✓ Captured</span> — Pace: ${payload.wpm} WPM | Visual Content: ${payload.visual}%`;
                }
                this.currentStage5Slot = null;
            }
        });

        this.addEventListener('input', (e) => {
            const ref = e.target.getAttribute('data-ref');
            if (ref && ref.startsWith('t1-q')) {
                const num = ref.split('-q')[1];
                const valEl = this.querySelector(`[data-ref="val-q${num}"]`);
                if (valEl) valEl.innerText = e.target.value;
            }
        });
    }

    toggleLevelRecord(level) {
        const btn = this.querySelector(`[data-ref="s4-btn-${level}"]`);
        if (!window.isActive) {
            this.currentRecordingLevel = level;
            window.toggleRecording();
            if(btn) btn.innerHTML = `<i class="fas fa-stop mr-1"></i> Stop Level ${level}`;
            btn.classList.replace('bg-indigo-600', 'bg-red-500');
        } else {
            window.toggleRecording();
            if(btn) btn.innerHTML = `<i class="fas fa-mic mr-1"></i> Record Level ${level}`;
            btn.classList.replace('bg-red-500', 'bg-indigo-600');
        }
    }

    toggleVisualRecord(slot) {
        const btn = this.querySelector(`[data-ref="s5-btn-${slot}"]`);
        if (!window.isActive) {
            this.currentStage5Slot = slot;
            window.toggleRecording();
            if(btn) btn.innerHTML = `<i class="fas fa-stop mr-1"></i> Stop Recording`;
            btn.classList.replace('bg-indigo-600', 'bg-red-500');
        } else {
            window.toggleRecording();
            if(btn) btn.innerHTML = `<i class="fas fa-mic mr-1"></i> Start Recording`;
            btn.classList.replace('bg-red-500', 'bg-indigo-600');
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
            nextBtn.innerHTML = `Next <i class="fas fa-arrow-right ml-2"></i>`;
        }
    }

    toggleAcc(id, iconId) {
        const el = this.querySelector(`[data-ref="${id}"]`);
        const icon = this.querySelector(`[data-ref="${iconId}"]`);
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
            icon.classList.add('rotate-90');
        } else {
            el.classList.add('hidden');
            icon.classList.remove('rotate-90');
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
                if (time <= 0) {
                    clearInterval(this.activeTimers[id].interval);
                }
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
            this.querySelector('[data-ref="tts-icon"]').className = 'fas fa-play mr-2';
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
        this.querySelector('[data-ref="tts-icon"]').className = 'fas fa-stop mr-2';
        this.querySelector('[data-ref="tts-label"]').innerText = 'Stop Audio';
    }

    compileReportCard() {
        const clientName = this.querySelector('[data-ref="clientName"]').value || 'Unspecified';
        const date = this.querySelector('[data-ref="assessmentDate"]').value || new Date().toLocaleDateString();
        const goals = this.querySelector('[data-ref="goalsChallenges"]').value || 'None recorded.';

        const t1q1 = parseInt(this.querySelector('[data-ref="t1-q1"]').value);
        const t1q2 = parseInt(this.querySelector('[data-ref="t1-q2"]').value);
        const t1q3 = parseInt(this.querySelector('[data-ref="t1-q3"]').value);
        const t1q4 = parseInt(this.querySelector('[data-ref="t1-q4"]').value);
        const totalNervesScore = t1q1 + t1q2 + t1q3 + t1q4;

        const phantasiaSelection = this.querySelector('input[name="vviq"]:checked')?.value || 'Phantasia';

        // Aggregate round metrics for Stage 6 Repeat Counts
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

        // Assemble unified object state frame
        window.thps_diagnosticData = {
            client: { name: clientName, date: date, goals: goals },
            nervesScore: totalNervesScore,
            phantasia: phantasiaSelection,
            vocalInhibition: this.stage4AudioSlots,
            visualAssociation: this.stage5DataSlots,
            repeatCount: stage6Metrics
        };

        // Command global builder shell loop to fire printing node instance
        if (window.THPS?.Dashboard?.spawnWidget) {
            window.THPS.Dashboard.spawnWidget('thps-report-card', 'w-full mt-4');
            // Auto scroll main canvas wrapper node structure to view panel instance
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
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Client Name</label>
                                <input type="text" data-ref="clientName" class="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Enter client's full name">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                                <input type="date" data-ref="assessmentDate" class="w-full border border-slate-300 rounded-lg p-3 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Goals & Challenges (Max 250 characters)</label>
                                <textarea data-ref="goalsChallenges" maxlength="250" rows="4" class="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Record objects and hurdles..."></textarea>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 2 -->
                    <section data-ref="page-2" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 1: SAMS Nerve Score</h3>
                        <div class="space-y-8">
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4"><label class="font-semibold text-slate-700">1. Preparation Discomfort</label><span class="text-xl font-bold text-indigo-600 w-8" data-ref="val-q1">5</span></div>
                                <input type="range" data-ref="t1-q1" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4"><label class="font-semibold text-slate-700">2. Presentation Discomfort</label><span class="text-xl font-bold text-indigo-600 w-8" data-ref="val-q2">5</span></div>
                                <input type="range" data-ref="t1-q2" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4"><label class="font-semibold text-slate-700">3. Communicating Conflict</label><span class="text-xl font-bold text-indigo-600 w-8" data-ref="val-q3">5</span></div>
                                <input type="range" data-ref="t1-q3" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4"><label class="font-semibold text-slate-700">4. Receiving Conflict</label><span class="text-xl font-bold text-indigo-600 w-8" data-ref="val-q4">5</span></div>
                                <input type="range" data-ref="t1-q4" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 3 -->
                    <section data-ref="page-3" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 2: Phantasia Mind Eye</h3>
                        <div class="bg-slate-100 p-6 rounded-xl mb-8 flex flex-col items-center">
                            <button data-action="toggleTTS" data-ref="tts-btn" class="mb-4 px-6 py-3 rounded-full font-bold text-white bg-indigo-600 flex items-center justify-center w-full max-w-xs"><i class="fas fa-play mr-2" data-ref="tts-icon"></i><span data-ref="tts-label">Play Audio Script</span></button>
                            <div data-ref="phantasia-script" class="thps-diag-scroll w-full h-48 overflow-y-auto bg-white rounded p-4 text-slate-700 text-sm leading-relaxed">
                                <p>This is a Phantasia Test. Form recognizable images. See black. See Red apple, brown stem, green leaf. Replace with red apple shaped diamond. Rotate slowly like a disco-ball.</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Aphantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Aphantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Hypophantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Hypophantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Phantasia" checked class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Phantasia</span></label>
                            <label class="cursor-pointer border border-slate-200 rounded-lg p-4 flex items-center bg-white"><input type="radio" name="vviq" value="Hyperphantasia" class="w-5 h-5 text-indigo-600"><span class="ml-3 font-semibold">Hyperphantasia</span></label>
                        </div>
                    </section>

                    <!-- PAGE 4 -->
                    <section data-ref="page-4" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 3: Vocal Inhibition Auto Scoring</h3>
                        <p class="text-slate-500 mb-6">Record each level sequentially. App processes directly via Vercel pipeline logs.</p>
                        <div class="space-y-4">
                            ${[1,2,3,4,5].map(l => `
                                <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <div class="font-bold text-slate-800">Level ${l} Assessment</div>
                                        <div data-ref="s4-status-${l}" class="text-xs text-slate-400 mt-1 italic">Waiting for capture step...</div>
                                    </div>
                                    <button data-action="toggleLevelRecord" data-level="${l}" data-ref="s4-btn-${l}" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow-sm flex items-center"><i class="fas fa-mic mr-1"></i> Record Level ${l}</button>
                                </div>
                            `).join('')}
                        </div>
                    </section>

                    <!-- PAGE 5 -->
                    <section data-ref="page-5" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 4: Word Association Visual (Part A)</h3>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                            <div>
                                <img src="https://content.api.news/v3/images/bin/42df73e55c8f6009e64b1997f5d2cb75" class="w-full rounded-md shadow">
                                <div class="bg-indigo-50 border p-3 rounded mt-4 text-xs text-indigo-900 leading-relaxed"><b>Goal:</b> Speak under 100 WPM, Visual Content over 20%.</div>
                            </div>
                            <div class="flex flex-col justify-between">
                                <button data-action="toggleVisualRecord" data-slot="A" data-ref="s5-btn-A" class="w-full py-4 bg-indigo-600 text-white font-black text-center rounded-xl shadow-md"><i class="fas fa-mic mr-2"></i> Start Recording</button>
                                <div data-ref="s5-status-A" class="mt-4 p-4 border rounded bg-slate-50 text-sm font-medium text-slate-600 text-center">No execution frames logged.</div>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 6 -->
                    <section data-ref="page-6" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 4: Word Association Visual (Part B)</h3>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                            <div>
                                <div class="bg-slate-300 rounded aspect-video w-full flex items-center justify-center text-slate-500 font-bold text-center">Memory Prompt Card</div>
                                <div class="bg-amber-50 border p-3 rounded mt-4 text-xs text-amber-900 leading-relaxed"><b>Goal:</b> Speak over 170 WPM, Visual Content over 20%.</div>
                            </div>
                            <div class="flex flex-col justify-between">
                                <button data-action="toggleVisualRecord" data-slot="B" data-ref="s5-btn-B" class="w-full py-4 bg-indigo-600 text-white font-black text-center rounded-xl shadow-md"><i class="fas fa-mic mr-2"></i> Start Recording</button>
                                <div data-ref="s5-status-B" class="mt-4 p-4 border rounded bg-slate-50 text-sm font-medium text-slate-600 text-center">No execution frames logged.</div>
                            </div>
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

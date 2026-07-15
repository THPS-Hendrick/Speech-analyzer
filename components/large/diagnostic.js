class THPSDiagnostic extends HTMLElement {
    constructor() {
        super();
        this.TOTAL_PAGES = 13;
        this.currentPage = 1;
        this.activeTimers = {};
        this.isPlayingTTS = false;
        this.ttsUtterance = null;
        
        this.navItems = [
            { id: 1, icon: 'fa-user', label: 'Client Details' },
            { id: 2, icon: 'fa-heartbeat', label: 'Test 1: SAMS' },
            { id: 3, icon: 'fa-eye', label: 'Test 2: VVIQ' },
            { id: 4, icon: 'fa-volume-up', label: 'Test 3: Sound Change' },
            { id: 5, icon: 'fa-image', label: 'Test 4: Visual Pt 1' },
            { id: 6, icon: 'fa-camera', label: 'Test 4: Visual Pt 2' },
            { id: 7, icon: 'fa-list-ol', label: 'Test 5: P1' },
            { id: 8, icon: 'fa-list-ol', label: 'Test 5: P2' },
            { id: 9, icon: 'fa-question', label: 'Test 5: P3' },
            { id: 10, icon: 'fa-quote-left', label: 'Test 5: P4' },
            { id: 11, icon: 'fa-compress-arrows-alt', label: 'Test 5: P5' },
            { id: 12, icon: 'fa-exchange-alt', label: 'Test 5: P6' },
            { id: 13, icon: 'fa-flag-checkered', label: 'Results' }
        ];

        this.test5Data = [
            { pageId: 7, title: "Test 5: Word (underlined)", questions: [
                "1. Would you invest in a <u>bakery</u>?", "2. Would you <u>invest</u> in a theme park?", "3. Would you rather <u>coffee or tea</u>?", "4. Would you rather have <u>a home</u> by the beach or in the mountains?", "5. What's your <u>dream job</u> if money didn't matter?"
            ]},
            { pageId: 8, title: "Test 5: Word (no underline)", questions: [
                "1. What does the ideal Sunday look like?", "2. Would you invest in a board game?", "3. Would you invest in a fashion store?", "4. What's better: summer or winter?", "5. Would you rather lose a phone or wallet?"
            ]},
            { pageId: 9, title: "Test 5: Question", questions: [
                "1. What does the ideal birthday look like?", "2. What's the best way to spend a rainy day?", "3. Would you invest in a jazz club?", "4. Would you invest in a rooftop bar?", "5. What's better: skydiving or scuba diving?"
            ]},
            { pageId: 10, title: "Test 5: Statement", questions: [
                "1. Would you rather live on a boat or bus?", "2. What's your go-to comfort food?", "3. What's your dream festival or event?", "4. Would you invest in a yoga studio?", "5. Would you invest in an indie movie?"
            ]},
            { pageId: 11, title: "Test 5: Clarify in 2 (Small Big)", questions: [
                "1. What's your ideal daily routine?", "2. What makes a perfect morning?", "3. Would you invest in a chocolate factory?", "4. Could you live without the internet?", "5. What's better: unlimited travel or time?"
            ]},
            { pageId: 12, title: "Test 5: Clarify in 2 (opposites)", questions: [
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
        
        // Ensure browser preloads available voices
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
        }
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
            if (action === 'copyResults') this.copyResults();
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
            oldNav.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
            oldNav.classList.add('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            const icon = oldNav.querySelector('i');
            if (icon) icon.classList.replace('text-white', 'text-slate-500');
        }

        this.currentPage = pageNum;

        const newPage = this.querySelector(`[data-ref="page-${this.currentPage}"]`);
        if (newPage) newPage.classList.add('thps-diag-active');
        
        const newNav = this.querySelector(`[data-ref="nav-item-${this.currentPage}"]`);
        if(newNav) {
            newNav.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
            newNav.classList.remove('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            const icon = newNav.querySelector('i');
            if (icon) icon.classList.replace('text-slate-500', 'text-white');
        }

        const container = this.querySelector('[data-ref="form-container"]');
        if (container) container.scrollTop = 0;

        if(this.currentPage === this.TOTAL_PAGES) this.generateResults();
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
        if (!el || !icon) return;
        
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
        if (!display) return;
        
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
                    this.showToast("Time's up!");
                }
            }, 1000)
        };
    }

    resetTimer(id, duration) {
        if (this.activeTimers[id]) clearInterval(this.activeTimers[id].interval);
        const display = this.querySelector(`[data-ref="${id}-display"]`);
        if (display) {
            display.innerText = this.formatTime(duration);
            display.classList.remove('text-emerald-400', 'text-red-500');
        }
    }

    showToast(msg) {
        const toast = this.querySelector('[data-ref="toast"]');
        const toastMsg = this.querySelector('[data-ref="toast-msg"]');
        if (!toast || !toastMsg) return;
        
        toastMsg.innerText = msg;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    resetTTSButton() {
        this.isPlayingTTS = false;
        const btn = this.querySelector('[data-ref="tts-btn"]');
        const icon = this.querySelector('[data-ref="tts-icon"]');
        const label = this.querySelector('[data-ref="tts-label"]');
        if (!btn || !icon || !label) return;
        
        btn.classList.replace('bg-red-500', 'bg-indigo-600');
        btn.classList.replace('hover:bg-red-600', 'hover:bg-indigo-700');
        icon.className = 'fas fa-play mr-2';
        label.innerText = 'Play Audio Script';
    }

    toggleTTS() {
        const scriptEl = this.querySelector('[data-ref="phantasia-script"]');
        const btn = this.querySelector('[data-ref="tts-btn"]');
        const icon = this.querySelector('[data-ref="tts-icon"]');
        const label = this.querySelector('[data-ref="tts-label"]');
        
        if (!scriptEl || !btn || !icon || !label) return;
        
        const textToRead = scriptEl.innerText;

        if (this.isPlayingTTS || window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.resetTTSButton();
            return;
        }

        this.ttsUtterance = new SpeechSynthesisUtterance(textToRead);
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Siri'));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en-'));
        if (selectedVoice) this.ttsUtterance.voice = selectedVoice;

        this.ttsUtterance.rate = 0.85; 
        this.ttsUtterance.pitch = 1.0;
        this.ttsUtterance.onend = () => this.resetTTSButton();

        window.speechSynthesis.speak(this.ttsUtterance);
        this.isPlayingTTS = true;
        
        btn.classList.replace('bg-indigo-600', 'bg-red-500');
        btn.classList.replace('hover:bg-indigo-700', 'hover:bg-red-600');
        icon.className = 'fas fa-stop mr-2';
        label.innerText = 'Stop Audio';
    }

    generateResults() {
        const clientName = this.querySelector('[data-ref="clientName"]').value || 'Unspecified';
        const date = this.querySelector('[data-ref="assessmentDate"]').value || new Date().toLocaleDateString();
        const goals = this.querySelector('[data-ref="goalsChallenges"]').value || 'None recorded.';

        const t1q1 = this.querySelector('[data-ref="t1-q1"]').value;
        const t1q2 = this.querySelector('[data-ref="t1-q2"]').value;
        const t1q3 = this.querySelector('[data-ref="t1-q3"]').value;
        const t1q4 = this.querySelector('[data-ref="t1-q4"]').value;

        const vviqChecked = this.querySelector('input[name="vviq"]:checked');
        const vviq = vviqChecked ? vviqChecked.value : 'Unspecified';

        const t3_scores = [];
        for(let i=1; i<=5; i++) {
            const cb = this.querySelector(`[data-ref="sc_check_${i}"]`);
            if(cb && cb.checked) t3_scores.push(`Level ${i} (${['Very Serious','Serious','Normal','Animated','Very Animated'][i-1]})`);
        }
        const t3_result = t3_scores.length > 0 ? t3_scores.join(', ') : 'None passed.';

        const t4p1 = this.querySelector('[data-ref="t4_p1_notes"]').value || 'No notes.';
        const t4p2 = this.querySelector('[data-ref="t4_p2_notes"]').value || 'No notes.';

        let t5Markdown = "";
        this.test5Data.forEach(block => {
            t5Markdown += `### ${block.title}\n`;
            block.questions.forEach((q, idx) => {
                const qId = `t5_p${block.pageId}_q${idx+1}`;
                const cbC = this.querySelector(`[data-ref="${qId}_correct"]`);
                const cbN = this.querySelector(`[data-ref="${qId}_nodelay"]`);
                const cbV = this.querySelector(`[data-ref="${qId}_voice"]`);
                
                const c = cbC && cbC.checked ? '☑ Correct ' : '☐ Correct ';
                const n = cbN && cbN.checked ? '☑ No Delay ' : '☐ No Delay ';
                const v = cbV && cbV.checked ? '☑ Voice Added' : '☐ Voice Added';
                
                t5Markdown += `- **Q:** ${q}\n  - ${c} | ${n} | ${v}\n`;
            });
            t5Markdown += `\n`;
        });

        const md = `# THPS Diagnostic Assessment Report\n**Client Name:** ${clientName}\n**Date:** ${date}\n\n## Background & Goals\n${goals}\n\n---\n\n## Test 1: Sympathetic Adrenomedullary System (1-10)\n- **Preparation Discomfort:** ${t1q1}/10\n- **Presentation Discomfort:** ${t1q2}/10\n- **Communicating Conflict to Others:** ${t1q3}/10\n- **Receiving Conflict from Others:** ${t1q4}/10\n\n---\n\n## Test 2: VVIQ Score\n**Result:** ${vviq}\n\n---\n\n## Test 3: Sound Change Ranges Passed\n**Result:** ${t3_result}\n\n---\n\n## Test 4: Word Association Visual Capacity\n### Part 1 (Under 120 WPM, Visual > 50%)\n${t4p1}\n\n### Part 2 (Over 180 WPM, Visual > 50%)\n${t4p2}\n\n---\n\n## Test 5: Word Association Categories Performance\n${t5Markdown}\n*Report generated via THPS Diagnostic App*\n`;
        const resEl = this.querySelector('[data-ref="results-markdown"]');
        if (resEl) resEl.value = md;
    }

    copyResults() {
        const txt = this.querySelector('[data-ref="results-markdown"]');
        if (!txt) return;
        txt.select();
        txt.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            this.showToast("Results copied to clipboard!");
        } catch (err) {
            this.showToast("Failed to copy. Please copy manually.");
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
            .thps-diag-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            
            .thps-diag-range { -webkit-appearance: none; width: 100%; background: transparent; }
            .thps-diag-range::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #4f46e5; cursor: pointer; margin-top: -8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .thps-diag-range::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #e2e8f0; border-radius: 4px; }
            
            .thps-toast { transition: opacity 0.3s ease-in-out; }
        </style>
        
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        
        <div class="flex flex-row w-full h-[85vh] min-h-[700px] overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-slate-50 relative font-['Inter',sans-serif]">
            
            <!-- Sidebar Navigation -->
            <aside class="w-20 md:w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-xl z-20 flex-shrink-0 transition-all duration-300 thps-diag-scroll overflow-y-auto">
                <div class="p-4 md:p-6 bg-slate-950 text-center md:text-left flex items-center justify-center md:justify-start"></div>
                <nav class="flex-1 py-4 flex flex-col gap-1 px-2" data-ref="nav-menu"></nav>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
                <header class="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 class="text-xl font-semibold text-slate-700" data-ref="header-title">Client Details</h2>
                    <div class="text-sm font-medium text-slate-400">Step <span data-ref="current-step">1</span> of 13</div>
                </header>

                <div class="flex-1 overflow-y-auto p-4 md:p-8 relative thps-diag-scroll" data-ref="form-container">
                    
                    <!-- PAGE 1: Client Details -->
                    <section data-ref="page-1" class="thps-diag-page thps-diag-active max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-6 text-slate-800">1. Client Information</h3>
                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Client Name</label>
                                <input type="text" data-ref="clientName" class="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter client's full name">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                                <input type="date" data-ref="assessmentDate" class="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-1">Goals & Challenges</label>
                                <textarea data-ref="goalsChallenges" rows="4" class="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Record the client's main objectives and hurdles here..."></textarea>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 2: Test 1 -->
                    <section data-ref="page-2" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 1</h3>
                        <p class="text-slate-500 mb-8">Sympathetic Adrenomedullary System test. Score from 1 to 10.</p>
                        <div class="space-y-8">
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4">
                                    <label class="font-semibold text-slate-700">1. Preparation Discomfort</label>
                                    <span class="text-xl font-bold text-indigo-600 w-8 text-center" data-ref="val-q1">5</span>
                                </div>
                                <input type="range" data-ref="t1-q1" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4">
                                    <label class="font-semibold text-slate-700">2. Presentation Discomfort</label>
                                    <span class="text-xl font-bold text-indigo-600 w-8 text-center" data-ref="val-q2">5</span>
                                </div>
                                <input type="range" data-ref="t1-q2" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4">
                                    <label class="font-semibold text-slate-700">3. Communicating Conflict to Others</label>
                                    <span class="text-xl font-bold text-indigo-600 w-8 text-center" data-ref="val-q3">5</span>
                                </div>
                                <input type="range" data-ref="t1-q3" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="flex justify-between items-center mb-4">
                                    <label class="font-semibold text-slate-700">4. Receiving Conflict from Others</label>
                                    <span class="text-xl font-bold text-indigo-600 w-8 text-center" data-ref="val-q4">5</span>
                                </div>
                                <input type="range" data-ref="t1-q4" min="1" max="10" value="5" class="thps-diag-range">
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 3: Test 2 (VVIQ) -->
                    <section data-ref="page-3" class="thps-diag-page max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 2: VVIQ Test</h3>
                        <p class="text-slate-500 mb-6">Play the audio script or read it aloud.</p>
                        
                        <div class="bg-slate-100 p-6 rounded-xl mb-8 border border-slate-200 flex flex-col items-center">
                            <button data-action="toggleTTS" data-ref="tts-btn" class="mb-4 px-6 py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-300 flex items-center justify-center w-full max-w-xs">
                                <i class="fas fa-play mr-2" data-ref="tts-icon"></i> <span data-ref="tts-label">Play Audio Script</span>
                            </button>
                            
                            <div data-ref="phantasia-script" class="thps-diag-scroll w-full h-64 overflow-y-auto bg-white border border-slate-300 rounded-lg p-5 text-slate-700 text-sm leading-relaxed shadow-inner">
                                <p class="mb-3">This test goes for about 4 minutes.</p>
                                <p class="mb-3">This is a Phantasia Test.<br>Phantasia means "to make visable images in your mind".<br>The Phantasia test is about whether seeing images in your mind is easy or hard for you.<br>Speakers that struggle to see images in their mind are likely to struggle to speak easily without a script.<br>However, speakers that are very good at creating images in their head may struggle to speak slowly or stay on topic.<br>Imagining images effortlessly and involuntarily is called Hyper-phantasia.<br>Struggling to see images in your mind is called Hypo-phantasia.<br>Being unable to see images in your mind at all is called Aphantasia, and is perfectly normal.<br>Everyone is somewhere from Aphantasia (unable to see images in their mind) to Hyper-phantasia (involuntarily sees lots of images in their mind).</p>
                                <p class="mb-3">In this test, I need you to keep your eyes open, and try to see everything that is described.<br>Let's begin the Phantasia Test.</p>
                                <p class="mb-3">All I want you to see in your mind is the colour black.<br>Like a room with no light in it at all. Your mind is entirely black.</p>
                                <p class="mb-3">Now, see an apple. It's a normal Apple, about the size of your fist, in the middle of that black screen.<br>The Apple is Red.<br>Growing from that Red Apple, is a short brown wooden stem.<br>The brown wooden stem is about half the size of your smallest finger.<br>Growing from that brown stem on top of the red apple, is a small green leaf.<br>The green leaf starts small, about the size of your finger nail.<br>Then, the green leaf grows bigger, until it is about the size of your longest finger.<br>See Red Apple, with brown wooden stem, with green leaf.</p>
                                <p class="mb-3">Now, remove the Red Apple, but keep the brown wooden stem, and keep the green leaf.<br>Only the brown stem and green leaf remain.<br>Now, replace the ordinary red apple with a diamond.<br>The wooden stem and the green leaf are now growing from that diamond.</p>
                                <p class="mb-3">Make the diamond the colour Red and about the size of your fist.<br>Now, imagine cutting the red diamond into the shape of an apple.<br>Notice the surface of the red diamond, how it is shiny, almost transparent, and now crafted into the shape of an apple.</p>
                                <p class="mb-3">You now have a red apple-shaped diamond, with wooden stem and green leaf.<br>Now, imagine rotating that entire object (apple-diamond, stem and leaf) together as slowly as you can. Control the spin, as slowly as you can.<br>Notice how the surface of the red apple-diamond gives off light as it rotates slowly - like a disco-ball.<br>And stop.</p>
                                <p class="mb-3">Your answers to these 2 questions will determine if you are Aphantasia (cannot see images), Hypo-phantasia (struggle to see images), Phantasia (easily see images), Hyper-phantasia (effortlessly and involuntarily see images).</p>
                                <p class="mb-3">Question one: was it difficult to see everything I described?<br>Question two: did you see more than what was described without trying to see more?</p>
                                <p class="mb-3">If you saw absolutely nothing at all, then you have Aphantasia. Aphantasia is the inability to generate images in your head.</p>
                                <p class="mb-3">If trying to see the objects in your head was a challenge or a strain, then you have Hypo-phantasia. Hypo-phantasia is a difficulty or delay with image generation in your head.</p>
                                <p class="mb-3">If seeing everything that was described was almost effortless, then you have Phantasia. Phantasia or near-effortless and compliant image generation is what about 60% of the population has.</p>
                                <p class="mb-3">However, if seeing what was described was effortless, and you saw more than what was described without trying, then you have Hyper-phantasia. Hyperphantasia is characterised by effortless and involuntary image generation. For example, you may not have been able to stop yourself from seeing a worm come out of the apple - or an orchard of apple trees.</p>
                                <p class="mb-3">Select which of the 4 options best described your experience and move on to the next activity.</p>
                                <p>If you didn't understand the test, try it again.</p>
                            </div>
                        </div>
                        <h4 class="font-semibold text-slate-700 mb-4">Select Client's Imagery Category:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label class="cursor-pointer border-2 border-slate-200 rounded-lg p-4 flex items-center hover:border-indigo-400 transition-colors bg-white">
                                <input type="radio" name="vviq" value="Aphantasia" class="w-5 h-5 text-indigo-600 border-gray-300">
                                <div class="ml-3"><span class="block font-semibold text-slate-800">Aphantasia</span><span class="block text-xs text-slate-500">No visual imagination</span></div>
                            </label>
                            <label class="cursor-pointer border-2 border-slate-200 rounded-lg p-4 flex items-center hover:border-indigo-400 transition-colors bg-white">
                                <input type="radio" name="vviq" value="Hypophantasia" class="w-5 h-5 text-indigo-600 border-gray-300">
                                <div class="ml-3"><span class="block font-semibold text-slate-800">Hypophantasia</span><span class="block text-xs text-slate-500">Weak visual imagination</span></div>
                            </label>
                            <label class="cursor-pointer border-2 border-slate-200 rounded-lg p-4 flex items-center hover:border-indigo-400 transition-colors bg-white">
                                <input type="radio" name="vviq" value="Phantasia" checked class="w-5 h-5 text-indigo-600 border-gray-300">
                                <div class="ml-3"><span class="block font-semibold text-slate-800">Phantasia</span><span class="block text-xs text-slate-500">Typical visual imagination</span></div>
                            </label>
                            <label class="cursor-pointer border-2 border-slate-200 rounded-lg p-4 flex items-center hover:border-indigo-400 transition-colors bg-white">
                                <input type="radio" name="vviq" value="Hyperphantasia" class="w-5 h-5 text-indigo-600 border-gray-300">
                                <div class="ml-3"><span class="block font-semibold text-slate-800">Hyperphantasia</span><span class="block text-xs text-slate-500">Extremely vivid imagination</span></div>
                            </label>
                        </div>
                    </section>

                    <!-- PAGE 4: Test 3 (Sound Change) -->
                    <section data-ref="page-4" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 3: Sound Change Test</h3>
                        <p class="text-slate-500 mb-6">Play audio, then have client read excerpts. Tick if performed sufficiently.</p>
                        <div class="bg-slate-100 p-4 rounded-xl mb-6 border border-slate-200 flex flex-col items-center">
                            <audio controls class="w-full max-w-md shadow-sm rounded-full">
                                <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" type="audio/mpeg">
                            </audio>
                        </div>
                        <div class="space-y-3">
                            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors" data-action="toggleAcc" data-target="acc1" data-icon="icon1">
                                    <div class="flex items-center gap-3"><i data-ref="icon1" class="fas fa-chevron-right text-slate-400 transition-transform"></i><span class="font-bold text-slate-700">1 Very Serious</span></div>
                                    <div class="flex items-center" onclick="event.stopPropagation()">
                                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm hover:bg-indigo-50">
                                            <input type="checkbox" data-ref="sc_check_1" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-medium text-slate-600">Passed</span>
                                        </label>
                                    </div>
                                </button>
                                <div data-ref="acc1" class="hidden p-5 border-t border-slate-200 text-slate-600 italic bg-white leading-relaxed">"1- You know, when you get old in life things get taken from you. I mean that's...part of life.<br><br>1- You find out life's this game of inches"</div>
                            </div>
                            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors" data-action="toggleAcc" data-target="acc2" data-icon="icon2">
                                    <div class="flex items-center gap-3"><i data-ref="icon2" class="fas fa-chevron-right text-slate-400 transition-transform"></i><span class="font-bold text-slate-700">2 Serious</span></div>
                                    <div class="flex items-center" onclick="event.stopPropagation()">
                                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm hover:bg-indigo-50">
                                            <input type="checkbox" data-ref="sc_check_2" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-medium text-slate-600">Passed</span>
                                        </label>
                                    </div>
                                </button>
                                <div data-ref="acc2" class="hidden p-5 border-t border-slate-200 text-slate-600 italic bg-white leading-relaxed">"2- So is football. Because in either game, life or football, the margin for error is so small.<br><br>2- One-half a step too late, or too early, and you don't quite make it."</div>
                            </div>
                            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors" data-action="toggleAcc" data-target="acc3" data-icon="icon3">
                                    <div class="flex items-center gap-3"><i data-ref="icon3" class="fas fa-chevron-right text-slate-400 transition-transform"></i><span class="font-bold text-slate-700">3 Normal</span></div>
                                    <div class="flex items-center" onclick="event.stopPropagation()">
                                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm hover:bg-indigo-50">
                                            <input type="checkbox" data-ref="sc_check_3" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-medium text-slate-600">Passed</span>
                                        </label>
                                    </div>
                                </button>
                                <div data-ref="acc3" class="hidden p-5 border-t border-slate-200 text-slate-600 italic bg-white leading-relaxed">"3- But the inches we need are everywhere.<br><br>3- They're in every break of the game, every minute, every second."</div>
                            </div>
                            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors" data-action="toggleAcc" data-target="acc4" data-icon="icon4">
                                    <div class="flex items-center gap-3"><i data-ref="icon4" class="fas fa-chevron-right text-slate-400 transition-transform"></i><span class="font-bold text-slate-700">4 Animated</span></div>
                                    <div class="flex items-center" onclick="event.stopPropagation()">
                                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm hover:bg-indigo-50">
                                            <input type="checkbox" data-ref="sc_check_4" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-medium text-slate-600">Passed</span>
                                        </label>
                                    </div>
                                </button>
                                <div data-ref="acc4" class="hidden p-5 border-t border-slate-200 text-slate-600 italic bg-white leading-relaxed">"4- On this team, we fight for that inch.<br><br>4- On this team, we tear ourselves and everyone else around us to pieces for that inch."</div>
                            </div>
                            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <button class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors" data-action="toggleAcc" data-target="acc5" data-icon="icon5">
                                    <div class="flex items-center gap-3"><i data-ref="icon5" class="fas fa-chevron-right text-slate-400 transition-transform"></i><span class="font-bold text-slate-700">5 Very Animated</span></div>
                                    <div class="flex items-center" onclick="event.stopPropagation()">
                                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-md border border-slate-300 shadow-sm hover:bg-indigo-50">
                                            <input type="checkbox" data-ref="sc_check_5" class="w-4 h-4 text-indigo-600 rounded"><span class="text-sm font-medium text-slate-600">Passed</span>
                                        </label>
                                    </div>
                                </button>
                                <div data-ref="acc5" class="hidden p-5 border-t border-slate-200 text-slate-600 italic bg-white leading-relaxed">"5 - We claw with our fingernails for that inch, because we know when we add up all those inches - that's gonna make the difference between winning and losing!<br><br>5 - Between livin' and dyin'!"</div>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 5: Test 4 (Visual Part 1) -->
                    <section data-ref="page-5" class="thps-diag-page max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 4: Word Association Visual (Part 1)</h3>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div>
                                <img src="https://content.api.news/v3/images/bin/42df73e55c8f6009e64b1997f5d2cb75" class="w-full rounded-md">
                                <div class="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mt-4">
                                    <h4 class="font-bold text-indigo-800 mb-2"><i class="fas fa-info-circle mr-2"></i>Instructions</h4>
                                    <p class="text-sm text-indigo-900 leading-relaxed">For 60 seconds, Say only what can literally be seen in the image (size, colour, position, objects, etc). <br><br><b>Goal:</b> Speak under 120 wpm, Visual Content over 50%</p>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <div class="bg-slate-900 rounded-lg p-6 mb-4 flex flex-col items-center justify-center text-white shadow-inner">
                                    <div class="text-5xl font-mono tracking-wider font-bold" data-ref="timer1-display">01:00</div>
                                    <div class="flex gap-3 mt-4">
                                        <button data-action="startTimer" data-timer="timer1" class="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-full font-bold transition">Start</button>
                                        <button data-action="resetTimer" data-timer="timer1" class="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-full font-bold transition">Reset</button>
                                    </div>
                                </div>
                                <div class="flex-1 flex flex-col">
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Assessor Notes (Max 1000 words)</label>
                                    <textarea data-ref="t4_p1_notes" class="flex-1 w-full border border-slate-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[200px]" placeholder="Type transcript and technical feedback here..."></textarea>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- PAGE 6: Test 4 (Visual Part 2) -->
                    <section data-ref="page-6" class="thps-diag-page max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                        <h3 class="text-2xl font-bold mb-2 text-slate-800">Test 4: Word Association Visual (Part 2)</h3>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div>
                                <div class="relative overflow-hidden rounded-lg shadow-md border border-slate-200 aspect-video mb-4">
                                    <img src="https://placehold.co/800x600/94a3b8/ffffff?text=$10+Million+House" alt="Blurry house" class="w-full h-full object-cover blur-md scale-110">
                                </div>
                                <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                    <h4 class="font-bold text-amber-800 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>Instructions</h4>
                                    <p class="text-sm text-amber-900 leading-relaxed">For 60 seconds, visually describe what a $10 million house might look like. <br><br><b>Goal:</b> Speak over 180 wpm, Visual Content over 50%</p>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <div class="bg-slate-900 rounded-lg p-6 mb-4 flex flex-col items-center justify-center text-white shadow-inner">
                                    <div class="text-5xl font-mono tracking-wider font-bold" data-ref="timer2-display">01:00</div>
                                    <div class="flex gap-3 mt-4">
                                        <button data-action="startTimer" data-timer="timer2" class="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-full font-bold transition">Start</button>
                                        <button data-action="resetTimer" data-timer="timer2" class="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-full font-bold transition">Reset</button>
                                    </div>
                                </div>
                                <div class="flex-1 flex flex-col">
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Assessor Notes (Max 1000 words)</label>
                                    <textarea data-ref="t4_p2_notes" class="flex-1 w-full border border-slate-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[200px]" placeholder="Type transcript and technical feedback here..."></textarea>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- PAGES 7 to 12 dynamically generated here -->
                    <div data-ref="test5-pages-container"></div>

                    <!-- PAGE 13: Results -->
                    <section data-ref="page-13" class="thps-diag-page max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-lg border border-slate-200">
                        <div class="text-center mb-8">
                            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                                <i class="fas fa-check-double text-3xl"></i>
                            </div>
                            <h3 class="text-3xl font-bold text-slate-800">THPS Diagnostic Finished</h3>
                            <p class="text-slate-500 mt-2">Review the markdown report below, then copy and send to the client.</p>
                        </div>
                        <div class="relative group">
                            <textarea data-ref="results-markdown" class="w-full h-96 bg-slate-900 text-emerald-400 font-mono text-sm p-6 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto thps-diag-scroll" readonly></textarea>
                            <button data-action="copyResults" class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition shadow-lg z-10">
                                <i class="fas fa-copy"></i> Copy Results
                            </button>
                        </div>
                    </section>

                </div>

                <!-- Footer Navigation -->
                <footer class="bg-white border-t border-slate-200 p-4 md:px-8 flex justify-between z-10">
                    <button data-action="prevPage" data-ref="btn-prev" class="px-6 py-2.5 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-arrow-left mr-2"></i> Previous
                    </button>
                    <button data-action="nextPage" data-ref="btn-next" class="px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                        Next <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </footer>
            </main>

            <!-- Custom Toast Notification -->
            <div data-ref="toast" class="thps-toast absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 opacity-0 pointer-events-none flex items-center gap-2 font-medium">
                <i class="fas fa-check-circle text-emerald-400"></i> <span data-ref="toast-msg">Copied to clipboard!</span>
            </div>
            
        </div>
        `;
    }
}

customElements.define('thps-diagnostic', THPSDiagnostic);

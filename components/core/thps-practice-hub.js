// ==========================================
// THPS WIDGET: MOBILE-FIRST PRACTICE HUB
// Fixed-layout training center (Stories, Accent, Q&A, Confidence)
// ==========================================

class ThpsPracticeHub extends HTMLElement {
    constructor() {
        super();
        this.currentView = 'menu'; // 'menu', 'confidence-menu', 'stories', 'accent', 'qa', 'confidence'
        this.drillState = 'prompt'; // 'prompt', 'result'
        this.activeIndex = 0; // Shared index for Images & Questions (0-9)
        
        this.vcSpeechIndex = 0;
        this.vcLineIndex = 0;
        this.latestPayload = null;

        // --- HARDCODED DATA ASSETS ---
        this.QUESTIONS = [
            "How do you find meaning in mundane, everyday tasks?",
            "When is it the right time to quietly walk away from a toxic friendship?",
            "What makes a neighborhood or group feel like a true \"community\"?",
            "Is happiness a conscious choice, a mere byproduct, or an illusion?",
            "What exact role does gratitude play in your normal daily routine?",
            "How do you find peace in the things you cannot possibly control?",
            "How do you actively keep your inner child alive as an adult?",
            "Are you trading too much of your time for money, or vice versa?",
            "What is your core personal philosophy on taking on financial debt?",
            "How do you personally define the concept of \"financial freedom\"?"
        ];

        this.IMAGES = [
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_1.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_2.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_3.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_4.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_5.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_6.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_7.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_8.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_9.png",
            "https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/courses/say-what-you-see/images/image_10.png"
        ];

        this.SPEECHES = [
            {
                "title": "Al Pacino - Any Given Sunday",
                "description": "Move through the 1 to 5 Sound Change Range",
                "lines": [
                    { "intensity": 1, "text": "You know, when you get old in life things get taken from you. I mean that's...part of life." },
                    { "intensity": 1, "text": "You find out life's this game of inches" },
                    { "intensity": 2, "text": "So is football. Because in either game, life or football, the margin for error is so small." },
                    { "intensity": 2, "text": "One-half a step too late, or too early, and you don't quite make it." },
                    { "intensity": 3, "text": "But the inches we need are everywhere." },
                    { "intensity": 3, "text": "They're in every break of the game, every minute, every second." },
                    { "intensity": 4, "text": "On this team, we fight for that inch." },
                    { "intensity": 4, "text": "On this team, we tear ourselves and everyone else around us to pieces for that inch." },
                    { "intensity": 5, "text": "We claw with our fingernails for that inch, because we know when we add up all those inches that's gonna make the difference between winning and losing!" },
                    { "intensity": 5, "text": "Between livin' and dyin'!" }
                ]
            },
            {
                "title": "Milla Jovovich - Joan of Arc",
                "description": "Spending Time with 5s and 0s (explode then recover)",
                "lines": [
                    { "intensity": 5, "text": "I have a message for your King Henry." },
                    { "intensity": 5, "text": "It is a message from God." },
                    { "intensity": 5, "text": "Go home." },
                    { "intensity": 5, "text": "Go now, in peace." },
                    { "intensity": 5, "text": "If you do not go now, you will be buried in this field." },
                    { "intensity": 5, "text": "I have seen enough blood. But if you want more, I can't stop you." },
                    { "intensity": 5, "text": "I can only warn you, that it will be your blood, not ours." },
                    { "intensity": 5, "text": "I am waiting for your answer." }
                ]
            },
            {
                "title": "Liam Neeson - Taken",
                "description": "Endure delivering deadly 1’s for a long time",
                "lines": [
                    { "intensity": 1, "text": "I don't know who you are. I don't know what you want." },
                    { "intensity": 1, "text": "If you are looking for ransom, I can tell you I don't have money." },
                    { "intensity": 1, "text": "But what I do have are a very particular set of skills;" },
                    { "intensity": 1, "text": "Skills I have acquired over a very long career." },
                    { "intensity": 1, "text": "Skills that make me a nightmare for people like you." },
                    { "intensity": 1, "text": "If you let my daughter go now, that'll be the end of it." },
                    { "intensity": 1, "text": "I will not look for you, I will not pursue you." },
                    { "intensity": 1, "text": "But if you don't …" },
                    { "intensity": 1, "text": "I will look for you. I will find you. And I will kill you." }
                ]
            },
            {
                "title": "Jack Nicholson - A Few Good Men",
                "description": "One Extreme (5)... Another Extreme (1) then Recover (3)",
                "lines": [
                    { "intensity": 5, "text": "You can't handle the truth!!" },
                    { "intensity": 1, "text": "Son, we live in a world that has walls and those walls have to be guarded by men with guns." },
                    { "intensity": 3, "text": "Whose gonna do it? You?" },
                    { "intensity": 5, "text": "You Lieutenant Wineburg?" },
                    { "intensity": 3, "text": "I have a greater responsibility than you can possibly fathom. You weep for Santiago and you curse the marines." },
                    { "intensity": 5, "text": "You have that luxury. The luxury of not knowing what I know." },
                    { "intensity": 1, "text": "That Santiago's death, while tragic" },
                    { "intensity": 5, "text": "--probably saved lives!" },
                    { "intensity": 3, "text": "And my existence, although gro-tesque and incomprehensible to you," },
                    { "intensity": 5, "text": "saves lives!!" },
                    { "intensity": 1, "text": "You don't want the truth because deep down in places you don't talk about at parties, you want me on that wall. You need me on that wall." },
                    { "intensity": 3, "text": "We use words like Honour, code, loyalty." },
                    { "intensity": 5, "text": "We use those words as the backbone of a life spent defending something." },
                    { "intensity": 1, "text": "... You use them as a punchline." }
                ]
            },
            {
                "title": "Julia Gillard - Address to Parliament",
                "description": "Firm (4) but controlled (2) in a formal environment",
                "lines": [
                    { "intensity": 3, "text": "Thank you madam Speaker and I rise to oppose the motion moved by the leader of the opposition." },
                    { "intensity": 4, "text": "And in so doing I say to the leader of the opposition, I will not be lectured about sexism and misogyny by. this. man. I will not." },
                    { "intensity": 2, "text": "And the government will not be lectured about sexism and misogyny by this man." },
                    { "intensity": 4, "text": "Not now, not ever." },
                    { "intensity": 2, "text": "The leader of the opposition says that people who hold sexist views and who are misogynists are not appropriate for high office." },
                    { "intensity": 3, "text": "Well, I hope the leader of the opposition has got a piece of paper; and he is writing out his resignation." },
                    { "intensity": 2, "text": "Because if he wants to know what misogyny looks like in modern Australia, he doesn't need a motion in the House of Representatives," },
                    { "intensity": 4, "text": "He needs a mirror!" }
                ]
            },
            {
                "title": "George Clooney - Up In The Air",
                "description": "Very Subtle. As close to 3 while still getting to 2 and 4.",
                "lines": [
                    { "intensity": 2, "text": "How much does your life weigh?" },
                    { "intensity": 3, "text": "Imagine for a second that you're carrying a backpack." },
                    { "intensity": 2, "text": "I want you to feel the straps on your shoulders." },
                    { "intensity": 2, "text": "Feel 'em?" },
                    { "intensity": 3, "text": "Now I want you to pack it with all the stuff that you have in your life. You start with the little things." },
                    { "intensity": 4, "text": "The things on shelves and in drawers, the knick-knacks, the collectibles." },
                    { "intensity": 2, "text": "Feel the weight as that adds up." },
                    { "intensity": 4, "text": "Then you start adding larger stuff, clothes, table-top appliances, lamps, linens, your TV." },
                    { "intensity": 3, "text": "The backpack should be getting pretty heavy now." },
                    { "intensity": 4, "text": "And you go bigger. Your couch, bed, your kitchen table. Stuff it all in there. Your car, get it in there. Your home, whether it's a studio apartment or a two bedroom house." },
                    { "intensity": 3, "text": "I want you to stuff it all into that backpack." },
                    { "intensity": 2, "text": "Now try to walk." }
                ]
            },
            {
                "title": "Alec Baldwin - Glengarry Glen Ross",
                "description": "Put it all together in rapid succession",
                "lines": [
                    { "intensity": 4, "text": "Let me have your attention for the moment." },
                    { "intensity": 2, "text": "Because you're talking about what?" },
                    { "intensity": 3, "text": "Complaining about that sale you didn't make?" },
                    { "intensity": 4, "text": "Making excuses for why they're not buying today?" },
                    { "intensity": 2, "text": "Let's talk about something important." },
                    { "intensity": 4, "text": "... Let's talk about something important!" },
                    { "intensity": 5, "text": "Put that coffee, down!!! ..." },
                    { "intensity": 1, "text": "Coffee is for closers..." },
                    { "intensity": 2, "text": "You think I'm joking? ... I am not joking..." },
                    { "intensity": 3, "text": "I am here from Mitch & Murray, and I am here on a mission of mercy!" },
                    { "intensity": 5, "text": "The good news is... you're fired." },
                    { "intensity": 3, "text": "The bad news is that all of you have just one week to regain your jobs. Starting with tonight." },
                    { "intensity": 1, "text": "Oh? Have I got your attention now? Good." },
                    { "intensity": 4, "text": "Because we're adding a little something to this week's sales contest." },
                    { "intensity": 4, "text": "First prize is a Nissan El Dorado sedan." },
                    { "intensity": 2, "text": "Second prize ... a lovely set of steak knives." },
                    { "intensity": 3, "text": "Third prize is you're fired." }
                ]
            }
        ];
    }

    connectedCallback() {
        this.render();
        this.syncLoop = setInterval(() => this.updateTimerUI(), 100);
        
        this.payloadHandler = (e) => {
            // Only capture payloads if we are actively in a drill prompt
            if (this.currentView !== 'menu' && this.currentView !== 'confidence-menu' && this.drillState === 'prompt') {
                if (e.detail && e.detail.text && e.detail.text.trim() !== '') {
                    this.latestPayload = e.detail;
                    this.drillState = 'result';
                    this.render();
                }
            }
        };
        window.addEventListener('thps-dashboard-update', this.payloadHandler);
    }

    disconnectedCallback() {
        if (this.syncLoop) clearInterval(this.syncLoop);
        window.removeEventListener('thps-dashboard-update', this.payloadHandler);
    }

    // ==========================================
    // MATH HELPERS
    // ==========================================
    
    calculateVariety(countsObj, ignoreKeys = []) {
        let total = 0;
        let max = 0;
        for (const [k, v] of Object.entries(countsObj)) {
            if (ignoreKeys.includes(k)) continue;
            let val = v || 0;
            total += val;
            if (val > max) max = val;
        }
        
        if (total < 3) return { label: 'N/A', pctStr: '', colorClass: 'bg-slate-100 text-slate-500', score: 0 };
        
        let spreadPct = ((total - max) / total) * 100;
        let pctStr = Math.round(spreadPct) + '%';
        
        // NEW STRICT THRESHOLDS (Mirrors voice-timeline.js updates)
        if (spreadPct < 50) return { label: 'Low', pctStr, colorClass: 'bg-red-100 text-red-700', score: -1 };
        if (spreadPct > 60) return { label: 'High', pctStr, colorClass: 'bg-orange-100 text-orange-700', score: 1 };
        return { label: 'Med', pctStr, colorClass: 'bg-green-100 text-green-700', score: 0 };
    }

    getVarietyStats(payload) {
        const pCounts = payload.pauseBuckets || {};
        const vCounts = payload.volumeBuckets || {};
        const rCounts = payload.runBuckets || {};
        
        // Strip micro pauses mathematically just like the timeline
        const pauseSafe = { short: pCounts.short || 0, medium: pCounts.medium || 0, long: pCounts.long || 0, vLong: pCounts.vLong || 0, extreme: pCounts.extreme || 0 };
        
        const pauseVar = this.calculateVariety(pauseSafe);
        const volVar = this.calculateVariety(vCounts);
        const paceVar = this.calculateVariety(rCounts);
        
        let tot = pauseVar.score + volVar.score + paceVar.score;
        let ovr = { label: 'Med', pctStr: '', colorClass: 'bg-green-100 text-green-700' };
        
        if (pauseVar.score === 0 && volVar.score === 0 && paceVar.score === 0 && pauseVar.label === 'N/A') {
            ovr = { label: 'N/A', pctStr: '', colorClass: 'bg-slate-100 text-slate-500' };
        } else if (tot <= -2) {
            ovr = { label: 'Low', pctStr: '', colorClass: 'bg-red-100 text-red-700' };
        } else if (tot >= 2) {
            ovr = { label: 'High', pctStr: '', colorClass: 'bg-orange-100 text-orange-700' };
        }
        
        return { overall: ovr, pause: pauseVar, vol: volVar, pace: paceVar };
    }

    formatVal(val, type) {
        if (val === undefined || val === null) return '-';
        if (type === 'time') return `${Math.floor(val / 60)}:${Math.floor(val % 60).toString().padStart(2, '0')}`;
        if (type === 'pct') return Math.round(val) + '%';
        if (type === 'float') return Number(val).toFixed(1);
        if (type === 'int') return Math.round(val);
        return val;
    }

    // ==========================================
    // VIEWS
    // ==========================================

    render() {
        let viewHtml = '';

        if (this.currentView === 'menu') {
            viewHtml = this.getMenuHtml();
        } else if (this.currentView === 'confidence-menu') {
            viewHtml = this.getConfidenceMenuHtml();
        } else {
            // Drill Container Shell
            let drillContent = '';
            if (this.drillState === 'prompt') {
                if (this.currentView === 'stories') drillContent = this.getStoriesPrompt();
                else if (this.currentView === 'accent') drillContent = this.getHybridPrompt('Accent');
                else if (this.currentView === 'qa') drillContent = this.getHybridPrompt('Q&A');
                else if (this.currentView === 'confidence') drillContent = this.getConfidencePrompt();
            } else {
                drillContent = this.getResultsHtml();
            }

            const titles = { 'stories': 'Stories', 'accent': 'Accent', 'qa': 'Q&A', 'confidence': 'Confidence' };

            viewHtml = `
                <div class="flex flex-col h-full w-full relative">
                    <div class="bg-slate-900 text-white p-3.5 flex justify-between items-center shrink-0 z-20">
                        <button id="ph-btn-back" class="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                            <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Back
                        </button>
                        <div class="text-center truncate px-4">
                            <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">PRACTICE HUB</span>
                            <span class="block text-sm font-bold truncate">${titles[this.currentView] || ''}</span>
                        </div>
                        <div class="w-16"></div> <!-- Spacer -->
                    </div>
                    
                    <div class="flex-1 w-full bg-slate-50 overflow-y-auto custom-scrollbar relative flex flex-col p-4 md:p-6 pb-28">
                        ${drillContent}
                    </div>

                    <!-- Fixed Bottom Controls -->
                    <div class="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shrink-0 z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                        ${this.drillState === 'prompt' ? this.getBottomRecordControls() : this.getBottomNextControls()}
                    </div>
                </div>
            `;
        }

        this.innerHTML = `
            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            </style>
            <div class="w-full h-[100dvh] max-h-[750px] bg-slate-50 border-y sm:border sm:rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col font-sans relative">
                ${viewHtml}
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
        this.attachDynamicListeners();
    }

    getMenuHtml() {
        return `
            <div class="flex-1 flex flex-col items-center justify-center p-6 w-full h-full">
                <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <i data-lucide="mic-2" class="w-6 h-6 pointer-events-none"></i>
                </div>
                <h2 class="text-xl md:text-2xl font-black text-slate-800 mb-6 tracking-tight text-center">What do you want to practice & measure?</h2>
                
                <div class="grid grid-cols-2 gap-3 w-full max-w-lg">
                    <button class="ph-nav-btn group bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-view="stories">
                        <i data-lucide="image" class="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2 pointer-events-none transition-colors"></i>
                        <span class="text-base font-black text-slate-700 group-hover:text-indigo-700 mb-0.5 pointer-events-none transition-colors">Stories</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Content</span>
                    </button>
                    
                    <button class="ph-nav-btn group bg-white border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-view="accent">
                        <i data-lucide="speech" class="w-6 h-6 text-slate-400 group-hover:text-emerald-500 mb-2 pointer-events-none transition-colors"></i>
                        <span class="text-base font-black text-slate-700 group-hover:text-emerald-700 mb-0.5 pointer-events-none transition-colors">Accent</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Delivery</span>
                    </button>
                    
                    <button class="ph-nav-btn group bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-view="qa">
                        <i data-lucide="message-square" class="w-6 h-6 text-slate-400 group-hover:text-amber-500 mb-2 pointer-events-none transition-colors"></i>
                        <span class="text-base font-black text-slate-700 group-hover:text-amber-700 mb-0.5 pointer-events-none transition-colors">Q&A</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Simplicity</span>
                    </button>
                    
                    <button class="ph-nav-btn group bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm active:scale-95" data-view="confidence-menu">
                        <i data-lucide="flame" class="w-6 h-6 text-slate-400 group-hover:text-rose-500 mb-2 pointer-events-none transition-colors"></i>
                        <span class="text-base font-black text-slate-700 group-hover:text-rose-700 mb-0.5 pointer-events-none transition-colors">Confidence</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Variety</span>
                    </button>
                </div>
            </div>
        `;
    }

    getConfidenceMenuHtml() {
        const speechOptions = this.SPEECHES.map((speech, index) => `
            <button class="ph-vc-select-btn group bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 rounded-xl p-4 flex flex-col items-start justify-center text-left transition-all shadow-sm active:scale-95 w-full" data-index="${index}">
                <span class="text-sm font-black text-slate-700 group-hover:text-rose-600 mb-1 pointer-events-none transition-colors">${speech.title}</span>
                <span class="text-xs font-bold text-slate-400 pointer-events-none">${speech.description}</span>
            </button>
        `).join('');

        return `
            <div class="flex flex-col h-full w-full relative">
                <div class="bg-slate-900 text-white p-3.5 flex justify-between items-center shrink-0 z-20 shadow-md">
                    <button id="ph-btn-back-menu" class="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95">
                        <i data-lucide="arrow-left" class="w-4 h-4 pointer-events-none"></i> Back
                    </button>
                    <div class="text-center truncate px-4">
                        <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">PRACTICE HUB</span>
                        <span class="block text-sm font-bold truncate">Confidence Scripts</span>
                    </div>
                    <div class="w-16"></div>
                </div>
                <div class="flex-1 w-full bg-slate-50 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                    ${speechOptions}
                </div>
            </div>
        `;
    }

    // --- PROMPT VIEWS ---
    getStoriesPrompt() {
        return `
            <div class="w-full max-w-lg mx-auto flex flex-col">
                <div class="relative w-full aspect-video bg-slate-200 rounded-xl overflow-hidden shadow-sm mb-5">
                    <img src="${this.IMAGES[this.activeIndex]}" class="w-full h-full object-cover">
                    <!-- Permanent Half Hidden Mask -->
                    <div class="absolute top-0 bottom-0 right-0 w-1/2 bg-black/80 backdrop-blur-[4px] pointer-events-none border-l border-white/10"></div>
                </div>
                <div class="bg-white border-2 border-indigo-100 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                    <p class="text-sm md:text-base font-bold text-slate-700 leading-relaxed">Visually describe the left image; then use your imagination to describe the right side.</p>
                </div>
            </div>
        `;
    }

    getHybridPrompt(typeStr) {
        return `
            <div class="w-full max-w-lg mx-auto flex flex-col">
                <div class="relative w-full aspect-video bg-slate-200 rounded-xl overflow-hidden shadow-sm mb-5">
                    <img src="${this.IMAGES[this.activeIndex]}" class="w-full h-full object-cover">
                </div>
                <div class="bg-white border-2 border-indigo-100 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                    <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2">${typeStr} Question</span>
                    <p class="text-sm md:text-base font-bold text-slate-700 leading-relaxed">${this.QUESTIONS[this.activeIndex]}</p>
                </div>
            </div>
        `;
    }

    getConfidencePrompt() {
        const speech = this.SPEECHES[this.vcSpeechIndex];
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

        const linesHTML = speech.lines.map((line, index) => {
            const style = getStyle(line.intensity);
            return `
                <div class="vc-line-wrapper py-2 w-full" id="ph-vc-line-${index}">
                    <div class="vc-line-content flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-2 border-transparent transition-all duration-300 ${index === this.vcLineIndex ? 'opacity-100 bg-white shadow-sm ring-1 ' + style.ring : 'opacity-40'}">
                        <div class="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center shadow-inner ${style.bg} ${style.text}">
                            <span class="text-lg sm:text-xl font-black leading-none">${line.intensity}</span>
                        </div>
                        <div class="flex-1 flex items-center">
                            <p class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${line.text}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="w-full max-w-lg mx-auto flex flex-col h-full relative">
                <div class="flex justify-between items-center mb-2 shrink-0">
                    <button id="ph-vc-up" class="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors active:scale-90 shadow-sm" ${this.vcLineIndex === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    <div class="text-center truncate px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">${speech.title}</div>
                    <button id="ph-vc-down" class="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors active:scale-90 shadow-sm" ${this.vcLineIndex === speech.lines.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
                
                <div id="ph-vc-viewport" class="flex-1 overflow-y-auto custom-scrollbar relative pb-32 scroll-smooth">
                    ${linesHTML}
                </div>
            </div>
        `;
    }

    // --- RESULTS VIEW ---
    getResultsHtml() {
        const d = this.latestPayload;
        if (!d) return '';

        let pills = [];
        const vStats = this.getVarietyStats(d);
        
        if (this.currentView === 'stories') {
            pills = [
                { label: 'Personal', key: 'Personal', val: this.formatVal(d.personal, 'pct'), color: 'bg-green-100 text-green-700' },
                { label: 'Visual', key: 'Visual', val: this.formatVal(d.visual, 'pct'), color: 'bg-blue-100 text-blue-700' },
                { label: 'Variety', key: 'Overall Variety', val: vStats.overall.label, color: vStats.overall.colorClass }
            ];
        } else if (this.currentView === 'accent') {
            pills = [
                { label: 'Clarity', key: 'Clarity %', val: this.formatVal(d.clarity, 'pct'), color: 'bg-indigo-100 text-indigo-700' },
                { label: 'Words/Min', key: 'Words/min', val: this.formatVal(d.wpm, 'int'), color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Simple %', key: 'Simple %', val: this.formatVal(d.simple, 'pct'), color: 'bg-amber-100 text-amber-700' }
            ];
        } else if (this.currentView === 'qa') {
            pills = [
                { label: 'Runtime', key: 'Runtime', val: this.formatVal(d.runtime, 'float')+'s', color: 'bg-blue-100 text-blue-700' },
                { label: 'Read-Level', key: 'Read-Level', val: this.formatVal(d.readlevel, 'float'), color: 'bg-rose-100 text-rose-700' },
                { label: 'Intangible', key: 'Intangible', val: this.formatVal(d.intangible, 'pct'), color: 'bg-slate-200 text-slate-700' }
            ];
        } else if (this.currentView === 'confidence') {
            pills = [
                { label: 'Variation', key: 'Overall Variety', val: vStats.overall.label, color: vStats.overall.colorClass },
                { label: 'Pause Var', key: 'Pause Var.', val: vStats.pause.label, color: vStats.pause.colorClass },
                { label: 'Vol Var', key: 'Vol Var.', val: vStats.vol.label, color: vStats.vol.colorClass },
                { label: 'Pace Var', key: 'Pace Var.', val: vStats.pace.label, color: vStats.pace.colorClass }
            ];
        }

        const pillsHtml = pills.map((p, idx) => `
            <button class="ph-result-pill flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 border-transparent hover:border-slate-300 bg-white shadow-sm transition-all active:scale-95 text-center min-w-[75px]" data-key="${p.key}">
                <span class="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 line-clamp-1 pointer-events-none">${p.label}</span>
                <span class="text-sm sm:text-base font-black px-2 py-0.5 rounded-md ${p.color} pointer-events-none">${p.val}</span>
            </button>
        `).join('');

        return `
            <div class="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-full">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <i data-lucide="check-circle" class="w-8 h-8"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-6">Results Saved!</h3>
                
                <div class="flex flex-wrap justify-center gap-3 w-full mb-6">
                    ${pillsHtml}
                </div>

                <div id="ph-explanation-box" class="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-600 text-center shadow-sm mb-4">
                    <span class="italic text-slate-400">Click any metric above to see what it means and how to improve.</span>
                </div>
            </div>
        `;
    }

    // --- BOTTOM BARS ---
    getBottomRecordControls() {
        return `
            <div class="max-w-lg mx-auto w-full flex items-center justify-between gap-4">
                <div class="flex flex-col items-center w-20 shrink-0">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</span>
                    <span id="ph-timer" class="text-xl font-mono font-black text-slate-700">00:00</span>
                </div>
                <button id="ph-record-btn" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                    <i data-lucide="mic" id="ph-record-icon" class="w-5 h-5 pointer-events-none"></i> <span id="ph-record-text">Start</span>
                </button>
            </div>
        `;
    }

    getBottomNextControls() {
        return `
            <div class="max-w-lg mx-auto w-full flex gap-3">
                <button id="ph-btn-retry" class="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-slate-200 shadow-sm">
                    Retry Drill
                </button>
                <button id="ph-btn-next" class="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                    Next <i data-lucide="arrow-right" class="w-4 h-4 pointer-events-none"></i>
                </button>
            </div>
        `;
    }

    // ==========================================
    // INTERACTIVITY
    // ==========================================
    
    attachDynamicListeners() {
        // Shared Back Buttons
        const backBtn = this.querySelector('#ph-btn-back');
        if (backBtn) backBtn.addEventListener('click', () => {
            if (window.isActive && typeof window.toggleRecording === 'function') window.toggleRecording();
            this.currentView = this.currentView === 'confidence' ? 'confidence-menu' : 'menu';
            this.drillState = 'prompt';
            this.render();
        });

        const backMenuBtn = this.querySelector('#ph-btn-back-menu');
        if (backMenuBtn) backMenuBtn.addEventListener('click', () => {
            this.currentView = 'menu';
            this.render();
        });

        // Main Menu Nav
        this.querySelectorAll('.ph-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.currentTarget.getAttribute('data-view');
                this.drillState = 'prompt';
                this.render();
            });
        });

        // Confidence Menu Select
        this.querySelectorAll('.ph-vc-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.vcSpeechIndex = parseInt(e.currentTarget.getAttribute('data-index'));
                this.vcLineIndex = 0;
                this.currentView = 'confidence';
                this.drillState = 'prompt';
                this.render();
            });
        });

        // Prompter Record Button
        const recBtn = this.querySelector('#ph-record-btn');
        if (recBtn) recBtn.addEventListener('click', () => {
            if (typeof window.toggleRecording === 'function') window.toggleRecording();
        });

        // Next / Retry Buttons
        const nextBtn = this.querySelector('#ph-btn-next');
        if (nextBtn) nextBtn.addEventListener('click', () => {
            this.activeIndex = (this.activeIndex + 1) % 10;
            this.drillState = 'prompt';
            this.latestPayload = null;
            if (this.currentView === 'confidence') {
                this.currentView = 'confidence-menu'; // Kick back to script list
            }
            this.render();
        });

        const retryBtn = this.querySelector('#ph-btn-retry');
        if (retryBtn) retryBtn.addEventListener('click', () => {
            this.drillState = 'prompt';
            this.latestPayload = null;
            this.vcLineIndex = 0; 
            this.render();
        });

        // Confidence Prompter Scrollers
        const vcUp = this.querySelector('#ph-vc-up');
        const vcDown = this.querySelector('#ph-vc-down');
        if (vcUp && vcDown) {
            const speech = this.SPEECHES[this.vcSpeechIndex];
            
            const updateVcScroll = () => {
                const viewport = this.querySelector('#ph-vc-viewport');
                const lines = this.querySelectorAll('.vc-line-content');
                lines.forEach((line, idx) => {
                    const styleClass = this.getStyleClassForIntensity(speech.lines[idx].intensity);
                    if (idx === this.vcLineIndex) {
                        line.classList.remove('opacity-40');
                        line.classList.add('opacity-100', 'bg-white', 'shadow-sm', 'ring-1', styleClass);
                    } else {
                        line.classList.add('opacity-40');
                        line.classList.remove('opacity-100', 'bg-white', 'shadow-sm', 'ring-1', styleClass);
                    }
                });

                const target = this.querySelector(`#ph-vc-line-${this.vcLineIndex}`);
                if (target && viewport) {
                    viewport.scrollTo({ top: target.offsetTop - 20, behavior: 'smooth' });
                }

                vcUp.disabled = this.vcLineIndex === 0;
                vcDown.disabled = this.vcLineIndex === speech.lines.length - 1;
            };

            vcUp.addEventListener('click', () => { if (this.vcLineIndex > 0) { this.vcLineIndex--; updateVcScroll(); } });
            vcDown.addEventListener('click', () => { if (this.vcLineIndex < speech.lines.length - 1) { this.vcLineIndex++; updateVcScroll(); } });
        }

        // Result Pill Clicks -> Explanations
        this.querySelectorAll('.ph-result-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const key = e.currentTarget.getAttribute('data-key');
                const box = this.querySelector('#ph-explanation-box');
                
                // Clear active pill styling
                this.querySelectorAll('.ph-result-pill').forEach(p => p.classList.replace('border-indigo-400', 'border-transparent'));
                e.currentTarget.classList.replace('border-transparent', 'border-indigo-400');
                
                box.innerHTML = `<span class="animate-pulse">Loading...</span>`;
                setTimeout(() => {
                    let text = `Detailed explanation for "${key}" will appear here soon.`;
                    
                    if (key === 'Overall Variety') {
                        text = "Measures if you vary your voice naturally or speak in a robotic monotone. If Pause, Volume, and Pace variation are too low, your overall variety suffers.";
                    } else if (window.explanationsData && window.explanationsData[key]) {
                        text = window.explanationsData[key];
                    } else if (window.FALLBACK_EXPLANATIONS && window.FALLBACK_EXPLANATIONS[key]) {
                        text = window.FALLBACK_EXPLANATIONS[key];
                    } else if (key === 'Vol Var.') {
                        text = "Volume Variation: Counts how varied your speaking volume is. Varying volume keeps the listener engaged.";
                    }
                    
                    box.innerHTML = `<strong class="text-indigo-800 block mb-1 uppercase tracking-widest text-[10px]">${key}</strong>${text}`;
                }, 50);
            });
        });
    }

    getStyleClassForIntensity(intensity) {
        switch(parseInt(intensity)) {
            case 1: return 'ring-purple-600';
            case 2: return 'ring-blue-500';
            case 3: return 'ring-emerald-500';
            case 4: return 'ring-orange-500';
            case 5: return 'ring-rose-600';
            default: return 'ring-slate-200';
        }
    }

    updateTimerUI() {
        const timer = this.querySelector('#ph-timer');
        const recBtn = this.querySelector('#ph-record-btn');
        const recIcon = this.querySelector('#ph-record-icon');
        const recText = this.querySelector('#ph-record-text');
        
        if (!timer || !recBtn) return;
        
        if (window.isActive && window.THPS && window.THPS.Audio && window.THPS.Audio.recordStartTime) {
            const elapsed = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
            let m = Math.floor(elapsed / 60).toString().padStart(2, '0');
            let s = Math.floor(elapsed % 60).toString().padStart(2, '0');
            
            timer.innerText = `${m}:${s}`;
            timer.classList.add('text-rose-500');
            
            if (!recBtn.classList.contains('bg-rose-500')) {
                recBtn.classList.replace('bg-indigo-600', 'bg-rose-500');
                recBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-rose-400');
                if (recText) recText.innerText = "Stop";
                if (recIcon) {
                    recIcon.setAttribute('data-lucide', 'square');
                    if (window.lucide) window.lucide.createIcons({ root: recBtn });
                }
            }
        } else {
            timer.classList.remove('text-rose-500');
            
            if (recBtn.classList.contains('bg-rose-500')) {
                recBtn.classList.replace('bg-rose-500', 'bg-indigo-600');
                recBtn.classList.replace('hover:bg-rose-400', 'hover:bg-indigo-500');
                if (recText) recText.innerText = "Start";
                if (recIcon) {
                    recIcon.setAttribute('data-lucide', 'mic');
                    if (window.lucide) window.lucide.createIcons({ root: recBtn });
                }
            }
        }
    }
}

customElements.define('thps-practice-hub', ThpsPracticeHub);

renderVoiceChoicePrompter() {
        const speech = this.courseData.speeches[this.vcActiveSpeechIndex];
        
        // NEW: Updated Color Palette
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
            // NEW: Removed the 'grayscale' class from the inactive state
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
                <!-- NEW: Added 'min-h-0' to force flexbox to respect the boundary -->
                <div class="flex-1 relative flex flex-col min-h-0">
                    
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
                    // NEW: Removed grayscale
                    line.classList.remove('opacity-40');
                    line.classList.add('opacity-100', 'bg-white', 'shadow-sm', 'ring-1');
                } else {
                    // NEW: Removed grayscale
                    line.classList.add('opacity-40');
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

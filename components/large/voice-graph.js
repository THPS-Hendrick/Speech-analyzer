// ==========================================
// THPS WIDGET: LARGE VOICE GRAPH (PHD ACOUSTICS v4.0)
// Includes Canvas Pause Bars, Pace Backgrounds, Percentile Voice Variance, and Dual Engines
// ==========================================

class ThpsVoiceGraph extends HTMLElement {
    constructor() {
        super();
        this.pauseMode = 'dynamic'; // Default to relative speaker cadence
        this.lastData = null; // Cache the data so we can instantly recalculate on toggle
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                .custom-scrollbar::-webkit-scrollbar { height: 14px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 4px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; border: 3px solid #f8fafc; }
            </style>
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-indigo-500 shadow-sm flex flex-col bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Graph</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Variance in Pause, Voice, & Pace</p>
                    </div>
                    <!-- NEW: The Engine Mode Toggle -->
                    <div class="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button data-action="setModeDynamic" class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all bg-white shadow-sm text-indigo-600">Dynamic</button>
                        <button data-action="setModeGlobal" class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-400 hover:text-slate-600">Global</button>
                    </div>
                </div>
                
                <div class="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-slate-50 pb-1 custom-scrollbar relative" id="thps-scroll-wrapper">
                    
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none thps-vg-placeholder z-50">
                        <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-800/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-700/50">Waiting for Audio...</span>
                    </div>

                    <div class="thps-sync-track relative flex flex-col" style="min-width: 100%;">
                        
                        <div class="thps-time-axis relative w-full h-7 border-b border-slate-700/50 bg-slate-800/90 shrink-0"></div>

                        <div class="w-full h-32 md:h-40 relative shrink-0 bg-slate-900">
                            <canvas class="thps-vg-canvas absolute inset-0 w-full h-full"></canvas>
                        </div>
                        
                        <div class="thps-staff-words relative w-full h-[120px] bg-slate-50 shrink-0 overflow-hidden">
                            <div class="absolute inset-0 flex flex-col justify-evenly py-[10px] pointer-events-none opacity-40 z-0">
                                <div class="w-full h-px bg-slate-300"></div>
                                <div class="w-full h-px bg-slate-300"></div>
                                <div class="w-full h-px bg-slate-300"></div>
                                <div class="w-full h-px bg-slate-300"></div>
                                <div class="w-full h-px bg-slate-300"></div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div class="flex flex-col">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2 cursor-pointer hover:text-blue-600 transition-colors" onclick="window.explain('Pause Var.')">Pause Var.</h4>
                        <div class="thps-bar-container-pause flex flex-col gap-1.5 text-[9px] font-medium text-slate-500"></div>
                    </div>
                    <div class="flex flex-col h-full">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2 cursor-pointer hover:text-blue-600 transition-colors" onclick="window.explain('Voice Var.')">Voice Var.</h4>
                        <div class="thps-bar-container-voice flex-1 flex items-end"></div>
                    </div>
                    <div class="flex flex-col">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2 cursor-pointer hover:text-blue-600 transition-colors" onclick="window.explain('Pace Var.')">Pace Var.</h4>
                        <div class="thps-bar-container-pace flex flex-col gap-1.5 text-[9px] font-medium text-slate-500"></div>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        // Toggle Listeners
        this.querySelector('[data-action="setModeDynamic"]').addEventListener('click', () => this.setMode('dynamic'));
        this.querySelector('[data-action="setModeGlobal"]').addEventListener('click', () => this.setMode('global'));

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
        
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }
    }

    setMode(mode) {
        this.pauseMode = mode;
        const dynBtn = this.querySelector('[data-action="setModeDynamic"]');
        const globBtn = this.querySelector('[data-action="setModeGlobal"]');
        
        if (mode === 'dynamic') {
            dynBtn.className = 'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all bg-white shadow-sm text-indigo-600';
            globBtn.className = 'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-400 hover:text-slate-600';
        } else {
            globBtn.className = 'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all bg-white shadow-sm text-indigo-600';
            dynBtn.className = 'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-400 hover:text-slate-600';
        }
        
        // Recalculate graph and all dependent maths instantly
        if (this.lastData) this.update(this.lastData);
    }

    countSyllablesLocal(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    }

    update(data) {
        if (!data || !data.wordTimestamps || data.wordTimestamps.length === 0) return;
        this.lastData = data; 
        
        this.querySelector('.thps-vg-placeholder').style.display = 'none';
        
        const duration = Math.max(data.time || 1, Math.ceil(data.wordTimestamps[data.wordTimestamps.length - 1].end));
        const PIXELS_PER_SEC = 50;
        const scrollWrapper = this.querySelector('#thps-scroll-wrapper');
        const track = this.querySelector('.thps-sync-track');
        
        const trackWidth = Math.max(duration * PIXELS_PER_SEC, scrollWrapper.clientWidth);
        track.style.width = `${trackWidth}px`;
        
        const canvas = this.querySelector('.thps-vg-canvas');
        const axis = this.querySelector('.thps-time-axis');
        const staff = this.querySelector('.thps-staff-words');
        
        let pauses = []; 
        let chunkPaces = []; 

        let pauseCounts = { vShort: 0, short: 0, norm: 0, long: 0, vLong: 0 };
        let paceCounts = { vSlow: 0, slow: 0, norm: 0, fast: 0, vFast: 0 };
        let voiceCounts = { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 };
        
        // --- PHD MATH PHASE 1: HYBRID PAUSE ENGINE ---
        let expectedSyllableLength = 0.250; 
        
        if (this.pauseMode === 'dynamic') {
            const firstWord = data.wordTimestamps[0];
            const lastWord = data.wordTimestamps[data.wordTimestamps.length - 1];
            const totalSpeakingTime = (lastWord.start + 1.0) - firstWord.start;
            
            let totalSyllables = 0;
            data.wordTimestamps.forEach(w => totalSyllables += this.countSyllablesLocal(w.word));
            
            const dynamicSPS = totalSyllables / Math.max(0.1, totalSpeakingTime);
            expectedSyllableLength = 1.0 / dynamicSPS; 
        }

        for (let i = 0; i < data.wordTimestamps.length - 1; i++) {
            const currWord = data.wordTimestamps[i];
            const nextWord = data.wordTimestamps[i+1];
            
            const sylCount = this.countSyllablesLocal(currWord.word);
            const expectedNextStart = currWord.start + (sylCount * expectedSyllableLength);
            
            const truePause = Math.max(0, nextWord.start - expectedNextStart);

            if (truePause > 0.05) { 
                let pColor = '', pY = 0;
                
                if (truePause <= 0.350) { pauseCounts.vShort++; pColor = '#cbd5e1'; pY = 0.15; }
                else if (truePause <= 0.700) { pauseCounts.short++; pColor = '#60a5fa'; pY = 0.35; }
                else if (truePause <= 1.050) { pauseCounts.norm++; pColor = '#10b981'; pY = 0.50; }
                else if (truePause <= 1.400) { pauseCounts.long++; pColor = '#fbbf24'; pY = 0.65; }
                else { pauseCounts.vLong++; pColor = '#f43f5e'; pY = 0.85; }

                pauses.push({ 
                    start: expectedNextStart, 
                    duration: truePause, 
                    color: pColor, 
                    yPct: pY 
                });
            }
        }

        // --- PHD MATH PHASE 2: PACE & TRUE LOGARITHMIC VOICE VARIANCE ---
        let validChunks = [];
        let numChunks = Math.ceil(duration / 3);

        for(let c = 0; c < numChunks; c++) {
            let chunkStart = c * 3;
            let chunkEnd = chunkStart + 3;
            
            let sylCount = 0;
            data.wordTimestamps.forEach(w => {
                if (w.start >= chunkStart && w.start < chunkEnd) {
                    sylCount += this.countSyllablesLocal(w.word);
                }
            });
            
            if (sylCount > 0) {
                let paceColor = '', paceRow = 0;

                if (sylCount <= 8) { paceCounts.vSlow++; paceColor = '#cbd5e1'; paceRow = 0; }
                else if (sylCount <= 10) { paceCounts.slow++; paceColor = '#60a5fa'; paceRow = 1; }
                else if (sylCount <= 13) { paceCounts.norm++; paceColor = '#10b981'; paceRow = 2; }
                else if (sylCount <= 15) { paceCounts.fast++; paceColor = '#fbbf24'; paceRow = 3; }
                else { paceCounts.vFast++; paceColor = '#f43f5e'; paceRow = 4; }
                
                chunkPaces.push({ start: chunkStart, width: 3, color: paceColor, row: paceRow });
            }

            let pauseInChunk = 0;
            pauses.forEach(p => {
                let pEnd = p.start + p.duration;
                if (p.start < chunkEnd && pEnd > chunkStart) {
                    let overlapStart = Math.max(p.start, chunkStart);
                    let overlapEnd = Math.min(pEnd, chunkEnd);
                    pauseInChunk += (overlapEnd - overlapStart);
                }
            });

            let activeTime = 3 - pauseInChunk;
            if (activeTime >= 0.2) { 
                let linearSum = 0; let dbCount = 0;
                if (data.volumeData && data.volumeData.length > 0) {
                    data.volumeData.forEach(v => {
                        if (v.time >= chunkStart && v.time < chunkEnd) {
                            // Convert dB to linear power for true acoustic averaging
                            linearSum += Math.pow(10, v.db / 10);
                            dbCount++;
                        }
                    });
                }
                // Convert linear average back to decibels
                let avgDb = dbCount > 0 ? (10 * Math.log10(linearSum / dbCount)) : -40; 
                validChunks.push({ start: chunkStart, end: chunkEnd, db: avgDb });
            }
        }

        // --- PHD MATH PHASE 3: PERCENTILE SORTING & GLOBAL CLAMP ---
        
        // 1. Sort valid chunks from quietest to loudest
        validChunks.sort((a, b) => a.db - b.db);

        // 2. Find Percentiles
        let floorDb = -40;
        let ceilingDb = -10;

        if (validChunks.length > 0) {
            let floorIndex = Math.floor(validChunks.length * 0.05); // 5th Percentile
            let ceilIndex = Math.floor(validChunks.length * 0.95);  // 95th Percentile
            if (ceilIndex >= validChunks.length) ceilIndex = validChunks.length - 1;
            
            floorDb = validChunks[floorIndex].db;
            ceilingDb = validChunks[ceilIndex].db;
        }

        // 3. The Global Clamp (Enforce Minimum 15 dB Range for Dynamic Mode)
        let range = ceilingDb - floorDb;
        if (range < 15) {
            let midPoint = (ceilingDb + floorDb) / 2;
            floorDb = midPoint - 7.5;
            ceilingDb = midPoint + 7.5;
            range = 15;
        }

        // 4. Override Bounds if on Global Benchmark Mode (Fixed Standard)
        if (this.pauseMode === 'global') {
            floorDb = -35;
            ceilingDb = -15; // 20 dB Strict Benchmark Range
            range = 20;
        }

        // 5. Calculate Step Size for the 5 Buckets
        let step = range / 5;
        let bounds = [
            floorDb + step,       
            floorDb + (step * 2), 
            floorDb + (step * 3), 
            floorDb + (step * 4)  
        ];

        // 6. Generate Dynamic Labels (ex: < -28dB, -25dB, etc.)
        let voiceLabels = [
            `< ${Math.round(bounds[0])}dB`,
            `${Math.round(bounds[0])}dB`,
            `${Math.round(bounds[1])}dB`,
            `${Math.round(bounds[2])}dB`,
            `> ${Math.round(bounds[3])}dB`
        ];
        
        // 7. Sort the chunks into the new dynamic buckets
        validChunks.forEach(vc => {
            if (vc.db < bounds[0]) { voiceCounts.vLow++; vc.color = '#8b5cf6'; vc.hPct = 0.15; } 
            else if (vc.db < bounds[1]) { voiceCounts.low++; vc.color = '#3b82f6'; vc.hPct = 0.30; } 
            else if (vc.db < bounds[2]) { voiceCounts.norm++; vc.color = '#10b981'; vc.hPct = 0.50; } 
            else if (vc.db < bounds[3]) { voiceCounts.high++; vc.color = '#f59e0b'; vc.hPct = 0.75; } 
            else { voiceCounts.vHigh++; vc.color = '#ef4444'; vc.hPct = 0.97; } 
        });

        // --- VISUAL PAINTING 1: TIME AXIS ---
        axis.innerHTML = '';
        for (let i = 0; i <= duration; i++) {
            let xPos = i * PIXELS_PER_SEC;
            let isMajor = (i % 5 === 0);
            
            if (isMajor) {
                let label = document.createElement('span');
                label.className = 'absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold -translate-x-1/2 select-none';
                label.style.left = `${xPos}px`;
                label.innerText = `${i}s`;
                axis.appendChild(label);
            } else {
                let tick = document.createElement('div');
                tick.className = `absolute bottom-0 border-l border-slate-500/50 h-2`;
                tick.style.left = `${xPos}px`;
                axis.appendChild(tick);
            }
        }

        // --- VISUAL PAINTING 2: CANVAS BLOCKS & PAUSE BARS ---
        const canvasHeight = canvas.parentElement.clientHeight;
        canvas.width = trackWidth * 2; 
        canvas.height = canvasHeight * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2); 
        
        ctx.clearRect(0, 0, trackWidth, canvasHeight);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for(let i=0; i<duration; i+=3) {
            let x = i * PIXELS_PER_SEC;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasHeight); ctx.stroke();
        }

        // A) Solid Intensity Blocks
        // Re-sort the chunks by time so they draw left-to-right correctly
        validChunks.sort((a, b) => a.start - b.start);
        
        validChunks.forEach(vc => {
            let x = vc.start * PIXELS_PER_SEC;
            let w = 3 * PIXELS_PER_SEC;
            let h = vc.hPct * canvasHeight;
            let y = canvasHeight - h;
            
            ctx.fillStyle = vc.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = vc.color;
            ctx.fillRect(x, y, w - 2, h); 
            ctx.shadowBlur = 0;
        });

        // B) Pause Overlay Bars
        pauses.forEach(p => {
            let x = p.start * PIXELS_PER_SEC;
            let w = p.duration * PIXELS_PER_SEC;
            let h = canvasHeight * 0.10; 
            let y = (p.yPct * canvasHeight) - (h / 2); 
            
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 4);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, w, h);
            }
            ctx.shadowBlur = 0;
        });

        // --- VISUAL PAINTING 3: SPEECH STAFF (PACE BARS & WORDS) ---
        staff.querySelectorAll('.staff-item').forEach(el => el.remove());

        chunkPaces.forEach(cp => {
            const bar = document.createElement('div');
            bar.className = 'staff-item absolute opacity-30 pointer-events-none rounded-sm z-0';
            bar.style.backgroundColor = cp.color;
            bar.style.left = `${cp.start * PIXELS_PER_SEC}px`;
            bar.style.width = `${cp.width * PIXELS_PER_SEC}px`;
            bar.style.top = `${cp.row * 20}%`;
            bar.style.height = `20%`;
            staff.appendChild(bar);
        });

        data.wordTimestamps.forEach((w, index) => {
            const span = document.createElement('span');
            span.innerText = w.word;
            
            const xPos = w.start * PIXELS_PER_SEC; 
            const row = index % 5;
            
            let textColorCls = 'text-slate-700';
            if (w.colorType === 'personal') textColorCls = 'text-emerald-500';
            else if (w.colorType === 'visual') textColorCls = 'text-rose-500';
            else if (w.colorType === 'overlap') textColorCls = 'text-fuchsia-600';
            
            span.className = `staff-item absolute text-[9px] px-1 py-0.5 bg-white ${textColorCls} font-bold rounded border border-slate-200 shadow-sm whitespace-nowrap z-10 hover:bg-indigo-50 hover:text-indigo-700 hover:z-20 hover:scale-110 transition-all cursor-default`;
            span.style.left = `${xPos}px`; 
            span.style.top = `calc(${row * 20}% + 4px)`; 
            
            staff.appendChild(span);
        });

        // --- VISUAL PAINTING 4: UI BAR GRAPHS ---
        const drawHorizontalBars = (containerClass, countsObj, labels, colors) => {
            const container = this.querySelector(containerClass);
            container.innerHTML = '';
            const maxVal = Math.max(...Object.values(countsObj), 1); 
            
            Object.keys(countsObj).forEach((key, idx) => {
                const count = countsObj[key];
                const widthPct = Math.max(5, (count / maxVal) * 100); 
                container.innerHTML += `
                    <div class="flex items-center gap-2">
                        <span class="w-12 text-right">${labels[idx]}:</span>
                        <div class="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden">
                            <div class="h-full rounded-sm ${colors[idx]}" style="width: ${widthPct}%"></div>
                        </div>
                        <span class="w-4 font-bold text-slate-700">${count}</span>
                    </div>
                `;
            });
        };

        const drawVerticalBars = (containerClass, countsObj, labels, colors) => {
            const container = this.querySelector(containerClass);
            container.innerHTML = `<div class="flex items-end justify-between w-full h-full pt-1 pb-1"></div>`;
            const wrapper = container.firstElementChild;
            const maxVal = Math.max(...Object.values(countsObj), 1); 
            
            Object.keys(countsObj).forEach((key, idx) => {
                const count = countsObj[key];
                const heightPct = Math.max(5, (count / maxVal) * 100); 
                wrapper.innerHTML += `
                    <div class="flex flex-col items-center justify-end gap-1 flex-1 h-full">
                        <span class="text-[9px] font-bold text-slate-700">${count}</span>
                        <div class="w-3 sm:w-4 h-16 bg-slate-100 rounded-sm flex flex-col justify-end overflow-hidden">
                            <div class="w-full rounded-sm ${colors[idx]}" style="height: ${heightPct}%"></div>
                        </div>
                        <span class="text-[8px] text-slate-500">${labels[idx]}</span>
                    </div>
                `;
            });
        };

        // NEW: Changed the first labels array from ['v.short', 'short', 'norm', 'long', 'v.long'] to strict numerical cutoffs.
        drawHorizontalBars('.thps-bar-container-pause', pauseCounts, ['short', '0.35s', '0.70s', '1.05s', 'long'], ['bg-slate-300', 'bg-blue-400', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-500']);
        
        // Pass the dynamically generated voiceLabels into the Vertical Bars renderer
        drawVerticalBars('.thps-bar-container-voice', voiceCounts, voiceLabels, ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']);
        
        drawHorizontalBars('.thps-bar-container-pace', paceCounts, ['v.slow', 'slow', 'norm', 'fast', 'v.fast'], ['bg-slate-300', 'bg-blue-400', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-500']);
    }
}

customElements.define('thps-voice-graph', ThpsVoiceGraph);

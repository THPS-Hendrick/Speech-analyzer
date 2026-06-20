// ==========================================
// THPS WIDGET: LARGE VOICE GRAPH (PHD ACOUSTICS v2.3)
// Includes Fixed Heights, Synchronized Horizontal Scrolling, and Aligned Grids
// ==========================================

class ThpsVoiceGraph extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                /* Upgraded Scrollbar: Shorter and brighter */
                .custom-scrollbar::-webkit-scrollbar { height: 12px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; border: 3px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
            </style>
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-indigo-500 shadow-sm flex flex-col bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Acoustic Variance</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">3-Second Intensity Windows & Start-to-Start Cadence</p>
                    </div>
                </div>
                
                <!-- SYNCHRONIZED SCROLL CONTAINER (bg-slate-50 to prevent dark bleed) -->
                <div class="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-slate-50 custom-scrollbar relative" id="thps-scroll-wrapper">
                    
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none thps-vg-placeholder z-50">
                        <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-800/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-700/50">Waiting for Audio...</span>
                    </div>

                    <!-- The Track: Grows wide based on duration to maintain fixed pixels-per-second -->
                    <div class="thps-sync-track relative flex flex-col" style="min-width: 100%;">
                        
                        <!-- 1. Time Axis -->
                        <div class="thps-time-axis relative w-full h-7 bg-slate-800/90 shrink-0"></div>

                        <!-- 2. Block Waveform Canvas (Dark background isolated here) -->
                        <div class="w-full h-32 md:h-40 relative shrink-0 bg-slate-900 border-b border-slate-700">
                            <canvas class="thps-vg-canvas absolute inset-0 w-full h-full"></canvas>
                        </div>
                        
                        <!-- 3. The Speech Staff -->
                        <div class="thps-staff-words relative w-full h-[120px] bg-slate-50 shrink-0 overflow-hidden">
                            <!-- 5 Equal Vertical Lanes -->
                            <div class="absolute inset-0 flex flex-col pointer-events-none opacity-40 z-0">
                                <div class="w-full flex-1 border-b border-slate-300"></div>
                                <div class="w-full flex-1 border-b border-slate-300"></div>
                                <div class="w-full flex-1 border-b border-slate-300"></div>
                                <div class="w-full flex-1 border-b border-slate-300"></div>
                                <div class="w-full flex-1"></div>
                            </div>
                            <!-- Words and Pace Backgrounds injected via JS -->
                        </div>

                    </div>
                </div>

                <!-- THE PHD VARIANCE PANELS -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <!-- Pause Variance -->
                    <div class="flex flex-col">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Pause Var.</h4>
                        <div class="thps-bar-container-pause flex flex-col gap-1.5 text-[9px] font-medium text-slate-500"></div>
                    </div>
                    <!-- Voice Variance -->
                    <div class="flex flex-col">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Voice Var.</h4>
                        <div class="thps-bar-container-voice flex flex-col gap-1.5 text-[9px] font-medium text-slate-500"></div>
                    </div>
                    <!-- Pace Variance -->
                    <div class="flex flex-col">
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Pace Var.</h4>
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

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
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
        if (!data.wordTimestamps || data.wordTimestamps.length === 0) return;
        
        this.querySelector('.thps-vg-placeholder').style.display = 'none';
        
        const duration = Math.max(data.time || 1, Math.ceil(data.wordTimestamps[data.wordTimestamps.length - 1].end));
        
        // Setup Fixed Pixel Scaling (50 pixels = 1 second)
        const PIXELS_PER_SEC = 50;
        const scrollWrapper = this.querySelector('#thps-scroll-wrapper');
        const track = this.querySelector('.thps-sync-track');
        
        // Lock the track width to the exact math so all 3 layers match perfectly
        const trackWidth = Math.max(duration * PIXELS_PER_SEC, scrollWrapper.clientWidth);
        track.style.width = `${trackWidth}px`;
        track.style.minWidth = `${trackWidth}px`;
        
        const canvas = this.querySelector('.thps-vg-canvas');
        const axis = this.querySelector('.thps-time-axis');
        const staff = this.querySelector('.thps-staff-words');
        
        // Arrays for UI elements
        let pauses = []; 
        let chunkPaces = []; 

        let pauseCounts = { vShort: 0, short: 0, norm: 0, long: 0, vLong: 0 };
        let paceCounts = { vSlow: 0, slow: 0, norm: 0, fast: 0, vFast: 0 };
        let voiceCounts = { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 };
        
        // --- PHD MATH PHASE 1: PAUSE VARIANCE ---
        for (let i = 0; i < data.wordTimestamps.length - 1; i++) {
            let gap = data.wordTimestamps[i+1].start - data.wordTimestamps[i].start;
            if (gap >= 0.500) {
                let pColor = '', pY = 0;
                
                if (gap < 0.650) { pauseCounts.vShort++; pColor = '#cbd5e1'; pY = 0.15; } 
                else if (gap < 0.800) { pauseCounts.short++; pColor = '#60a5fa'; pY = 0.35; } 
                else if (gap < 0.950) { pauseCounts.norm++; pColor = '#10b981'; pY = 0.50; } 
                else if (gap < 1.100) { pauseCounts.long++; pColor = '#fbbf24'; pY = 0.65; } 
                else { pauseCounts.vLong++; pColor = '#f43f5e'; pY = 0.85; } 

                pauses.push({ start: data.wordTimestamps[i].start, duration: gap, color: pColor, yPct: pY });
            }
        }

        // --- PHD MATH PHASE 2: PACE & VOICE VARIANCE (3s CHUNKS) ---
        let validChunks = [];
        let totalDb = 0;
        let numChunks = Math.ceil(duration / 3);

        for(let c = 0; c < numChunks; c++) {
            let chunkStart = c * 3;
            let chunkEnd = chunkStart + 3;
            
            // Pace Math
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

            // Voice Math
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
            if (activeTime >= 1) { 
                let dbSum = 0; let dbCount = 0;
                if (data.volumeData && data.volumeData.length > 0) {
                    data.volumeData.forEach(v => {
                        if (v.time >= chunkStart && v.time < chunkEnd) {
                            dbSum += v.db;
                            dbCount++;
                        }
                    });
                }
                let avgDb = dbCount > 0 ? (dbSum / dbCount) : -40; 
                validChunks.push({ start: chunkStart, end: chunkEnd, db: avgDb });
                totalDb += avgDb;
            }
        }

        // --- PHD MATH PHASE 3: INTENSITY SORTING ---
        let globalAvgDb = validChunks.length > 0 ? (totalDb / validChunks.length) : -40;
        
        validChunks.forEach(vc => {
            let diff = vc.db - globalAvgDb;
            if (diff < -10) { voiceCounts.vLow++; vc.color = '#8b5cf6'; vc.hPct = 0.15; } 
            else if (diff < -5) { voiceCounts.low++; vc.color = '#3b82f6'; vc.hPct = 0.30; } 
            else if (diff <= 5) { voiceCounts.norm++; vc.color = '#10b981'; vc.hPct = 0.50; } 
            else if (diff <= 10) { voiceCounts.high++; vc.color = '#f59e0b'; vc.hPct = 0.75; } 
            else { voiceCounts.vHigh++; vc.color = '#ef4444'; vc.hPct = 0.97; } 
        });


        // --- VISUAL PAINTING 1: TIME AXIS ---
        axis.innerHTML = '';
        for (let i = 0; i <= duration; i++) {
            let xPos = i * PIXELS_PER_SEC;
            let isMajor = (i % 5 === 0);
            
            if (isMajor || i === Math.ceil(duration)) {
                // Major marker: Just the centered text
                let label = document.createElement('span');
                label.className = 'absolute bottom-1 text-[10px] text-slate-400 font-bold -translate-x-1/2 select-none';
                label.style.left = `${xPos}px`;
                label.innerText = `${i}s`;
                axis.appendChild(label);
            } else {
                // Minor tick
                let tick = document.createElement('div');
                tick.className = `absolute bottom-0 border-l border-slate-600/50 h-1.5`;
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

        // A) Pace Background Bars (z-index 0)
        chunkPaces.forEach(cp => {
            const bar = document.createElement('div');
            bar.className = 'staff-item absolute opacity-30 pointer-events-none z-0';
            bar.style.backgroundColor = cp.color;
            bar.style.left = `${cp.start * PIXELS_PER_SEC}px`;
            bar.style.width = `${cp.width * PIXELS_PER_SEC}px`;
            bar.style.top = `${cp.row * 20}%`;
            bar.style.height = `20%`; // Exact height of 1 lane
            staff.appendChild(bar);
        });

        // B) Word Spans (z-index 10+)
        data.wordTimestamps.forEach((w, index) => {
            const span = document.createElement('span');
            span.innerText = w.word;
            
            // EXACT PIXEL ALIGNMENT
            const xPos = w.start * PIXELS_PER_SEC; 
            const row = index % 5;
            
            span.className = 'staff-item absolute text-[9px] px-1 py-0.5 bg-white text-slate-700 font-bold rounded border border-slate-200 shadow-sm whitespace-nowrap z-10 hover:bg-indigo-50 hover:text-indigo-700 hover:z-20 hover:scale-110 transition-all cursor-default';
            
            span.style.left = `${xPos}px`; 
            
            // Center the text vertically inside the exact 20% lane (Lane height = 24px, Padding/Text roughly 16px)
            span.style.top = `calc(${row * 20}% + 3px)`; 
            
            staff.appendChild(span);
        });

        // --- VISUAL PAINTING 4: UI BAR GRAPHS ---
        const drawMiniBars = (containerClass, countsObj, labels, colors) => {
            const container = this.querySelector(containerClass);
            container.innerHTML = '';
            
            const maxVal = Math.max(...Object.values(countsObj), 1); 
            
            Object.keys(countsObj).forEach((key, idx) => {
                const count = countsObj[key];
                const widthPct = Math.max(5, (count / maxVal) * 100); 
                
                container.innerHTML += `
                    <div class="flex items-center gap-2">
                        <span class="w-10 text-right">${labels[idx]}:</span>
                        <div class="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden">
                            <div class="h-full rounded-sm ${colors[idx]}" style="width: ${widthPct}%"></div>
                        </div>
                        <span class="w-4 font-bold text-slate-700">${count}</span>
                    </div>
                `;
            });
        };

        drawMiniBars(
            '.thps-bar-container-pause', 
            pauseCounts, 
            ['v.short', 'short', 'norm', 'long', 'v.long'],
            ['bg-slate-300', 'bg-blue-400', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-500']
        );

        drawMiniBars(
            '.thps-bar-container-voice', 
            voiceCounts, 
            ['v.low', 'low', 'norm', 'high', 'v.high'],
            ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
        );

        drawMiniBars(
            '.thps-bar-container-pace', 
            paceCounts, 
            ['v.slow', 'slow', 'norm', 'fast', 'v.fast'],
            ['bg-slate-300', 'bg-blue-400', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-500']
        );
    }
}

customElements.define('thps-voice-graph', ThpsVoiceGraph);

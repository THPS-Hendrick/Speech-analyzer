class ThpsVoiceTimeline extends HTMLElement {
    constructor() {
        super();
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
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Timeline</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Trackman Acoustic Telemetry</p>
                    </div>
                </div>
                
                <div class="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-slate-50 pb-1 custom-scrollbar relative" id="thps-scroll-wrapper">
                    
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none thps-vg-placeholder z-50">
                        <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-800/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-700/50">Waiting for Audio...</span>
                    </div>

                    <div class="thps-sync-track relative flex flex-col" style="min-width: 100%;">
                        <div class="thps-time-axis relative w-full h-7 border-b border-slate-700/50 bg-slate-800/90 shrink-0"></div>

                        <div class="w-full h-32 md:h-40 relative shrink-0 bg-slate-900 cursor-crosshair" id="thps-canvas-container">
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

                <!-- GRAPHS -->
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

                <!-- TELEMETRY INSPECTOR -->
                <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col w-full h-[100px]">
                    <div class="w-full h-full bg-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden shadow-inner">
                        <div id="timeline-telemetry-content" class="w-full h-full flex flex-col justify-center">
                            <span class="text-xs font-mono text-slate-400 animate-pulse">Click a word, pause bar, or colored run to view acoustic data.</span>
                        </div>
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
        
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }
    }

    formatTimeCode(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    showWordTelemetry(word, start, t) {
        if (!t) return;
        const container = this.querySelector('#timeline-telemetry-content');
        
        let delta = t.actualDurationMs - t.expectedDurationMs;
        let sign = delta >= 0 ? '+' : '';
        let vol = t.volumeDb !== undefined ? t.volumeDb.toFixed(1) : '--';

        container.innerHTML = `
            <div class="flex items-center text-white text-[13px] font-bold tracking-wide mb-1.5">
                ${word} [${t.sylCount}] (${t.paceLabel || 'normal'})
            </div>
            <div class="flex flex-wrap gap-x-6 text-slate-400 text-[11px] font-mono">
                <span><strong class="text-slate-300">Start:</strong> ${this.formatTimeCode(start)}</span>
                <span><strong class="text-slate-300">Vol Avg:</strong> ${vol} dB</span>
                <span><strong class="text-slate-300">Duration:</strong> ${t.actualDurationMs}ms [${sign}${delta}]</span>
            </div>
        `;
    }

    showPauseTelemetry(pause) {
        const container = this.querySelector('#timeline-telemetry-content');
        let category = "unknown";
        let range = "";
        
        if (pause.duration <= 0.700) { category = "short pause"; range = "0.35s to 0.70s"; }
        else if (pause.duration <= 1.050) { category = "medium pause"; range = "0.70s to 1.05s"; }
        else if (pause.duration <= 1.400) { category = "long pause"; range = "1.05s to 1.40s"; }
        else { category = "very long pause"; range = "> 1.40s"; }

        let vol = pause.volumeDb !== undefined ? pause.volumeDb.toFixed(1) : '--';

        container.innerHTML = `
            <div class="flex items-center text-[13px] font-bold tracking-wide mb-1.5" style="color: ${pause.color}">
                ${category} (${range})
            </div>
            <div class="flex flex-wrap gap-x-6 text-slate-400 text-[11px] font-mono">
                <span><strong class="text-slate-300">Start:</strong> ${this.formatTimeCode(pause.start)}</span>
                <span><strong class="text-slate-300">Vol Avg:</strong> ${vol} dB</span>
                <span><strong class="text-slate-300">Duration:</strong> ${Math.round(pause.duration * 1000)}ms</span>
            </div>
        `;
    }

    // NEW: Render logic for specific run blocks
    showRunTelemetry(rp) {
        if (!rp) return;
        const container = this.querySelector('#timeline-telemetry-content');
        
        container.innerHTML = `
            <div class="flex items-center text-[13px] font-bold tracking-wide mb-1.5" style="color: ${rp.color}">
                Run ${rp.id} [${rp.duration.toFixed(2)} secs] (${rp.label})
            </div>
            <div class="flex flex-wrap gap-x-6 text-slate-400 text-[11px] font-mono">
                <span><strong class="text-slate-300">Start:</strong> ${this.formatTimeCode(rp.start)}</span>
                <span><strong class="text-slate-300">Wpm:</strong> ${rp.wpm}</span>
                <span><strong class="text-slate-300">Sps:</strong> ${rp.sps}</span>
            </div>
        `;
    }

    update(data) {
        if (!data || !data.wordTimestamps || data.wordTimestamps.length === 0) return;
        
        this.querySelector('.thps-vg-placeholder').style.display = 'none';
        
        const duration = Math.max(data.time || 1, Math.ceil(data.wordTimestamps[data.wordTimestamps.length - 1].end));
        const PIXELS_PER_SEC = 50;
        const scrollWrapper = this.querySelector('#thps-scroll-wrapper');
        const track = this.querySelector('.thps-sync-track');
        
        const trackWidth = Math.max(duration * PIXELS_PER_SEC, scrollWrapper.clientWidth);
        track.style.width = `${trackWidth}px`;
        
        const canvas = this.querySelector('.thps-vg-canvas');
        const canvasContainer = this.querySelector('#thps-canvas-container');
        const axis = this.querySelector('.thps-time-axis');
        const staff = this.querySelector('.thps-staff-words');
        
        const pauseEvents = data.pauseEvents || [];
        const runPaces = data.runPaces || [];
        const pauseCounts = data.pauseBuckets || { micro: 0, blue: 0, green: 0, orange: 0, red: 0 };
        const voiceCounts = data.volumeBuckets || { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 };
        const paceCounts = data.paceBuckets || { fastest: 0, fast: 0, normal: 0, slow: 0, slowest: 0 };
        const validChunks = data.volumeChunks || [];

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

        // --- VISUAL PAINTING 2: CANVAS (VOLUME ONLY) ---
        const canvasHeight = canvasContainer.clientHeight;
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
            let w = Math.max(2, (vc.end - vc.start) * PIXELS_PER_SEC); 
            let h = vc.hPct * canvasHeight;
            let y = canvasHeight - h;
            
            ctx.fillStyle = vc.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = vc.color;
            ctx.fillRect(x, y, w - 1, h); 
            ctx.shadowBlur = 0;
        });

        // --- VISUAL PAINTING 3: SPEECH STAFF (WORDS & INVISIBLE PAUSE BLOCKS) ---
        staff.querySelectorAll('.staff-item').forEach(el => el.remove());

        // Draw Pace Run background lines
        runPaces.forEach(rp => {
            const bar = document.createElement('div');
            // REMOVED pointer-events-none, added hover and cursor pointers for interactivity
            bar.className = 'staff-item absolute opacity-20 hover:opacity-40 cursor-pointer rounded-sm z-0 transition-all';
            bar.style.backgroundColor = rp.color;
            bar.style.left = `${rp.start * PIXELS_PER_SEC}px`;
            bar.style.width = `${rp.width * PIXELS_PER_SEC}px`;
            bar.style.top = `${rp.row * 20}%`;
            bar.style.height = `20%`;
            
            bar.onclick = () => this.showRunTelemetry(rp);
            staff.appendChild(bar);
        });

        // Draw the words with Pace-coded text
        data.wordTimestamps.forEach((w, index) => {
            const span = document.createElement('span');
            span.innerText = w.word;
            
            const xPos = w.start * PIXELS_PER_SEC; 
            const row = index % 5;
            
            // Text color matches the pace heat map exactly
            const paceColor = w.telemetry && w.telemetry.paceColor ? w.telemetry.paceColor : '#334155';
            
            span.className = `staff-item absolute text-[9px] px-1 py-0.5 bg-white font-bold rounded border border-slate-200 shadow-sm whitespace-nowrap z-10 hover:bg-slate-50 hover:z-20 hover:scale-110 transition-all cursor-pointer`;
            span.style.color = paceColor;
            span.style.left = `${xPos}px`; 
            span.style.top = `calc(${row * 20}% + 4px)`; 
            
            span.onclick = () => this.showWordTelemetry(w.word, w.start, w.telemetry);
            staff.appendChild(span);
        });

        // Draw the "Invisible Word" pause blocks directly on the staff
        pauseEvents.forEach((p) => {
            const block = document.createElement('div');
            block.className = `staff-item absolute rounded shadow-sm z-0 hover:brightness-110 transition-all cursor-pointer border border-black/10`;
            block.style.backgroundColor = p.color;
            block.style.left = `${p.start * PIXELS_PER_SEC}px`; 
            block.style.width = `${p.duration * PIXELS_PER_SEC}px`;
            block.style.top = `calc(40% + 4px)`; // Positioned centrally on the staff
            block.style.height = `16px`; // Sized to match a word badge
            
            block.onclick = () => this.showPauseTelemetry(p);
            staff.appendChild(block);
        });

        // --- VISUAL PAINTING 4: UI BAR GRAPHS (HEAT MAP UNIFIED) ---
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
                        <span class="text-[8px] text-slate-500">${labels[idx] || ''}</span>
                    </div>
                `;
            });
        };

        // Pause Var (micro=red, short=orange, med=green, long=blue, vLong=purple)
        drawHorizontalBars('.thps-bar-container-pause', pauseCounts, ['micro', '0.35s', '0.70s', '1.05s', 'long'], ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500']);
        // Voice Var
        drawVerticalBars('.thps-bar-container-voice', voiceCounts, data.volumeLabels || [], ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']);
        // Pace Var (fastest=red, fast=orange, norm=green, slow=blue, slowest=purple)
        drawHorizontalBars('.thps-bar-container-pace', paceCounts, ['Fastest', 'Fast', 'Normal', 'Slow', 'Slowest'], ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500']);
    }
}

customElements.define('thps-voice-timeline', ThpsVoiceTimeline);

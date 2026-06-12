// ==========================================
// THPS WIDGET: LARGE VOICE GRAPH
// Advanced Canvas Waveform & Text Timeline
// ==========================================

class ThpsVoiceGraph extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4 border border-slate-200/50 relative bg-white shadow-sm transition-all hover:shadow-md w-full">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Acoustic Timeline</h3>
                        <p class="text-[10px] text-slate-400 uppercase font-semibold">Volume Dynamics & Pacing</p>
                    </div>
                </div>

                <div class="w-full overflow-x-auto pb-4 cursor-grab" id="thps-vg-scroller" style="scrollbar-width: thin;">
                    <div id="thps-vg-wrapper" class="relative" style="min-width: 100%;">
                        
                        <!-- 2D Canvas for Graph -->
                        <div class="w-full h-[250px] bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800 shadow-inner">
                            <canvas id="thps-vg-canvas" class="absolute inset-0 w-full h-full block"></canvas>
                        </div>

                        <!-- Text Timeline Strip -->
                        <div class="w-full relative h-28 overflow-hidden bg-slate-50 rounded-xl border border-slate-200 mt-2 shadow-inner">
                            <div id="thps-vg-words" class="absolute inset-0 w-full h-full">
                                <!-- Words injected here -->
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        this.canvas = this.querySelector('#thps-vg-canvas');
        this.wordContainer = this.querySelector('#thps-vg-words');
        this.scrollWrapper = this.querySelector('#thps-vg-wrapper');
        
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (!data.text || data.time <= 0) return;
        
        const durationSecs = data.time;
        const text = data.text;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        if (words.length === 0) return;

        // 1. Synthetic Acoustic Engine (Generates Realistic Timestamps & DB)
        let simulatedData = [];
        let wordTimestamps = [];
        let currentTimeMs = 0;
        const totalDurationMs = durationSecs * 1000;
        
        // Calculate average time per syllable to stretch text across duration
        let totalSyllables = 0;
        words.forEach(w => totalSyllables += Math.max(1, Math.floor(w.length / 3)));
        const msPerSyllable = totalDurationMs / (totalSyllables + (words.length * 0.5)); // Added buffer for spaces

        words.forEach(word => {
            let syllables = Math.max(1, Math.floor(word.length / 3));
            let wordDuration = syllables * msPerSyllable;
            
            wordTimestamps.push({ word: word, timeMs: currentTimeMs });
            
            // Spike DB for the word
            for(let i=0; i < wordDuration; i+=50) {
                let db = 55 + Math.random() * 20; // Animated/Base Zone
                if (word.length > 7) db += 10; // Volcanic Zone for big words
                simulatedData.push({ timeMs: currentTimeMs + i, db: db });
            }
            
            currentTimeMs += wordDuration;

            // Pause Logic
            let pauseDuration = 50;
            if (/[.!?]/.test(word)) pauseDuration = 600;
            else if (/[,;]/.test(word)) pauseDuration = 300;
            
            for(let i=0; i < pauseDuration; i+=50) {
                simulatedData.push({ timeMs: currentTimeMs + i, db: 25 + Math.random() * 5 }); // Pause Zone
            }
            currentTimeMs += pauseDuration;
        });

        // 2. Setup Canvas Dimensions (120px per second)
        const PIXELS_PER_SECOND = 120;
        const canvasPixelWidth = Math.max(this.parentElement.clientWidth, durationSecs * PIXELS_PER_SECOND);
        this.scrollWrapper.style.width = canvasPixelWidth + "px";

        const ctx = this.canvas.getContext('2d');
        const totalHeight = 250;
        this.canvas.width = canvasPixelWidth * window.devicePixelRatio;
        this.canvas.height = totalHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.clearRect(0, 0, canvasPixelWidth, totalHeight);

        // 3. Draw Gradients & Waveform
        const gradient = ctx.createLinearGradient(0, totalHeight, 0, 0);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");   // Blue
        gradient.addColorStop(0.4, "rgba(16, 185, 129, 0.5)"); // Emerald
        gradient.addColorStop(0.6, "rgba(250, 204, 21, 0.7)"); // Yellow
        gradient.addColorStop(0.8, "rgba(249, 115, 22, 0.9)"); // Orange
        gradient.addColorStop(1, "rgba(239, 68, 68, 1)");      // Red

        const minDb = 20; 
        const maxDb = 90; 
        const dbRange = maxDb - minDb; 

        ctx.beginPath();
        ctx.moveTo(0, totalHeight);

        simulatedData.forEach(d => {
            const x = (d.timeMs / totalDurationMs) * canvasPixelWidth;
            let normVol = Math.max(0, Math.min(1, (d.db - minDb) / dbRange));
            let y = totalHeight - (normVol * totalHeight); 
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(canvasPixelWidth, totalHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // 4. Draw Boundaries (Trackman Zones)
        const boundaries = [35, 45, 55, 65, 75];
        const lineLabels = ["Dramatic", "Serious", "Base Vol", "Animated", "Volcanic"];
        
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.font = "bold 10px sans-serif";

        boundaries.forEach((db, i) => {
            let normVol = Math.max(0, Math.min(1, (db - minDb) / dbRange));
            let y = totalHeight - (normVol * totalHeight);
            
            ctx.beginPath();
            ctx.setLineDash(i === 2 ? [] : [4, 4]); 
            ctx.moveTo(0, y);
            ctx.lineTo(canvasPixelWidth, y);
            ctx.strokeStyle = i === 2 ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = i === 2 ? 2 : 1;
            ctx.stroke();
            
            const textWidth = ctx.measureText(lineLabels[i]).width;
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(5, y - 16, textWidth + 8, 14);
            ctx.fillStyle = i === 2 ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
            ctx.fillText(lineLabels[i], 9, y - 3);
        });

        // 5. Draw 5-Second Ticks
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        for (let s = 0; s <= durationSecs; s += 5) {
            const x = (s / durationSecs) * canvasPixelWidth;
            const m = String(Math.floor(s / 60)).padStart(2, '0');
            const sec = String(Math.floor(s % 60)).padStart(2, '0');
            ctx.fillText(`${m}:${sec}`, x, 5);
            ctx.fillRect(x, 0, 1, 4);
        }

        // 6. Draw 5-Row Text Ladder
        this.wordContainer.innerHTML = '';
        let currentShelf = 0;
        
        wordTimestamps.forEach(wObj => {
            let leftPx = (wObj.timeMs / totalDurationMs) * canvasPixelWidth;
            let topPct = currentShelf * 20 + 5; 
            
            const wordEl = document.createElement('div');
            wordEl.className = "absolute text-[11px] font-bold text-slate-600 whitespace-nowrap px-1 border-l-2 border-indigo-200 bg-white/80";
            wordEl.style.left = `${leftPx}px`;
            wordEl.style.top = `${topPct}%`;
            wordEl.innerText = wObj.word;
            
            this.wordContainer.appendChild(wordEl);
            currentShelf = (currentShelf + 1) % 5; // Rotate rows 0-4
        });
    }
}

customElements.define('thps-voice-graph', ThpsVoiceGraph);

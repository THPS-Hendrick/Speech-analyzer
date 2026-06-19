// ==========================================
// THPS WIDGET: LARGE VOICE GRAPH (TIMESTAMPS)
// ==========================================

class ThpsVoiceGraph extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-indigo-500 shadow-sm flex flex-col bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <!-- SELF DESTRUCT BUTTON (Appears on Hover) -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Acoustic Timeline</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Exact word placement via Google V2 Timestamps</p>
                    </div>
                </div>
                
                <div class="w-full h-48 bg-slate-900 rounded-xl overflow-hidden relative">
                    <canvas class="thps-vg-canvas absolute inset-0 w-full h-full"></canvas>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none thps-vg-placeholder">
                        <span class="text-slate-500 text-xs font-bold uppercase tracking-widest">Waiting for Audio...</span>
                    </div>
                </div>
                
                <div class="thps-word-ladder mt-4 flex flex-wrap gap-1 w-full max-h-32 overflow-y-auto content-start"></div>
            </div>
        `;

        // The Self-Destruct Logic
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        // If there are no timestamps (i.e. manual text entry), ignore.
        if (!data.wordTimestamps || data.wordTimestamps.length === 0) return;
        
        this.querySelector('.thps-vg-placeholder').style.display = 'none';
        
        const canvas = this.querySelector('.thps-vg-canvas');
        const ladder = this.querySelector('.thps-word-ladder');
        const duration = data.time || 1;
        
        // High DPI Canvas Scaling
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw 5-Second Grid Markers
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<duration; i+=5) {
            let x = (i / duration) * canvas.width;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // 2. Draw The Timestamp Waveform!
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        
        data.wordTimestamps.forEach((w) => {
            let startX = (w.start / duration) * canvas.width;
            let endX = (w.end / duration) * canvas.width;
            let midX = (startX + endX) / 2;
            
            // Random visual height just for the demo waveform (since we don't track decibels yet)
            let height = (canvas.height/2) * 0.8 * (0.5 + Math.random()*0.5); 
            
            ctx.lineTo(startX, canvas.height/2);
            ctx.lineTo(midX, (canvas.height/2) - height);
            ctx.lineTo(endX, canvas.height/2);
        });
        
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = '#6366f1'; // Indigo
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add glowing gradient fill
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();

        // 3. Draw The Word Ladder
        ladder.innerHTML = '';
        data.wordTimestamps.forEach(w => {
            const span = document.createElement('span');
            span.innerText = w.word;
            span.className = 'text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 shadow-sm';
            ladder.appendChild(span);
        });
    }
}

customElements.define('thps-voice-graph', ThpsVoiceGraph);

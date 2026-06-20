// ==========================================
// THPS WIDGET: LARGE VOICE GRAPH (TIMESTAMPS & SPEECH STAFF)
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
                
                <!-- WAVEFORM CANVAS -->
                <div class="w-full h-48 bg-slate-900 rounded-xl overflow-hidden relative">
                    <canvas class="thps-vg-canvas absolute inset-0 w-full h-full"></canvas>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none thps-vg-placeholder">
                        <span class="text-slate-500 text-xs font-bold uppercase tracking-widest">Waiting for Audio...</span>
                    </div>
                </div>
                
                <!-- THE SPEECH STAFF -->
                <div class="relative w-full h-[110px] mt-4 bg-slate-50/50 border border-slate-200 rounded-lg overflow-x-hidden overflow-y-visible">
                    <!-- Staff Visual Lines -->
                    <div class="absolute inset-0 flex flex-col justify-evenly py-[10px] pointer-events-none opacity-40">
                        <div class="w-full h-px bg-slate-300"></div>
                        <div class="w-full h-px bg-slate-300"></div>
                        <div class="w-full h-px bg-slate-300"></div>
                        <div class="w-full h-px bg-slate-300"></div>
                        <div class="w-full h-px bg-slate-300"></div>
                    </div>
                    <!-- Words Container -->
                    <div class="thps-staff-words relative w-full h-full"></div>
                </div>
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
        // If there are no timestamps, ignore.
        if (!data.wordTimestamps || data.wordTimestamps.length === 0) return;
        
        this.querySelector('.thps-vg-placeholder').style.display = 'none';
        
        const canvas = this.querySelector('.thps-vg-canvas');
        const staff = this.querySelector('.thps-staff-words');
        const duration = data.time || 1;
        
        // --- 1. SETUP CANVAS ---
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw 5-Second Grid Markers
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<duration; i+=5) {
            let x = (i / duration) * canvas.width;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Draw The Timestamp Waveform
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        
        data.wordTimestamps.forEach((w) => {
            let startX = (w.start / duration) * canvas.width;
            let endX = (w.end / duration) * canvas.width;
            let midX = (startX + endX) / 2;
            
            // Random visual height just for the demo waveform
            let height = (canvas.height/2) * 0.8 * (0.5 + Math.random()*0.5); 
            
            ctx.lineTo(startX, canvas.height/2);
            ctx.lineTo(midX, (canvas.height/2) - height);
            ctx.lineTo(endX, canvas.height/2);
        });
        
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = '#6366f1'; 
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add glowing gradient fill
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();

        // --- 2. DRAW THE SPEECH STAFF ---
        staff.innerHTML = '';
        data.wordTimestamps.forEach((w, index) => {
            const span = document.createElement('span');
            span.innerText = w.word;
            
            // Horizontal position: Mapping exactly to the timestamp!
            const leftPercent = (w.start / duration) * 100;
            
            // Vertical position: Modulo 5 maps it to row 0, 1, 2, 3, 4, then repeats
            const row = index % 5;
            
            span.className = 'absolute text-[9px] px-1 py-0.5 bg-white text-slate-700 font-bold rounded border border-slate-200 shadow-sm whitespace-nowrap z-10 hover:bg-indigo-50 hover:text-indigo-700 hover:z-20 hover:scale-110 transition-all cursor-default';
            
            // Prevent words clipping off the right edge
            span.style.left = `${Math.min(95, leftPercent)}%`; 
            
            // Distribute across the 5 rows (0%, 20%, 40%, 60%, 80%) with a slight pixel offset to align with the visual lines
            span.style.top = `calc(${row * 20}% + 4px)`; 
            
            staff.appendChild(span);
        });
    }
}

customElements.define('thps-voice-graph', ThpsVoiceGraph);

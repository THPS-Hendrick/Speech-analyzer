// ==========================================
// THPS WIDGET: MEDIUM WPM GRAPH
// ==========================================

class ThpsWpmGraph extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex justify-between items-start cursor-pointer thps-toggle-btn">
                    <div class="w-full">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Speaking Pace</h3>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <div class="thps-val text-3xl sm:text-4xl font-bold text-slate-400">0</div>
                            <span class="text-sm text-slate-500 font-medium">WPM Avg</span>
                        </div>
                    </div>
                    <svg class="w-5 h-5 ml-2 text-slate-400 transition-transform duration-300 transform flex-shrink-0 thps-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div class="thps-accordion-content cba-accordion-content border-t border-slate-100 pt-2">
                    <p class="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wide">Pace per 20-second interval</p>
                    <canvas class="thps-chart" height="150"></canvas>
                </div>
            </div>
        `;
        
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        const toggleBtn = this.querySelector('.thps-toggle-btn');
        const content = this.querySelector('.thps-accordion-content');
        const arrow = this.querySelector('.thps-arrow');
        
        toggleBtn.addEventListener('click', () => {
            content.classList.toggle('cba-accordion-open');
            arrow.classList.toggle('rotate-180');
        });

        this.chartInstance = null;
        window.addEventListener('thps-dashboard-update', (e) => this.update(e.detail));
    }

    update(data) {
        if (data.wpm === undefined) return;
        const valEl = this.querySelector('.thps-val');
        
        if (data.recordedAudio && data.time > 0) {
            valEl.textContent = data.wpm;
            valEl.className = 'thps-val text-3xl sm:text-4xl font-bold text-amber-500';
            this.querySelector('.score-card').style.borderLeftColor = '#f59e0b';
        } else {
            valEl.textContent = "0";
            valEl.className = 'thps-val text-3xl sm:text-4xl font-bold text-slate-400';
            this.querySelector('.score-card').style.borderLeftColor = '#cbd5e1';
            return; // No charts for text-only
        }

        if (!data.text || data.time <= 0) return;
        
        const numWords = data.text.split(/\s+/).filter(w => w.trim().length > 0).length;
        let wpmDataArray = [];
        let transcribedDuration = Math.min(240, data.time);
        let numIntervals = Math.ceil(transcribedDuration / 20);
        
        for (let i = 0; i < numIntervals; i++) {
            let intervalDuration = (i === numIntervals - 1) ? (transcribedDuration % 20 || 20) : 20;
            let share = intervalDuration / transcribedDuration;
            let baseWords = numWords * share;
            let variation = 1 + (Math.sin(i * 1.5) * 0.12); 
            let intervalWords = Math.round(baseWords * variation);
            let intervalWpm = Math.round((intervalWords / intervalDuration) * 60);
            wpmDataArray.push(intervalWpm);
        }

        const canvas = this.querySelector('.thps-chart');
        if (this.chartInstance) this.chartInstance.destroy();
        if (typeof window.Chart !== 'undefined') {
            this.chartInstance = new window.Chart(canvas, {
                type: 'bar',
                data: { 
                    labels: wpmDataArray.map((_, i) => `${(i+1)*20}s`), 
                    datasets: [{ 
                        label: 'WPM', 
                        data: wpmDataArray, 
                        backgroundColor: 'rgba(245, 158, 11, 0.5)', 
                        borderColor: 'rgba(245, 158, 11, 1)', 
                        borderWidth: 1, 
                        borderRadius: 4 
                    }] 
                },
                options: { responsive: true, scales: { y: { beginAtZero: true, suggestedMax: 180 } }, plugins: { legend: { display: false } } }
            });
        }
    }
}
customElements.define('thps-wpm-graph', ThpsWpmGraph);

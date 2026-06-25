// ==========================================
// THPS WIDGET: LARGE SCORE SUMMARY
// Listens to the Dashboard Broadcast and grades the speech
// ==========================================

class ThpsScoreSummary extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-slate-800 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 border-slate-100 gap-4 pr-6">
                    <h2 class="text-lg font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onclick="window.explain('Score Summary')">Score Summary</h2>
                    <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors" onclick="window.explain('Time')">
                            <span class="text-xs font-bold text-slate-500 uppercase pointer-events-none">Time:</span>
                            <span id="sum-time" class="font-bold text-slate-800 text-sm pointer-events-none">-</span>
                        </div>
                        <div class="text-base font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg shadow-inner cursor-pointer hover:bg-blue-100 transition-colors" onclick="window.explain('Grade')">
                            Grade: <span id="sum-overallGrade" class="text-blue-600 pointer-events-none">- / 10</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <!-- Content -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="window.explain('Content')">Content</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Personal')"><span class="score-label group-hover:text-blue-600 transition-colors">Personal:</span> <div class="flex items-center gap-1"><span id="sum-personal" class="score-value pointer-events-none">0%</span> <span id="sum-personal-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Visual')"><span class="score-label group-hover:text-blue-600 transition-colors">Visual:</span> <div class="flex items-center gap-1"><span id="sum-visual" class="score-value pointer-events-none">0%</span> <span id="sum-visual-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Intangible')"><span class="score-label group-hover:text-blue-600 transition-colors">Intangible:</span> <div class="flex items-center gap-1"><span id="sum-intangible" class="score-value pointer-events-none">0%</span> <span id="sum-intangible-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                    </div>
                    <!-- Delivery -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="window.explain('Delivery')">Delivery</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Words/min')"><span class="score-label group-hover:text-blue-600 transition-colors">Words/min:</span> <div class="flex items-center gap-1"><span id="sum-wpm" class="score-value pointer-events-none">-</span> <span id="sum-wpm-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Syllable/sec')"><span class="score-label group-hover:text-blue-600 transition-colors">Syllable/sec:</span> <div class="flex items-center gap-1"><span id="sum-sps" class="score-value pointer-events-none">-</span> <span id="sum-sps-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Pause %')"><span class="score-label group-hover:text-blue-600 transition-colors">Pause %:</span> <div class="flex items-center gap-1"><span id="sum-pause" class="score-value pointer-events-none">-</span> <span id="sum-pause-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                    </div>
                    <!-- Simplicity -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="window.explain('Simplicity')">Simplicity</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Words/Sent')"><span class="score-label group-hover:text-blue-600 transition-colors">Words/Sent:</span> <div class="flex items-center gap-1"><span id="sum-wps" class="score-value pointer-events-none">0</span> <span id="sum-wps-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Comp. Grade')"><span class="score-label group-hover:text-blue-600 transition-colors">Comp. Grade:</span> <div class="flex items-center gap-1"><span id="sum-grade" class="score-value pointer-events-none">0.0</span> <span id="sum-grade-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="window.explain('Simple %')"><span class="score-label group-hover:text-blue-600 transition-colors">Simple %:</span> <div class="flex items-center gap-1"><span id="sum-simple" class="score-value pointer-events-none">0%</span> <span id="sum-simple-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
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
        
        // NEW: THE "WAKE-UP" CATCH-UP CHECK
        if (window.thps_lastPayload) {
            setTimeout(() => this.update(window.thps_lastPayload), 50);
        }

    }

    update(data) {
        if (!data || data.totalPoints === undefined) return;

        const setEval = (id, text, colorClass) => {
            const el = this.querySelector(`#${id}`);
            if(el) { 
                el.textContent = text; 
                el.className = `text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${colorClass} ml-1 pointer-events-none`; 
            }
        };

        const evalColor = (status) => {
            if(status === 'just right' || status === 'pretty good!') return 'bg-green-100 text-green-700';
            if(status.includes('too') || status.includes('slow') || status.includes('strain') || status === 'not enough') return 'bg-red-100 text-red-700';
            return 'bg-amber-100 text-amber-700';
        };

        // 1. Content
        this.querySelector('#sum-personal').textContent = `${data.personal}%`;
        let pStatus = 'just right'; 
        if (data.personal < 30) pStatus = 'not enough'; 
        else if (data.personal > 60) pStatus = 'too much'; 
        setEval('sum-personal-eval', pStatus, evalColor(pStatus));

        this.querySelector('#sum-visual').textContent = `${data.visual}%`;
        let vStatus = 'just right'; 
        if (data.visual < 20) vStatus = 'not enough'; 
        else if (data.visual > 50) vStatus = 'too much'; 
        setEval('sum-visual-eval', vStatus, evalColor(vStatus));

        this.querySelector('#sum-intangible').textContent = `${data.intangible}%`;
        let iStatus = 'just right'; 
        if (data.intangible > 45) iStatus = 'too much'; 
        else if (data.intangible >= 30) iStatus = 'bit much'; 
        setEval('sum-intangible-eval', iStatus, evalColor(iStatus));

        // 2. Delivery
        if (data.recordedAudio && data.time > 0) {
            this.querySelector('#sum-wpm').textContent = data.wpm;
            let wpmStatus = 'just right'; 
            if (data.wpm < 100) wpmStatus = 'speed up'; 
            else if (data.wpm > 150) wpmStatus = 'strain'; 
            setEval('sum-wpm-eval', wpmStatus, evalColor(wpmStatus));

            this.querySelector('#sum-sps').textContent = data.sps.toFixed(1);
            let spsStatus = 'just right'; 
            if (data.sps < 3) spsStatus = 'speed up'; 
            else if (data.sps > 5) spsStatus = 'strain'; 
            setEval('sum-sps-eval', spsStatus, evalColor(spsStatus));

            this.querySelector('#sum-pause').textContent = `${data.pause.toFixed(0)}%`;
            let pzStatus = 'just right'; 
            if (data.pause < 10) pzStatus = 'too little'; 
            else if (data.pause > 30) pzStatus = 'too much'; 
            setEval('sum-pause-eval', pzStatus, evalColor(pzStatus));
        } else {
            this.querySelector('#sum-wpm').textContent = "-";
            this.querySelector('#sum-sps').textContent = "-";
            this.querySelector('#sum-pause').textContent = "-";
            setEval('sum-wpm-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('sum-sps-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('sum-pause-eval', 'Text Only', 'bg-slate-100 text-slate-500');
        }

        // 3. Simplicity
        this.querySelector('#sum-wps').textContent = data.wps.toFixed(1);
        let wpsStatus = 'just right'; 
        if (data.wps < 5) wpsStatus = 'simple'; 
        else if (data.wps > 15) wpsStatus = 'complex'; 
        setEval('sum-wps-eval', wpsStatus, evalColor(wpsStatus));

        this.querySelector('#sum-grade').textContent = data.grade.toFixed(1);
        let gradeStatus = 'just right'; 
        if (data.grade < 5) gradeStatus = 'simple'; 
        else if (data.grade > 10) gradeStatus = 'complex'; 
        setEval('sum-grade-eval', gradeStatus, evalColor(gradeStatus));

        this.querySelector('#sum-simple').textContent = `${data.simple}%`;
        let simpleStatus = 'just right'; 
        if (data.simple < 85) simpleStatus = 'complex'; 
        else if (data.simple > 95) simpleStatus = 'simple'; 
        setEval('sum-simple-eval', simpleStatus, evalColor(simpleStatus));
        
        // Final Grade Output
        if (data.overrideGrade) {
            this.querySelector('#sum-overallGrade').textContent = "- / 10";
            this.querySelector('#sum-time').textContent = "-";
        } else {
            let formattedScore = data.totalPoints % 1 === 0 ? data.totalPoints : data.totalPoints.toFixed(2);
            this.querySelector('#sum-overallGrade').textContent = `${formattedScore} / 10`;
            this.querySelector('#sum-time').textContent = `${data.time.toFixed(0)}s`;
        }
    }
}

customElements.define('thps-score-summary', ThpsScoreSummary);

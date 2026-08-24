// ==========================================
// THPS WIDGET: LARGE SCORE SUMMARY
// Listens to the Dashboard Broadcast and grades the speech
// ==========================================

class ThpsScoreSummary extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-slate-800 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move flex flex-col">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 border-slate-100 gap-4 pr-6">
                    <h2 class="text-lg font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onclick="this.closest('thps-score-summary').triggerMetricSelect('Score Summary', 'grade')">Score Summary</h2>
                    <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors" onclick="this.closest('thps-score-summary').triggerMetricSelect('Green Score', 'greenScore')">
                            <span class="text-xs font-bold text-slate-500 uppercase pointer-events-none">Greens:</span>
                            <span id="sum-greens" class="font-bold text-slate-800 text-sm pointer-events-none">- / 10</span>
                        </div>
                        <div class="text-base font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg shadow-inner cursor-pointer hover:bg-blue-100 transition-colors" onclick="this.closest('thps-score-summary').triggerMetricSelect('Grade', 'grade')">
                            Grade: <span id="sum-overallGrade" class="text-blue-600 pointer-events-none">- / 100</span>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-2">
                    <!-- Content -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-score-summary').triggerMetricSelect('Content', 'grade')">Content</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Personal', 'personal')"><span class="score-label group-hover:text-blue-600 transition-colors">Personal:</span> <div class="flex items-center gap-1"><span id="sum-personal" class="score-value pointer-events-none">0%</span> <span id="sum-personal-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Visual', 'visual')"><span class="score-label group-hover:text-blue-600 transition-colors">Visual:</span> <div class="flex items-center gap-1"><span id="sum-visual" class="score-value pointer-events-none">0%</span> <span id="sum-visual-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Intangible', 'intangible')"><span class="score-label group-hover:text-blue-600 transition-colors">Intangible:</span> <div class="flex items-center gap-1"><span id="sum-intangible" class="score-value pointer-events-none">0%</span> <span id="sum-intangible-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                    </div>
                    <!-- Delivery -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-score-summary').triggerMetricSelect('Delivery', 'grade')">Delivery</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Words/min', 'wpm')"><span class="score-label group-hover:text-blue-600 transition-colors">Words/min:</span> <div class="flex items-center gap-1"><span id="sum-wpm" class="score-value pointer-events-none">-</span> <span id="sum-wpm-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Syllable/sec', 'sps')"><span class="score-label group-hover:text-blue-600 transition-colors">Syllable/sec:</span> <div class="flex items-center gap-1"><span id="sum-sps" class="score-value pointer-events-none">-</span> <span id="sum-sps-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Pause %', 'pause')"><span class="score-label group-hover:text-blue-600 transition-colors">Pause %:</span> <div class="flex items-center gap-1"><span id="sum-pause" class="score-value pointer-events-none">-</span> <span id="sum-pause-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                    </div>
                    <!-- Simplicity -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-score-summary').triggerMetricSelect('Simplicity', 'grade')">Simplicity</h3>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Runtime', 'runtime')"><span class="score-label group-hover:text-blue-600 transition-colors">Runtime:</span> <div class="flex items-center gap-1"><span id="sum-runtime" class="score-value pointer-events-none">0.0s</span> <span id="sum-runtime-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Comp. Grade', 'grade')"><span class="score-label group-hover:text-blue-600 transition-colors">Comp. Grade:</span> <div class="flex items-center gap-1"><span id="sum-grade" class="score-value pointer-events-none">0.0</span> <span id="sum-grade-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                        <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-score-summary').triggerMetricSelect('Simple %', 'simple')"><span class="score-label group-hover:text-blue-600 transition-colors">Simple %:</span> <div class="flex items-center gap-1"><span id="sum-simple" class="score-value pointer-events-none">0%</span> <span id="sum-simple-eval" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                    </div>
                </div>
                
                <!-- LOCAL EXPLAINER BOX -->
                <div class="mt-auto pt-4 border-t border-slate-100 flex flex-col w-full">
                    <div class="w-full min-h-[80px] sm:min-h-[60px] max-h-[100px] overflow-y-auto styled-scrollbar pr-2">
                        <span id="local-explanation-title" class="text-xs font-black text-slate-700 uppercase tracking-widest mr-1">Score Summary:</span>
                        <span id="local-explanation-content" class="text-xs font-medium text-slate-500 leading-relaxed">Loading explanation...</span>
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

        this.showLocalExplanation('Score Summary');
    }

    // NEW: Dual-action method to show explanation AND broadcast state to Progress Graph
    triggerMetricSelect(term, key) {
        this.showLocalExplanation(term);
        window.dispatchEvent(new CustomEvent('thps-metric-select', { detail: key }));
    }

    showLocalExplanation(term) {
        const titleEl = this.querySelector('#local-explanation-title');
        const contentEl = this.querySelector('#local-explanation-content');
        if (!titleEl || !contentEl) return;

        titleEl.innerText = term + ':';
        contentEl.innerHTML = `<span class="animate-pulse">Loading...</span>`;

        setTimeout(() => {
            let text = (window.explanationsData && window.explanationsData[term]) 
                       ? window.explanationsData[term] 
                       : (window.FALLBACK_EXPLANATIONS && window.FALLBACK_EXPLANATIONS[term] 
                            ? window.FALLBACK_EXPLANATIONS[term] 
                            : `Explanation for "${term}" will appear here soon.`);
            contentEl.innerHTML = text;
        }, 100);
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

        const formatBadge = (pts) => pts === 10 ? "+10" : "+" + pts.toFixed(1);

        const getBadgeStyle = (pts) => {
            if (pts === 10) return 'bg-green-100 text-green-700';
            if (pts >= 5.0) return 'bg-amber-100 text-amber-700';
            return 'bg-red-100 text-red-700';
        };

        // 1. Content
        this.querySelector('#sum-personal').textContent = `${data.personal}%`;
        let pPts = window.getMetricPoints ? window.getMetricPoints('personal', data.personal) : 0;
        setEval('sum-personal-eval', formatBadge(pPts), getBadgeStyle(pPts));

        this.querySelector('#sum-visual').textContent = `${data.visual}%`;
        let vPts = window.getMetricPoints ? window.getMetricPoints('visual', data.visual) : 0;
        setEval('sum-visual-eval', formatBadge(vPts), getBadgeStyle(vPts));

        this.querySelector('#sum-intangible').textContent = `${data.intangible}%`;
        let iPts = window.getMetricPoints ? window.getMetricPoints('intangible', data.intangible) : 0;
        setEval('sum-intangible-eval', formatBadge(iPts), getBadgeStyle(iPts));

        // 2. Delivery
        if (data.recordedAudio && !data.overrideGrade) {
            this.querySelector('#sum-wpm').textContent = data.wpm;
            let wpmPts = window.getMetricPoints('wpm', data.wpm);
            setEval('sum-wpm-eval', formatBadge(wpmPts), getBadgeStyle(wpmPts));

            this.querySelector('#sum-sps').textContent = data.sps.toFixed(1);
            let spsPts = window.getMetricPoints('sps', data.sps);
            setEval('sum-sps-eval', formatBadge(spsPts), getBadgeStyle(spsPts));

            this.querySelector('#sum-pause').textContent = `${(data.pause || 0).toFixed(0)}%`;
            let pausePts = window.getMetricPoints('pause', data.pause || 0);
            setEval('sum-pause-eval', formatBadge(pausePts), getBadgeStyle(pausePts));
        } else {
            this.querySelector('#sum-wpm').textContent = "-";
            this.querySelector('#sum-sps').textContent = "-";
            this.querySelector('#sum-pause').textContent = "-";
            setEval('sum-wpm-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('sum-sps-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('sum-pause-eval', 'Text Only', 'bg-slate-100 text-slate-500');
        }

        // 3. Simplicity
        if (data.recordedAudio && !data.overrideGrade) {
            const runtimeVal = data.runtime !== undefined ? data.runtime : 0;
            this.querySelector('#sum-runtime').textContent = `${runtimeVal.toFixed(1)}s`;
            let rPts = window.getMetricPoints('runtime', runtimeVal);
            setEval('sum-runtime-eval', formatBadge(rPts), getBadgeStyle(rPts));
        } else {
            this.querySelector('#sum-runtime').textContent = "-";
            setEval('sum-runtime-eval', 'Text Only', 'bg-slate-100 text-slate-500');
        }

        this.querySelector('#sum-grade').textContent = data.grade.toFixed(1);
        let gPts = window.getMetricPoints ? window.getMetricPoints('grade', data.grade) : 0;
        setEval('sum-grade-eval', formatBadge(gPts), getBadgeStyle(gPts));

        this.querySelector('#sum-simple').textContent = `${data.simple}%`;
        let sPts = window.getMetricPoints ? window.getMetricPoints('simple', data.simple) : 0;
        setEval('sum-simple-eval', formatBadge(sPts), getBadgeStyle(sPts));
        
        // Final Output
        if (data.overrideGrade) {
            this.querySelector('#sum-overallGrade').textContent = "- / 100";
            this.querySelector('#sum-greens').textContent = "- / 10";
        } else {
            this.querySelector('#sum-overallGrade').textContent = `${data.totalPoints.toFixed(1)} / 100`;
            this.querySelector('#sum-greens').textContent = `${data.greenScore || 0} / 10`;
        }
    }
}

customElements.define('thps-score-summary', ThpsScoreSummary);

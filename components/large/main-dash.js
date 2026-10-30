// ==========================================
// THPS WIDGET: MAIN DASHBOARD (Trackman Style)
// Consolidates Summary, Progress, MoE Dispersion, and History
// ==========================================

class ThpsMainDash extends HTMLElement {
    constructor() {
        super();
        this.activeTab = 'summary'; 
        this.chart = null;
        this.currentMetric = 'grade';
        this.latestData = null;

        // Unified Metric Configuration
        this.METRIC_CONFIG = {
            'grade': { key: 'totalPoints', title: 'Overall', min: 0, max: 100, zones: [ { min: 80, max: 100, color: 'rgba(34, 197, 94, 0.12)' }, { min: 65, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 0, max: 65, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'greenScore': { key: 'greenScore', title: 'Greens', min: 0, max: 10, zones: [ { min: 8, max: 10, color: 'rgba(34, 197, 94, 0.12)' }, { min: 5, max: 8, color: 'rgba(234, 179, 8, 0.12)' }, { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'personal': { key: 'personal', title: 'Personal', min: 0, max: 100, zones: [ { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' }, { min: 10, max: 30, color: 'rgba(234, 179, 8, 0.12)' }, { min: 30, max: 60, color: 'rgba(34, 197, 94, 0.12)' }, { min: 60, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 80, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'visual': { key: 'visual', title: 'Visual', min: 0, max: 100, zones: [ { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' }, { min: 10, max: 20, color: 'rgba(234, 179, 8, 0.12)' }, { min: 20, max: 50, color: 'rgba(34, 197, 94, 0.12)' }, { min: 50, max: 60, color: 'rgba(234, 179, 8, 0.12)' }, { min: 60, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'intangible': { key: 'intangible', title: 'Intangible', min: 0, max: 100, zones: [ { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' }, { min: 5, max: 10, color: 'rgba(234, 179, 8, 0.12)' }, { min: 10, max: 30, color: 'rgba(34, 197, 94, 0.12)' }, { min: 30, max: 50, color: 'rgba(234, 179, 8, 0.12)' }, { min: 50, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'wpm': { key: 'wpm', title: 'Words/Min', min: 50, max: 200, zones: [ { min: 0, max: 85, color: 'rgba(239, 68, 68, 0.12)' }, { min: 85, max: 100, color: 'rgba(234, 179, 8, 0.12)' }, { min: 100, max: 150, color: 'rgba(34, 197, 94, 0.12)' }, { min: 150, max: 170, color: 'rgba(234, 179, 8, 0.12)' }, { min: 170, max: 300, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'sps': { key: 'sps', title: 'Syll/Sec', min: 2.0, max: 6.0, zones: [ { min: 0, max: 3.0, color: 'rgba(239, 68, 68, 0.12)' }, { min: 3.0, max: 3.5, color: 'rgba(234, 179, 8, 0.12)' }, { min: 3.5, max: 4.5, color: 'rgba(34, 197, 94, 0.12)' }, { min: 4.5, max: 5.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 5.0, max: 10, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'pause': { key: 'pause', title: 'Pause', min: 0, max: 60, zones: [ { min: 0, max: 9, color: 'rgba(239, 68, 68, 0.12)' }, { min: 9, max: 15, color: 'rgba(234, 179, 8, 0.12)' }, { min: 15, max: 35, color: 'rgba(34, 197, 94, 0.12)' }, { min: 35, max: 41, color: 'rgba(234, 179, 8, 0.12)' }, { min: 41, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'runtime': { key: 'runtime', title: 'Runtime', min: 0, max: 12, zones: [ { min: 0, max: 2.0, color: 'rgba(239, 68, 68, 0.12)' }, { min: 2.0, max: 3.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 3.0, max: 6.0, color: 'rgba(34, 197, 94, 0.12)' }, { min: 6.0, max: 9.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 9.0, max: 30, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'simple': { key: 'simple', title: 'Simple', min: 50, max: 100, zones: [ { min: 0, max: 70, color: 'rgba(239, 68, 68, 0.12)' }, { min: 70, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 80, max: 90, color: 'rgba(34, 197, 94, 0.12)' }, { min: 90, max: 96, color: 'rgba(234, 179, 8, 0.12)' }, { min: 96, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] }
        };
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-0 rounded-2xl border-t-4 border-slate-800 shadow-lg transition-colors duration-300 relative w-full h-full group cursor-move flex flex-col min-h-[420px] overflow-hidden bg-white">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex border-b border-slate-200 bg-slate-50 pt-2 px-2 gap-1 overflow-x-auto styled-scrollbar">
                    <button class="dash-tab-btn px-4 py-2 text-sm font-black tracking-wide rounded-t-xl transition-colors text-blue-600 bg-white border-t border-l border-r border-slate-200 shadow-sm relative z-10" data-tab="summary">Summary</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b border-transparent" data-tab="progress">Progress</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b border-transparent" data-tab="moe">MoE</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b border-transparent" data-tab="history">History <span class="history-count-badge ml-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">0</span></button>
                </div>

                <div class="p-5 sm:p-6 flex-1 flex flex-col relative w-full h-full overflow-hidden">
                    
                    <!-- TAB 1: SUMMARY -->
                    <div id="dash-view-summary" class="dash-view block w-full h-full flex-col">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 border-slate-100 gap-4 pr-6">
                            <h2 class="text-lg font-bold text-slate-800">Score Summary</h2>
                            <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <span class="text-xs font-bold text-slate-500 uppercase">Greens:</span>
                                    <span class="dash-greens font-bold text-slate-800 text-sm">- / 10</span>
                                </div>
                                <div class="text-base font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg shadow-inner">
                                    Grade: <span class="dash-overallGrade text-blue-600">- / 100</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-2">
                            <div class="space-y-3">
                                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-main-dash').triggerMetricSelect('Content', 'grade')">Content</h3>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Personal', 'personal')"><span class="score-label group-hover:text-blue-600 transition-colors">Personal:</span> <div class="flex items-center gap-1"><span class="dash-personal score-value pointer-events-none">0%</span> <span class="dash-personal-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Visual', 'visual')"><span class="score-label group-hover:text-blue-600 transition-colors">Visual:</span> <div class="flex items-center gap-1"><span class="dash-visual score-value pointer-events-none">0%</span> <span class="dash-visual-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Intangible', 'intangible')"><span class="score-label group-hover:text-blue-600 transition-colors">Intangible:</span> <div class="flex items-center gap-1"><span class="dash-intangible score-value pointer-events-none">0%</span> <span class="dash-intangible-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                            </div>
                            <div class="space-y-3">
                                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-main-dash').triggerMetricSelect('Delivery', 'grade')">Delivery</h3>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Words/min', 'wpm')"><span class="score-label group-hover:text-blue-600 transition-colors">Words/min:</span> <div class="flex items-center gap-1"><span class="dash-wpm score-value pointer-events-none">-</span> <span class="dash-wpm-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Syllable/sec', 'sps')"><span class="score-label group-hover:text-blue-600 transition-colors">Syllable/sec:</span> <div class="flex items-center gap-1"><span class="dash-sps score-value pointer-events-none">-</span> <span class="dash-sps-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Pause %', 'pause')"><span class="score-label group-hover:text-blue-600 transition-colors">Pause %:</span> <div class="flex items-center gap-1"><span class="dash-pause score-value pointer-events-none">-</span> <span class="dash-pause-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                            </div>
                            <div class="space-y-3">
                                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 cursor-pointer hover:text-blue-600 transition-colors inline-block" onclick="this.closest('thps-main-dash').triggerMetricSelect('Simplicity', 'grade')">Simplicity</h3>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Runtime', 'runtime')"><span class="score-label group-hover:text-blue-600 transition-colors">Runtime:</span> <div class="flex items-center gap-1"><span class="dash-runtime score-value pointer-events-none">0.0s</span> <span class="dash-runtime-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Comp. Grade', 'grade')"><span class="score-label group-hover:text-blue-600 transition-colors">Comp. Grade:</span> <div class="flex items-center gap-1"><span class="dash-grade score-value pointer-events-none">0.0</span> <span class="dash-grade-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                                <div class="score-row cursor-pointer hover:bg-slate-100 p-1 -mx-1 rounded transition-colors group" onclick="this.closest('thps-main-dash').triggerMetricSelect('Simple %', 'simple')"><span class="score-label group-hover:text-blue-600 transition-colors">Simple %:</span> <div class="flex items-center gap-1"><span class="dash-simple score-value pointer-events-none">0%</span> <span class="dash-simple-eval text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none">WAITING</span></div></div>
                            </div>
                        </div>
                        <div class="mt-auto pt-4 border-t border-slate-100 flex flex-col w-full">
                            <div class="w-full min-h-[60px] max-h-[100px] overflow-y-auto styled-scrollbar pr-2 flex items-start gap-1">
                                <span class="dash-explainer-title text-xs font-black text-slate-700 uppercase tracking-widest shrink-0">Score Summary:</span>
                                <span class="dash-explainer-content text-xs font-medium text-slate-500 leading-relaxed">Loading explanation...</span>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: PROGRESS -->
                    <div id="dash-view-progress" class="dash-view hidden w-full h-full flex-col">
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm pointer-events-none">
                                    <i data-lucide="line-chart" class="w-4 h-4"></i>
                                </div>
                                <h2 class="text-lg font-bold text-slate-800">Historical Progress</h2>
                            </div>
                            <div class="dash-progress-label text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-widest shadow-inner whitespace-nowrap">
                                Overall Grade
                            </div>
                        </div>
                        
                        <div class="flex w-full gap-2 overflow-x-auto styled-scrollbar pb-3 mb-2 border-b border-slate-100 dash-progress-selectors">
                            <!-- Injected by JS -->
                        </div>

                        <div class="flex-1 w-full relative min-h-[220px]">
                            <canvas class="dash-progress-canvas"></canvas>
                            <div class="dash-progress-empty absolute inset-0 flex items-center justify-center bg-white z-10 transition-all duration-300">
                                <p class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <i data-lucide="activity" class="w-4 h-4"></i> Complete an attempt to plot data
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: MoE DISPERSION -->
                    <div id="dash-view-moe" class="dash-view hidden w-full h-full flex-col">
                        <div class="flex justify-between items-center mb-4 border-b pb-4 border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm pointer-events-none">
                                    <i data-lucide="target" class="w-4 h-4"></i>
                                </div>
                                <h2 class="text-lg font-bold text-slate-800">Margin of Error</h2>
                            </div>
                            <p class="text-[10px] uppercase font-bold text-slate-400">Green zone centered.</p>
                        </div>
                        <div class="flex-1 w-full relative">
                            <!-- The grid is now pinned absolutely to fill the flexible wrapper -->
                            <div class="dash-moe-grid absolute inset-0 flex flex-col md:flex-row gap-4 md:gap-2 justify-between overflow-y-auto md:overflow-hidden pb-4 md:pb-0">
                                <!-- Tracks will be injected here via JS -->
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: HISTORY -->
                    <div id="dash-view-history" class="dash-view hidden w-full h-full flex-col">
                        <div class="flex justify-between items-center mb-4 border-b pb-4 border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm pointer-events-none">
                                    <i data-lucide="history" class="w-4 h-4"></i>
                                </div>
                                <h2 class="text-lg font-bold text-slate-800">Session History</h2>
                            </div>
                            <button onclick="window.handleHistoryDownload('pdf')" class="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1">
                                <i data-lucide="file-text" class="w-3 h-3"></i> Export
                            </button>
                        </div>
                        <div class="dash-history-list flex-1 w-full overflow-y-auto styled-scrollbar space-y-3 pr-2">
                            <!-- History items injected here -->
                        </div>
                    </div>

                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        if (window.Chart && !window.Chart.registry.plugins.get('zoneBackground')) {
            window.Chart.register({
                id: 'zoneBackground',
                beforeDraw: (chart) => {
                    const zones = chart.config.options.plugins.zoneBackground?.zones;
                    if (!zones) return;
                    const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
                    ctx.save();
                    zones.forEach(zone => {
                        const yTopPixel = Math.max(top, y.getPixelForValue(zone.max));
                        const yBottomPixel = Math.min(bottom, y.getPixelForValue(zone.min));
                        const height = yBottomPixel - yTopPixel;
                        if (height > 0) {
                            ctx.fillStyle = zone.color;
                            ctx.fillRect(left, yTopPixel, right - left, height);
                        }
                    });
                    ctx.restore();
                }
            });
        }

        this.buildProgressSelectors();

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        this.querySelectorAll('.dash-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        this.updateHandler = (e) => {
            this.latestData = e.detail;
            this.updateSummary(this.latestData);
            this.updateHistoryCount();
            if (this.activeTab === 'progress') this.renderChart();
            if (this.activeTab === 'moe') this.renderMoE();
            if (this.activeTab === 'history') this.renderHistoryList();
        };

        window.addEventListener('thps-dashboard-update', this.updateHandler);
        
        if (window.thps_lastPayload) {
            this.latestData = window.thps_lastPayload;
            setTimeout(() => this.updateHandler({ detail: this.latestData }), 50);
        }
        this.showLocalExplanation('Score Summary');
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
        if (this.chart) this.chart.destroy();
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        this.querySelectorAll('.dash-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = "dash-tab-btn px-4 py-2 text-sm font-black tracking-wide rounded-t-xl transition-colors text-blue-600 bg-white border-t border-l border-r border-slate-200 shadow-sm relative z-10";
            } else {
                btn.className = "dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b border-transparent";
            }
        });

        this.querySelectorAll('.dash-view').forEach(view => view.classList.add('hidden'));
        this.querySelector(`#dash-view-${tabName}`).classList.remove('hidden');

        if (tabName === 'progress') this.renderChart();
        if (tabName === 'moe') this.renderMoE();
        if (tabName === 'history') this.renderHistoryList();
    }

    triggerMetricSelect(term, key) {
        this.showLocalExplanation(term);
        if (this.METRIC_CONFIG[key]) {
            this.currentMetric = key;
            this.switchTab('progress');
        }
    }

    showLocalExplanation(term) {
        const titleEl = this.querySelector('.dash-explainer-title');
        const contentEl = this.querySelector('.dash-explainer-content');
        if (!titleEl || !contentEl) return;
        titleEl.innerText = term + ':';
        contentEl.innerHTML = `<span class="animate-pulse">Loading...</span>`;
        setTimeout(() => {
            let text = (window.explanationsData && window.explanationsData[term]) ? window.explanationsData[term] : (window.FALLBACK_EXPLANATIONS && window.FALLBACK_EXPLANATIONS[term] ? window.FALLBACK_EXPLANATIONS[term] : `Explanation for "${term}" will appear here soon.`);
            contentEl.innerHTML = text;
        }, 100);
    }

    updateSummary(data) {
        if (!data || data.totalPoints === undefined) return;
        const setEval = (cls, text, colorClass) => {
            const el = this.querySelector(`.${cls}`);
            if(el) { el.textContent = text; el.className = `${cls} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${colorClass} ml-1 pointer-events-none`; }
        };
        const formatBadge = (pts) => pts === 10 ? "+10" : "+" + pts.toFixed(1);
        const getBadgeStyle = (pts) => pts === 10 ? 'bg-green-100 text-green-700' : (pts >= 5.0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700');

        this.querySelector('.dash-personal').textContent = `${data.personal}%`;
        let pPts = window.getMetricPoints ? window.getMetricPoints('personal', data.personal) : 0;
        setEval('dash-personal-eval', formatBadge(pPts), getBadgeStyle(pPts));

        this.querySelector('.dash-visual').textContent = `${data.visual}%`;
        let vPts = window.getMetricPoints ? window.getMetricPoints('visual', data.visual) : 0;
        setEval('dash-visual-eval', formatBadge(vPts), getBadgeStyle(vPts));

        this.querySelector('.dash-intangible').textContent = `${data.intangible}%`;
        let iPts = window.getMetricPoints ? window.getMetricPoints('intangible', data.intangible) : 0;
        setEval('dash-intangible-eval', formatBadge(iPts), getBadgeStyle(iPts));

        if (data.recordedAudio && !data.overrideGrade) {
            this.querySelector('.dash-wpm').textContent = data.wpm;
            let wpmPts = window.getMetricPoints('wpm', data.wpm);
            setEval('dash-wpm-eval', formatBadge(wpmPts), getBadgeStyle(wpmPts));

            this.querySelector('.dash-sps').textContent = data.sps.toFixed(1);
            let spsPts = window.getMetricPoints('sps', data.sps);
            setEval('dash-sps-eval', formatBadge(spsPts), getBadgeStyle(spsPts));

            this.querySelector('.dash-pause').textContent = `${(data.pause || 0).toFixed(0)}%`;
            let pausePts = window.getMetricPoints('pause', data.pause || 0);
            setEval('dash-pause-eval', formatBadge(pausePts), getBadgeStyle(pausePts));

            const runtimeVal = data.runtime !== undefined ? data.runtime : 0;
            this.querySelector('.dash-runtime').textContent = `${runtimeVal.toFixed(1)}s`;
            let rPts = window.getMetricPoints('runtime', runtimeVal);
            setEval('dash-runtime-eval', formatBadge(rPts), getBadgeStyle(rPts));
        } else {
            this.querySelector('.dash-wpm').textContent = "-";
            this.querySelector('.dash-sps').textContent = "-";
            this.querySelector('.dash-pause').textContent = "-";
            this.querySelector('.dash-runtime').textContent = "-";
            setEval('dash-wpm-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('dash-sps-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('dash-pause-eval', 'Text Only', 'bg-slate-100 text-slate-500');
            setEval('dash-runtime-eval', 'Text Only', 'bg-slate-100 text-slate-500');
        }

        this.querySelector('.dash-grade').textContent = data.grade.toFixed(1);
        let gPts = window.getMetricPoints ? window.getMetricPoints('grade', data.grade) : 0;
        setEval('dash-grade-eval', formatBadge(gPts), getBadgeStyle(gPts));

        this.querySelector('.dash-simple').textContent = `${data.simple}%`;
        let sPts = window.getMetricPoints ? window.getMetricPoints('simple', data.simple) : 0;
        setEval('dash-simple-eval', formatBadge(sPts), getBadgeStyle(sPts));
        
        if (data.overrideGrade) {
            this.querySelector('.dash-overallGrade').textContent = "- / 100";
            this.querySelector('.dash-greens').textContent = "- / 10";
        } else {
            this.querySelector('.dash-overallGrade').textContent = `${data.totalPoints.toFixed(1)} / 100`;
            this.querySelector('.dash-greens').textContent = `${data.greenScore || 0} / 10`;
        }
    }

    buildProgressSelectors() {
        const container = this.querySelector('.dash-progress-selectors');
        Object.keys(this.METRIC_CONFIG).forEach(key => {
            const btn = document.createElement('button');
            btn.className = `prog-pill px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap border ${this.currentMetric === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`;
            btn.innerText = this.METRIC_CONFIG[key].title;
            btn.onclick = () => {
                this.currentMetric = key;
                this.querySelectorAll('.prog-pill').forEach(p => p.className = "prog-pill px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap border bg-white text-slate-500 border-slate-200 hover:bg-slate-50");
                btn.className = "prog-pill px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap border bg-blue-600 text-white border-blue-600";
                this.renderChart();
            };
            container.appendChild(btn);
        });
    }

    renderChart() {
        if (!window.Chart || this.activeTab !== 'progress') return;
        const history = window.thps_sessionHistory || [];
        const emptyState = this.querySelector('.dash-progress-empty');
        
        if (history.length === 0) {
            emptyState.classList.remove('hidden');
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        const config = this.METRIC_CONFIG[this.currentMetric];
        this.querySelector('.dash-progress-label').innerText = config.title;
        this.querySelectorAll('.prog-pill').forEach(p => {
            if (p.innerText === config.title) p.className = "prog-pill px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap border bg-blue-600 text-white border-blue-600";
            else p.className = "prog-pill px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap border bg-white text-slate-500 border-slate-200 hover:bg-slate-50";
        });

        const chronologicalHistory = [...history].reverse();
        const labels = chronologicalHistory.map(h => `Att ${h.id}`);
        const dataPoints = chronologicalHistory.map(h => h[config.key] !== undefined ? h[config.key] : null);

        const canvas = this.querySelector('.dash-progress-canvas');
        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].label = config.title;
            this.chart.data.datasets[0].data = dataPoints;
            this.chart.options.scales.y.min = config.min;
            this.chart.options.scales.y.max = config.max;
            this.chart.options.plugins.zoneBackground = { zones: config.zones };
            this.chart.update();
        } else {
            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: config.title, data: dataPoints, borderColor: 'rgba(15, 23, 42, 0.4)', borderWidth: 1.5,
                        borderDash: [5, 5], pointBackgroundColor: '#0f172a', pointBorderColor: '#0f172a',
                        pointRadius: 5, pointHoverRadius: 7, fill: false, tension: 0.1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 10 }, bodyFont: { size: 13, weight: 'bold' }, padding: 10, displayColors: false },
                        zoneBackground: { zones: config.zones }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
                        y: { min: config.min, max: config.max, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } }
                    },
                    animation: { duration: 400, easing: 'easeOutQuart' }
                }
            });
        }
    }

    getSymmetricBounds(config) {
        const greenZone = config.zones.find(z => z.color.includes('197, 94'));
        const center = greenZone ? (greenZone.min + greenZone.max) / 2 : (config.min + config.max) / 2;
        const maxDist = Math.max(center - config.min, config.max - center);
        return { visMin: center - maxDist, visMax: center + maxDist, center: center, visRange: maxDist * 2 };
    }

    renderMoE() {
        if (!this.latestData || this.activeTab !== 'moe') return;
        const grid = this.querySelector('.dash-moe-grid');
        grid.innerHTML = '';

        const metricsToMap = ['personal', 'visual', 'intangible', 'wpm', 'sps', 'pause', 'runtime', 'grade', 'simple'];
        const history = window.thps_sessionHistory || [];

        metricsToMap.forEach(key => {
            const config = this.METRIC_CONFIG[key];
            const bounds = this.getSymmetricBounds(config);
            
            let gradientStops = [];
            config.zones.forEach(zone => {
                let startPct = Math.max(0, Math.min(100, ((zone.min - bounds.visMin) / bounds.visRange) * 100));
                let endPct = Math.max(0, Math.min(100, ((zone.max - bounds.visMin) / bounds.visRange) * 100));
                const solidColor = zone.color.includes('197') ? '#dcfce7' : (zone.color.includes('179') ? '#fef08a' : '#fee2e2');
                gradientStops.push(`${solidColor} ${startPct}%`, `${solidColor} ${endPct}%`);
            });

            let dotsHtml = '';
            let usedPercentages = [];
            
            [...history].reverse().forEach((attempt) => {
                const rawVal = attempt[config.key];
                const hideDot = (rawVal === null || rawVal === undefined || (['wpm', 'sps', 'pause', 'runtime'].includes(key) && !attempt.recordedAudio));
                
                if (!hideDot) {
                    let dotPct = Math.max(0, Math.min(100, ((rawVal - bounds.visMin) / bounds.visRange) * 100));
                    let dotPctRounded = Math.round(dotPct);
                    
                    let dodgeOffset = 0;
                    const collisions = usedPercentages.filter(p => Math.abs(p - dotPctRounded) < 2).length;
                    if (collisions > 0) {
                        dodgeOffset = collisions % 2 === 0 ? (collisions * 4) : -(collisions * 4);
                    }
                    usedPercentages.push(dotPctRounded);

                    const isActive = attempt.id === this.latestData.id;
                    const dotClass = isActive ? 'bg-slate-800 border-white z-20 w-4 h-4' : 'bg-slate-400 border-slate-200 z-10 w-3 h-3 opacity-80';

                    dotsHtml += `
                        <div class="absolute rounded-full shadow-md border-2 transition-all duration-300 ease-out dot-mobile block md:hidden ${dotClass}" 
                             style="top: calc(50% + ${dodgeOffset}px); left: ${dotPct}%; transform: translate(-50%, -50%);" title="Att ${attempt.id}: ${rawVal}"></div>
                        <div class="absolute rounded-full shadow-md border-2 transition-all duration-300 ease-out dot-desktop hidden md:block ${dotClass}" 
                             style="left: calc(50% + ${dodgeOffset}px); bottom: ${dotPct}%; transform: translate(-50%, 50%);" title="Att ${attempt.id}: ${rawVal}"></div>
                    `;
                }
            });

            const track = document.createElement('div');
            track.className = "flex-1 flex flex-row md:flex-col items-center relative group w-full h-full";
            track.innerHTML = `
                <div class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase text-left md:text-center w-20 md:w-full shrink-0 mb-0 md:mb-2 md:mr-0 pr-2 md:pr-0 truncate">${config.title.split(' ')[0]}</div>
                <div class="flex-1 w-full relative rounded-md overflow-hidden bg-slate-100 h-8 md:h-full md:w-10 shadow-inner">
                     <div class="absolute inset-0 hidden md:block" style="background: linear-gradient(to top, ${gradientStops.join(', ')});"></div>
                     <div class="absolute inset-0 block md:hidden" style="background: linear-gradient(to right, ${gradientStops.join(', ')});"></div>
                     <div class="absolute bg-white/70 md:w-full md:h-[2px] w-[2px] h-full z-0" style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                     ${dotsHtml}
                </div>
            `;
            grid.appendChild(track);
        });
    }

    // --- HISTORY ---
    updateHistoryCount() {
        const count = window.thps_sessionHistory ? window.thps_sessionHistory.length : 0;
        this.querySelectorAll('.history-count-badge').forEach(el => el.innerText = count);
    }

    renderHistoryList() {
        if (this.activeTab !== 'history') return;
        const listEl = this.querySelector('.dash-history-list');
        listEl.innerHTML = '';
        const history = window.thps_sessionHistory || [];
        if (history.length === 0) {
            listEl.innerHTML = `<p class="text-slate-500 font-medium text-sm text-center py-10">No history yet.</p>`;
            return;
        }
        history.forEach((attempt) => {
            const isActive = (this.latestData && this.latestData.id === attempt.id);
            const gradeText = attempt.overrideGrade ? '-' : attempt.totalPoints.toFixed(1);
            const item = document.createElement('div');
            item.className = `p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'}`;
            item.onclick = () => window.loadHistoryAttempt(attempt.id);
            item.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-black text-slate-800 ${isActive ? 'text-indigo-700' : ''}">${attempt.title} ${isActive ? '<span class="ml-2 text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Viewing</span>' : ''}</span>
                    <span class="font-bold text-sm text-slate-500">Score: ${gradeText}/100</span>
                </div>
                <div class="flex justify-between items-center text-xs text-slate-400 font-medium mt-2">
                    <span>Greens: ${attempt.greenScore || 0}/10</span>
                    <button onclick="event.stopPropagation(); window.deleteHistoryAttempt(${attempt.id}); document.querySelector('thps-main-dash').renderHistoryList();" class="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 rounded-md hover:bg-red-50" title="Delete Attempt"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `;
            listEl.appendChild(item);
        });
        if (window.lucide) window.lucide.createIcons();
    }
}

customElements.define('thps-main-dash', ThpsMainDash);

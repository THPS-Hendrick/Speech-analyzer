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

        // Unified Metric Configuration (From Progress Graph)
        this.METRIC_CONFIG = {
            'grade': { key: 'totalPoints', title: 'Overall Grade', min: 0, max: 100, zones: [ { min: 80, max: 100, color: 'rgba(34, 197, 94, 0.12)' }, { min: 65, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 0, max: 65, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'greenScore': { key: 'greenScore', title: 'Greens', min: 0, max: 10, zones: [ { min: 8, max: 10, color: 'rgba(34, 197, 94, 0.12)' }, { min: 5, max: 8, color: 'rgba(234, 179, 8, 0.12)' }, { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'wpm': { key: 'wpm', title: 'Words/Min', min: 50, max: 200, zones: [ { min: 0, max: 85, color: 'rgba(239, 68, 68, 0.12)' }, { min: 85, max: 100, color: 'rgba(234, 179, 8, 0.12)' }, { min: 100, max: 150, color: 'rgba(34, 197, 94, 0.12)' }, { min: 150, max: 170, color: 'rgba(234, 179, 8, 0.12)' }, { min: 170, max: 300, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'sps': { key: 'sps', title: 'Syll/Sec', min: 2.0, max: 6.0, zones: [ { min: 0, max: 3.0, color: 'rgba(239, 68, 68, 0.12)' }, { min: 3.0, max: 3.5, color: 'rgba(234, 179, 8, 0.12)' }, { min: 3.5, max: 4.5, color: 'rgba(34, 197, 94, 0.12)' }, { min: 4.5, max: 5.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 5.0, max: 10, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'personal': { key: 'personal', title: 'Personal %', min: 0, max: 100, zones: [ { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' }, { min: 10, max: 30, color: 'rgba(234, 179, 8, 0.12)' }, { min: 30, max: 60, color: 'rgba(34, 197, 94, 0.12)' }, { min: 60, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 80, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'visual': { key: 'visual', title: 'Visual %', min: 0, max: 100, zones: [ { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' }, { min: 10, max: 20, color: 'rgba(234, 179, 8, 0.12)' }, { min: 20, max: 50, color: 'rgba(34, 197, 94, 0.12)' }, { min: 50, max: 60, color: 'rgba(234, 179, 8, 0.12)' }, { min: 60, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'intangible': { key: 'intangible', title: 'Intangible %', min: 0, max: 100, zones: [ { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' }, { min: 5, max: 10, color: 'rgba(234, 179, 8, 0.12)' }, { min: 10, max: 30, color: 'rgba(34, 197, 94, 0.12)' }, { min: 30, max: 50, color: 'rgba(234, 179, 8, 0.12)' }, { min: 50, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'pause': { key: 'pause', title: 'Pause %', min: 0, max: 60, zones: [ { min: 0, max: 9, color: 'rgba(239, 68, 68, 0.12)' }, { min: 9, max: 15, color: 'rgba(234, 179, 8, 0.12)' }, { min: 15, max: 35, color: 'rgba(34, 197, 94, 0.12)' }, { min: 35, max: 41, color: 'rgba(234, 179, 8, 0.12)' }, { min: 41, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'runtime': { key: 'runtime', title: 'Runtime (s)', min: 0, max: 12, zones: [ { min: 0, max: 2.0, color: 'rgba(239, 68, 68, 0.12)' }, { min: 2.0, max: 3.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 3.0, max: 6.0, color: 'rgba(34, 197, 94, 0.12)' }, { min: 6.0, max: 9.0, color: 'rgba(234, 179, 8, 0.12)' }, { min: 9.0, max: 30, color: 'rgba(239, 68, 68, 0.12)' } ] },
            'simple': { key: 'simple', title: 'Simple %', min: 50, max: 100, zones: [ { min: 0, max: 70, color: 'rgba(239, 68, 68, 0.12)' }, { min: 70, max: 80, color: 'rgba(234, 179, 8, 0.12)' }, { min: 80, max: 90, color: 'rgba(34, 197, 94, 0.12)' }, { min: 90, max: 96, color: 'rgba(234, 179, 8, 0.12)' }, { min: 96, max: 100, color: 'rgba(239, 68, 68, 0.12)' } ] }
        };

        // Chart.js Plugin for Progress
        this.zoneBackgroundPlugin = {
            id: 'zoneBackground',
            beforeDraw: (chart) => {
                const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
                const zones = chart.config.options.plugins.zoneBackground.zones;
                if (!zones) return;
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
        };
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="score-card glass-panel p-0 rounded-2xl border-t-4 border-slate-800 shadow-lg transition-colors duration-300 relative w-full h-full group cursor-move flex flex-col min-h-[400px] overflow-hidden bg-white">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <!-- TAB NAVIGATION -->
                <div class="flex border-b border-slate-200 bg-slate-50 pt-2 px-2 gap-1 overflow-x-auto styled-scrollbar">
                    <button class="dash-tab-btn px-4 py-2 text-sm font-black tracking-wide rounded-t-xl transition-colors text-blue-600 bg-white border-t border-l border-r border-slate-200" data-tab="summary">Summary</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100" data-tab="progress">Progress</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100" data-tab="moe">MoE</button>
                    <button class="dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100" data-tab="history">History <span class="history-count-badge ml-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">0</span></button>
                </div>

                <!-- VIEW CONTAINERS -->
                <div class="p-5 sm:p-6 flex-1 flex flex-col relative">
                    
                    <!-- TAB 1: SUMMARY -->
                    <div id="dash-view-summary" class="dash-view block w-full h-full flex-col">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 border-slate-100 gap-4 pr-6">
                            <h2 class="text-lg font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onclick="this.closest('thps-main-dash').triggerMetricSelect('Score Summary', 'grade')">Score Summary</h2>
                            <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors" onclick="this.closest('thps-main-dash').triggerMetricSelect('Green Score', 'greenScore')">
                                    <span class="text-xs font-bold text-slate-500 uppercase pointer-events-none">Greens:</span>
                                    <span class="dash-greens font-bold text-slate-800 text-sm pointer-events-none">- / 10</span>
                                </div>
                                <div class="text-base font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg shadow-inner cursor-pointer hover:bg-blue-100 transition-colors" onclick="this.closest('thps-main-dash').triggerMetricSelect('Grade', 'grade')">
                                    Grade: <span class="dash-overallGrade text-blue-600 pointer-events-none">- / 100</span>
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
                            <div class="w-full min-h-[60px] max-h-[100px] overflow-y-auto styled-scrollbar pr-2">
                                <span class="dash-explainer-title text-xs font-black text-slate-700 uppercase tracking-widest mr-1">Score Summary:</span>
                                <span class="dash-explainer-content text-xs font-medium text-slate-500 leading-relaxed">Loading explanation...</span>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: PROGRESS -->
                    <div id="dash-view-progress" class="dash-view hidden w-full h-full flex-col">
                        <div class="flex justify-between items-center mb-4 border-b pb-4 border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm pointer-events-none">
                                    <i data-lucide="line-chart" class="w-4 h-4"></i>
                                </div>
                                <h2 class="text-lg font-bold text-slate-800">Historical Progress</h2>
                            </div>
                            <div class="dash-progress-label text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-widest shadow-inner">
                                Overall Grade
                            </div>
                        </div>
                        <div class="flex-1 w-full relative min-h-[220px]">
                            <canvas class="dash-progress-canvas"></canvas>
                            <div class="dash-progress-empty absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 rounded-xl transition-all duration-300">
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
                            <p class="text-xs text-slate-400 font-medium">Green zone centered.</p>
                        </div>
                        <div class="flex-1 w-full relative bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-hidden">
                            <div class="dash-moe-grid w-full h-full flex flex-col md:flex-row gap-2 justify-between">
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

        // Bind Close Button
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        // Bind Tab Buttons
        this.querySelectorAll('.dash-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Event Listeners
        this.updateHandler = (e) => {
            this.latestData = e.detail;
            this.updateSummary(this.latestData);
            this.updateHistoryCount();
            // Only re-render heavy views if they are currently active
            if (this.activeTab === 'progress') this.renderChart();
            if (this.activeTab === 'moe') this.renderMoE();
            if (this.activeTab === 'history') this.renderHistoryList();
        };

        this.metricSelectHandler = (e) => {
            if (this.METRIC_CONFIG[e.detail]) {
                this.currentMetric = e.detail;
                if (this.activeTab === 'progress') this.renderChart();
            }
        };

        window.addEventListener('thps-dashboard-update', this.updateHandler);
        window.addEventListener('thps-metric-select', this.metricSelectHandler);
        
        // Initial Render
        if (window.thps_lastPayload) {
            this.latestData = window.thps_lastPayload;
            setTimeout(() => this.updateHandler({ detail: this.latestData }), 50);
        }
        this.showLocalExplanation('Score Summary');
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
        window.removeEventListener('thps-metric-select', this.metricSelectHandler);
        if (this.chart) this.chart.destroy();
    }

    // --- TAB ROUTING ---
    switchTab(tabName) {
        this.activeTab = tabName;
        
        // Style Buttons
        this.querySelectorAll('.dash-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = "dash-tab-btn px-4 py-2 text-sm font-black tracking-wide rounded-t-xl transition-colors text-blue-600 bg-white border-t border-l border-r border-slate-200";
            } else {
                btn.className = "dash-tab-btn px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b border-transparent";
            }
        });

        // Toggle Views
        this.querySelectorAll('.dash-view').forEach(view => view.classList.add('hidden'));
        this.querySelector(`#dash-view-${tabName}`).classList.remove('hidden');

        // Lazy Render
        if (tabName === 'progress') this.renderChart();
        if (tabName === 'moe') this.renderMoE();
        if (tabName === 'history') this.renderHistoryList();
    }

    // --- TAB 1: SUMMARY LOGIC ---
    triggerMetricSelect(term, key) {
        this.showLocalExplanation(term);
        window.dispatchEvent(new CustomEvent('thps-metric-select', { detail: key }));
    }

    showLocalExplanation(term) {
        const titleEl = this.querySelector('.dash-explainer-title');
        const contentEl = this.querySelector('.dash-explainer-content');
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

    updateSummary(data) {
        if (!data || data.totalPoints === undefined) return;

        const setEval = (cls, text, colorClass) => {
            const el = this.querySelector(`.${cls}`);
            if(el) { 
                el.textContent = text; 
                el.className = `${cls} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${colorClass} ml-1 pointer-events-none`; 
            }
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

    // --- TAB 2: PROGRESS LOGIC ---
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
            this.chart.options.plugins.zoneBackground.zones = config.zones;
            this.chart.update();
        } else {
            this.chart = new Chart(canvas, {
                type: 'line',
                plugins: [this.zoneBackgroundPlugin],
                data: {
                    labels: labels,
                    datasets: [{
                        label: config.title,
                        data: dataPoints,
                        borderColor: 'rgba(15, 23, 42, 0.4)',
                        borderWidth: 1.5,
                        borderDash: [5, 5], 
                        pointBackgroundColor: '#0f172a', 
                        pointBorderColor: '#0f172a',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 10 }, bodyFont: { size: 13, weight: 'bold' }, padding: 10, displayColors: false }
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

    // --- TAB 3: MoE DISPERSION LOGIC ---
    calculateMoEPosition(val, config) {
        if (val === null || val === undefined) return null;
        
        // Find the designated green zone (assumes rgba(34, 197, 94...))
        const greenZone = config.zones.find(z => z.color.includes('197, 94'));
        if (!greenZone) return 50; // Fallback

        const greenCenter = (greenZone.min + greenZone.max) / 2;
        
        // Force the value into a 0-100% position where greenCenter is exactly 50%
        if (val === greenCenter) return 50;
        
        if (val < greenCenter) {
            // Map [config.min to greenCenter] -> [0% to 50%]
            const range = greenCenter - config.min;
            if (range <= 0 || val <= config.min) return 0;
            return ((val - config.min) / range) * 50;
        } else {
            // Map [greenCenter to config.max] -> [50% to 100%]
            const range = config.max - greenCenter;
            if (range <= 0 || val >= config.max) return 100;
            return 50 + (((val - greenCenter) / range) * 50);
        }
    }

    renderMoE() {
        if (!this.latestData || this.activeTab !== 'moe') return;
        
        const grid = this.querySelector('.dash-moe-grid');
        grid.innerHTML = ''; // Clear existing

        const metricsToMap = ['personal', 'visual', 'intangible', 'wpm', 'sps', 'pause', 'runtime', 'grade', 'simple'];

        metricsToMap.forEach(key => {
            const config = this.METRIC_CONFIG[key];
            const rawVal = this.latestData[config.key];
            const posPct = this.calculateMoEPosition(rawVal, config);

            // Determine if dot is visible (hide if text-only logic applied to audio metric)
            const hideDot = (posPct === null || (['wpm', 'sps', 'pause', 'runtime'].includes(key) && !this.latestData.recordedAudio));

            // Background Gradient built dynamically from zones mapped to 0-100
            let gradientStops = [];
            config.zones.forEach(zone => {
                const startPct = this.calculateMoEPosition(zone.min, config);
                const endPct = this.calculateMoEPosition(zone.max, config);
                // Convert rgba opacity to solid for clear background tracking
                const solidColor = zone.color.includes('197') ? '#dcfce7' : (zone.color.includes('179') ? '#fef08a' : '#fee2e2');
                gradientStops.push(`${solidColor} ${startPct}%`);
                gradientStops.push(`${solidColor} ${endPct}%`);
            });

            // Create Responsive Track (Flex-1 allows columns on md, rows on mobile)
            const track = document.createElement('div');
            track.className = "flex-1 flex flex-row md:flex-col items-center gap-2 relative group cursor-pointer";
            track.onclick = () => this.triggerMetricSelect(config.title, key);
            
            track.innerHTML = `
                <div class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase text-right md:text-center w-12 md:w-auto shrink-0 group-hover:text-blue-600 transition-colors">${config.title.split(' ')[0]}</div>
                <div class="flex-1 w-full relative rounded-full overflow-hidden shadow-inner border border-slate-200" 
                     style="background: linear-gradient(to right, ${gradientStops.join(', ')}); md:background: linear-gradient(to bottom, ${gradientStops.join(', ')});">
                     <!-- CSS overrides inline background for desktop orientation using a style block below -->
                     <div class="moe-bg-desktop absolute inset-0 hidden md:block" style="background: linear-gradient(to bottom, ${gradientStops.join(', ')});"></div>
                     <div class="moe-bg-mobile absolute inset-0 block md:hidden" style="background: linear-gradient(to right, ${gradientStops.join(', ')});"></div>
                     
                     <!-- The Central Target Line -->
                     <div class="absolute bg-slate-300 md:w-full md:h-[1px] w-[1px] h-full" style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>

                     <!-- The Data Dot -->
                     ${!hideDot ? `<div class="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-800 shadow-md border-2 border-white transition-all duration-500 ease-out" 
                          style="top: 50%; left: ${posPct}%; transform: translate(-50%, -50%);" 
                          data-desktop-style="top: ${posPct}%; left: 50%;"
                          title="${rawVal}"></div>` : ''}
                </div>
            `;
            grid.appendChild(track);
        });

        // Apply orientation logic for dots
        setTimeout(() => {
            const isDesktop = window.innerWidth >= 768;
            grid.querySelectorAll('.w-3').forEach(dot => {
                const pos = dot.style.left; // captured from mobile style
                if (isDesktop) {
                    dot.style.left = '50%';
                    dot.style.top = dot.getAttribute('data-desktop-style').split('top: ')[1].split(';')[0];
                }
            });
        }, 10);
    }

    // --- TAB 4: HISTORY LOGIC ---
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

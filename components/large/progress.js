// ==========================================
// THPS WIDGET: LARGE PROGRESS GRAPH
// Tracks historical performance across attempts
// ==========================================

class ThpsProgress extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.currentMetric = 'grade'; // Default view
        
        // Define the target zones for every possible metric
        this.METRIC_CONFIG = {
            'grade': {
                key: 'totalPoints',
                title: 'Overall Grade (/100)',
                min: 0, max: 100,
                zones: [
                    { min: 80, max: 100, color: 'rgba(34, 197, 94, 0.12)' }, // Green
                    { min: 65, max: 80, color: 'rgba(234, 179, 8, 0.12)' },  // Yellow
                    { min: 0, max: 65, color: 'rgba(239, 68, 68, 0.12)' }   // Red
                ]
            },
            'greenScore': {
                key: 'greenScore',
                title: 'Green Metrics Hit (/10)',
                min: 0, max: 10,
                zones: [
                    { min: 8, max: 10, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 5, max: 8, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'wpm': {
                key: 'wpm',
                title: 'Words Per Minute',
                min: 50, max: 200,
                zones: [
                    { min: 0, max: 85, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 85, max: 100, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 100, max: 150, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 150, max: 170, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 170, max: 300, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'sps': {
                key: 'sps',
                title: 'Syllables / Sec',
                min: 2.0, max: 6.0,
                zones: [
                    { min: 0, max: 3.0, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 3.0, max: 3.5, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 3.5, max: 4.5, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 4.5, max: 5.0, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 5.0, max: 10, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'personal': {
                key: 'personal', title: 'Personal Content %', min: 0, max: 100,
                zones: [
                    { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 10, max: 30, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 30, max: 60, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 60, max: 80, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 80, max: 100, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'visual': {
                key: 'visual', title: 'Visual Content %', min: 0, max: 100,
                zones: [
                    { min: 0, max: 10, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 10, max: 20, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 20, max: 50, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 50, max: 60, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 60, max: 100, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'intangible': {
                key: 'intangible', title: 'Intangible Content %', min: 0, max: 100,
                zones: [
                    { min: 0, max: 5, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 5, max: 10, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 10, max: 30, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 30, max: 50, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 50, max: 100, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'pause': {
                key: 'pause', title: 'Pause Time %', min: 0, max: 60,
                zones: [
                    { min: 0, max: 9, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 9, max: 15, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 15, max: 35, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 35, max: 41, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 41, max: 100, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'runtime': {
                key: 'runtime', title: 'Runtime (Seconds)', min: 0, max: 12,
                zones: [
                    { min: 0, max: 2.0, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 2.0, max: 3.0, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 3.0, max: 6.0, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 6.0, max: 9.0, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 9.0, max: 30, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            },
            'simple': {
                key: 'simple', title: 'Simple Language %', min: 50, max: 100,
                zones: [
                    { min: 0, max: 70, color: 'rgba(239, 68, 68, 0.12)' },
                    { min: 70, max: 80, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 80, max: 90, color: 'rgba(34, 197, 94, 0.12)' },
                    { min: 90, max: 96, color: 'rgba(234, 179, 8, 0.12)' },
                    { min: 96, max: 100, color: 'rgba(239, 68, 68, 0.12)' }
                ]
            }
        };

        // Custom Chart.js Plugin to draw the colored background threshold zones
        this.zoneBackgroundPlugin = {
            id: 'zoneBackground',
            beforeDraw: (chart) => {
                const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
                const zones = chart.config.options.plugins.zoneBackground.zones;
                
                if (!zones) return;

                ctx.save();
                zones.forEach(zone => {
                    // Chart.js Y-axis is inverted (0 is at the bottom visually)
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
            <div class="score-card glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-amber-500 shadow-sm transition-colors duration-300 relative w-full h-full group cursor-move flex flex-col min-h-[350px]">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-center mb-4 border-b pb-4 border-slate-100">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm pointer-events-none">
                            <i data-lucide="line-chart" class="w-4 h-4"></i>
                        </div>
                        <h2 class="text-lg font-bold text-slate-800">Historical Progress</h2>
                    </div>
                    <div id="progress-metric-label" class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-widest shadow-inner">
                        Overall Grade
                    </div>
                </div>
                
                <div class="flex-1 w-full relative min-h-[220px]">
                    <canvas id="progress-canvas"></canvas>
                    <div id="progress-empty" class="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 rounded-xl transition-all duration-300">
                        <p class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <i data-lucide="activity" class="w-4 h-4"></i> Complete an attempt to plot data
                        </p>
                    </div>
                </div>
                
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        // Event Listeners
        this.updateHandler = (e) => this.renderChart();
        this.metricSelectHandler = (e) => {
            const key = e.detail;
            if (this.METRIC_CONFIG[key]) {
                this.currentMetric = key;
                this.renderChart();
            }
        };

        window.addEventListener('thps-dashboard-update', this.updateHandler);
        window.addEventListener('thps-metric-select', this.metricSelectHandler);
        
        // Initial Render
        setTimeout(() => this.renderChart(), 100);
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
        window.removeEventListener('thps-metric-select', this.metricSelectHandler);
        if (this.chart) this.chart.destroy();
    }

    renderChart() {
        if (!window.Chart) return;
        
        const history = window.thps_sessionHistory || [];
        const emptyState = this.querySelector('#progress-empty');
        
        // Show empty state if there is no history to plot
        if (history.length === 0) {
            emptyState.classList.remove('hidden');
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        const config = this.METRIC_CONFIG[this.currentMetric];
        this.querySelector('#progress-metric-label').innerText = config.title;

        // History array places newest at index 0. Reverse it to plot chronologically.
        const chronologicalHistory = [...history].reverse();
        
        const labels = chronologicalHistory.map(h => `Att ${h.id}`);
        const dataPoints = chronologicalHistory.map(h => h[config.key] !== undefined ? h[config.key] : null);

        const canvas = this.querySelector('#progress-canvas');
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(canvas, {
            type: 'line',
            plugins: [this.zoneBackgroundPlugin],
            data: {
                labels: labels,
                datasets: [{
                    label: config.title,
                    data: dataPoints,
                    borderColor: 'rgba(15, 23, 42, 0.4)', // Slate-900 transparent line
                    borderWidth: 1.5,
                    borderDash: [5, 5], // Dotted connecting line
                    pointBackgroundColor: '#0f172a', // Solid Black dots
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
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 10 },
                        bodyFont: { size: 13, weight: 'bold' },
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y}`;
                            }
                        }
                    },
                    zoneBackground: {
                        zones: config.zones
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
                    },
                    y: {
                        min: config.min,
                        max: config.max,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
                    }
                },
                animation: {
                    duration: 400,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
}

customElements.define('thps-progress', ThpsProgress);

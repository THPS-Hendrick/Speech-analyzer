class THPSResultsWidget extends HTMLElement {
    constructor() {
        super();
        this.data = null;
        this.isPhantom = this.hasAttribute('phantom');
    }

    connectedCallback() {
        if (!this.isPhantom) {
            // 1. Check for existing data on spawn (covers both caching variables)
            this.data = window.thps_lastPayload || window.THPS?.NLP?.currentPayload || null; 
            
            // 2. Listen for live analysis updates so the widget doesn't stay stuck on "No Data"
            this.updateListener = (e) => {
                this.data = e.detail; 
                this.render();        
            };
            window.addEventListener('thps-dashboard-update', this.updateListener);
            
            this.render();
        }
    }

    disconnectedCallback() {
        // Clean up the listener when the widget is deleted from the dashboard
        if (this.updateListener) {
            window.removeEventListener('thps-dashboard-update', this.updateListener);
        }
    }

    // This allows the phantom generator to inject specific historical data silently
    injectDataAndRender(payload) {
        this.data = payload;
        this.render();
    }

    render() {
        // If spawned visibly on the dashboard with no data yet
        if (!this.data && !this.isPhantom) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans h-full flex flex-col items-center justify-center">
                    <h3 class="font-black text-xl text-slate-800 tracking-tight">No Data Found</h3>
                    <p class="text-sm text-slate-500 mt-2">Please run an analysis to populate this widget.</p>
                </div>
            `;
            return;
        }

        // The A4 constraints ensure it scales perfectly for the html2pdf engine
        this.innerHTML = `
        <style>
            .pdf-a4-container { 
                width: 210mm; 
                min-height: 297mm; 
                background: white; 
                padding: 15mm; 
                box-sizing: border-box; 
                font-family: 'Inter', -apple-system, sans-serif; 
                color: #1e293b; 
                overflow: hidden; 
            }
            .pdf-a4-container thps-score-summary, 
            .pdf-a4-container thps-voice-graph, 
            .pdf-a4-container thps-tangible-text {
                display: block; 
                width: 100%;
            }
        </style>

        ${!this.isPhantom ? `
        <div class="flex justify-between items-center mb-4 px-2">
            <h2 class="text-lg font-black uppercase text-slate-800 tracking-widest">Comprehensive Results</h2>
            <button onclick="this.closest('thps-results').triggerSingleDownload()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                <i data-lucide="file-text" class="w-4 h-4"></i> Download PDF
            </button>
        </div>` : ''}

        <div class="overflow-x-auto w-full styled-scrollbar pb-4">
            <div id="pdf-export-target" class="pdf-a4-container mx-auto border border-slate-200 shadow-sm rounded-xl bg-slate-50 relative shrink-0">
                
                <div class="border-b-2 border-slate-900 pb-4 mb-6 mt-2">
                    <h1 class="text-3xl font-black tracking-tight text-slate-900">THPS ANALYSIS RESULTS</h1>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Acoustic & Semantic Breakdown</p>
                </div>

                <!-- WE NEST THE ACTUAL WIDGETS HERE -->
                <!-- pointer-events-none prevents users from accidentally clicking the nested elements during a live PDF generation -->
                <div class="mb-6 pointer-events-none">
                    <thps-score-summary id="nested-score-summary"></thps-score-summary>
                </div>
                
                <div class="mb-6 pointer-events-none">
                    <thps-voice-graph id="nested-voice-graph"></thps-voice-graph>
                </div>
                
                <div class="mb-6 pointer-events-none">
                    <thps-tangible-text id="nested-tangible-text"></thps-tangible-text>
                </div>
                
            </div>
        </div>
        `;
        
        if (window.lucide && !this.isPhantom) window.lucide.createIcons();
        
        // Push the data down into the nested child widgets
        this.injectDataToChildren();
    }

    injectDataToChildren() {
        if (!this.data) return;

        // Grab the specific child widgets sitting inside this wrapper
        const summaryWidget = this.querySelector('#nested-score-summary');
        const graphWidget = this.querySelector('#nested-voice-graph');
        const textWidget = this.querySelector('#nested-tangible-text');

        // Manually force the historical data into them and trigger their render methods natively
        const forceUpdate = (widget) => {
            if (widget) {
                widget.data = this.data; 
                if (typeof widget.render === 'function') {
                    widget.render();
                }
            }
        };

        // A tiny 50ms delay ensures the custom elements are registered/connected in the DOM before we call render()
        setTimeout(() => {
            forceUpdate(summaryWidget);
            forceUpdate(graphWidget);
            forceUpdate(textWidget);
        }, 50);
    }

    // Triggered by the visible widget's own download button
    triggerSingleDownload() {
        const element = this.querySelector('#pdf-export-target');
        const attemptName = this.data?.title ? this.data.title.replace(/\s+/g, '_') : 'Result';
        
        const opt = {
            margin:       0,
            filename:     `THPS_${attemptName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }

    // Triggered by the History menu for headless ZIP bundling
    async generatePDFBlob() {
        const element = this.querySelector('#pdf-export-target');
        const opt = {
            margin:       0,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Outputs a raw Blob instead of forcing a save
        return await html2pdf().set(opt).from(element).outputPdf('blob');
    }
}

customElements.define('thps-results', THPSResultsWidget);

class THPSResultsWidget extends HTMLElement {
    constructor() {
        super();
        this.data = null;
        this.isPhantom = this.hasAttribute('phantom');
    }

    connectedCallback() {
        // If spawned visibly via the menu, pull the active payload immediately
        if (!this.isPhantom) {
            this.data = window.THPS?.NLP?.currentPayload || null;
            this.render();
        }
    }

    // This allows the phantom generator to inject specific historical data
    injectDataAndRender(payload) {
        this.data = payload;
        this.render();
    }

    render() {
        if (!this.data && !this.isPhantom) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans">
                    <h3 class="font-black text-xl text-slate-800 tracking-tight">No Data Found</h3>
                    <p class="text-sm text-slate-500 mt-2">Please run an analysis to populate this widget.</p>
                </div>
            `;
            return;
        }

        // The A4 constraints ensure it looks perfect whether viewed on-screen or exported via html2pdf
        this.innerHTML = `
        <style>
            .pdf-a4-container { width: 210mm; min-height: 297mm; background: white; padding: 20mm; box-sizing: border-box; font-family: 'Inter', sans-serif; color: #1e293b; }
        </style>

        ${!this.isPhantom ? `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-black uppercase text-slate-800 tracking-widest">Comprehensive Results</h2>
            <button onclick="this.closest('thps-results').triggerSingleDownload()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors">
                Download PDF
            </button>
        </div>` : ''}

        <div id="pdf-export-target" class="pdf-a4-container mx-auto border border-slate-200 shadow-sm rounded-xl">
            
            <div class="border-b-2 border-slate-900 pb-4 mb-6">
                <h1 class="text-3xl font-black tracking-tight text-slate-900">THPS ANALYSIS RESULTS</h1>
                <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Acoustic & Semantic Breakdown</p>
            </div>

            <!-- SCORE SUMMARY REPLICA -->
            <div class="mb-8">
                <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">Score Summary</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Words Per Minute</div>
                        <div class="text-2xl font-black text-indigo-600">${this.data?.wpm || 0}</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pause Ratio</div>
                        <div class="text-2xl font-black text-emerald-600">${this.data?.pausePercent || 0}%</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mumble Score</div>
                        <div class="text-2xl font-black text-rose-600">${this.data?.mumbleScore?.toFixed(1) || 0}</div>
                    </div>
                </div>
            </div>

            <!-- VOICE GRAPH REPLICA -->
            <div class="mb-8">
                <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">Acoustic Cadence Graph</h3>
                <div class="w-full h-40 bg-slate-900 rounded-xl border border-slate-200 flex items-center justify-center">
                    <span class="text-slate-500 text-xs">[Voice Graph Canvas Rendered Here]</span>
                </div>
            </div>

            <!-- TANGIBLE TEXT REPLICA -->
            <div class="mb-8">
                <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 mb-3">Tangible Text Map</h3>
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
                    ${this.data?.reportMarkdownText || "No transcript available."}
                </div>
            </div>
            
        </div>
        `;
        
        this.drawCanvases();
    }

    drawCanvases() {
        // Logic to draw the voice graph peaks using this.data.volumeData
    }

    // Triggered by the visible widget's own download button
    triggerSingleDownload() {
        const element = this.querySelector('#pdf-export-target');
        const opt = {
            margin:       0,
            filename:     'THPS_Analysis_Result.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
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
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Outputs a raw Blob instead of forcing a save
        return await html2pdf().set(opt).from(element).outputPdf('blob');
    }
}

customElements.define('thps-results', THPSResultsWidget);

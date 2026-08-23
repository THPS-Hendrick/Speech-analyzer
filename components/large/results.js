class THPSResultsWidget extends HTMLElement {
    constructor() {
        super();
        this.data = null;
        this.isPhantom = this.hasAttribute('phantom');
    }

    connectedCallback() {
        if (!this.isPhantom) {
            // 1. Check for existing data on spawn
            this.data = window.thps_lastPayload || window.THPS?.NLP?.currentPayload || null; 
            
            // 2. Listen for live analysis updates
            this.updateListener = (e) => {
                this.data = e.detail; 
                this.render();        
            };
            window.addEventListener('thps-dashboard-update', this.updateListener);
            
            this.render();
        }
    }

    disconnectedCallback() {
        if (this.updateListener) {
            window.removeEventListener('thps-dashboard-update', this.updateListener);
        }
    }

    // Allows the phantom generator to inject specific historical data silently
    injectDataAndRender(payload) {
        this.data = payload;
        this.render();
    }

    render() {
        // If spawned visibly on the dashboard with no data yet
        if (!this.data && !this.isPhantom) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans h-full flex flex-col items-center justify-center relative">
                    <button onclick="const wrapper = this.closest('.group'); if(wrapper) wrapper.remove(); else this.remove();" class="thps-close-btn absolute top-3 right-3 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer" title="Remove Widget">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    <h3 class="font-black text-xl text-slate-800 tracking-tight">No Data Found</h3>
                    <p class="text-sm text-slate-500 mt-2">Please run an analysis to populate this widget.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
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
            <!-- Grouped Header & Download Button -->
            <div class="flex items-center gap-4">
                <h2 class="text-lg font-black uppercase text-slate-800 tracking-widest">THPS Results</h2>
                <button onclick="this.closest('thps-results').triggerSingleDownload()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                    <i data-lucide="file-text" class="w-4 h-4"></i> Download PDF
                </button>
            </div>
            
            <!-- Despawn Close Button (Respects Edit Mode Lock) -->
            <button onclick="const wrapper = this.closest('.group'); if(wrapper) wrapper.remove(); else this.closest('thps-results').remove();" class="thps-close-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer ml-auto" title="Remove Widget">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        </div>` : ''}

        <div class="overflow-x-auto w-full styled-scrollbar pb-4">
            <div id="pdf-export-target" class="pdf-a4-container mx-auto border border-slate-200 shadow-sm rounded-xl bg-slate-50 relative shrink-0">
                
                <!-- NEW PDF HEADER LOGO -->
                <div class="border-b-2 border-slate-900 pb-5 mb-6 mt-2 flex justify-start">
                    <img src="https://raw.githack.com/THPS-Hendrick/Speech-analyzer/main/image/thps-logo.webp" crossorigin="anonymous" alt="THPS Public Speaking" class="h-20 object-contain">
                </div>

                <!-- WE NEST THE ACTUAL WIDGETS HERE -->
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

        const summaryWidget = this.querySelector('#nested-score-summary');
        const graphWidget = this.querySelector('#nested-voice-graph');
        const textWidget = this.querySelector('#nested-tangible-text');

        // The "Bilingual" Update Function (FIXED FOR PHANTOM PDF LOOP)
        const forceUpdate = (widget) => {
            if (widget) {
                widget.data = this.data; 
                if (typeof widget.render === 'function') {
                    widget.render();
                }
                if (typeof widget.update === 'function') {
                    widget.update(this.data);
                }
                // NEW: Added support for widgets that use standard DOM event dispatch mapping
                if (typeof widget.handleUpdate === 'function') {
                    widget.handleUpdate({ detail: this.data });
                }
            }
        };

        // Delay extended to 100ms to safely overwrite internal widget initializations
        setTimeout(() => {
            forceUpdate(summaryWidget);
            forceUpdate(graphWidget);
            forceUpdate(textWidget);
        }, 100);
    }

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

    async generatePDFBlob() {
        const element = this.querySelector('#pdf-export-target');
        const opt = {
            margin:       0,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        return await html2pdf().set(opt).from(element).outputPdf('blob');
    }
}

customElements.define('thps-results', THPSResultsWidget);

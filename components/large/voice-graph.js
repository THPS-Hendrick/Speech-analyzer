class THPSVoiceGraph extends HTMLElement {
    constructor() {
        super();
        // Removed DOM manipulation from the constructor to prevent rendering crashes
    }

    connectedCallback() {
        // Safely set innerHTML after the element is officially connected to the DOM
        this.innerHTML = this.getTemplate();
        
        if (window.lucide) window.lucide.createIcons();
        this.updateHandler = this.handleUpdate.bind(this);
        window.addEventListener('thps-dashboard-update', this.updateHandler);
        
        // Check for existing cache on load
        if (window.thps_lastPayload) {
            this.handleUpdate({ detail: window.thps_lastPayload });
        }
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
    }

    handleUpdate(e) {
        const data = e.detail;

        // Failsafe: if the audio hasn't generated the elastic grid buckets yet, clear the graph
        if (!data || !data.pauseBuckets || !data.paceBuckets) {
             this.clearGraph();
             return;
        }

        this.renderPauseColumn(data.pauseBuckets);
        this.renderPaceColumn(data.paceBuckets);
        
        if (data.volumeData && data.volumeData.length > 0) {
            this.renderVolumeColumn(data.volumeData);
        } else {
            this.renderVolumeColumn([]); // Clear if no audio volume data exists
        }
    }

    renderPauseColumn(pauseBuckets) {
        // We ignore 'micro' pauses in the visual render as they are sub-perceptual
        const total = pauseBuckets.blue + pauseBuckets.green + pauseBuckets.orange + pauseBuckets.red;
        this.updateBar('vg-pause-red', pauseBuckets.red, total);
        this.updateBar('vg-pause-orange', pauseBuckets.orange, total);
        this.updateBar('vg-pause-green', pauseBuckets.green, total);
        this.updateBar('vg-pause-blue', pauseBuckets.blue, total);
    }

    renderPaceColumn(paceBuckets) {
        const total = paceBuckets.fastest + paceBuckets.fast + paceBuckets.normal + paceBuckets.slow + paceBuckets.slowest;
        this.updateBar('vg-pace-fastest', paceBuckets.fastest, total);
        this.updateBar('vg-pace-fast', paceBuckets.fast, total);
        this.updateBar('vg-pace-normal', paceBuckets.normal, total);
        this.updateBar('vg-pace-slow', paceBuckets.slow, total);
        this.updateBar('vg-pace-slowest', paceBuckets.slowest, total);
    }

    renderVolumeColumn(volumeData) {
        let volBuckets = { quietest: 0, quiet: 0, normal: 0, loud: 0, loudest: 0 };
        
        if (volumeData.length > 0) {
            // Group raw acoustic frames into 3-second chunks
            let chunks = {};
            volumeData.forEach(frame => {
                let chunkIndex = Math.floor(frame.time / 3);
                if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
                chunks[chunkIndex].push(frame.db);
            });

            let chunkAverages = [];
            for (const key in chunks) {
                let dBs = chunks[key];
                // Logarithmic average of the chunk
                let linearSum = 0;
                dBs.forEach(db => linearSum += Math.pow(10, db / 10));
                let avgDb = 10 * Math.log10(linearSum / dBs.length);
                chunkAverages.push(avgDb);
            }

            // Find global baseline to measure intensity variation against
            let globalLinearSum = 0;
            chunkAverages.forEach(db => globalLinearSum += Math.pow(10, db / 10));
            let globalAvgDb = 10 * Math.log10(globalLinearSum / chunkAverages.length);

            // Bucket the variations
            chunkAverages.forEach(db => {
                let diff = db - globalAvgDb;
                if (diff > 4) volBuckets.loudest++;
                else if (diff > 1.5) volBuckets.loud++;
                else if (diff > -1.5) volBuckets.normal++;
                else if (diff > -4) volBuckets.quiet++;
                else volBuckets.quietest++;
            });
        }

        const total = volBuckets.loudest + volBuckets.loud + volBuckets.normal + volBuckets.quiet + volBuckets.quietest;
        this.updateBar('vg-vol-loudest', volBuckets.loudest, total);
        this.updateBar('vg-vol-loud', volBuckets.loud, total);
        this.updateBar('vg-vol-normal', volBuckets.normal, total);
        this.updateBar('vg-vol-quiet', volBuckets.quiet, total);
        this.updateBar('vg-vol-quietest', volBuckets.quietest, total);
    }

    updateBar(elementId, count, total) {
        const el = this.querySelector(`#${elementId}`);
        if (!el) return;
        
        el.innerText = count > 0 ? count : '';
        
        if (total === 0 || count === 0) {
            el.style.height = '0%';
            el.style.opacity = '0.3';
            el.style.padding = '0';
        } else {
            // Allocate remaining vertical space dynamically
            const percentage = Math.max(15, (count / total) * 100);
            el.style.height = `${percentage}%`;
            el.style.opacity = '1';
            el.style.padding = '2px 0';
        }
    }

    clearGraph() {
        const bars = this.querySelectorAll('.vg-bar');
        bars.forEach(bar => {
            bar.style.height = '0%';
            bar.style.opacity = '0.3';
            bar.innerText = '';
        });
    }

    getTemplate() {
        return `
        <div class="score-card glass-panel p-4 md:p-6 rounded-2xl border-t-4 border-blue-500 shadow-sm relative overflow-hidden h-full flex flex-col min-h-[300px]">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">Voice Graph</h3>
                    <p class="text-xs text-slate-500 font-medium">Acoustic variations & intensity</p>
                </div>
                <button class="thps-close-btn p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" onclick="this.closest('.group').remove()">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            
            <!-- GRAPH CONTAINER -->
            <div class="flex-1 grid grid-cols-3 gap-2 sm:gap-4 h-full mt-2 pb-2">
                
                <!-- Silence Column -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div class="vg-bar w-full bg-red-100 rounded text-center text-xs font-bold text-red-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-red"></div>
                    <div class="vg-bar w-full bg-orange-100 rounded text-center text-xs font-bold text-orange-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-orange"></div>
                    <div class="vg-bar w-full bg-emerald-100 rounded text-center text-xs font-bold text-emerald-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-green"></div>
                    <div class="vg-bar w-full bg-blue-100 rounded text-center text-xs font-bold text-blue-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-blue"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Silence</div>
                </div>

                <!-- Intensity Column -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div class="vg-bar w-full bg-purple-100 rounded text-center text-xs font-bold text-purple-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-loudest"></div>
                    <div class="vg-bar w-full bg-fuchsia-100 rounded text-center text-xs font-bold text-fuchsia-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-loud"></div>
                    <div class="vg-bar w-full bg-slate-200 rounded text-center text-xs font-bold text-slate-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-normal"></div>
                    <div class="vg-bar w-full bg-teal-100 rounded text-center text-xs font-bold text-teal-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-quiet"></div>
                    <div class="vg-bar w-full bg-cyan-100 rounded text-center text-xs font-bold text-cyan-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-quietest"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Intensity</div>
                </div>

                <!-- Pace Column -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div class="vg-bar w-full bg-rose-100 rounded text-center text-xs font-bold text-rose-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-fastest"></div>
                    <div class="vg-bar w-full bg-amber-100 rounded text-center text-xs font-bold text-amber-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-fast"></div>
                    <div class="vg-bar w-full bg-slate-200 rounded text-center text-xs font-bold text-slate-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-normal"></div>
                    <div class="vg-bar w-full bg-lime-100 rounded text-center text-xs font-bold text-lime-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-slow"></div>
                    <div class="vg-bar w-full bg-indigo-100 rounded text-center text-xs font-bold text-indigo-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-slowest"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Pace</div>
                </div>

            </div>
        </div>
        `;
    }
}

customElements.define('thps-voice-graph', THPSVoiceGraph);

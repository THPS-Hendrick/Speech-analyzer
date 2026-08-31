class THPSVoiceGraph extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = this.getTemplate();
        
        // Interactive Explainer Logic (Event Delegation)
        const grid = this.querySelector('#vg-interactive-grid');
        const explainer = this.querySelector('#vg-explainer-text');
        
        if (grid && explainer) {
            grid.addEventListener('click', (e) => {
                const bar = e.target.closest('.vg-bar');
                if (bar && bar.dataset.desc) {
                    explainer.innerText = bar.dataset.desc;
                    explainer.classList.add('text-blue-600');
                    explainer.classList.remove('text-slate-500');
                }
            });
        }

        if (window.lucide) window.lucide.createIcons();
        this.updateHandler = this.handleUpdate.bind(this);
        window.addEventListener('thps-dashboard-update', this.updateHandler);
        
        if (window.thps_lastPayload) {
            this.handleUpdate({ detail: window.thps_lastPayload });
        }
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.updateHandler);
    }

    handleUpdate(e) {
        const data = e.detail;

        if (!data || !data.pauseBuckets || !data.paceBuckets) {
             this.clearGraph();
             return;
        }

        this.renderPauseColumn(data.pauseBuckets);
        // Explicitly using the word-level paceBuckets, NOT the new macro runBuckets
        this.renderPaceColumn(data.paceBuckets);
        
        if (data.volumeBuckets) {
            this.renderVolumeColumn(data.volumeBuckets);
        } else {
            this.clearVolumeColumn();
        }
    }

    renderPauseColumn(pauseBuckets) {
        const total = pauseBuckets.micro + pauseBuckets.blue + pauseBuckets.green + pauseBuckets.orange + pauseBuckets.red;
        this.updateBar('vg-pause-red', pauseBuckets.red, total);
        this.updateBar('vg-pause-orange', pauseBuckets.orange, total);
        this.updateBar('vg-pause-green', pauseBuckets.green, total);
        this.updateBar('vg-pause-blue', pauseBuckets.blue, total);
        this.updateBar('vg-pause-micro', pauseBuckets.micro, total);
    }

    renderPaceColumn(paceBuckets) {
        const total = paceBuckets.fastest + paceBuckets.fast + paceBuckets.normal + paceBuckets.slow + paceBuckets.slowest;
        this.updateBar('vg-pace-fastest', paceBuckets.fastest, total);
        this.updateBar('vg-pace-fast', paceBuckets.fast, total);
        this.updateBar('vg-pace-normal', paceBuckets.normal, total);
        this.updateBar('vg-pace-slow', paceBuckets.slow, total);
        this.updateBar('vg-pace-slowest', paceBuckets.slowest, total);
    }

    renderVolumeColumn(volumeBuckets) {
        const total = volumeBuckets.vHigh + volumeBuckets.high + volumeBuckets.norm + volumeBuckets.low + volumeBuckets.vLow;
        this.updateBar('vg-vol-loudest', volumeBuckets.vHigh, total);
        this.updateBar('vg-vol-loud', volumeBuckets.high, total);
        this.updateBar('vg-vol-normal', volumeBuckets.norm, total);
        this.updateBar('vg-vol-quiet', volumeBuckets.low, total);
        this.updateBar('vg-vol-quietest', volumeBuckets.vLow, total);
    }

    clearVolumeColumn() {
        ['vg-vol-loudest', 'vg-vol-loud', 'vg-vol-normal', 'vg-vol-quiet', 'vg-vol-quietest'].forEach(id => {
            const el = this.querySelector(`#${id}`);
            if (el) {
                el.style.height = '0%';
                el.style.opacity = '0.3';
                el.innerText = '';
            }
        });
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
        <div class="score-card glass-panel p-4 md:p-6 rounded-2xl border-t-4 border-blue-500 shadow-sm relative overflow-hidden h-full flex flex-col min-h-[250px]">
            <button class="thps-close-btn absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer z-10" onclick="this.closest('.group').remove()">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
            
            <div class="flex-1 grid grid-cols-3 gap-2 sm:gap-4 h-full mt-2 pb-2" id="vg-interactive-grid">
                
                <!-- Pause Var Column -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div data-desc="Pauses over 1.4 seconds" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-purple-100 rounded text-center text-xs font-bold text-purple-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-red"></div>
                    <div data-desc="Pauses 1.05s to 1.4s" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-blue-100 rounded text-center text-xs font-bold text-blue-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-orange"></div>
                    <div data-desc="Pauses 700ms to 1.05s" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-emerald-100 rounded text-center text-xs font-bold text-emerald-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-green"></div>
                    <div data-desc="Pauses 350ms to 700ms" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-orange-100 rounded text-center text-xs font-bold text-orange-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-blue"></div>
                    <div data-desc="Pauses under 350ms" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-red-100 rounded text-center text-xs font-bold text-red-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pause-micro"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Pause Var</div>
                </div>

                <!-- Voice Var Column (Now matching timeline 6dB colors) -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div data-desc="> 9dB above your average (Very Loud)" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-red-100 rounded text-center text-xs font-bold text-red-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-loudest"></div>
                    <div data-desc="3dB to 9dB above your average (Loud)" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-amber-100 rounded text-center text-xs font-bold text-amber-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-loud"></div>
                    <div data-desc="Within ±3dB of your average (Normal)" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-emerald-100 rounded text-center text-xs font-bold text-emerald-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-normal"></div>
                    <div data-desc="3dB to 9dB below your average (Quiet)" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-blue-100 rounded text-center text-xs font-bold text-blue-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-quiet"></div>
                    <div data-desc="> 9dB below your average (Very Quiet)" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-purple-100 rounded text-center text-xs font-bold text-purple-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-vol-quietest"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Voice Var</div>
                </div>

                <!-- Pace Var Column (Word-level Accordion logic intact) -->
                <div class="flex flex-col justify-end items-center gap-1 h-full w-full">
                    <div data-desc="Words 25%+ faster than your avg" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-rose-100 rounded text-center text-xs font-bold text-rose-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-fastest"></div>
                    <div data-desc="Words 10-25% faster than your avg" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-amber-100 rounded text-center text-xs font-bold text-amber-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-fast"></div>
                    <div data-desc="Words +/-10% of your avg pace" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-emerald-100 rounded text-center text-xs font-bold text-emerald-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-normal"></div>
                    <div data-desc="Words 10-25% slower than your avg" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-blue-100 rounded text-center text-xs font-bold text-blue-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-slow"></div>
                    <div data-desc="Words 25%+ slower than your avg" class="vg-bar cursor-pointer hover:brightness-95 w-full bg-purple-100 rounded text-center text-xs font-bold text-purple-600 transition-all duration-500 flex items-center justify-center overflow-hidden" id="vg-pace-slowest"></div>
                    <div class="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 border-t-2 border-slate-100 pt-2 w-full text-center">Pace Var</div>
                </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-100 text-center">
                <p id="vg-explainer-text" class="text-xs font-medium text-slate-500 transition-colors duration-300">Your pause, pace & volume variation.</p>
            </div>
        </div>
        `;
    }
}

customElements.define('thps-voice-graph', THPSVoiceGraph);

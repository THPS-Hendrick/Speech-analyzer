class THPSReportCard extends HTMLElement {
    constructor() {
        super();
        this.data = window.thps_diagnosticData || null; 
        this.explainerData = { strengthsGaps: null, phantasia: null };
        this.isLoading = true;
    }

    async connectedCallback() {
        await this.fetchExplainers();
        this.render();

        this.diagListener = (e) => {
            this.data = e.detail; 
            this.render();        
        };
        window.addEventListener('thps-diagnostic-complete', this.diagListener);
    }

    disconnectedCallback() {
        if (this.diagListener) window.removeEventListener('thps-diagnostic-complete', this.diagListener);
    }

    async fetchExplainers() {
        try {
            const [sgRes, phanRes] = await Promise.all([
                fetch('https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/Explainers/strengths-gaps.json'),
                fetch('https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/Explainers/phantasia-preferences.json')
            ]);
            if (sgRes.ok) this.explainerData.strengthsGaps = await sgRes.json();
            if (phanRes.ok) this.explainerData.phantasia = await phanRes.json();
        } catch (e) { 
            console.warn("Could not load Report Card explainer JSONs", e); 
        } finally {
            this.isLoading = false;
        }
    }

    downloadPDF() {
        const element = this.querySelector('#report-card-pdf-target');
        if (!element || typeof html2pdf === 'undefined') {
            alert("PDF generation engine is initializing or unavailable.");
            return;
        }

        const opt = {
            margin:       0,
            filename:     `Speech_Assessment_${this.data?.client?.name?.replace(/\s+/g, '_') || 'Client'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    }

    render() {
        if (!this.data) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans">
                    <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-file-text text-2xl"></i>
                    </div>
                    <h3 class="font-black text-xl text-slate-800 tracking-tight">Awaiting Diagnostic Data</h3>
                    <p class="text-sm text-slate-500 mt-2 max-w-md mx-auto">Please complete all stages of the Diagnostic Course and click "Generate PDF Report Card" to populate this document.</p>
                </div>
            `;
            return; 
        }

        if (this.isLoading) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans">
                    <i class="fas fa-spinner fa-spin text-indigo-600 text-3xl mb-4"></i>
                    <p class="text-sm font-bold text-slate-600">Compiling Report Scoring Matrix...</p>
                </div>
            `;
            return;
        }

        // Invoke Scoring Matrix Engine (Failsafe fallback if engine not loaded)
        const scoring = window.THPS_ReportScoring || {
            scoreVocalInhibition: () => ({ hasInhibition: false, label: "No Inhibition", pauseVariety: "med", voiceVariety: "med", runVariety: "med", bars: { pause: [20,20,20,20,20], voice: [20,20,20,20,20], run: [20,20,20,20,20] } }),
            scoreVisualInhibition: () => ({ label: "Not Inhibited", house: { time: 0, timePass: false, pace: 0, pacePass: false, vis: 0, visPass: false, score: 0 }, imagination: { time: 0, timePass: false, pace: 0, pacePass: false, vis: 0, visPass: false, score: 0 } }),
            scoreCategoryInhibition: () => ({ total: 0, label: "Not Inhibited", grade: "Average" }),
            sortStrengthsAndGaps: () => ({ strengths: [], gaps: [] })
        };

        const vocal = scoring.scoreVocalInhibition(this.data.vocalInhibition);
        const visual = scoring.scoreVisualInhibition(this.data.visualAssociation);
        const category = scoring.scoreCategoryInhibition(this.data.repeatCount);
        const splitData = scoring.sortStrengthsAndGaps(this.data, this.explainerData.strengthsGaps);

        const phantasiaText = (this.explainerData.phantasia && this.explainerData.phantasia[this.data.phantasia]) 
            ? this.explainerData.phantasia[this.data.phantasia] 
            : `Selected profile: ${this.data.phantasia}`;

        this.innerHTML = `
        <style>
            .a4-container { width: 100%; max-width: 800px; margin: 0 auto; }
            .a4-page { width: 210mm; min-height: 295mm; padding: 15mm; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: white; }
        </style>

        <div class="a4-container font-['Inter',sans-serif] text-slate-800">
            <div class="flex justify-end mb-4">
                <button id="btn-download-pdf" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow flex items-center gap-2 transition cursor-pointer">
                    <i class="fas fa-file-pdf"></i> Download PDF Report
                </button>
            </div>

            <div id="report-card-pdf-target">
                <!-- PAGE 1 -->
                <div class="a4-page border border-slate-200 rounded-2xl mx-auto">
                    <div>
                        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                            <div>
                                <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">THPS SPEECH ASSESSMENT</h1>
                                <p class="text-sm font-semibold text-slate-700 mt-1">Speaker Name: <span class="font-normal text-slate-900">${this.data.client.name}</span></p>
                                <p class="text-sm font-semibold text-slate-700">Assessment Date: <span class="font-normal text-slate-900">${this.data.client.date}</span></p>
                            </div>
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidential</div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-base text-slate-900 mb-2">Speaker Goals:</h3>
                            <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">${this.data.client.goals}</p>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-base text-slate-900 mb-2">Your Speaking Strengths [${splitData.strengths.length}/4]</h3>
                            <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
                                ${splitData.strengths.length > 0 
                                    ? splitData.strengths.map(s => `<li><b>${s.name}:</b>${s.text}</li>`).join('') 
                                    : `<li class="text-slate-400 italic">No primary strengths flagged in this baseline.</li>`}
                            </ul>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-base text-slate-900 mb-2">Your Speaking Gaps [${splitData.gaps.length}/4]</h3>
                            <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
                                ${splitData.gaps.length > 0 
                                    ? splitData.gaps.map(g => `<li><b>${g.name}:</b>${g.text}</li>`).join('') 
                                    : `<li class="text-slate-400 italic">No significant gaps flagged.</li>`}
                            </ul>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-base text-slate-900 mb-2">When speaking, do you prefer thinking in Images or Concepts?</h3>
                            <p class="text-sm text-slate-700 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">${phantasiaText}</p>
                        </div>
                    </div>
                    <div class="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border-t pt-3 mt-4">THPS Analytics Core — Page 1</div>
                </div>

                <!-- PAGE 2 -->
                <div class="a4-page border border-slate-200 rounded-2xl mx-auto mt-6">
                    <div>
                        <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
                            <h1 class="text-xl font-black tracking-tight text-slate-900 uppercase">THPS SPEECH ASSESSMENT</h1>
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidential</div>
                        </div>

                        <!-- 1. VOCAL INHIBITION -->
                        <div class="mb-8">
                            <h3 class="font-bold text-base text-slate-900 mb-3">Do you have Vocal Inhibition? <span class="text-indigo-600">[${vocal.hasInhibition ? 'Yes - ' + vocal.label : 'No'}]</span></h3>
                            
                            <div class="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">PAUSE VAR.</p>
                                    <div class="flex items-end gap-1 h-16 border-b border-slate-200 pb-1">
                                        ${vocal.bars.pause.map(val => `<div class="flex-1 bg-rose-500 rounded-t" style="height: ${Math.max(5, val)}%;"></div>`).join('')}
                                    </div>
                                    <p class="text-xs font-bold text-slate-600 text-center mt-2">[${vocal.pauseVariety} variety]</p>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">VOICE VAR.</p>
                                    <div class="flex items-end gap-1 h-16 border-b border-slate-200 pb-1">
                                        ${vocal.bars.voice.map(val => `<div class="flex-1 bg-indigo-500 rounded-t" style="height: ${Math.max(5, val)}%;"></div>`).join('')}
                                    </div>
                                    <p class="text-xs font-bold text-slate-600 text-center mt-2">[${vocal.voiceVariety} variety]</p>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">RUN VAR.</p>
                                    <div class="flex items-end gap-1 h-16 border-b border-slate-200 pb-1">
                                        ${vocal.bars.run.map(val => `<div class="flex-1 bg-emerald-500 rounded-t" style="height: ${Math.max(5, val)}%;"></div>`).join('')}
                                    </div>
                                    <p class="text-xs font-bold text-slate-600 text-center mt-2">[${vocal.runVariety} variety]</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2. IMAGE INHIBITION -->
                        <div class="mb-8">
                            <h3 class="font-bold text-base text-slate-900 mb-3">Is your speaking inhibited by Image or Imagination prompts? <span class="text-indigo-600">[${visual.label}]</span></h3>
                            
                            <div class="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                                <div>
                                    <h4 class="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">House Test</h4>
                                    <div class="space-y-1 text-xs text-slate-600">
                                        <div class="flex justify-between"><span>Time:</span> <span class="font-bold">${visual.house.time}s (${visual.house.timePass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between"><span>Pace:</span> <span class="font-bold">${visual.house.pace} wpm (${visual.house.pacePass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between"><span>Visual:</span> <span class="font-bold">${Math.round(visual.house.vis)}% (${visual.house.visPass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200"><span>Result:</span> <span>${visual.house.score}/3 (${visual.house.score === 3 ? 'pass' : 'fail'})</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">Imagination Test</h4>
                                    <div class="space-y-1 text-xs text-slate-600">
                                        <div class="flex justify-between"><span>Time:</span> <span class="font-bold">${visual.imagination.time}s (${visual.imagination.timePass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between"><span>Pace:</span> <span class="font-bold">${visual.imagination.pace} wpm (${visual.imagination.pacePass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between"><span>Visual:</span> <span class="font-bold">${Math.round(visual.imagination.vis)}% (${visual.imagination.visPass ? 'pass' : 'fail'})</span></div>
                                        <div class="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200"><span>Result:</span> <span>${visual.imagination.score}/3 (${visual.imagination.score === 3 ? 'pass' : 'fail'})</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. CATEGORY INHIBITION -->
                        <div class="mb-8">
                            <h3 class="font-bold text-base text-slate-900 mb-3">Is your speaking inhibited by Rules or Category prompts? <span class="text-indigo-600">[${category.label}]</span></h3>
                            
                            <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                                ${this.data.repeatCount.map(round => `
                                    <div class="border rounded-lg p-2.5 bg-slate-50 flex justify-between items-center">
                                        <span class="font-sans font-bold text-slate-700">${round.name} Map</span>
                                        <span class="text-slate-500 text-[11px]">C: ${round.correct}/5 | D: ${round.noDelay}/5 \vert{} V:${round.voice}/5</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- TOTAL SCORE FOOTER (Strictly Test 5) -->
                    <div class="border-t-2 border-slate-900 pt-4 flex justify-between items-center">
                        <h3 class="font-black text-lg text-slate-900">Total Score: <span class="text-indigo-600">${category.total} / 90</span></h3>
                        <span class="px-4 py-1.5 bg-indigo-100 text-indigo-800 font-black rounded-full uppercase tracking-wider text-xs">${category.grade}</span>
                    </div>
                </div>
            </div>
        </div>
        `;

        const downloadBtn = this.querySelector('#btn-download-pdf');
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadPDF());
    }
}
customElements.define('thps-report-card', THPSReportCard);

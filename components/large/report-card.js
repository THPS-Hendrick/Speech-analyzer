class THPSReportCard extends HTMLElement {
    constructor() {
        super();
        this.data = window.thps_diagnosticData || {
            client: { name: "John Doe", date: new Date().toLocaleDateString(), goals: "Wants to capture clear flow without reading script cards during professional deliveries." },
            nervesScore: 24,
            phantasia: "Phantasia",
            vocalInhibition: {
                1: { recorded: true, wpm: 75, sps: 2.1, pause: 45, text: "Sample string output level one." },
                2: { recorded: true, wpm: 92, sps: 2.8, pause: 38, text: "Sample string output level two." },
                3: { recorded: true, wpm: 124, sps: 4.2, pause: 21, text: "Sample string output level three." },
                4: { recorded: true, wpm: 155, sps: 5.1, pause: 12, text: "Sample string output level four." },
                5: { recorded: true, wpm: 182, sps: 5.9, pause: 8, text: "Sample string output level five." }
            },
            visualAssociation: {
                A: { recorded: true, wpm: 98, visual: 24 },
                B: { recorded: true, wpm: 155, visual: 19 }
            },
            repeatCount: [
                { name: "Underline", correct: 4, noDelay: 3, voice: 5 },
                { name: "No Underline", correct: 5, noDelay: 4, voice: 4 },
                { name: "Question", correct: 3, noDelay: 2, voice: 3 },
                { name: "Statement", correct: 5, noDelay: 5, voice: 4 },
                { name: "Small Big", correct: 4, noDelay: 4, voice: 5 },
                { name: "Opposites", correct: 2, noDelay: 1, voice: 2 }
            ]
        };
    }

    connectedCallback() {
        this.render();
        this.querySelector('[data-action="printPDF"]').addEventListener('click', () => window.print());
    }

    getNervesPercentile(score) {
        if (score <= 16) return { name: "Top 80-100%", desc: "Highly stable physiological response.", dial: 5 };
        if (score <= 24) return { name: "Top 60-80%", desc: "Typical adaptive focus variables.", dial: 4 };
        if (score <= 27) return { name: "Mid 40-60%", desc: "Moderate nervous activation thresholds.", dial: 3 };
        if (score <= 31) return { name: "Bottom 20-40%", desc: "High somatic reaction indicators.", dial: 2 };
        return { name: "Bottom 0-20%", desc: "Severe sympathetic stress thresholds.", dial: 1 };
    }

    getPhantasiaInterpretation(type) {
        switch(type) {
            case "Aphantasia":
                return "<b>Aphantasia (~1% of population):</b> Complete absence of voluntary visual imagery. <i>Speaking Implication:</i> Highly structured abstract logical processors. Likely requires clear systematic frameworks or notes to navigate dense conceptual structures easily, as they cannot pull from a 'visable' mind-map scene dynamically.";
            case "Hypophantasia":
                return "<b>Hypo-phantasia (~3% of population):</b> Strained or delayed mental image generation. <i>Speaking Implication:</i> May experience slight friction or conceptual hitches when attempting to improvise storytelling arcs or visual scene architectures under immediate public pressure.";
            case "Hyperphantasia":
                return "<b>Hyper-phantasia (~6% of population):</b> Effortless, highly vivid, and frequently involuntary mental visuals. <i>Speaking Implication:</i> Phenomenal creative projection capacity. However, they run an intense risk of speaking too quickly or wandering off-topic, as their brain continuously forces secondary visual imagery (like unprompted orchard scenes or background environmental textures) directly into their operational awareness.";
            default:
                return "<b>Phantasia (~89% of population):</b> Standard, typical visual memory access. <i>Speaking Implication:</i> Well-balanced visual landscape memory tracking. Can conjure recognizable shapes (like red apple targets) with low cognitive overhead, ensuring balanced delivery loops when well-paced.";
        }
    }

    render() {
        const nerves = this.getNervesPercentile(this.data.nervesScore);
        const phantasiaText = this.getPhantasiaInterpretation(this.data.phantasia);
        
        // Arbitrary placeholder mappings for Remaining Dials as requested
        const vInhibPasses = Object.values(this.data.vocalInhibition).filter(v => v.recorded).length;
        const s5Passes = (this.data.visualAssociation.A.wpm < 100 ? 1 : 0) + (this.data.visualAssociation.B.wpm > 170 ? 1 : 0);

        this.innerHTML = `
        <style>
            .a4-container { width: 100%; max-width: 800px; margin: 0 auto; }
            .a4-page { width: 210mm; height: 295mm; background: white; padding: 20mm; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; display: flex; flex-col: column; justify-content: space-between; position: relative; border: 1px border-slate-200; box-sizing: border-box; }
            .dial-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
            .dot-active { background: #4f46e5; transform: scale(1.2); box-shadow: 0 0 6px rgba(79,70,229,0.4); }
            .dot-inactive { background: #e2e8f0; }
            
            @media print {
                body, html, aside, main header, footer, #widget-menu-drawer, #celebration-panel, button, .tools-header-ui {
                    visibility: hidden !important;
                    height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;
                }
                thps-report-card, thps-report-card * { visibility: visible !important; }
                thps-report-card { position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important; }
                .a4-page { width: 210mm !important; height: 297mm !important; page-break-after: always !important; page-break-inside: avoid !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                .no-print { display: none !important; }
            }
        </style>

        <div class="a4-container font-['Inter',sans-serif] text-slate-800">
            
            <div class="flex justify-end mb-4 no-print">
                <button data-action="printPDF" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow flex items-center gap-2 transition"><i class="fas fa-file-pdf"></i> Download PDF Report</button>
            </div>

            <!-- PAGE 1 -->
            <div class="a4-page border border-slate-200 rounded-2xl mx-auto flex flex-col justify-between">
                <div>
                    <!-- Header Block -->
                    <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                        <div>
                            <h1 class="text-3xl font-black tracking-tight text-slate-900">THPS DIAGNOSTIC REPORT</h1>
                            <p class="text-xs font-bold uppercase tracking-widest text-indigo-600 mt-1">Acoustic & Cognitive Neuro-Performance Metric</p>
                        </div>
                        <div class="text-right text-xs text-slate-400 font-bold">CONFIDENTIAL</div>
                    </div>

                    <!-- Stage 1: Client Details -->
                    <div class="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm">
                        <div>
                            <div class="mb-2"><span class="font-bold text-slate-500 uppercase text-[10px] block">Speaker Profile</span> <span class="text-base font-black text-slate-800">${this.data.client.name}</span></div>
                            <div><span class="font-bold text-slate-500 uppercase text-[10px] block">Assessment Frame Date</span> <span class="font-semibold">${this.data.client.date}</span></div>
                        </div>
                        <div>
                            <span class="font-bold text-slate-500 uppercase text-[10px] block">Strategic Objective Targets</span>
                            <p class="text-xs leading-relaxed font-medium text-slate-600 line-clamp-3">${this.data.client.goals}</p>
                        </div>
                    </div>

                    <!-- Stage 7: Executive Summary Percentile Matrix -->
                    <div class="mb-8">
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-4">Stage 7: Performance Percentile Gauges</h2>
                        <div class="grid grid-cols-5 gap-3">
                            ${[
                                { title: "Nerve Control", score: nerves.dial, lbl: nerves.name },
                                { title: "Mind's Eye", score: this.data.phantasia === 'Phantasia' ? 4 : (this.data.phantasia === 'Hyperphantasia' ? 5 : 2), lbl: this.data.phantasia },
                                { title: "Vocal Release", score: Math.max(1, vInhibPasses), lbl: `Lvl ${vInhibPasses}/5 verified` },
                                { title: "Visual Flow", score: s5Passes === 2 ? 5 : (s5Passes === 1 ? 3 : 1), lbl: `${s5Passes}/2 Targets` },
                                { title: "Repeat Engine", score: 4, lbl: "Stable tracking" }
                            ].map(dial => `
                                <div class="border border-slate-200 rounded-xl p-3 bg-white text-center shadow-sm">
                                    <div class="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 truncate">${dial.title}</div>
                                    <div class="flex justify-center gap-1 mb-2">
                                        ${[1,2,3,4,5].map(pt => `<span class="dial-dot ${pt === dial.score ? 'dot-active' : 'dot-inactive'}"></span>`).join('')}
                                    </div>
                                    <div class="text-[11px] font-bold text-indigo-600 mt-1 truncate">${dial.lbl}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="grid grid-cols-5 text-[8px] uppercase tracking-widest text-slate-400 font-bold px-1 mt-2 text-center">
                            <span>0-20%</span><span>20-40%</span><span>40-60%</span><span>60-80%</span><span>80-100%</span>
                        </div>
                    </div>

                    <!-- Stage 2: Nerve Self-Assessment Breakdown -->
                    <div class="mb-6">
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">Stage 2: Sympathetic Nervous Activation</h2>
                        <p class="text-xs text-slate-500 mb-3 font-medium">Measures sensory threshold adjustments under immediate communication stress frames. Target profile values look to optimize baseline tranquility vectors.</p>
                        <div class="bg-slate-50 border rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Accumulated Trauma Load Matrix</span>
                                <div class="text-3xl font-black text-slate-900 mt-0.5">${this.data.nervesScore} <span class="text-sm font-bold text-slate-400">/ 40 total</span></div>
                            </div>
                            <div class="text-right">
                                <span class="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold font-mono">${nerves.name}</span>
                                <div class="text-xs font-medium text-slate-500 mt-1 max-w-[200px]">${nerves.desc}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Stage 3: Phantasia Mind's Eye Profiles -->
                    <div>
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">Stage 3: Imagery Cognitive Baseline</h2>
                        <div class="p-4 border border-indigo-100 bg-indigo-50/40 rounded-xl text-xs leading-relaxed text-slate-700">
                            ${phantasiaText}
                        </div>
                    </div>
                </div>
                <div class="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border-t pt-4">THPS Analytics Core — Page 1</div>
            </div>

            <!-- PAGE 2 -->
            <div class="a4-page border border-slate-200 rounded-2xl mx-auto flex flex-col justify-between">
                <div>
                    <!-- Stage 4: Vocal Inhibition Matrix -->
                    <div class="mb-8">
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">Stage 4: Vocal Inhibition Stress Testing</h2>
                        <p class="text-xs text-slate-500 mb-4 font-medium">Tracks micro acoustic variations under sequential cadence restrictions routed directly via Vercel engines.</p>
                        <table class="w-full text-left border border-slate-200 rounded-xl overflow-hidden text-xs">
                            <thead class="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500">
                                <tr>
                                    <th class="p-3">Acoustic Tier Frame</th>
                                    <th class="p-3">Pacing Vector</th>
                                    <th class="p-3">Mumble Density</th>
                                    <th class="p-3">Pause Ratio</th>
                                    <th class="p-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 font-medium">
                                ${[1,2,3,4,5].map(l => {
                                    const slot = this.data.vocalInhibition[l];
                                    return `
                                        <tr>
                                            <td class="p-3 font-bold text-slate-700">Level ${l} Variant</td>
                                            <td class="p-3">${slot?.recorded ? `${slot.wpm} WPM` : '-'}</td>
                                            <td class="p-3">${slot?.recorded ? `${slot.sps.toFixed(1)} SPS` : '-'}</td>
                                            <td class="p-3">${slot?.recorded ? `${slot.pause}%` : '-'}</td>
                                            <td class="p-3 text-right">${slot?.recorded ? '<span class="text-emerald-600 font-bold">Verified</span>' : '<span class="text-slate-300">Skipped</span>'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Stage 5: Visual Word Association Targets -->
                    <div class="mb-8">
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">Stage 5: Dual Image & Memory Prompt Targets</h2>
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Part A -->
                            <div class="border rounded-xl p-4 bg-slate-50/50">
                                <div class="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Part A: External Image Prompt</div>
                                <div class="text-xs font-semibold text-slate-600 space-y-1">
                                    <div>Target Boundary: <span class="font-mono font-bold">&lt; 100 WPM | &gt; 20% Visual</span></div>
                                    <div class="text-sm text-slate-900 font-bold pt-1">Actual: ${this.data.visualAssociation.A.wpm} WPM | ${this.data.visualAssociation.A.visual}% Visual</div>
                                    <div class="pt-2">Result: ${this.data.visualAssociation.A.wpm < 100 && this.data.visualAssociation.A.visual > 20 ? '<span class="text-emerald-600 font-black uppercase">✓ Target Passed</span>' : '<span class="text-rose-500 font-black uppercase">✗ Boundary Failure</span>'}</div>
                                </div>
                            </div>
                            <!-- Part B -->
                            <div class="border rounded-xl p-4 bg-slate-50/50">
                                <div class="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Part B: Internal Memory Prompt</div>
                                <div class="text-xs font-semibold text-slate-600 space-y-1">
                                    <div>Target Boundary: <span class="font-mono font-bold">&gt; 170 WPM | &gt; 20% Visual</span></div>
                                    <div class="text-sm text-slate-900 font-bold pt-1">Actual: ${this.data.visualAssociation.B.wpm} WPM | ${this.data.visualAssociation.B.visual}% Visual</div>
                                    <div class="pt-2">Result: ${this.data.visualAssociation.B.wpm > 170 && this.data.visualAssociation.B.visual > 20 ? '<span class="text-emerald-600 font-black uppercase">✓ Target Passed</span>' : '<span class="text-rose-500 font-black uppercase">✗ Boundary Failure</span>'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stage 6: Repeat Count Supervised Matrix -->
                    <div>
                        <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">Stage 6: Supervised Repeat Count Vector Rounds</h2>
                        <div class="grid grid-cols-2 gap-3 text-xs font-medium">
                            ${this.data.repeatCount.map(round => `
                                <div class="border rounded-xl p-3 bg-white flex justify-between items-center shadow-sm">
                                    <div class="font-bold text-slate-700">${round.name} Map</div>
                                    <div class="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        C: ${round.correct}/5 | D: ${round.noDelay}/5 | V: ${round.voice}/5
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border-t pt-4">THPS Analytics Core — Page 2</div>
            </div>

        </div>
        `;
    }
}
customElements.define('thps-report-card', THPSReportCard);

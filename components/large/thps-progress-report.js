class THPSProgressReport extends HTMLElement {
    constructor() {
        super();
        this.clientId = localStorage.getItem('thps_crm_client_id') || null;
        this.progressData = [];
        this.clientDetails = null;
        this.isLoading = true;
        this.error = null;
    }

    async connectedCallback() {
        this.render();
        if (this.clientId) {
            await this.fetchProgressData();
        } else {
            this.isLoading = false;
            this.error = "No CRM Client ID linked. Please use the Guest menu to link a session.";
            this.render();
        }
    }

    async fetchProgressData() {
        try {
            // Replace with your actual Firebase API endpoint
            const response = await fetch(`/api/get-rc-progress?clientId=${encodeURIComponent(this.clientId)}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch progress data from CRM.");
            }

            const data = await response.json();
            
            // Expected structure: { client: { name, dateStarted }, attempts: [ { timestamp, levelId, setIndex, telemetry: {}, manualGrades: {} }, ... ] }
            this.clientDetails = data.client || { name: this.clientId, dateStarted: new Date().toLocaleDateString() };
            this.progressData = data.attempts || [];
            
        } catch (error) {
            console.warn("API Fetch Failed, falling back to dummy data for demonstration.", error);
            
            // DEMO/FALLBACK DATA IF ENDPOINT IS UNAVAILABLE
            this.clientDetails = { name: this.clientId, dateStarted: new Date().toLocaleDateString() };
            this.progressData = this.generateDummyData();
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    generateDummyData() {
        const attempts = [];
        let trend = 0;
        for (let i = 0; i < 15; i++) {
            trend += (Math.random() * 10 - 2); // Simulating gradual improvement
            attempts.push({
                attemptNum: i + 1,
                manualGrades: {
                    questionAdherence: Math.random() > 0.2,
                    repeatAdherence: Math.random() > 0.3,
                    countAdherence: Math.random() > 0.4
                },
                telemetry: {
                    personal: Math.max(10, Math.min(80, 20 + trend + Math.random() * 20)),
                    visual: Math.max(10, Math.min(60, 15 + trend/2 + Math.random() * 15)),
                    intangible: Math.max(5, Math.min(50, 40 - trend + Math.random() * 10)),
                    wpm: Math.max(90, Math.min(200, 110 + trend * 2 + Math.random() * 30)),
                    sps: Math.max(2.5, Math.min(6.0, 3.0 + (trend/20) + Math.random() * 1.5)),
                    pause: Math.max(5, Math.min(50, 10 + trend + Math.random() * 10)),
                    runtime: Math.max(2.0, Math.min(10.0, 3.5 + (trend/10) + Math.random() * 2.0)),
                    compGrade: Math.max(4.0, Math.min(12.0, 6.0 + (trend/5) + Math.random() * 2.0)),
                    simple: Math.max(60, Math.min(100, 75 + trend + Math.random() * 10))
                }
            });
        }
        return attempts;
    }

    downloadPDF() {
        const element = this.querySelector('#progress-pdf-target');
        if (!element || typeof html2pdf === 'undefined') {
            alert("PDF generation engine is initializing or unavailable.");
            return;
        }

        const opt = {
            margin:       0,
            filename:     `THPS_Progress_Report_${this.clientDetails.name.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    }

    // Helper to generate the CSS Scatter Plots
    buildGraph(title, key, minVal, maxVal, zones) {
        const attempts = this.progressData;
        const totalAttempts = Math.max(10, attempts.length); // Minimum x-axis width of 10
        
        // Calculate background zone heights (percentages)
        const getPct = (val) => Math.max(0, Math.min(100, ((val - minVal) / (maxVal - minVal)) * 100));
        
        const red1H = getPct(zones.yellow[0]); 
        const yellow1H = getPct(zones.green[0]) - getPct(zones.yellow[0]);
        const greenH = getPct(zones.green[1]) - getPct(zones.green[0]);
        const yellow2H = getPct(zones.yellow[1]) - getPct(zones.green[1]);
        const red2H = 100 - getPct(zones.yellow[1]);

        // Generate data dots
        const dots = attempts.map((att, idx) => {
            const rawVal = att.telemetry[key];
            const xPos = (idx / (totalAttempts - 1)) * 100;
            const yPos = getPct(rawVal);
            
            // Determine dot color based on where it landed
            let dotColor = 'bg-rose-500'; // Default red
            if (rawVal >= zones.green[0] && rawVal <= zones.green[1]) dotColor = 'bg-emerald-500';
            else if (rawVal >= zones.yellow[0] && rawVal <= zones.yellow[1]) dotColor = 'bg-amber-400';

            return `<div class="absolute w-2.5 h-2.5 rounded-full border border-white shadow-sm transform -translate-x-1/2 translate-y-1/2 z-20 ${dotColor}" style="left: ${xPos}%; bottom: ${yPos}%;" title="Attempt ${idx + 1}: ${rawVal.toFixed(1)}"></div>`;
        }).join('');

        return `
            <div class="mb-8 break-inside-avoid">
                <div class="flex justify-between items-end mb-2">
                    <h4 class="font-bold text-slate-800 uppercase tracking-widest text-xs">${title}</h4>
                    <span class="text-[10px] font-bold text-slate-400">Scale: ${minVal} - ${maxVal}</span>
                </div>
                <div class="relative w-full h-40 border-l-2 border-b-2 border-slate-800 bg-white shadow-sm">
                    <!-- Zones -->
                    <div class="absolute w-full bg-rose-50/50 border-t border-rose-100/50" style="bottom: 0%; height: ${red1H}%;"></div>
                    <div class="absolute w-full bg-amber-50/50 border-t border-amber-100/50" style="bottom: ${red1H}%; height: ${yellow1H}%;"></div>
                    <div class="absolute w-full bg-emerald-50/50 border-t border-emerald-100/50" style="bottom: ${red1H + yellow1H}%; height: ${greenH}%;"></div>
                    <div class="absolute w-full bg-amber-50/50 border-t border-amber-100/50" style="bottom: ${red1H + yellow1H + greenH}%; height: ${yellow2H}%;"></div>
                    <div class="absolute w-full bg-rose-50/50 border-t border-rose-100/50" style="bottom: ${red1H + yellow1H + greenH + yellow2H}%; height: ${red2H}%;"></div>
                    
                    <!-- Data Points -->
                    ${dots}
                    
                    <!-- X-Axis Labels -->
                    <div class="absolute -bottom-5 left-0 text-[9px] font-bold text-slate-400">Att 1</div>
                    <div class="absolute -bottom-5 right-0 text-[9px] font-bold text-slate-400">Att ${totalAttempts}</div>
                </div>
            </div>
        `;
    }

    render() {
        if (this.isLoading) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans">
                    <i class="fas fa-spinner fa-spin text-indigo-600 text-3xl mb-4"></i>
                    <p class="text-sm font-bold text-slate-600">Fetching Longitudinal CRM Data...</p>
                </div>
            `;
            return;
        }

        if (this.error) {
            this.innerHTML = `
                <div class="p-10 text-center bg-rose-50 rounded-2xl border border-rose-200 shadow-sm w-full font-sans flex flex-col items-center">
                    <i data-lucide="alert-triangle" class="w-10 h-10 text-rose-500 mb-3"></i>
                    <p class="text-sm font-bold text-rose-700">${this.error}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: this });
            return;
        }

        if (this.progressData.length === 0) {
            this.innerHTML = `
                <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm w-full font-sans">
                    <i data-lucide="bar-chart-2" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                    <h3 class="text-lg font-black text-slate-800 mb-1">No Progress Data</h3>
                    <p class="text-sm text-slate-500">This client has not recorded any Repeat + Count attempts yet.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: this });
            return;
        }

        // Calculate Overview Stats
        const totalSets = this.progressData.length;
        let qPass = 0, rPass = 0, cPass = 0;
        
        this.progressData.forEach(att => {
            if (att.manualGrades?.questionAdherence) qPass++;
            if (att.manualGrades?.repeatAdherence) rPass++;
            if (att.manualGrades?.countAdherence) cPass++;
        });

        const qPct = Math.round((qPass / totalSets) * 100);
        const rPct = Math.round((rPass / totalSets) * 100);
        const cPct = Math.round((cPass / totalSets) * 100);

        this.innerHTML = `
        <style>
            .a4-container { width: 100%; max-width: 800px; margin: 0 auto; }
            .a4-page { width: 210mm; min-height: 295mm; padding: 15mm; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); box-sizing: border-box; display: flex; flex-direction: column; background: white; }
            .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        </style>

        <div class="a4-container font-['Inter',sans-serif] text-slate-800">
            <div class="flex justify-end mb-4 px-4 sm:px-0">
                <button id="btn-download-progress-pdf" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow flex items-center gap-2 transition cursor-pointer">
                    <i data-lucide="download" class="w-4 h-4 pointer-events-none"></i> Download Progress PDF
                </button>
            </div>

            <div id="progress-pdf-target">
                <!-- PAGE 1: SUMMARY & ADHERENCE -->
                <div class="a4-page border border-slate-200 rounded-2xl mx-auto">
                    <div>
                        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                            <div>
                                <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">Repeat + Count Progress</h1>
                                <p class="text-sm font-semibold text-slate-700 mt-1">Client ID: <span class="font-normal font-mono text-indigo-600">${this.clientDetails.name}</span></p>
                                <p class="text-sm font-semibold text-slate-700">Total Attempts Logged: <span class="font-normal text-slate-900">${totalSets}</span></p>
                            </div>
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidential</div>
                        </div>

                        <div class="mb-8">
                            <h3 class="font-bold text-lg text-slate-900 mb-4 border-b border-slate-200 pb-2">Manual Adherence Overview</h3>
                            <div class="grid grid-cols-3 gap-6">
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                                    <span class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Question Prompts</span>
                                    <div class="text-3xl font-black text-indigo-600">${qPct}%</div>
                                    <div class="text-xs font-bold text-slate-400 mt-1">Pass Rate</div>
                                </div>
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                                    <span class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Repeat Frameworks</span>
                                    <div class="text-3xl font-black text-emerald-600">${rPct}%</div>
                                    <div class="text-xs font-bold text-slate-400 mt-1">Pass Rate</div>
                                </div>
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                                    <span class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Count Sequences</span>
                                    <div class="text-3xl font-black text-amber-500">${cPct}%</div>
                                    <div class="text-xs font-bold text-slate-400 mt-1">Pass Rate</div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-lg text-slate-900 mb-4 border-b border-slate-200 pb-2">Content Telemetry</h3>
                            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
                                ${this.buildGraph('Personal %', 'personal', 0, 100, { green: [30, 60], yellow: [10, 80] })}
                                ${this.buildGraph('Visual %', 'visual', 0, 100, { green: [20, 50], yellow: [10, 60] })}
                                ${this.buildGraph('Intangible %', 'intangible', 0, 100, { green: [10, 30], yellow: [5, 50] })}
                            </div>
                        </div>
                    </div>
                    <div class="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border-t pt-3 mt-auto">THPS Analytics Core — Page 1</div>
                </div>

                <!-- PAGE 2: DELIVERY & SIMPLICITY -->
                <div class="a4-page border border-slate-200 rounded-2xl mx-auto mt-6">
                    <div>
                        <div class="mb-6">
                            <h3 class="font-bold text-lg text-slate-900 mb-4 border-b border-slate-200 pb-2">Delivery Telemetry</h3>
                            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
                                ${this.buildGraph('Words/Min', 'wpm', 50, 250, { green: [100, 150], yellow: [85, 170] })}
                                ${this.buildGraph('Syllables/Sec', 'sps', 0, 8, { green: [3.5, 4.5], yellow: [3.0, 5.0] })}
                                ${this.buildGraph('Pause %', 'pause', 0, 100, { green: [15, 35], yellow: [9, 41] })}
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-lg text-slate-900 mb-4 border-b border-slate-200 pb-2">Simplicity Telemetry</h3>
                            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
                                ${this.buildGraph('Runtime (s)', 'runtime', 0, 15, { green: [3.0, 6.0], yellow: [2.0, 9.0] })}
                                ${this.buildGraph('Comp. Grade', 'compGrade', 0, 16, { green: [5.0, 10.0], yellow: [4.0, 12.0] })}
                                ${this.buildGraph('Simple %', 'simple', 0, 100, { green: [80, 90], yellow: [70, 96] })}
                            </div>
                        </div>
                    </div>
                    <div class="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest border-t pt-3 mt-auto">THPS Analytics Core — Page 2</div>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });

        const downloadBtn = this.querySelector('#btn-download-progress-pdf');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPDF());
        }
    }
}
customElements.define('thps-progress-report', THPSProgressReport);

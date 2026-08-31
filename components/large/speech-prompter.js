class ThpsSpeechPrompter extends HTMLElement {
    constructor() {
        super();
        this.state = {
            currentStep: 1,
            targetMinutes: 5,
            audience: "",
            goal: "",
            probFamiliar: "",
            probEscalation: "",
            probStage: "let AI decide",
            metricFamiliar: "",
            metricProof: "",
            metricStage: "let AI decide",
            solIntro: "",
            solScale: "",
            solStage: "let AI decide",
            askDetails: "",
            askImpact: "",
            askStage: "let AI decide"
        };
    }

    connectedCallback() {
        this.render();
    }

    calculateWordCounts() {
        const totalWords = this.state.targetMinutes * 130;
        const topicBudget = Math.floor(totalWords / 4);
        const familiarWords = Math.floor(topicBudget * 0.35);
        const sizingWords = Math.floor(topicBudget * 0.65);
        return { totalWords, familiarWords, sizingWords };
    }

    generatePrompt() {
        const { totalWords, familiarWords, sizingWords } = this.calculateWordCounts();
        const s = this.state;

        return `**Role & Task**
Act as an elite speechwriter. Write a speech for a specific audience: **${s.audience || "[Insert Audience]"}**. The ultimate goal of this speech is: **${s.goal || "[Insert Goal]"}**.

**Strict Analytical Constraints**
You must adhere to the following biological pacing and scoring guardrails:
* **Word Count:** The total speech must be exactly **${totalWords}** words. Do not deviate.
* **Sentence Pacing:** Sentences must average 7 to 15 words. Absolutely no sentence may exceed 22 words in length to force natural breathing pauses.
* **Content Balance:** Ensure 30% to 60% of the speech uses personal pronouns and storytelling. Ensure 20% to 50% uses vivid, sensory, visual language.

**The 12-Step Structure**
Write the speech using the following 4 topics. Each topic has 2 spoken parts with strict word counts, and 1 non-spoken stage direction part.

**Topic 1: The Problem**
* **Part 1 (Speak - ${familiarWords} words):** Explain the core problem using this familiar analogy: ${s.probFamiliar || "[Insert familiarExample]"}.
* **Part 2 (Speak - ${sizingWords} words):** Escalate the problem using these Small, Medium, and Large examples: ${s.probEscalation || "[Insert escalationSML]"}.
* **Part 3 (Stage Directions - Do Not Speak):** Suggest specific slide images and vocal modulations for Parts 1 and 2 based on this emotional cue: ${s.probStage}.

**Topic 2: Success Metrics**
* **Part 4 (Speak - ${familiarWords} words):** Explain the main metric for success using this cross-industry example: ${s.metricFamiliar || "[Insert familiarMetric]"}.
* **Part 5 (Speak - ${sizingWords} words):** Prove why this metric alone fails without the secondary metric using this proof: ${s.metricProof || "[Insert vitalProof]"}.
* **Part 6 (Stage Directions - Do Not Speak):** Suggest specific slide images and vocal modulations for Parts 4 and 5 based on this emotional cue: ${s.metricStage}.

**Topic 3: The Solution**
* **Part 7 (Speak - ${familiarWords} words):** Introduce the solution without jargon based on this concept: ${s.solIntro || "[Insert familiarIntro]"}.
* **Part 8 (Speak - ${sizingWords} words):** Address the downside/cost, then scale up to the Better and Best versions using this framework: ${s.solScale || "[Insert costAndScale]"}.
* **Part 9 (Stage Directions - Do Not Speak):** Suggest specific slide images and vocal modulations for Parts 7 and 8 based on this emotional cue: ${s.solStage}.

**Topic 4: The Ask & Impact**
* **Part 10 (Speak - ${familiarWords} words):** Make the precise funding or collaboration request: ${s.askDetails || "[Insert specificAsk]"}.
* **Part 11 (Speak - ${sizingWords} words):** Describe the cascading impact this ask will have on the original Small, Medium, and Large problems: ${s.askImpact || "[Insert cascadingImpact]"}.
* **Part 12 (Stage Directions - Do Not Speak):** Suggest specific slide images and vocal modulations for Parts 10 and 11 based on this emotional cue: ${s.askStage}.`;
    }

    getStepContent() {
        const step = this.state.currentStep;
        const val = (key) => this.state[key];

        switch(step) {
            case 1: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">1. Speech Setup</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Target Duration (${val('targetMinutes')} Minutes)</label>
                <input type="range" min="1" max="20" value="${val('targetMinutes')}" class="w-full mb-4" oninput="this.closest('thps-speech-prompter').updateState('targetMinutes', this.value)">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Target Audience</label>
                <input type="text" value="${val('audience')}" placeholder="Who are you speaking to?" class="w-full p-2 border border-slate-200 rounded mb-4 text-sm" oninput="this.closest('thps-speech-prompter').updateState('audience', this.value)">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Speech Goal</label>
                <textarea rows="3" placeholder="What is the ultimate goal?" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('goal', this.value)">${val('goal')}</textarea>`;
            case 2: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">2. Problem: Familiar Anchor</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Familiar Example</label>
                <textarea rows="5" placeholder="Describe the core problem using an everyday example or analogy the audience already understands." class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('probFamiliar', this.value)">${val('probFamiliar')}</textarea>`;
            case 3: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">3. Problem: Escalation</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Small, Medium, Large Examples</label>
                <textarea rows="5" placeholder="Provide a Small, Medium, and Large real-world example of how this problem is expanding out of control." class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('probEscalation', this.value)">${val('probEscalation')}</textarea>`;
            case 4: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">4. Problem: Stage Directions</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Visual & Emotional Cues</label>
                <textarea rows="5" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('probStage', this.value)">${val('probStage')}</textarea>`;
            case 5: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">5. Metrics: Familiar Context</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Main Metric</label>
                <textarea rows="5" placeholder="What is the main metric for success? Give an example of this working in a totally different industry." class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('metricFamiliar', this.value)">${val('metricFamiliar')}</textarea>`;
            case 6: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">6. Metrics: Proof of Necessity</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Metric</label>
                <textarea rows="5" placeholder="Prove why having the first metric without the second one leads to failure." class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('metricProof', this.value)">${val('metricProof')}</textarea>`;
            case 7: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">7. Metrics: Stage Directions</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Visual & Emotional Cues</label>
                <textarea rows="5" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('metricStage', this.value)">${val('metricStage')}</textarea>`;
            case 8: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">8. Solution: Simple Intro</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">The Solution</label>
                <textarea rows="5" placeholder="Introduce your specific solution as simply as possible. Avoid jargon." class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('solIntro', this.value)">${val('solIntro')}</textarea>`;
            case 9: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">9. Solution: Cost & Scale</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Downside & Upside</label>
                <textarea rows="5" placeholder="What is the honest downside/cost? What does the Better and Best version look like?" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('solScale', this.value)">${val('solScale')}</textarea>`;
            case 10: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">10. Solution: Stage Directions</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Visual & Emotional Cues</label>
                <textarea rows="5" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('solStage', this.value)">${val('solStage')}</textarea>`;
            case 11: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">11. The Ask: Details</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">The Request</label>
                <textarea rows="5" placeholder="What specific funding, resources, or collaboration do you need right now?" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('askDetails', this.value)">${val('askDetails')}</textarea>`;
            case 12: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">12. The Ask: Impact</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Resolving the Escalation</label>
                <textarea rows="5" placeholder="How will this ask specifically resolve the Small, Medium, and Large escalations you mentioned earlier?" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('askImpact', this.value)">${val('askImpact')}</textarea>`;
            case 13: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">13. The Ask: Stage Directions</h3>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Visual & Emotional Cues</label>
                <textarea rows="5" class="w-full p-2 border border-slate-200 rounded text-sm resize-none" oninput="this.closest('thps-speech-prompter').updateState('askStage', this.value)">${val('askStage')}</textarea>`;
            case 14: return `
                <h3 class="text-lg font-bold text-slate-800 mb-4">14. Print Prompt</h3>
                <p class="text-xs text-slate-500 mb-2">Copy this text and paste it into Gemini or another AI to generate your speech.</p>
                <textarea id="final-prompt-text" rows="12" class="w-full p-3 border border-slate-200 rounded text-xs font-mono bg-slate-50 resize-none" readonly>${this.generatePrompt()}</textarea>
                <button onclick="this.closest('thps-speech-prompter').copyPrompt()" class="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-sm transition-colors">Copy to Clipboard</button>`;
            default: return "";
        }
    }

    updateState(key, value) {
        this.state[key] = value;
        if (key === 'targetMinutes' && this.state.currentStep === 1) {
            this.render(); // Re-render to update the visual minute count
        }
    }

    setStep(num) {
        this.state.currentStep = num;
        this.render();
    }

    copyPrompt() {
        const textEl = this.querySelector('#final-prompt-text');
        if (textEl) {
            textEl.select();
            document.execCommand('copy');
            const btn = this.querySelector('button.bg-indigo-600');
            if (btn) {
                btn.innerText = "Copied!";
                setTimeout(() => btn.innerText = "Copy to Clipboard", 2000);
            }
        }
    }

    render() {
        const steps = [
            "Setup", "Prob: Anchor", "Prob: Scale", "Prob: Stage",
            "Metric: Anchor", "Metric: Proof", "Metric: Stage",
            "Sol: Intro", "Sol: Scale", "Sol: Stage",
            "Ask: Details", "Ask: Impact", "Ask: Stage", "Print Prompt"
        ];

        this.innerHTML = `
            <div class="score-card glass-panel p-0 rounded-2xl border-t-4 border-indigo-500 shadow-sm relative overflow-hidden flex w-full h-[400px] group cursor-move">
                
                <!-- EDIT MODE DESPAWN BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <!-- LEFT NAV -->
                <div class="w-1/3 max-w-[200px] bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col py-4">
                    ${steps.map((label, idx) => `
                        <div onclick="this.closest('thps-speech-prompter').setStep(${idx + 1})" 
                             class="px-4 py-2 text-xs font-bold cursor-pointer transition-colors ${this.state.currentStep === idx + 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}">
                            ${idx + 1}. ${label}
                        </div>
                    `).join('')}
                </div>

                <!-- MAIN BODY -->
                <div class="flex-1 flex flex-col bg-white">
                    <div class="flex justify-between items-center p-4 border-b border-slate-100">
                        <h2 class="text-sm font-black text-slate-700 tracking-wider">AI Speech Prompter</h2>
                        <span class="text-xs font-bold text-slate-400">Step ${this.state.currentStep} of 14</span>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-6 relative">
                        ${this.getStepContent()}
                    </div>

                    <div class="p-4 border-t border-slate-100 flex justify-between bg-slate-50">
                        <button onclick="this.closest('thps-speech-prompter').setStep(${Math.max(1, this.state.currentStep - 1)})" class="px-4 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-300 transition-colors ${this.state.currentStep === 1 ? 'invisible' : ''}">Previous</button>
                        <button onclick="this.closest('thps-speech-prompter').setStep(${Math.min(14, this.state.currentStep + 1)})" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors ${this.state.currentStep === 14 ? 'hidden' : ''}">Next</button>
                    </div>
                </div>
            </div>
        `;

        const closeBtn = this.querySelector('.thps-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const wrapper = this.closest('.cursor-move');
                if (wrapper) wrapper.remove(); 
                else this.remove(); 
            });
        }
    }
}

customElements.define('thps-speech-prompter', ThpsSpeechPrompter);

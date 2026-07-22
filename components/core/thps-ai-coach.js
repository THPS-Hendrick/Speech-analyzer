// ==========================================
// THPS AI COACH WIDGET (DASHBOARD WIDGET v2.0)
// Inline Chat Widget with Wake-Up Payload Sync
// ==========================================

class ThpsAiCoach extends HTMLElement {
    constructor() {
        super();
        this.latestPayload = null;
        this.isTyping = false;
        this.hasGreetedPayload = false;
    }

    connectedCallback() {
        this.render();
        this.attachListeners();

        // 1. Listen for live updates broadcast across the dashboard
        this.dashboardHandler = (e) => {
            this.latestPayload = e.detail;
            this.wakeUpCoach();
        };
        window.addEventListener('thps-dashboard-update', this.dashboardHandler);

        // 2. WAKE UP FUNCTION: If payload already exists in memory prior to spawning
        if (window.thps_lastPayload && window.thps_lastPayload.text) {
            this.latestPayload = window.thps_lastPayload;
            // Delay slightly to allow inner DOM to settle
            setTimeout(() => this.wakeUpCoach(), 100);
        }
    }

    disconnectedCallback() {
        window.removeEventListener('thps-dashboard-update', this.dashboardHandler);
    }

    wakeUpCoach() {
        if (!this.latestPayload || !this.latestPayload.text) return;

        const messagesArea = this.querySelector('#ai-coach-messages');
        if (!messagesArea) return;

        // Check if we already appended a wake-up notice for this specific attempt ID or text
        if (this.hasGreetedPayload === this.latestPayload.id || this.hasGreetedPayload === this.latestPayload.text) return;

        this.hasGreetedPayload = this.latestPayload.id || this.latestPayload.text;

        const systemMsg = document.createElement('div');
        systemMsg.className = 'flex justify-start';
        systemMsg.innerHTML = `
            <div class="max-w-[90%] bg-indigo-50 border border-indigo-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                <p class="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-600"></i> Speech Data Synchronized
                </p>
                <p class="text-xs text-indigo-700 leading-relaxed">
                    I've loaded your latest analysis! Ask me about your scores, mumble rating, or pacing.
                </p>
            </div>
        `;
        messagesArea.appendChild(systemMsg);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        if (window.lucide) window.lucide.createIcons({ root: systemMsg });
    }

    render() {
        this.innerHTML = `
            <div class="glass-panel p-5 rounded-2xl border-t-4 border-indigo-600 shadow-sm flex flex-col bg-white relative w-full h-[480px] transition-transform hover:-translate-y-1 hover:shadow-md group font-sans">
                
                <!-- CLOSE BUTTON (Hides when Locked, Visible in Edit Mode) -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                </button>

                <!-- HEADER -->
                <div class="flex items-center gap-3 pb-3 border-b border-slate-100 shrink-0 mb-3">
                    <div class="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <i data-lucide="bot" class="w-5 h-5 pointer-events-none"></i>
                    </div>
                    <div>
                        <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">AI Vocal Coach</h3>
                        <p class="text-[10px] text-slate-400 font-medium">Powered by Gemini AI</p>
                    </div>
                </div>

                <!-- MESSAGES CONTAINER -->
                <div id="ai-coach-messages" class="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar text-xs">
                    <!-- Default Greeting -->
                    <div class="flex justify-start">
                        <div class="max-w-[88%] bg-slate-100 border border-slate-200/60 rounded-2xl rounded-tl-sm p-3 text-slate-700 leading-relaxed">
                            Hi! I'm your AI Vocal Coach. Record a speech or choose an attempt from History, then ask me how to improve your metrics!
                        </div>
                    </div>
                </div>

                <!-- INPUT AREA -->
                <div class="pt-3 border-t border-slate-100 shrink-0 flex gap-2 items-center mt-2">
                    <input id="ai-coach-input" type="text" placeholder="Ask about your performance..." class="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                    <button id="ai-coach-send" class="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i data-lucide="send" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>

            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                .typing-dot { animation: typing 1.4s infinite ease-in-out both; }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            </style>
        `;

        if (window.lucide) window.lucide.createIcons({ root: this });
    }

    attachListeners() {
        const closeBtn = this.querySelector('.thps-close-btn');
        const sendBtn = this.querySelector('#ai-coach-send');
        const inputField = this.querySelector('#ai-coach-input');

        // Handle Widget Removal
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const wrapper = this.closest('.cursor-move');
                if (wrapper) wrapper.remove();
                else this.remove();
            });
        }

        sendBtn.addEventListener('click', () => this.handleSend());
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
            .replace(/\n/g, '<br>');
    }

    appendMessage(role, text) {
        const messagesArea = this.querySelector('#ai-coach-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

        if (role === 'user') {
            msgDiv.innerHTML = `
                <div class="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm text-xs leading-relaxed">
                    ${text}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="max-w-[88%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 shadow-sm text-xs text-slate-700 leading-relaxed">
                    ${this.formatMarkdown(text)}
                </div>
            `;
        }

        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    showTypingIndicator() {
        const messagesArea = this.querySelector('#ai-coach-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'ai-typing-indicator';
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="bg-slate-100 border border-slate-200/60 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex gap-1 items-center">
                <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
            </div>
        `;
        messagesArea.appendChild(typingDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = this.querySelector('#ai-typing-indicator');
        if (indicator) indicator.remove();
    }

    async handleSend() {
        const inputField = this.querySelector('#ai-coach-input');
        const sendBtn = this.querySelector('#ai-coach-send');
        const text = inputField.value.trim();

        if (!text || this.isTyping) return;

        // Ensure we check global cache if payload wasn't caught yet
        if (!this.latestPayload && window.thps_lastPayload) {
            this.latestPayload = window.thps_lastPayload;
        }

        if (!this.latestPayload || !this.latestPayload.text) {
            this.appendMessage('user', text);
            inputField.value = '';
            setTimeout(() => {
                this.appendMessage('coach', "I don't have any speech data yet! Please record audio or select an attempt from Session History first.");
            }, 400);
            return;
        }

        this.isTyping = true;
        sendBtn.disabled = true;
        inputField.disabled = true;
        
        this.appendMessage('user', text);
        inputField.value = '';
        this.showTypingIndicator();

        try {
            const response = await fetch('https://mic-check-backend.vercel.app/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    payload: this.latestPayload
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            
            this.removeTypingIndicator();
            this.appendMessage('coach', data.answer);

        } catch (error) {
            console.error("Coach API Error:", error);
            this.removeTypingIndicator();
            this.appendMessage('coach', "I'm having trouble connecting to my analysis engine. Please ensure your Vercel backend deployment is active.");
        } finally {
            this.isTyping = false;
            sendBtn.disabled = false;
            inputField.disabled = false;
            inputField.focus();
        }
    }
}

customElements.define('thps-ai-coach', ThpsAiCoach);

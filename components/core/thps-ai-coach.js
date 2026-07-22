// ==========================================
// THPS AI COACH WIDGET
// Floating chat interface for Gemini AI Contextual Coaching
// ==========================================

class ThpsAiCoach extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.latestPayload = null;
        this.isTyping = false;
    }

    connectedCallback() {
        this.render();
        this.attachListeners();
        
        // Listen to the main dashboard updates to secretly store the latest payload
        window.addEventListener('thps-dashboard-update', (e) => {
            this.latestPayload = e.detail;
        });

        // Check if there is already a payload loaded on startup
        if (window.thps_lastPayload) {
            this.latestPayload = window.thps_lastPayload;
        }
    }

    render() {
        this.innerHTML = `
            <!-- FLOATING ACTION BUTTON (FAB) -->
            <button id="ai-coach-fab" class="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group">
                <i data-lucide="bot" class="w-6 h-6 pointer-events-none transition-transform group-hover:rotate-12"></i>
            </button>

            <!-- CHAT WINDOW (Hidden by default) -->
            <div id="ai-coach-window" class="fixed bottom-24 right-6 z-[100] w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col font-sans transform scale-95 opacity-0 pointer-events-none transition-all duration-300 origin-bottom-right">
                
                <!-- Header -->
                <div class="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-inner">
                            <i data-lucide="bot" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-black tracking-wider uppercase">AI Vocal Coach</h3>
                            <p class="text-[10px] text-indigo-300">Powered by Gemini</p>
                        </div>
                    </div>
                    <button id="ai-coach-close" class="text-slate-400 hover:text-white p-1 transition-colors">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <!-- Messages Area -->
                <div id="ai-coach-messages" class="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4 custom-scrollbar">
                    <!-- Welcome Message -->
                    <div class="flex justify-start">
                        <div class="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                            <p class="text-sm text-slate-700 leading-relaxed">Hi! I'm your AI Vocal Coach. Complete a speech exercise, then ask me how you did or how you can improve your scores!</p>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-3 bg-white border-t border-slate-200 rounded-b-2xl shrink-0 flex gap-2 items-end">
                    <textarea id="ai-coach-input" rows="1" placeholder="Ask about your performance..." class="flex-1 bg-slate-100 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none max-h-32 custom-scrollbar"></textarea>
                    <button id="ai-coach-send" class="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i data-lucide="send" class="w-5 h-5 pointer-events-none ml-0.5"></i>
                    </button>
                </div>
            </div>
            
            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
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
        const fab = this.querySelector('#ai-coach-fab');
        const win = this.querySelector('#ai-coach-window');
        const closeBtn = this.querySelector('#ai-coach-close');
        const sendBtn = this.querySelector('#ai-coach-send');
        const inputField = this.querySelector('#ai-coach-input');

        // Auto-resize textarea
        inputField.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            sendBtn.disabled = this.value.trim() === '';
        });

        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                win.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
                win.classList.add('scale-100', 'opacity-100', 'pointer-events-auto');
                inputField.focus();
            } else {
                win.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');
                win.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
            }
        };

        fab.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        sendBtn.addEventListener('click', () => this.handleSend());
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    // Basic Markdown parser to make Gemini's bolding and line breaks look good
    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
            .replace(/\n/g, '<br>');
    }

    appendMessage(role, text) {
        const messagesArea = this.querySelector('#ai-coach-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

        if (role === 'user') {
            msgDiv.innerHTML = `
                <div class="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
                    <p class="text-sm leading-relaxed">${text}</p>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <p class="text-sm text-slate-700 leading-relaxed">${this.formatMarkdown(text)}</p>
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
            <div class="bg-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center h-10">
                <div class="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
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

        // 1. Check if we actually have data to analyze
        if (!this.latestPayload) {
            this.appendMessage('user', text);
            inputField.value = '';
            inputField.style.height = 'auto';
            setTimeout(() => {
                this.appendMessage('coach', "I don't have any data yet! Please complete a speaking module first so I can analyze your vocal metrics and transcript.");
            }, 500);
            return;
        }

        // 2. Lock UI and show user message
        this.isTyping = true;
        sendBtn.disabled = true;
        inputField.disabled = true;
        
        this.appendMessage('user', text);
        inputField.value = '';
        inputField.style.height = 'auto';
        this.showTypingIndicator();

        // 3. Contact Vercel Backend
        try {
            const response = await fetch('https://mic-check-backend.vercel.app/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    payload: this.latestPayload // The invisible context injection!
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            
            this.removeTypingIndicator();
            this.appendMessage('coach', data.answer);

        } catch (error) {
            console.error("Coach API Error:", error);
            this.removeTypingIndicator();
            this.appendMessage('coach', "I'm sorry, I'm having trouble connecting to my analysis engine right now. Please try again in a moment.");
        } finally {
            this.isTyping = false;
            sendBtn.disabled = false;
            inputField.disabled = false;
            inputField.focus();
        }
    }
}

customElements.define('thps-ai-coach', ThpsAiCoach);

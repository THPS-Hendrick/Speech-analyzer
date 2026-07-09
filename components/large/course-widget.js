class THPSCourseWidget extends HTMLElement {
    constructor() {
        super();
        this.isMenuOpen = false;
    }

    connectedCallback() {
        this.render();
        this.attachListeners();
        // Trigger lucide icons for this specific widget instance
        if (window.lucide) window.lucide.createIcons({ root: this });
    }

    render() {
        this.innerHTML = `
            <div class="relative w-full h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                
                <button class="thps-course-menu-toggle absolute top-0 left-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-br-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest z-30 transition-colors shadow-md flex items-center gap-2 active:scale-95 origin-top-left">
                    <i data-lucide="menu" class="w-3 h-3 sm:w-4 sm:h-4 pointer-events-none"></i> 
                    <span class="thps-course-step-text pointer-events-none">Step 1 / 13</span>
                </button>

                <div class="thps-course-drawer absolute inset-y-0 left-0 w-full md:w-72 bg-slate-900 text-slate-300 transform -translate-x-full transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl">
                    <div class="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
                        <span class="font-black text-white tracking-widest uppercase text-xs">Course Modules</span>
                        <button class="thps-course-menu-toggle text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors">
                            <i data-lucide="chevron-left" class="w-4 h-4 pointer-events-none"></i> Hide
                        </button>
                    </div>
                    
                    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
                        <div class="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white cursor-pointer">
                            <span class="truncate pr-2">1. Pitching Setup</span>
                        </div>
                        <div class="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
                            <span class="truncate pr-2">2. Visual Hooks</span>
                        </div>
                    </nav>
                </div>

                <div class="flex-1 overflow-y-auto bg-slate-50 pt-16 px-4 md:px-8 pb-8 relative">
                    <div class="max-w-2xl mx-auto space-y-8">
                        <div>
                            <h2 class="thps-course-title text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-2">1. Pitching Setup</h2>
                            <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-900 leading-relaxed shadow-sm">
                                Module setup and instructions will be dynamically loaded here in Phase 2.
                            </div>
                        </div>
                        
                        <div class="thps-course-content-area space-y-6"></div>
                    </div>
                </div>

                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button class="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Prev
                    </button>
                    <button class="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2">
                        Next <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachListeners() {
        // Find all elements serving as menu toggles (the tab and the hide button)
        const toggleBtns = this.querySelectorAll('.thps-course-menu-toggle');
        const drawer = this.querySelector('.thps-course-drawer');

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.isMenuOpen = !this.isMenuOpen;
                if (this.isMenuOpen) {
                    drawer.classList.remove('-translate-x-full');
                } else {
                    drawer.classList.add('-translate-x-full');
                }
            });
        });
    }
}

customElements.define('thps-course-widget', THPSCourseWidget);

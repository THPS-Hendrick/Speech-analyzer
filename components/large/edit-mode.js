// ==========================================
// THPS WIDGET: LARGE EDIT MODE
// ==========================================

class ThpsEditMode extends HTMLElement {
    connectedCallback() {
        this.virtualSentences = [];
        this.virtualWords = [];
        this.syllableGroups = [];
        this.currentMode = "edit-speech"; // Default mode
        this.isEditing = false; // Toggle state for the editor
        this.lastDataPayload = null;

        this.innerHTML = `
            <style>
                .github-line { display: flex; font-size: 0.875rem; line-height: 1.5; border-bottom: 1px solid transparent; transition: background-color 0.15s; }
                .github-line:hover { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .github-gutter { width: 4rem; flex-shrink: 0; padding: 0.25rem 0.5rem; text-align: right; color: #94a3b8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; user-select: none; border-right: 1px solid #e2e8f0; margin-right: 1rem; align-items: flex-start; display: flex; justify-content: flex-end; }
                .github-content { flex-grow: 1; padding: 0.25rem 0; color: #334155; }
                .metric-highlight { color: #ef4444; font-weight: bold; } 
                
                /* Filter Styles */
                .personal-word, .visual-word, .overlap-word, .simple-word { transition: all 0.2s; }
                .show-personal .personal-word { color: #3b82f6; font-weight: 700; background: #eff6ff; border-radius: 2px; }
                .show-visual .visual-word { color: #ef4444; font-weight: 700; background: #fef2f2; border-radius: 2px; }
                .show-overlap .overlap-word { color: #a855f7; font-weight: 700; background: #faf5ff; border-radius: 2px; }
                .show-simple .simple-word { text-decoration: underline; text-decoration-color: currentColor; text-decoration-thickness: 2px; text-underline-offset: 4px; }
                
                /* Editor Styles */
                .thps-editor-box { outline: none; padding: 1rem; min-height: 100%; white-space: pre-wrap; line-height: 1.8; }
                .thps-editor-box:focus { background-color: #f8fafc; }
            </style>
            
            <!-- Default wrapper classes added for ON state -->
            <div class="glass-panel p-4 sm:p-6 rounded-2xl shadow-sm relative w-full h-full group cursor-move show-personal show-visual show-overlap show-simple">
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <!-- TOOLBAR -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 border-slate-100 gap-3 pr-6 relative z-50">
                    <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-slate-700"><i data-lucide="edit-3" class="w-4 h-4 inline-block mr-1"></i>Edit Mode</h3>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Modes Dropdown -->
                        <select id="edit-mode-select" class="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none hover:bg-slate-100 cursor-pointer font-bold">
                            <option value="edit-speech">Edit Speech</option>
                            <option value="long-short">Words / Sentence</option>
                            <option value="syllables">Syllables / Word</option>
                        </select>

                        <!-- Filters Dropdown -->
                        <div class="group/filters relative" id="filters-dropdown-container">
                            <button class="text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-500 rounded-lg px-3 py-1 outline-none hover:bg-slate-50 shadow-sm flex items-center gap-1 cursor-pointer">
                                Filters <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                            <div class="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/filters:opacity-100 group-hover/filters:visible transition-all duration-200 z-50 p-2 flex flex-col gap-2">
                                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-blue-600"><input type="checkbox" class="filter-toggle" value="show-personal" checked> Personal</label>
                                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-red-600"><input type="checkbox" class="filter-toggle" value="show-visual" checked> Visual</label>
                                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-purple-600"><input type="checkbox" class="filter-toggle" value="show-overlap" checked> Overlap</label>
                                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900"><input type="checkbox" class="filter-toggle" value="show-simple" checked> Simple</label>
                            </div>
                        </div>

                        <!-- Count Dropdown (Lazy Loads Sync) -->
                        <div class="group/counts relative">
                            <button id="count-dropdown-btn" class="text-xs font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg px-3 py-1 outline-none hover:bg-indigo-100 shadow-sm flex items-center gap-1 cursor-pointer w-24 justify-between">
                                Count <i data-lucide="bar-chart-2" class="w-3 h-3"></i>
                            </button>
                            <div class="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/counts:opacity-100 group-hover/counts:visible transition-all duration-200 z-50 p-3 flex flex-col gap-1.5 text-xs">
                                <div class="flex justify-between border-b pb-1 mb-1"><span class="text-slate-500">Words</span><span id="em-stat-words" class="font-bold text-slate-800">-</span></div>
                                <div class="flex justify-between border-b pb-1 mb-1"><span class="text-slate-500">Sentences</span><span id="em-stat-sents" class="font-bold text-slate-800">-</span></div>
                                <div class="flex justify-between border-b pb-1 mb-1"><span class="text-slate-500">Syllables</span><span id="em-stat-sylls" class="font-bold text-slate-800">-</span></div>
                                <div class="flex justify-between"><span class="text-slate-500">Personal</span><span id="em-stat-pers" class="font-bold text-blue-600">-</span></div>
                                <div class="flex justify-between"><span class="text-slate-500">Visual</span><span id="em-stat-vis" class="font-bold text-red-600">-</span></div>
                                <div class="flex justify-between"><span class="text-slate-500">Overlap</span><span id="em-stat-over" class="font-bold text-purple-600">-</span></div>
                                <div class="flex justify-between"><span class="text-slate-500">Simple</span><span id="em-stat-simp" class="font-bold text-slate-800">-</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CONTENT AREA -->
                <div class="thps-edit-content w-full h-80 sm:h-96 rounded-xl border border-slate-200 bg-white overflow-y-auto overflow-x-hidden">
                    <div class="p-4 text-center text-slate-400 italic text-sm mt-10">Waiting for text...</div>
                </div>
            </div>
        `;
        
        // Setup Close Event
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); else this.remove();
        });

        // Setup Mode Change Event
        this.querySelector('#edit-mode-select').addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            this.renderDOM();
        });

        // Setup Filter Toggles
        this.querySelectorAll('.filter-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                // Find the main glass-panel wrapper and toggle the specific class
                const wrapper = this.querySelector('.glass-panel');
                wrapper.classList.toggle(e.target.value, e.target.checked);
            });
        });

        // Lazy-Load sync for Count Dropdown
        this.querySelector('.group\\/counts').addEventListener('mouseenter', () => {
            if (this.currentMode === 'edit-speech' && this.isEditing) {
                this.syncToEngine(true); // Silent sync
            }
        });

        // Delegate Click Event for the dynamic "Edit (off/on)" button
        this.querySelector('.thps-edit-content').addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-edit-btn');
            if (btn) {
                if (this.isEditing) {
                    // Exiting Edit Mode
                    this.isEditing = false;
                    this.syncToEngine(); 
                } else {
                    // Entering Edit Mode
                    this.isEditing = true;
                    this.renderDOM();
                }
            }
        });

        // Delegate Paste Event to strip HTML when editing
        this.querySelector('.thps-edit-content').addEventListener('paste', (e) => {
            if (!this.isEditing) return;
            const editorBox = e.target.closest('.thps-editor-box');
            if (editorBox) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            }
        });
        
        if (window.lucide) window.lucide.createIcons({ root: this });
        window.addEventListener('thps-dashboard-update', (e) => this.processData(e.detail));

        if (window.thps_lastPayload) {
            setTimeout(() => this.processData(window.thps_lastPayload), 50);
        }
    }

    syncToEngine(silent = false) {
        const editor = this.querySelector('.thps-editor-box');
        if (!editor) return;
        
        const newText = editor.innerText || editor.textContent;
        const hiddenEl = document.getElementById('cba-inputText');
        if (hiddenEl) hiddenEl.value = newText;
        
        if (typeof window.analyze === 'function') {
            if (silent) this.ignoreNextUpdate = true;
            window.analyze();
        }
    }

    processData(data) {
        // SAFETY: Do not overwrite the user's text if an external update triggers while typing.
        if (this.isEditing && !this.ignoreNextUpdate) return; 

        if (this.ignoreNextUpdate) {
            this.updateStatsPanel(data);
            this.ignoreNextUpdate = false;
            return;
        }

        this.lastDataPayload = data;

        if (!data.text || data.text.trim() === '') {
            this.virtualSentences = [];
            this.syllableGroups = [];
            this.renderDOM();
            return;
        }

        // Parse Sentences using plain text so sort matches word count
        const rawSentences = data.text.match(/[^.!?]+[.!?]*/g) || [data.text];
        this.virtualSentences = rawSentences.map((sentence, index) => {
            const cleanText = sentence.trim();
            const words = cleanText.split(/\s+/).filter(w => w.length > 0);
            return { originalIndex: index + 1, text: cleanText, wordCount: words.length };
        }).filter(item => item.wordCount > 0);

        // Parse Words for Syllables (Batched & Deduplicated)
        const allWords = data.text.split(/\s+/).filter(w => w.trim().length > 0);
        let syllableMap = {};

        allWords.forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z']/g, '');
            if (!cleanWord) return; 
            
            let sylCount = 1;
            if (window.THPS && window.THPS.NLP && typeof window.THPS.NLP.countSyllables === 'function') {
                sylCount = window.THPS.NLP.countSyllables(cleanWord);
            }
            
            if (!syllableMap[sylCount]) syllableMap[sylCount] = new Set();
            syllableMap[sylCount].add(cleanWord);
        });

        this.syllableGroups = Object.keys(syllableMap)
            .map(Number)
            .sort((a, b) => b - a) 
            .map(sylCount => {
                return {
                    syllables: sylCount,
                    uniqueCount: syllableMap[sylCount].size,
                    words: Array.from(syllableMap[sylCount]).sort() 
                };
            });

        this.updateStatsPanel(data);
        this.renderDOM();
    }

    updateStatsPanel(data) {
        if (!data) return;
        
        const overlapMatches = (data.highlightedHTML || "").match(/class="[^"]*overlap-word/g) || [];
        const overlapCount = overlapMatches.length;
        const totalW = data.numWords || 1;

        this.querySelector('#em-stat-words').innerText = data.numWords || 0;
        this.querySelector('#em-stat-sents').innerText = data.numSentences || 0;
        this.querySelector('#em-stat-sylls').innerText = data.totalSyllables || 0;
        
        this.querySelector('#em-stat-pers').innerText = data.personal !== undefined ? Math.round(data.personal) + '%' : '-';
        this.querySelector('#em-stat-vis').innerText = data.visual !== undefined ? Math.round(data.visual) + '%' : '-';
        this.querySelector('#em-stat-over').innerText = Math.round((overlapCount / totalW) * 100) + '%';
        this.querySelector('#em-stat-simp').innerText = data.simple !== undefined ? Math.round(data.simple) + '%' : '-';
    }

    renderDOM() {
        const container = this.querySelector('.thps-edit-content');
        const modeSelect = this.querySelector('#edit-mode-select');
        const filtersBtn = this.querySelector('#filters-dropdown-container');
        
        // Apply UI Locks if editing
        if (this.isEditing) {
            modeSelect.disabled = true;
            modeSelect.classList.add('opacity-50', 'cursor-not-allowed');
            filtersBtn.classList.add('pointer-events-none', 'opacity-50');
        } else {
            modeSelect.disabled = false;
            modeSelect.classList.remove('opacity-50', 'cursor-not-allowed');
            filtersBtn.classList.remove('pointer-events-none', 'opacity-50');
        }

        if (!this.lastDataPayload || !this.lastDataPayload.text) {
            container.innerHTML = `<div class="p-4 text-center text-slate-400 italic text-sm mt-10">Waiting for text...</div>`;
            return;
        }

        let htmlOutput = '<div class="py-2 relative">';

        if (this.currentMode === "edit-speech") {
            // Edit Mode renders static header (not sticky) followed by HTML
            htmlOutput += `
                <div class="bg-slate-50 border-b border-slate-200 p-2 -mt-2 -mx-2 mb-2 flex justify-between items-center rounded-t-lg">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Speech Text</span>
                    <button class="toggle-edit-btn text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm ${this.isEditing ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">
                        ${this.isEditing ? 'Edit (on)' : 'Edit (off)'}
                    </button>
                </div>
                <div class="thps-editor-box px-2" ${this.isEditing ? 'contenteditable="true"' : ''} spellcheck="false">
                    ${this.lastDataPayload.highlightedHTML || this.lastDataPayload.text}
                </div>
            `;
        } 
        else if (this.currentMode === "syllables") {
            this.syllableGroups.forEach(group => {
                let gutterClass = group.syllables >= 4 ? "metric-highlight" : "text-slate-400";
                htmlOutput += `
                    <div class="github-line">
                        <div class="github-gutter ${gutterClass}" title="${group.syllables} Syllables (${group.uniqueCount} unique words)">
                            ${group.syllables}(${group.uniqueCount})
                        </div>
                        <div class="github-content leading-relaxed">
                            ${group.words.join(', ')}
                        </div>
                    </div>
                `;
            });
        } 
        else {
            // Sentence Mode (Long-Short)
            let displayArray = [...this.virtualSentences];
            if (this.currentMode === "long-short") displayArray.sort((a, b) => b.wordCount - a.wordCount);
            
            displayArray.forEach(item => {
                let gutterValue = this.currentMode === "long-short" ? item.wordCount : item.originalIndex;
                let gutterClass = (this.currentMode === "long-short" && item.wordCount >= 15) ? "metric-highlight" : "text-slate-400";
                
                htmlOutput += `
                    <div class="github-line">
                        <div class="github-gutter ${gutterClass}">${gutterValue}</div>
                        <div class="github-content">${item.text}</div>
                    </div>
                `;
            });
        }

        htmlOutput += '</div>';
        container.innerHTML = htmlOutput;
    }
}
customElements.define('thps-edit-mode', ThpsEditMode);

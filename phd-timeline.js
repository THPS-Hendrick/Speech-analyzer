// ==========================================
// THPS PhD TIMELINE & GRID ENGINE
// Handles STT chunking, Pause/Repair coding, and NLE timeline
// ==========================================

let analyzerSurfer = null;
let currentWordsData = [];
let pauseBarsData = []; // NEW: Manually placed Pauses
let clipStartTimeSec = 0; 

// Selection States
let selectedIndex = -1; // For Words
let selectedPauseId = null; // For Pauses

const PX_PER_SEC = 100;

// --- WAV ENCODER HELPERS ---
function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}
function encodeWAV(samples, sampleRate) {
    let buffer = new ArrayBuffer(44 + samples.length * 2);
    let view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    return new Blob([view], { type: 'audio/wav' });
}

// --- MASTER INJECTION & CHUNKING ENGINE ---
window.addEventListener('thps-inject-snip', async (e) => {
    const { blob, fileName, startTime } = e.detail;
    clipStartTimeSec = startTime; 
    
    // Clear out old NLE Data
    currentWordsData = [];
    pauseBarsData = [];
    selectedIndex = -1;
    selectedPauseId = null;
    
    const statusEl = document.getElementById('stt-status');
    if(statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerText = "Processing STT...";
        statusEl.classList.remove('bg-red-100', 'text-red-700');
        statusEl.classList.add('bg-blue-100', 'text-blue-700');
    }

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const arrayBuffer = await blob.arrayBuffer();
        let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (audioBuffer.sampleRate !== 16000) {
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
                1, Math.ceil(audioBuffer.duration * 16000), 16000
            );
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            source.start(0);
            audioBuffer = await offlineCtx.startRendering();
        }

        const sampleRate = audioBuffer.sampleRate; 
        const channelData = audioBuffer.getChannelData(0); 
        const chunkSize = sampleRate * 30;

        let wavChunks = [];
        for(let i = 0; i < channelData.length; i += chunkSize) {
            let segment = channelData.subarray(i, Math.min(i + chunkSize, channelData.length));
            wavChunks.push(encodeWAV(segment, sampleRate));
        }

        const uploadPromises = wavChunks.map(async (chunkBlob, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(chunkBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result.split(',')[1];
                    try {
                        const response = await fetch('https://mic-check-backend.vercel.app/api/transcribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audioContent: base64data, mimeType: 'audio/wav' })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            resolve({ index: index, words: data.words || [] });
                        } else {
                            resolve({ index: index, words: [], error: `HTTP ${response.status}` });
                        }
                    } catch (e) {
                        resolve({ index: index, words: [], error: e.message });
                    }
                };
            });
        });

        const resolvedChunks = await Promise.all(uploadPromises);
        resolvedChunks.sort((a, b) => a.index - b.index);

        let finalStitchedWords = [];
        resolvedChunks.forEach(chunk => {
            if (chunk.words && chunk.words.length > 0) {
                chunk.words.forEach(w => {
                    finalStitchedWords.push({
                        word: w.word,
                        start: w.start + (chunk.index * 30),
                        end: w.end + (chunk.index * 30),
                        isRepair: false // Pre-tag for custom PhD logic
                    });
                });
            }
        });

        // Ensure words are sorted by start time
        finalStitchedWords.sort((a, b) => a.start - b.start);

        // NEW: Auto-prefill Pause Bars for >= 1.0s gaps
        pauseBarsData = [];
        let pauseIdCounter = Date.now();

        if (finalStitchedWords.length > 0) {
            // 1. Check for gap at the very beginning of the audio
            if (finalStitchedWords[0].start >= 1.0) {
                pauseBarsData.push({
                    id: pauseIdCounter++,
                    start: 0.0,
                    row: 2 // Spawn in the middle (3rd) row
                });
            }

            // 2. Check for gaps between words
            for (let i = 0; i < finalStitchedWords.length - 1; i++) {
                const gap = finalStitchedWords[i + 1].start - finalStitchedWords[i].end;
                if (gap >= 1.0) {
                    pauseBarsData.push({
                        id: pauseIdCounter++,
                        start: finalStitchedWords[i].end, // Spawn precisely at the end of the previous word
                        row: 2 // Spawn in the middle (3rd) row
                    });
                }
            }
        }

        if(statusEl) statusEl.classList.add('hidden');
        
        setupAnalyzerTimeline(blob, finalStitchedWords);
        populateGridInitialData(fileName, startTime);

    } catch (err) {
        console.error("STT Extraction Error:", err);
        if(statusEl) {
            statusEl.innerText = "Error parsing Audio";
            statusEl.classList.replace('bg-blue-100', 'bg-red-100');
            statusEl.classList.replace('text-blue-700', 'text-red-700');
        }
    }
});

function formatTrueTime(relativeSeconds) {
    const totalSecs = clipStartTimeSec + relativeSeconds;
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function setupAnalyzerTimeline(audioBlob, wordsArray) {
    if (analyzerSurfer) analyzerSurfer.destroy();
    
    analyzerSurfer = WaveSurfer.create({
        container: '#analyzer-waveform',
        waveColor: '#94a3b8',
        progressColor: '#10b981',
        height: 96,
        normalize: true,
        cursorColor: 'transparent',
        interact: false 
    });
    
    const fileURL = URL.createObjectURL(audioBlob);
    analyzerSurfer.load(fileURL);
    
    currentWordsData = wordsArray.sort((a, b) => a.start - b.start);
    
    analyzerSurfer.on('ready', () => {
        const duration = analyzerSurfer.getDuration();
        const scrollArea = document.getElementById('master-scroll-area');
        if (scrollArea) {
            const pxWidth = Math.max(duration * PX_PER_SEC, scrollArea.clientWidth);
            document.getElementById('timeline-inner').style.width = pxWidth + 'px';
        }
        renderTimelineItems();
    });

    analyzerSurfer.on('timeupdate', (currentTime) => {
        const playhead = document.getElementById('master-playhead');
        if (playhead) {
            const leftPx = currentTime * PX_PER_SEC;
            playhead.style.left = leftPx + 'px';
            const scrollArea = document.getElementById('master-scroll-area');
            if (scrollArea && leftPx > scrollArea.scrollLeft + scrollArea.clientWidth - 100) {
                scrollArea.scrollLeft = leftPx - (scrollArea.clientWidth / 2);
            }
        }
    });

    analyzerSurfer.on('play', () => {
        const iconPlay = document.getElementById('master-icon-play');
        const iconPause = document.getElementById('master-icon-pause');
        if (iconPlay) iconPlay.classList.add('hidden');
        if (iconPause) iconPause.classList.remove('hidden');
    });
    
    analyzerSurfer.on('pause', () => {
        const iconPlay = document.getElementById('master-icon-play');
        const iconPause = document.getElementById('master-icon-pause');
        if (iconPause) iconPause.classList.add('hidden');
        if (iconPlay) iconPlay.classList.remove('hidden');
    });
}

// ----------------------------------------------------------------------
// THE 5-ROW NLE MUSIC STAFF ENGINE (Words + Pauses)
// ----------------------------------------------------------------------

let isDraggingWord = false;
let isDraggingPause = false;
let dragNode = null;
let dragIndex = -1;
let dragPauseId = null;
let dragStartX = 0;
let originalWordStart = 0;

function renderTimelineItems() {
    const track = document.getElementById('word-track');
    if(!track) return;
    track.innerHTML = '';
    
    // Inject Background Grid Lines
    track.innerHTML = `
        <div class="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 z-0">
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 w-full"></div>
        </div>
    `;

    // 1. RENDER PAUSE BARS (Sub-Layer Z-0)
    pauseBarsData.forEach(p => {
        const node = document.createElement('div');
        const yOffset = p.row * 42 + 4; // Subtly padded to fit rows perfectly
        const xOffset = p.start * PX_PER_SEC;

        node.className = 'absolute border rounded cursor-grab z-0 transition-opacity';
        node.style.left = xOffset + 'px';
        node.style.top = yOffset + 'px';
        node.style.width = PX_PER_SEC + 'px'; // Exactly 1 Second
        node.style.height = '34px';
        
        if (p.id === selectedPauseId) {
            node.classList.add('bg-yellow-400', 'border-yellow-600', 'opacity-90', 'ring-2', 'ring-yellow-500');
        } else {
            node.classList.add('bg-yellow-300', 'border-yellow-400', 'opacity-60', 'hover:opacity-80');
        }

        node.onmousedown = (e) => {
            e.stopPropagation();
            selectPause(p.id);

            isDraggingPause = true;
            dragNode = node;
            dragPauseId = p.id;
            dragStartX = e.clientX;
            originalWordStart = p.start;

            node.classList.remove('cursor-grab');
            node.classList.add('cursor-grabbing', 'z-40');
        };
        track.appendChild(node);
    });
    
    // 2. RENDER WORD BLOCKS (Top-Layer Z-10)
    currentWordsData.forEach((w, index) => {
        const node = document.createElement('div');
        const yOffset = (index % 5) * 42 + 8; 
        const xOffset = w.start * PX_PER_SEC;
        
        node.className = 'absolute px-2 py-1 text-xs font-bold border rounded shadow-sm cursor-grab select-none z-10 transition-shadow';
        node.style.left = xOffset + 'px';
        node.style.top = yOffset + 'px';
        node.innerText = w.word;
        
        // Is it tagged as a repair? Paint it Orange. Otherwise, standard styling.
        if (w.isRepair) {
            if (index === selectedIndex) {
                node.classList.add('bg-orange-200', 'border-orange-600', 'text-orange-900', 'ring-2', 'ring-orange-400');
            } else {
                node.classList.add('bg-orange-100', 'border-orange-400', 'text-orange-800');
            }
        } else {
            if (index === selectedIndex) {
                node.classList.add('bg-white', 'border-blue-500', 'text-blue-600', 'ring-2', 'ring-blue-200');
            } else {
                node.classList.add('bg-white', 'border-slate-300', 'text-slate-700');
            }
        }

        node.onmousedown = (e) => {
            e.stopPropagation();
            selectWord(index);
            
            isDraggingWord = true;
            dragNode = node;
            dragIndex = index;
            dragStartX = e.clientX;
            originalWordStart = w.start;
            
            node.classList.remove('cursor-grab');
            node.classList.add('cursor-grabbing', 'z-50', 'ring-4', 'ring-amber-200', 'border-amber-500', 'text-amber-700');
        };
        track.appendChild(node);
    });
    
    updateGridMetrics();
    updateLegacyText();
}

// Global Drag Mouse Tracking
window.addEventListener('mousemove', (e) => {
    if (!dragNode) return;
    
    const deltaX = e.clientX - dragStartX;
    const newTime = Math.max(0, originalWordStart + deltaX / PX_PER_SEC);
    dragNode.style.left = (newTime * PX_PER_SEC) + 'px';

    // If dragging a pause, we also let them change the ROW vertically
    if (isDraggingPause) {
        const trackRect = document.getElementById('word-track').getBoundingClientRect();
        let relativeY = e.clientY - trackRect.top;
        let newRow = Math.floor((relativeY - 4) / 42);
        newRow = Math.max(0, Math.min(4, newRow));
        dragNode.style.top = (newRow * 42 + 4) + 'px';
    }
});

window.addEventListener('mouseup', (e) => {
    if (isDraggingWord && dragNode) {
        const deltaX = e.clientX - dragStartX;
        const newTime = Math.max(0, originalWordStart + deltaX / PX_PER_SEC);
        
        const wordObj = currentWordsData[dragIndex];
        const duration = wordObj.end - wordObj.start;
        wordObj.start = newTime;
        wordObj.end = newTime + duration;

        currentWordsData.sort((a, b) => a.start - b.start);
        selectedIndex = currentWordsData.findIndex(item => item === wordObj);

        isDraggingWord = false;
        dragNode = null;
        renderTimelineItems();

    } else if (isDraggingPause && dragNode) {
        const deltaX = e.clientX - dragStartX;
        const newTime = Math.max(0, originalWordStart + deltaX / PX_PER_SEC);
        
        const trackRect = document.getElementById('word-track').getBoundingClientRect();
        let relativeY = e.clientY - trackRect.top;
        let newRow = Math.floor((relativeY - 4) / 42);
        newRow = Math.max(0, Math.min(4, newRow));

        const pIndex = pauseBarsData.findIndex(x => x.id === dragPauseId);
        if (pIndex > -1) {
            pauseBarsData[pIndex].start = newTime;
            pauseBarsData[pIndex].row = newRow;
        }

        isDraggingPause = false;
        dragNode = null;
        renderTimelineItems();
    }
});


// ----------------------------------------------------------------------
// TOOLBAR & SELECTION LOGIC
// ----------------------------------------------------------------------

function selectWord(index) {
    selectedIndex = index;
    selectedPauseId = null; // Unselect any pauses
    const w = currentWordsData[index];
    
    const tbContainer = document.getElementById('timeline-toolbar');
    const tbInput = document.getElementById('toolbar-word-input');
    const tbTime = document.getElementById('toolbar-word-time');

    if(tbContainer) tbContainer.classList.remove('hidden');
    if(tbInput) {
        tbInput.disabled = false;
        tbInput.value = w.word;
    }
    if(tbTime) tbTime.innerText = formatTrueTime(w.start);
    
    if (analyzerSurfer) {
        const dur = analyzerSurfer.getDuration();
        if (dur > 0) analyzerSurfer.seekTo(w.start / dur);
    }
    renderTimelineItems();
}

function selectPause(id) {
    selectedPauseId = id;
    selectedIndex = -1; // Unselect any words
    const p = pauseBarsData.find(x => x.id === id);

    const tbContainer = document.getElementById('timeline-toolbar');
    const tbInput = document.getElementById('toolbar-word-input');
    const tbTime = document.getElementById('toolbar-word-time');

    if(tbContainer) tbContainer.classList.remove('hidden');
    if(tbInput) {
        tbInput.value = "[PAUSE BAR SELECTED]";
        tbInput.disabled = true; // Cannot rename a pause block
    }
    if(tbTime) tbTime.innerText = formatTrueTime(p.start);

    renderTimelineItems();
}

document.addEventListener('DOMContentLoaded', () => {

    const masterPlayBtn = document.getElementById('master-play-btn');
    if (masterPlayBtn) {
        masterPlayBtn.addEventListener('click', () => {
            if (analyzerSurfer) analyzerSurfer.playPause();
        });
    }

    // P_COUNT BUTTON (Spawns a yellow Pause Bar)
    const btnPCount = document.getElementById('btn-p-count');
    if (btnPCount) {
        btnPCount.addEventListener('click', () => {
            let spawnTime = 0;
            if (analyzerSurfer) spawnTime = analyzerSurfer.getCurrentTime();
            
            const newPause = { id: Date.now(), start: spawnTime, row: 0 };
            pauseBarsData.push(newPause);
            selectPause(newPause.id);
        });
    }

    // R_COUNT BUTTON (Toggles Word to Orange Repair)
    const btnRCount = document.getElementById('btn-r-count');
    if (btnRCount) {
        btnRCount.addEventListener('click', () => {
            if (selectedIndex > -1 && currentWordsData[selectedIndex]) {
                currentWordsData[selectedIndex].isRepair = !currentWordsData[selectedIndex].isRepair;
                renderTimelineItems();
            }
        });
    }

    // Edit Word Text
    const tbInput = document.getElementById('toolbar-word-input');
    if (tbInput) {
        tbInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex > -1 && currentWordsData[selectedIndex]) {
                    currentWordsData[selectedIndex].word = tbInput.value.trim();
                    renderTimelineItems();
                    tbInput.blur();
                }
            }
        });
    }

    const btnAddBefore = document.getElementById('btn-add-before');
    if (btnAddBefore) {
        btnAddBefore.addEventListener('click', () => {
            if (selectedIndex === -1) return;
            const ref = currentWordsData[selectedIndex];
            const newWord = { word: "[Type here]", start: Math.max(0, ref.start - 0.2), end: ref.start, isRepair: false };
            currentWordsData.splice(selectedIndex, 0, newWord);
            selectWord(selectedIndex); 
        });
    }

    const btnAddAfter = document.getElementById('btn-add-after');
    if (btnAddAfter) {
        btnAddAfter.addEventListener('click', () => {
            if (selectedIndex === -1) return;
            const ref = currentWordsData[selectedIndex];
            const newWord = { word: "[Type here]", start: ref.end, end: ref.end + 0.2, isRepair: false };
            currentWordsData.splice(selectedIndex + 1, 0, newWord);
            selectWord(selectedIndex + 1); 
        });
    }

    // Master Delete Engine (Handles Toolbar Button AND Keypresses)
    const runDeletion = () => {
        if (selectedPauseId !== null) {
            pauseBarsData = pauseBarsData.filter(p => p.id !== selectedPauseId);
            selectedPauseId = null;
            document.getElementById('timeline-toolbar').classList.add('hidden');
            renderTimelineItems();
        } else if (selectedIndex > -1) {
            currentWordsData.splice(selectedIndex, 1);
            selectedIndex = -1;
            document.getElementById('timeline-toolbar').classList.add('hidden');
            if (analyzerSurfer) analyzerSurfer.seekTo(0);
            renderTimelineItems();
        }
    };

    const btnDeleteWord = document.getElementById('btn-delete-word');
    if (btnDeleteWord) btnDeleteWord.addEventListener('click', runDeletion);

    // Hardware Keyboard Deletion Hook
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Ignore if PhD is actively typing in a text field
            const tag = document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
            runDeletion();
        }
    });

    const gridRepairs = document.getElementById('grid-repairs');
    if (gridRepairs) gridRepairs.addEventListener('input', recalculateRates);

    // CSV Export
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const rowData = [
                document.getElementById('grid-pid').innerText,
                document.getElementById('grid-session').innerText,
                document.getElementById('grid-time').innerText,
                document.getElementById('grid-task').value || "None",
                document.getElementById('grid-words').innerText,
                document.getElementById('grid-pauses').innerText,
                document.getElementById('grid-repairs').value,
                document.getElementById('grid-org').value || "N/A",
                document.getElementById('grid-prate').innerText.replace('%', ''),
                document.getElementById('grid-rrate').innerText.replace('%', ''),
                document.getElementById('grid-notes').value || "None",
                document.getElementById('grid-org-notes').value || "None",
                document.getElementById('grid-ru-type').value || "None",
                document.getElementById('grid-include').value || "Y",
                document.getElementById('grid-complete').value || "Y"
            ];

            const tsvString = rowData.join('\t');
                btnExportCsv.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Copied to Clipboard!`;
                btnExportCsv.classList.replace('bg-emerald-600', 'bg-blue-600');
                if(window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btnExportCsv.innerHTML = originalText;
                    btnExportCsv.classList.replace('bg-blue-600', 'bg-emerald-600');
                    if(window.lucide) window.lucide.createIcons();
                }, 2000);
            });
        });
    }
});


// ----------------------------------------------------------------------
// DATA GRID LOGIC (Linked directly to explicit PhD tracking)
// ----------------------------------------------------------------------

function populateGridInitialData(fileName, startTimeSec) {
    const parts = fileName.split('-');
    const gridPid = document.getElementById('grid-pid');
    const gridSession = document.getElementById('grid-session');
    const gridTime = document.getElementById('grid-time');
    
    if(gridPid) gridPid.innerText = parts[0] || '-';
    if(gridSession) gridSession.innerText = parts[2] || '-';
    
    const h = Math.floor(startTimeSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((startTimeSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(startTimeSec % 60).toString().padStart(2, '0');
    if(gridTime) gridTime.innerText = `${h}:${m}:${s}`;
}

function updateGridMetrics() {
    // Exact overrides driven purely by the visual objects
    const wordCount = currentWordsData.length;
    const manualPauseCount = pauseBarsData.length;
    const manualRepairCount = currentWordsData.filter(w => w.isRepair).length;

    const gWords = document.getElementById('grid-words');
    const gPauses = document.getElementById('grid-pauses');
    const gRepairs = document.getElementById('grid-repairs');
    
    if(gWords) gWords.innerText = wordCount;
    if(gPauses) gPauses.innerText = manualPauseCount;
    if(gRepairs) {
        gRepairs.value = manualRepairCount; 
        gRepairs.classList.add('bg-orange-50', 'text-orange-800'); // Subtle visual link to the orange tags
    }
    
    recalculateRates();
}

function recalculateRates() {
    const wCountEl = document.getElementById('grid-words');
    const pCountEl = document.getElementById('grid-pauses');
    const rCountEl = document.getElementById('grid-repairs');
    
    if(!wCountEl || !pCountEl || !rCountEl) return;

    const wCount = parseInt(wCountEl.innerText) || 0;
    const pCount = parseInt(pCountEl.innerText) || 0;
    const rCount = parseInt(rCountEl.value) || 0;

    const pauseRate = wCount > 0 ? (pCount / wCount) * 100 : 0;
    const repairRate = wCount > 0 ? (rCount / wCount) * 100 : 0;

    const prate = document.getElementById('grid-prate');
    const rrate = document.getElementById('grid-rrate');
    
    if(prate) prate.innerText = pauseRate.toFixed(2) + '%';
    if(rrate) rrate.innerText = repairRate.toFixed(2) + '%';
}

function updateLegacyText() {
    const textStr = currentWordsData.map(w => w.word).join(" ");
    const legacyInput = document.getElementById('cba-inputText');
    if (legacyInput) legacyInput.value = textStr;
}

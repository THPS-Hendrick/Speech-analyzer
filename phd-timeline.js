// ==========================================
// THPS PhD TIMELINE & GRID ENGINE
// Handles STT calls, NLE interactive words, and metrics
// ==========================================

let analyzerSurfer = null;
let currentWordsData = [];
let clipStartTimeSec = 0; 
let selectedIndex = -1;

// TIMELINE SETTINGS
const PX_PER_SEC = 100; // 100px equals 1 second. Ensures smooth spacing.

window.addEventListener('thps-inject-snip', async (e) => {
    const { blob, fileName, startTime } = e.detail;
    clipStartTimeSec = startTime; 
    
    const statusEl = document.getElementById('stt-status');
    if(statusEl) statusEl.classList.remove('hidden');
    
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
        const b64 = reader.result.split(',')[1];
        
        try {
            const res = await fetch('https://mic-check-backend.vercel.app/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioContent: b64, mimeType: 'audio/wav' })
            });
            
            const sttData = await res.json();
            if(statusEl) statusEl.classList.add('hidden');
            
            setupAnalyzerTimeline(blob, sttData.words || []);
            populateGridInitialData(fileName, startTime);
            
        } catch (err) {
            console.error("STT Error:", err);
            if(statusEl) {
                statusEl.innerText = "Error parsing STT";
                statusEl.classList.replace('bg-blue-100', 'bg-red-100');
                statusEl.classList.replace('text-blue-700', 'text-red-700');
            }
        }
    };
});

// Helper: Format accurate HH:MM:SS
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
        cursorColor: 'transparent', // We use our custom red playhead
        interact: false // Disable direct wavesurfer clicking to prevent conflicts with our drag layer
    });
    
    const fileURL = URL.createObjectURL(audioBlob);
    analyzerSurfer.load(fileURL);
    
    // Sort array by start time to ensure perfect rendering
    currentWordsData = wordsArray.sort((a, b) => a.start - b.start);
    selectedIndex = -1;
    
    analyzerSurfer.on('ready', () => {
        const duration = analyzerSurfer.getDuration();
        
        // Stretch the internal timeline container based on the audio length
        const scrollArea = document.getElementById('master-scroll-area');
        if (scrollArea) {
            const pxWidth = Math.max(duration * PX_PER_SEC, scrollArea.clientWidth);
            document.getElementById('timeline-inner').style.width = pxWidth + 'px';
        }
        
        renderWordBlocks();
    });

    // MASTER PLAYBACK SYNC
    analyzerSurfer.on('timeupdate', (currentTime) => {
        const playhead = document.getElementById('master-playhead');
        if (playhead) {
            const leftPx = currentTime * PX_PER_SEC;
            playhead.style.left = leftPx + 'px';
            
            // Auto-Scroll the master container slightly ahead of playhead
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
// THE 5-ROW NLE MUSIC STAFF ENGINE
// ----------------------------------------------------------------------

let isDragging = false;
let dragNode = null;
let dragIndex = -1;
let dragStartX = 0;
let originalWordStart = 0;

function renderWordBlocks() {
    const track = document.getElementById('word-track');
    if(!track) return;
    track.innerHTML = '';
    
    // Re-inject the background grid lines so they stay underneath
    track.innerHTML = `
        <div class="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 z-0">
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 border-b border-slate-200 border-dashed w-full"></div>
            <div class="h-10 w-full"></div>
        </div>
    `;
    
    currentWordsData.forEach((w, index) => {
        const node = document.createElement('div');
        
        // We use absolute positioning. Modulo 5 ensures a perfect 5-row wrap!
        const yOffset = (index % 5) * 42 + 8; 
        const xOffset = w.start * PX_PER_SEC;
        
        node.className = 'absolute px-2 py-1 text-xs font-bold bg-white border rounded shadow-sm cursor-grab select-none z-10 transition-shadow';
        node.style.left = xOffset + 'px';
        node.style.top = yOffset + 'px';
        node.innerText = w.word;
        
        if (index === selectedIndex) {
            node.classList.add('border-blue-500', 'text-blue-600', 'ring-2', 'ring-blue-200');
        } else {
            node.classList.add('border-slate-300', 'text-slate-700');
        }

        // DRAG AND SELECT INITIATION
        node.onmousedown = (e) => {
            e.stopPropagation();
            selectWord(index);
            
            isDragging = true;
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

// Global Drag Handlers
window.addEventListener('mousemove', (e) => {
    if (!isDragging || !dragNode) return;
    const deltaX = e.clientX - dragStartX;
    const deltaSec = deltaX / PX_PER_SEC;
    let newTime = Math.max(0, originalWordStart + deltaSec);
    dragNode.style.left = (newTime * PX_PER_SEC) + 'px';
});

window.addEventListener('mouseup', (e) => {
    if (isDragging && dragNode) {
        isDragging = false;
        const deltaX = e.clientX - dragStartX;
        const deltaSec = deltaX / PX_PER_SEC;
        let newTime = Math.max(0, originalWordStart + deltaSec);
        
        // Update the master data array
        const wordObj = currentWordsData[dragIndex];
        const duration = wordObj.end - wordObj.start;
        wordObj.start = newTime;
        wordObj.end = newTime + duration;

        // Automatically sort timeline to keep chronological sanity (modulo 5 updates automatically)
        currentWordsData.sort((a, b) => a.start - b.start);
        selectedIndex = currentWordsData.findIndex(item => item === wordObj);

        dragNode = null;
        renderWordBlocks();
    }
});

// ----------------------------------------------------------------------
// TOOLBAR & DOM BINDINGS (Wrapped in DOMContentLoaded to prevent breaking)
// ----------------------------------------------------------------------

function selectWord(index) {
    selectedIndex = index;
    const w = currentWordsData[index];
    
    const tbContainer = document.getElementById('timeline-toolbar');
    const tbInput = document.getElementById('toolbar-word-input');
    const tbTime = document.getElementById('toolbar-word-time');

    if(tbContainer) tbContainer.classList.remove('hidden');
    if(tbInput) tbInput.value = w.word;
    if(tbTime) tbTime.innerText = formatTrueTime(w.start);
    
    // Jump Seeker
    if (analyzerSurfer) {
        const dur = analyzerSurfer.getDuration();
        if (dur > 0) analyzerSurfer.seekTo(w.start / dur);
    }
    
    renderWordBlocks();
}

document.addEventListener('DOMContentLoaded', () => {

    // Master Play Button
    const masterPlayBtn = document.getElementById('master-play-btn');
    if (masterPlayBtn) {
        masterPlayBtn.addEventListener('click', () => {
            if (analyzerSurfer) analyzerSurfer.playPause();
        });
    }

    // Edit Word Text (Hits Enter)
    const tbInput = document.getElementById('toolbar-word-input');
    if (tbInput) {
        tbInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex > -1 && currentWordsData[selectedIndex]) {
                    currentWordsData[selectedIndex].word = tbInput.value.trim();
                    // We intentionally DO NOT jump the seeker here. It stays in place.
                    renderWordBlocks();
                    tbInput.blur(); // Drop focus
                }
            }
        });
    }

    // [+ Add Back]
    const btnAddBefore = document.getElementById('btn-add-before');
    if (btnAddBefore) {
        btnAddBefore.addEventListener('click', () => {
            if (selectedIndex === -1) return;
            const ref = currentWordsData[selectedIndex];
            
            // Insert brand new blank element slightly before
            const newWord = { word: "[Type here]", start: Math.max(0, ref.start - 0.2), end: ref.start };
            currentWordsData.splice(selectedIndex, 0, newWord);
            
            // Select the new word automatically
            selectWord(selectedIndex); 
        });
    }

    // [+ Add After]
    const btnAddAfter = document.getElementById('btn-add-after');
    if (btnAddAfter) {
        btnAddAfter.addEventListener('click', () => {
            if (selectedIndex === -1) return;
            const ref = currentWordsData[selectedIndex];
            
            const newWord = { word: "[Type here]", start: ref.end, end: ref.end + 0.2 };
            currentWordsData.splice(selectedIndex + 1, 0, newWord);
            
            selectWord(selectedIndex + 1); 
        });
    }

    // [Delete]
    const btnDeleteWord = document.getElementById('btn-delete-word');
    if (btnDeleteWord) {
        btnDeleteWord.addEventListener('click', () => {
            if (selectedIndex === -1) return;
            currentWordsData.splice(selectedIndex, 1);
            
            selectedIndex = -1;
            const tbContainer = document.getElementById('timeline-toolbar');
            if (tbContainer) tbContainer.classList.add('hidden');
            
            // Send Seeker back to 0:00 as requested
            if (analyzerSurfer) analyzerSurfer.seekTo(0);
            
            renderWordBlocks();
        });
    }

    // Grid Rate Listeners
    const gridRepairs = document.getElementById('grid-repairs');
    if (gridRepairs) {
        gridRepairs.addEventListener('input', recalculateRates);
    }

    // COPY ROW TO CLIPBOARD (Updated with all 15 columns)
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
                document.getElementById('grid-prate').innerText,
                document.getElementById('grid-rrate').innerText,
                document.getElementById('grid-notes').value || "None",
                document.getElementById('grid-org-notes').value || "None",
                document.getElementById('grid-ru-type').value || "None",
                document.getElementById('grid-include').value || "Y",
                document.getElementById('grid-complete').value || "Y"
            ];

            const tsvString = rowData.join('\t');
            
            navigator.clipboard.writeText(tsvString).then(() => {
                const originalText = btnExportCsv.innerHTML;
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
// DATA GRID LOGIC
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
    const wordCount = currentWordsData.length;
    let pauseCount = 0;
    
    for (let i = 0; i < currentWordsData.length - 1; i++) {
        const gap = currentWordsData[i+1].start - currentWordsData[i].end;
        if (gap > 1.0) pauseCount++;
    }

    const gWords = document.getElementById('grid-words');
    const gPauses = document.getElementById('grid-pauses');
    
    if(gWords) gWords.innerText = wordCount;
    if(gPauses) gPauses.innerText = pauseCount;
    
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
    
    if(prate) prate.innerText = pauseRate.toFixed(2);
    if(rrate) rrate.innerText = repairRate.toFixed(2);
}

function updateLegacyText() {
    const textStr = currentWordsData.map(w => w.word).join(" ");
    const legacyInput = document.getElementById('cba-inputText');
    if (legacyInput) {
        legacyInput.value = textStr;
    }
}

// ==========================================
// THPS PhD TIMELINE & GRID ENGINE
// Handles STT calls, NLE interactive words, and metrics
// ==========================================

let analyzerSurfer = null;
let currentWordsData = [];
let clipStartTimeSec = 0; // The true HH:MM:SS start of this clip
let selectedIndex = -1;

// TIMELINE SETTINGS
const PX_PER_SEC = 100; // 100px equals 1 second. Ensures smooth spacing.

window.addEventListener('thps-inject-snip', async (e) => {
    const { blob, fileName, startTime } = e.detail;
    clipStartTimeSec = startTime; 
    
    const statusEl = document.getElementById('stt-status');
    statusEl.classList.remove('hidden');
    
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
            statusEl.classList.add('hidden');
            
            setupAnalyzerTimeline(blob, sttData.words || []);
            populateGridInitialData(fileName, startTime);
            
        } catch (err) {
            console.error("STT Error:", err);
            statusEl.innerText = "Error parsing STT";
            statusEl.classList.replace('bg-blue-100', 'bg-red-100');
            statusEl.classList.replace('text-blue-700', 'text-red-700');
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
        const pxWidth = Math.max(duration * PX_PER_SEC, scrollArea.clientWidth);
        document.getElementById('timeline-inner').style.width = pxWidth + 'px';
        
        renderWordBlocks();
    });

    // MASTER PLAYBACK SYNC
    analyzerSurfer.on('timeupdate', (currentTime) => {
        const playhead = document.getElementById('master-playhead');
        const leftPx = currentTime * PX_PER_SEC;
        playhead.style.left = leftPx + 'px';
        
        // Auto-Scroll the master container slightly ahead of playhead
        const scrollArea = document.getElementById('master-scroll-area');
        if (leftPx > scrollArea.scrollLeft + scrollArea.clientWidth - 100) {
            scrollArea.scrollLeft = leftPx - (scrollArea.clientWidth / 2);
        }
    });

    analyzerSurfer.on('play', () => {
        document.getElementById('master-icon-play').classList.add('hidden');
        document.getElementById('master-icon-pause').classList.remove('hidden');
    });
    
    analyzerSurfer.on('pause', () => {
        document.getElementById('master-icon-pause').classList.add('hidden');
        document.getElementById('master-icon-play').classList.remove('hidden');
    });
}

// Master Play Button
document.getElementById('master-play-btn').addEventListener('click', () => {
    if (analyzerSurfer) analyzerSurfer.playPause();
});


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
// TOOLBAR LOGIC
// ----------------------------------------------------------------------

const tbContainer = document.getElementById('timeline-toolbar');
const tbInput = document.getElementById('toolbar-word-input');
const tbTime = document.getElementById('toolbar-word-time');

function selectWord(index) {
    selectedIndex = index;
    const w = currentWordsData[index];
    
    tbContainer.classList.remove('hidden');
    tbInput.value = w.word;
    tbTime.innerText = formatTrueTime(w.start);
    
    // Jump Seeker
    if (analyzerSurfer) {
        const dur = analyzerSurfer.getDuration();
        analyzerSurfer.seekTo(w.start / dur);
    }
    
    renderWordBlocks();
}

// Edit Word Text (Hits Enter)
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

// [+ Add Back]
document.getElementById('btn-add-before').addEventListener('click', () => {
    if (selectedIndex === -1) return;
    const ref = currentWordsData[selectedIndex];
    
    // Insert brand new blank element slightly before
    const newWord = { word: "[Type here]", start: Math.max(0, ref.start - 0.2), end: ref.start };
    currentWordsData.splice(selectedIndex, 0, newWord);
    
    // Select the new word automatically
    selectWord(selectedIndex); 
});

// [+ Add After]
document.getElementById('btn-add-after').addEventListener('click', () => {
    if (selectedIndex === -1) return;
    const ref = currentWordsData[selectedIndex];
    
    const newWord = { word: "[Type here]", start: ref.end, end: ref.end + 0.2 };
    currentWordsData.splice(selectedIndex + 1, 0, newWord);
    
    selectWord(selectedIndex + 1); 
});

// [Delete]
document.getElementById('btn-delete-word').addEventListener('click', () => {
    if (selectedIndex === -1) return;
    currentWordsData.splice(selectedIndex, 1);
    
    selectedIndex = -1;
    tbContainer.classList.add('hidden');
    
    // Send Seeker back to 0:00 as requested
    if (analyzerSurfer) analyzerSurfer.seekTo(0);
    
    renderWordBlocks();
});


// ----------------------------------------------------------------------
// DATA GRID LOGIC
// ----------------------------------------------------------------------

function populateGridInitialData(fileName, startTimeSec) {
    const parts = fileName.split('-');
    document.getElementById('grid-pid').innerText = parts[0] || '-';
    document.getElementById('grid-session').innerText = parts[2] || '-';
    
    const h = Math.floor(startTimeSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((startTimeSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(startTimeSec % 60).toString().padStart(2, '0');
    document.getElementById('grid-time').innerText = `${h}:${m}:${s}`;
}

function updateGridMetrics() {
    const wordCount = currentWordsData.length;
    let pauseCount = 0;
    
    for (let i = 0; i < currentWordsData.length - 1; i++) {
        const gap = currentWordsData[i+1].start - currentWordsData[i].end;
        if (gap > 1.0) pauseCount++;
    }

    document.getElementById('grid-words').innerText = wordCount;
    document.getElementById('grid-pauses').innerText = pauseCount;
    
    recalculateRates();
}

function recalculateRates() {
    const wCount = parseInt(document.getElementById('grid-words').innerText) || 0;
    const pCount = parseInt(document.getElementById('grid-pauses').innerText) || 0;
    const rCount = parseInt(document.getElementById('grid-repairs').value) || 0;

    const pauseRate = wCount > 0 ? (pCount / wCount) * 100 : 0;
    const repairRate = wCount > 0 ? (rCount / wCount) * 100 : 0;

    document.getElementById('grid-prate').innerText = pauseRate.toFixed(2);
    document.getElementById('grid-rrate').innerText = repairRate.toFixed(2);
}

document.getElementById('grid-repairs').addEventListener('input', recalculateRates);

// Push timeline edits into the legacy text box so the old dashboard can function
function updateLegacyText() {
    const textStr = currentWordsData.map(w => w.word).join(" ");
    const legacyInput = document.getElementById('cba-inputText');
    if (legacyInput) {
        legacyInput.value = textStr;
        // Optionally trigger analyze() if you want the legacy dashboard to live-update
        // window.analyze();
    }
}

// COPY ROW TO CLIPBOARD (Updated with all 15 columns)
document.getElementById('btn-export-csv').addEventListener('click', () => {
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
        const btn = document.getElementById('btn-export-csv');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Copied to Clipboard!`;
        btn.classList.replace('bg-emerald-600', 'bg-blue-600');
        if(window.lucide) window.lucide.createIcons();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.replace('bg-blue-600', 'bg-emerald-600');
            if(window.lucide) window.lucide.createIcons();
        }, 2000);
    });
});

// ==========================================
// THPS PhD TIMELINE & GRID ENGINE
// Handles 5-Row Music Staff, Draggable Words, and Metrics
// ==========================================

const PX_PER_SEC = 100; // 1 second of audio = 100px wide
let analyzerSurfer = null;
let currentWordsData = [];

// Editor State
let selectedWordIndex = null;
let selectedWordNode = null;

window.addEventListener('thps-inject-snip', async (e) => {
    const { blob, fileName, startTime } = e.detail;
    
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

function setupAnalyzerTimeline(audioBlob, wordsArray) {
    if (analyzerSurfer) analyzerSurfer.destroy();
    
    analyzerSurfer = WaveSurfer.create({
        container: '#analyzer-waveform',
        waveColor: '#94a3b8',
        progressColor: '#3b82f6',
        height: 64,
        normalize: true,
        cursorColor: 'transparent', // Hide internal cursor, we use our red seeker line
        minPxPerSec: PX_PER_SEC,
        hideScrollbar: true
    });
    
    const fileURL = URL.createObjectURL(audioBlob);
    analyzerSurfer.load(fileURL);
    
    currentWordsData = wordsArray;
    
    analyzerSurfer.on('ready', () => {
        renderWordBlocks();
    });

    // Sync Playhead
    analyzerSurfer.on('timeupdate', (currentTime) => {
        const seeker = document.getElementById('timeline-seeker');
        seeker.style.left = (currentTime * PX_PER_SEC) + 'px';
    });

    // Play/Pause Wireup
    const btnPlay = document.getElementById('btn-analyzer-play');
    const iconPlay = document.getElementById('analyzer-icon-play');
    const iconPause = document.getElementById('analyzer-icon-pause');
    
    // Remove old listeners to avoid duplicates
    const newBtnPlay = btnPlay.cloneNode(true);
    btnPlay.parentNode.replaceChild(newBtnPlay, btnPlay);
    
    newBtnPlay.addEventListener('click', () => analyzerSurfer.playPause());
    
    analyzerSurfer.on('play', () => { iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden'); });
    analyzerSurfer.on('pause', () => { iconPause.classList.add('hidden'); iconPlay.classList.remove('hidden'); });

    // Sync custom track scroll -> hides default WaveSurfer scroll
    const trackContainer = document.getElementById('word-track-container');
    analyzerSurfer.on('scroll', (e) => {
        trackContainer.scrollLeft = e.target.scrollLeft;
    });
}

// --- MUSIC STAFF LOGIC ---
function renderWordBlocks() {
    const track = document.getElementById('word-track');
    const trackContainer = document.getElementById('word-track-container');
    track.innerHTML = '';
    
    // Calculate total width needed (Duration + buffer for last word)
    const duration = analyzerSurfer.getDuration() || 60;
    const totalWidth = Math.max(duration * PX_PER_SEC + 200, trackContainer.clientWidth);
    track.style.width = totalWidth + 'px';

    currentWordsData.forEach((w, index) => {
        const wordNode = document.createElement('div');
        // Styling for absolute position
        wordNode.className = 'absolute px-2 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer select-none whitespace-nowrap';
        wordNode.innerText = w.word;
        
        // Positioning: 5 rows total, 40px height per row
        const leftPos = w.start * PX_PER_SEC;
        const row = index % 5;
        const topPos = (row * 40) + 8; // Offset 8px to center in row
        
        wordNode.style.left = leftPos + 'px';
        wordNode.style.top = topPos + 'px';
        
        // DRAG AND DROP PHYSICS
        let isDragging = false;
        let startX = 0;
        let initialStart = 0;
        
        wordNode.addEventListener('mousedown', (e) => {
            selectWord(index, wordNode);
            isDragging = true;
            startX = e.clientX;
            initialStart = w.start;
            
            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const deltaX = moveEvent.clientX - startX;
                const deltaSec = deltaX / PX_PER_SEC;
                
                // Update Time
                w.start = Math.max(0, initialStart + deltaSec);
                w.end = w.start + (w.end - initialStart); // Keep same duration
                
                // Update UI
                wordNode.style.left = (w.start * PX_PER_SEC) + 'px';
                updateTimeDisplay(w.start, w.end);
            };

            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                updateGridMetrics(); // Pauses recalculate based on new positions!
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        track.appendChild(wordNode);
    });

    // Update Global App Engine Text (Triggers full Dashboard re-render)
    window.THPS.Audio = window.THPS.Audio || {};
    window.THPS.Audio.wordTimestamps = currentWordsData;
    const compiledText = currentWordsData.map(w => w.word).join(" ");
    const inputEl = document.getElementById('cba-inputText');
    if (inputEl) {
        inputEl.value = compiledText;
        if(typeof window.analyze === 'function') window.analyze();
    }
    
    updateGridMetrics();
}

// --- TOOLBAR LOGIC ---
const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
    return `${m}:${s}.${ms}`;
};

const updateTimeDisplay = (start, end) => {
    document.getElementById('editor-time').innerText = `${formatTime(start)} - ${formatTime(end)}`;
};

function selectWord(index, node) {
    if (selectedWordNode) {
        selectedWordNode.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500', 'z-10');
    }
    
    selectedWordIndex = index;
    selectedWordNode = node;
    node.classList.add('ring-2', 'ring-blue-500', 'border-blue-500', 'z-10');
    
    const w = currentWordsData[index];
    updateTimeDisplay(w.start, w.end);
    document.getElementById('editor-word').value = w.word;
    
    // Enable Action Buttons
    ['btn-add-word-before', 'btn-add-word-after', 'btn-delete-word'].forEach(id => {
        document.getElementById(id).disabled = false;
    });
}

// Editor Input Change
document.getElementById('editor-word').addEventListener('input', (e) => {
    if (selectedWordIndex !== null) {
        currentWordsData[selectedWordIndex].word = e.target.value;
        selectedWordNode.innerText = e.target.value;
        
        // Update main text
        const compiledText = currentWordsData.map(w => w.word).join(" ");
        const inputEl = document.getElementById('cba-inputText');
        if(inputEl) inputEl.value = compiledText;
        updateGridMetrics();
    }
});

// Add Before
document.getElementById('btn-add-word-before').addEventListener('click', () => {
    if (selectedWordIndex === null) return;
    const current = currentWordsData[selectedWordIndex];
    const newStart = Math.max(0, current.start - 0.5);
    currentWordsData.splice(selectedWordIndex, 0, { word: "new", start: newStart, end: current.start - 0.1 });
    renderWordBlocks();
});

// Add After
document.getElementById('btn-add-word-after').addEventListener('click', () => {
    if (selectedWordIndex === null) return;
    const current = currentWordsData[selectedWordIndex];
    currentWordsData.splice(selectedWordIndex + 1, 0, { word: "new", start: current.end + 0.1, end: current.end + 0.6 });
    renderWordBlocks();
});

// Delete
document.getElementById('btn-delete-word').addEventListener('click', () => {
    if (selectedWordIndex === null) return;
    currentWordsData.splice(selectedWordIndex, 1);
    document.getElementById('editor-word').value = '';
    document.getElementById('editor-time').innerText = '--:--.---';
    ['btn-add-word-before', 'btn-add-word-after', 'btn-delete-word'].forEach(id => document.getElementById(id).disabled = true);
    selectedWordIndex = null;
    selectedWordNode = null;
    renderWordBlocks();
});

// --- GRID LOGIC ---
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
    
    // Sort array by time so Pause counting is accurate if user dragged words out of order!
    currentWordsData.sort((a, b) => a.start - b.start);
    
    // Calculate Pauses (> 1.0 second gap)
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

// COPY ROW TO CLIPBOARD
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

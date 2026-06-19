// ==========================================
// THPS PhD TIMELINE & GRID ENGINE
// Handles STT calls, interactive words, and metrics
// ==========================================

let analyzerSurfer = null;
let currentWordsData = [];

window.addEventListener('thps-inject-snip', async (e) => {
    const { blob, fileName, startTime } = e.detail;
    
    const statusEl = document.getElementById('stt-status');
    statusEl.classList.remove('hidden');
    
    // Convert Blob to Base64 for Vercel
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
        const b64 = reader.result.split(',')[1];
        
        try {
            // Hit existing Vercel STT endpoint
            const res = await fetch('https://mic-check-backend.vercel.app/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioContent: b64, mimeType: 'audio/wav' })
            });
            
            const sttData = await res.json();
            statusEl.classList.add('hidden');
            
            // Render Timeline & Grid
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
        progressColor: '#10b981',
        height: 128,
        normalize: true,
        cursorColor: '#1e293b'
    });
    
    const fileURL = URL.createObjectURL(audioBlob);
    analyzerSurfer.load(fileURL);
    
    currentWordsData = wordsArray;
    renderWordBlocks();
}

function renderWordBlocks() {
    const track = document.getElementById('word-track');
    track.innerHTML = '';
    
    currentWordsData.forEach((w, index) => {
        const wordNode = document.createElement('div');
        wordNode.className = 'cursor-pointer px-2 py-1 text-sm bg-white border border-slate-200 rounded shadow-sm hover:border-blue-400 hover:text-blue-600 transition-colors outline-none focus:ring-2 focus:ring-blue-500';
        wordNode.innerText = w.word;
        wordNode.contentEditable = "true";
        
        // Listen for content changes
        wordNode.addEventListener('blur', (e) => {
            const newText = e.target.innerText.trim();
            if (newText === "") {
                // Remove word if deleted
                currentWordsData.splice(index, 1);
            } else {
                currentWordsData[index].word = newText;
            }
            // Re-render and recalculate grid
            renderWordBlocks(); 
        });

        // Shift+Click to play the specific word timestamp
        wordNode.addEventListener('click', (e) => {
            if (e.shiftKey) {
                e.preventDefault();
                analyzerSurfer.play(w.start, w.end);
            }
        });
        
        track.appendChild(wordNode);
    });
    
    updateGridMetrics();
}

// --- GRID LOGIC ---

function populateGridInitialData(fileName, startTimeSec) {
    const parts = fileName.split('-');
    document.getElementById('grid-pid').innerText = parts[0] || '-';
    document.getElementById('grid-session').innerText = parts[2] || '-';
    
    // Format timestamp
    const h = Math.floor(startTimeSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((startTimeSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(startTimeSec % 60).toString().padStart(2, '0');
    document.getElementById('grid-time').innerText = `${h}:${m}:${s}`;
}

function updateGridMetrics() {
    const wordCount = currentWordsData.length;
    let pauseCount = 0;
    
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

// Listen to manual repair inputs to update rate instantly
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
        document.getElementById('grid-notes').value || "None",
        document.getElementById('grid-org-notes').value || "None",
        document.getElementById('grid-ru-type').value || "None",
        document.getElementById('grid-include').value || "Y",
        document.getElementById('grid-complete').value || "Y"
    ];
    ];

    // Join with tabs for perfect Excel/Sheets pasting
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

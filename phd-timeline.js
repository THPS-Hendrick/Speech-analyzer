// ==========================================
// THPS PhD TIMELINE ENGINE
// Handles STT calls and Word-Boundary Dragging
// ==========================================

window.addEventListener('thps-inject-snip', async (e) => {
    const { start, end, fileName, sourceSurfer } = e.detail;
    
    // 1. Show Loading UI
    document.getElementById('stt-loading').classList.remove('hidden');
    
    // 2. Extract the Audio Buffer chunk locally (simulated logic for brevity)
    // Here we use the AudioContext offline renderer to slice the exact audio snippet
    const originalBuffer = sourceSurfer.getDecodedData();
    const sampleRate = originalBuffer.sampleRate;
    const frameCount = (end - start) * sampleRate;
    const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);
    
    // --> [Audio Extraction logic translates the buffer to WAV Blob here] <--
    // Let's assume we generated `wavBlob`
    
    // 3. Send to Vercel
    /* const reader = new FileReader();
    reader.readAsDataURL(wavBlob);
    reader.onloadend = async () => {
        const b64 = reader.result.split(',')[1];
        const res = await fetch('https://mic-check-backend.vercel.app/api/transcribe', {
            method: 'POST', body: JSON.stringify({ audioContent: b64 })
        });
        const sttData = await res.json();
        
        // 4. Render on Timeline
        renderTimeline(wavBlob, sttData.words);
    }
    */
});

function renderTimeline(audioBlob, wordsArray) {
    document.getElementById('stt-loading').classList.add('hidden');
    
    // Create the playable interactive timeline
    const analyzerSurfer = WaveSurfer.create({
        container: '#analyzer-waveform',
        waveColor: '#94a3b8',
        progressColor: '#10b981',
        height: 192,
        minPxPerSec: 50 // Stretches it out so words fit!
    });
    
    analyzerSurfer.loadBlob(audioBlob);
    
    // Render the draggable text track
    const track = document.getElementById('word-track');
    track.innerHTML = '';
    
    // We update the Global State
    window.THPS.Audio = window.THPS.Audio || {};
    window.THPS.Audio.wordTimestamps = wordsArray;

    wordsArray.forEach((w, index) => {
        const wordNode = document.createElement('div');
        wordNode.className = 'cursor-pointer px-3 py-1 bg-white border border-slate-300 rounded shadow-sm hover:border-blue-500 hover:shadow flex-shrink-0 transition-colors';
        wordNode.innerText = w.word;
        wordNode.contentEditable = "true"; // PhD can fix STT typos instantly
        
        // On Click, play just that word
        wordNode.addEventListener('click', (e) => {
            if (e.target.contentEditable === "true") return; // Let them type
            analyzerSurfer.play(w.start, w.end);
        });
        
        track.appendChild(wordNode);
    });
    
    // Recalculate Grid Stats automatically
    calculatePhDStats();
}

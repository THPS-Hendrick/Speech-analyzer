// ==========================================
// THPS AUDIO PROCESSOR ENGINE
// Handles Microphone, WAV Chunking, and Vercel STT Integration
// ==========================================

window.THPS = window.THPS || {};
window.THPS.Audio = window.THPS.Audio || {};

window.THPS.Audio.isRecording = false;
window.THPS.Audio.recordedAudio = false;
window.THPS.Audio.recordStartTime = 0;
window.THPS.Audio.lastRecordedDuration = 0;
window.THPS.Audio.wordTimestamps = []; 
window.THPS.Audio.volumeData = []; // NEW PHASE 1: Real-time intensity tracking

let audioCtx = null;
let sourceNode = null;
let processorNode = null;
let analyserNode = null; // NEW: The acoustic listener
let volumeInterval = null; // NEW: The 100ms timer
let audioBuffers = [];
let totalSamplesRecorded = 0;

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

window.THPS.Audio.stopRecordingProcess = async function() {
    if (!window.THPS.Audio.isRecording) return;
    window.THPS.Audio.isRecording = false;

    // Stop tracking volume
    if (volumeInterval) {
        clearInterval(volumeInterval);
        volumeInterval = null;
    }
    
    const inputEl = document.getElementById('cba-inputText');
    if (inputEl) inputEl.placeholder = "Processing Parallel Audio Streams...";
    
    const procPanel = document.getElementById('cba-processing-panel');
    if (procPanel) procPanel.classList.remove('hidden');
    
    const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
    window.THPS.Audio.lastRecordedDuration = elapsedSecs;
    window.THPS.Audio.recordedAudio = true;
    
    // Safely tear down all audio nodes
    if (processorNode) { processorNode.disconnect(); processorNode = null; }
    if (analyserNode) { analyserNode.disconnect(); analyserNode = null; }
    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
    if (window.THPS.Audio.audioStream) { window.THPS.Audio.audioStream.getTracks().forEach(t => t.stop()); }
    if (audioCtx && audioCtx.state !== 'closed') { audioCtx.close(); }

    const analyzeBtn = document.getElementById('cba-analyzeBtn');
    if (analyzeBtn) analyzeBtn.disabled = true;

    let masterFloatArray = new Float32Array(totalSamplesRecorded);
    let writeOffset = 0;
    for(let i = 0; i < audioBuffers.length; i++) {
        masterFloatArray.set(audioBuffers[i], writeOffset);
        writeOffset += audioBuffers[i].length;
    }

    const sampleRate = 16000;
    const chunkSize = sampleRate * 30; // 30-Second Slicer
    let wavChunks = [];
    
    for(let i = 0; i < totalSamplesRecorded; i += chunkSize) {
        let segment = masterFloatArray.subarray(i, Math.min(i + chunkSize, totalSamplesRecorded));
        wavChunks.push(encodeWAV(segment, sampleRate));
    }

    const uploadPromises = wavChunks.map(async (blob, index) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                try {
                    const response = await fetch('https://mic-check-backend.vercel.app/api/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            audioContent: base64data,
                            mimeType: 'audio/wav' 
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        resolve({ 
                            index: index, 
                            transcript: data.transcript ? data.transcript.trim() : '',
                            words: data.words || [] 
                        });
                    } else {
                        resolve({ index: index, transcript: '', words: [], error: `HTTP ${response.status}` });
                    }
                } catch (e) {
                    resolve({ index: index, transcript: '', words: [], error: e.message });
                }
            };
        });
    });

    const errorMsgBox = document.getElementById('cba-errorMsg');
    if (errorMsgBox) errorMsgBox.classList.add('hidden');

    try {
        const resolvedChunks = await Promise.all(uploadPromises);
        resolvedChunks.sort((a, b) => a.index - b.index); 
        
        const finalStitchedTranscript = resolvedChunks
            .map(r => r.transcript)
            .filter(t => t.length > 0)
            .join(' ');
            
        let finalStitchedWords = [];
        resolvedChunks.forEach(chunk => {
            if (chunk.words && chunk.words.length > 0) {
                chunk.words.forEach(w => {
                    finalStitchedWords.push({
                        word: w.word,
                        start: w.start + (chunk.index * 30),
                        end: w.end + (chunk.index * 30)
                    });
                });
            }
        });
        
        window.THPS.Audio.wordTimestamps = finalStitchedWords;
        
        if (finalStitchedTranscript.length > 0) {
            if (inputEl) inputEl.value = finalStitchedTranscript;
        } else {
            if (errorMsgBox) {
                errorMsgBox.innerHTML = `<strong>Google Cloud Error:</strong> Failed to generate transcript from audio chunks.<br><span class="text-xs font-semibold text-red-600">Ensure microphone was clearly recording.</span>`;
                errorMsgBox.classList.remove('hidden');
            }
            if (inputEl) inputEl.value = "";
        }
    } catch (globalError) {
        console.error("Parallel Framework Error:", globalError);
        if (errorMsgBox) {
            errorMsgBox.innerHTML = `<strong>Delivery Pipeline Error:</strong> Vercel chunk processing failed.<br><span class="text-xs font-semibold text-red-600">Details: ${globalError.message}</span>`;
            errorMsgBox.classList.remove('hidden');
        }
        if (inputEl) inputEl.value = "";
    }
    
    if (analyzeBtn) analyzeBtn.disabled = false;
    
    if (typeof window.analyze === 'function') window.analyze();
    
    if (procPanel) procPanel.classList.add('hidden');
    
    audioBuffers = []; masterFloatArray = null;
};

window.THPS.Audio.startRecordingProcess = async function() {
    window.THPS.Audio.isRecording = true;
    window.THPS.Audio.recordedAudio = true; 
    audioBuffers = [];
    totalSamplesRecorded = 0;
    window.THPS.Audio.recordStartTime = Date.now();
    
    window.THPS.Audio.wordTimestamps = []; 
    window.THPS.Audio.volumeData = []; // Reset the volume tracker
    
    const inputEl = document.getElementById('cba-inputText');
    if (inputEl) inputEl.placeholder = "Listening... speak clearly into your microphone.";

    try {
        window.THPS.Audio.audioStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass({ sampleRate: 16000 });
        
        sourceNode = audioCtx.createMediaStreamSource(window.THPS.Audio.audioStream);
        processorNode = audioCtx.createScriptProcessor(4096, 1, 1);
        
        // --- THE NEW DECIBEL TRACKER ---
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 2048;
        sourceNode.connect(analyserNode);

        // Every 100 milliseconds, capture the exact intensity of the microphone
        volumeInterval = setInterval(() => {
            if (!window.THPS.Audio.isRecording) return;
            
            const dataArray = new Float32Array(analyserNode.fftSize);
            analyserNode.getFloatTimeDomainData(dataArray);

            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sumSquares += dataArray[i] * dataArray[i];
            }
            
            let rms = Math.sqrt(sumSquares / dataArray.length);
            let db = 20 * Math.log10(Math.max(rms, 0.0001)); // Convert to Decibels
            
            window.THPS.Audio.volumeData.push({
                time: (Date.now() - window.THPS.Audio.recordStartTime) / 1000, // Exact seconds
                rms: rms,
                db: db
            });
        }, 100);
        // -------------------------------

        processorNode.onaudioprocess = function(e) {
            if (!window.THPS.Audio.isRecording) return;
            
            const channelData = e.inputBuffer.getChannelData(0);
            const elapsed = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
            if (elapsed <= 240) { 
                audioBuffers.push(new Float32Array(channelData));
                totalSamplesRecorded += channelData.length;
            }
        };

        sourceNode.connect(processorNode);
        processorNode.connect(audioCtx.destination); 

    } catch (e) {
        console.warn("Microphone access denied or not supported.", e);
        const errorMsgBox = document.getElementById('cba-errorMsg');
        if (errorMsgBox) {
            errorMsgBox.innerHTML = `<strong>Microphone Access Error:</strong> Please allow microphone access. <br><span class="text-xs font-normal">${e.message}</span>`;
            errorMsgBox.classList.remove('hidden');
        }
        window.THPS.Audio.stopRecordingProcess();
        return;
    }
};

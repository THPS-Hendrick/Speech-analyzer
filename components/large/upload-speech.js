// ==========================================
// THPS WIDGET: LARGE UPLOAD SPEECH
// Handles File Drop, Audio Decoding, Snipping, 30s Vercel Chunking, and Session Import/Export
// ==========================================

class ThpsUploadSpeech extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex flex-col bg-white relative w-full transition-transform hover:-translate-y-1 hover:shadow-md group">
                
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Speech (Audio/Video/Data)</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Snip media or restore a saved session</p>
                    </div>
                </div>
                
                <div id="upload-status-banner" class="hidden w-full text-xs font-bold p-3 rounded-lg mb-4 text-center transition-all"></div>

                <div id="drop-zone-wrapper" class="w-full flex flex-col gap-2">
                    <div id="drop-zone" class="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-emerald-400 transition-all cursor-pointer relative">
                        <input type="file" id="file-input" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="audio/*,video/mp4,video/webm,application/json,.json">
                        <i data-lucide="upload-cloud" class="w-8 h-8 text-slate-400 mb-2 pointer-events-none"></i>
                        <span class="text-sm font-bold text-slate-600 pointer-events-none">Drag & Drop Media or Data</span>
                        <span class="text-[10px] font-medium text-slate-400 mt-1 pointer-events-none text-center">Supports MP3, MP4, WAV, WEBM, JSON</span>
                    </div>
                    
                    <button id="btn-export-session" class="w-full mt-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm relative z-10 active:scale-95">
                        <i data-lucide="download" class="w-4 h-4"></i> Export Current Session
                    </button>
                </div>

                <div id="edit-panel" class="hidden w-full flex-col gap-4">
                    
                    <div class="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <i data-lucide="file-audio" class="w-5 h-5 text-emerald-500 shrink-0"></i>
                            <span id="file-name-display" class="text-xs font-bold text-slate-700 truncate">filename.mp3</span>
                        </div>
                        <button id="btn-reset-file" class="text-[10px] font-bold text-slate-500 hover:text-rose-500 uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded shadow-sm shrink-0">Replace</button>
                    </div>

                    <div class="w-full bg-slate-800 rounded-xl p-3 shadow-inner">
                        <audio id="audio-player" class="w-full h-8 outline-none" controls></audio>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start (IN)</span>
                                <span id="val-in-time" class="text-xs font-mono font-bold text-slate-800">0.0s</span>
                            </div>
                            <button id="btn-set-in" class="w-full py-2 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm">Set to Current Time</button>
                        </div>
                        <div class="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End (OUT)</span>
                                <span id="val-out-time" class="text-xs font-mono font-bold text-slate-800">End</span>
                            </div>
                            <button id="btn-set-out" class="w-full py-2 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm">Set to Current Time</button>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 mt-2">
                        <button id="btn-download-snip" class="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <i data-lucide="download" class="w-4 h-4"></i> Download Snip
                        </button>
                        <button id="btn-analyze-snip" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-md">
                            <i data-lucide="cpu" class="w-4 h-4"></i> Analyze Snip
                        </button>
                    </div>
                </div>

            </div>
        `;

        this.audioPlayer = this.querySelector('#audio-player');
        this.fileInput = this.querySelector('#file-input');
        this.dropZone = this.querySelector('#drop-zone');
        this.dropZoneWrapper = this.querySelector('#drop-zone-wrapper');
        this.editPanel = this.querySelector('#edit-panel');
        this.statusBanner = this.querySelector('#upload-status-banner');
        
        this.audioBuffer = null;
        this.inTime = 0;
        this.outTime = 0;
        this.sampleRate = 16000; // Force 16kHz for Google STT

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        // File Drag & Drop Visuals
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
        });
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
        });
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        // File Input Click
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Session Data Export
        this.querySelector('#btn-export-session').addEventListener('click', () => this.exportSession());

        // Reset File
        this.querySelector('#btn-reset-file').addEventListener('click', () => {
            this.audioBuffer = null;
            this.editPanel.classList.add('hidden');
            this.dropZoneWrapper.classList.remove('hidden');
            this.fileInput.value = '';
            this.audioPlayer.src = '';
            this.hideStatus();
        });

        // Snipping Controls
        this.querySelector('#btn-set-in').addEventListener('click', () => {
            if (this.audioPlayer.currentTime >= this.outTime) {
                this.showStatus('Start time cannot be after End time.', 'error');
                return;
            }
            this.inTime = this.audioPlayer.currentTime;
            this.querySelector('#val-in-time').innerText = this.inTime.toFixed(1) + 's';
        });

        this.querySelector('#btn-set-out').addEventListener('click', () => {
            if (this.audioPlayer.currentTime <= this.inTime) {
                this.showStatus('End time cannot be before Start time.', 'error');
                return;
            }
            this.outTime = this.audioPlayer.currentTime;
            this.querySelector('#val-out-time').innerText = this.outTime.toFixed(1) + 's';
        });

        // Action Buttons
        this.querySelector('#btn-download-snip').addEventListener('click', () => this.downloadSnip());
        this.querySelector('#btn-analyze-snip').addEventListener('click', () => this.analyzeSnip());
    }

    showStatus(msg, type = 'info') {
        this.statusBanner.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700', 'bg-amber-100', 'text-amber-700');
        if (type === 'error') this.statusBanner.classList.add('bg-red-100', 'text-red-700');
        else if (type === 'warn') this.statusBanner.classList.add('bg-amber-100', 'text-amber-700');
        else this.statusBanner.classList.add('bg-blue-100', 'text-blue-700');
        this.statusBanner.innerHTML = msg;
    }

    hideStatus() {
        this.statusBanner.classList.add('hidden');
    }

    exportSession() {
        if (!window.thps_lastPayload || Object.keys(window.thps_lastPayload).length === 0) {
            this.showStatus('No active session data found to export. Analyze a speech first!', 'warn');
            setTimeout(() => this.hideStatus(), 3000);
            return;
        }

        const dataStr = JSON.stringify(window.thps_lastPayload, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `speech-session-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }

    async importJSONSession(file) {
        this.showStatus('<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block align-middle mr-2"></i> Restoring Session...', 'info');
        if (window.lucide) window.lucide.createIcons();

        try {
            const text = await file.text();
            const payload = JSON.parse(text);

            window.thps_lastPayload = payload;

            const hiddenEl = document.getElementById('cba-inputText');
            if (hiddenEl && payload.text) hiddenEl.value = payload.text;

            if (window.THPS && window.THPS.Audio) {
                window.THPS.Audio.recordedAudio = payload.recordedAudio || false;
                window.THPS.Audio.lastRecordedDuration = payload.time || 0;
                window.THPS.Audio.wordTimestamps = payload.wordTimestamps || [];
                window.THPS.Audio.volumeData = payload.volumeData || [];
            }

            if (typeof window.updateCelebrationPanel === 'function') {
                window.updateCelebrationPanel(payload.totalPoints, payload.time, payload.overrideGrade, payload.recordedAudio, (payload.text || '').length);
            }

            // Immediately clear the status since visual feedback comes from widgets populating
            this.hideStatus();
            
            // Trigger the UI update
            window.dispatchEvent(new CustomEvent('thps-dashboard-update', { detail: payload }));
            
            // Inject into History tracking
            if (window.thps_sessionHistory && typeof window.updateHistoryUI === 'function') {
                let historyPayload = { 
                    ...payload, 
                    id: window.thps_currentAttemptId, 
                    title: 'Imported Attempt ' + window.thps_currentAttemptId, 
                    date: new Date() 
                };
                
                window.thps_sessionHistory.unshift(historyPayload);
                window.thps_currentAttemptId++;
                window.updateHistoryUI();
            }

            // Reset file input so the same file can be uploaded again if needed
            this.fileInput.value = '';

        } catch (error) {
            console.error("JSON Parse Error:", error);
            this.showStatus('Invalid session file. Could not restore data.', 'error');
        }
    }

    async handleFile(file) {
        // ROUTER: Intercept JSON Files
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            return this.importJSONSession(file);
        }

        // Default handling for Media
        this.querySelector('#file-name-display').innerText = file.name;
        this.dropZoneWrapper.classList.add('hidden');
        this.showStatus('<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block align-middle mr-2"></i> Extracting Audio Track...', 'info');
        if (window.lucide) window.lucide.createIcons();

        try {
            const objectUrl = URL.createObjectURL(file);
            this.audioPlayer.src = objectUrl;
            
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });
            this.audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            this.inTime = 0;
            this.outTime = this.audioBuffer.duration;
            
            this.querySelector('#val-in-time').innerText = '0.0s';
            this.querySelector('#val-out-time').innerText = this.outTime.toFixed(1) + 's';
            
            this.editPanel.classList.remove('hidden');
            this.editPanel.classList.add('flex');
            this.hideStatus();

        } catch (error) {
            console.error("Audio Decode Error:", error);
            this.showStatus('Failed to decode media file. Ensure it is a valid MP3, MP4, or WEBM.', 'error');
            this.dropZoneWrapper.classList.remove('hidden');
        }
    }

    getSlicedFloatArray() {
        if (!this.audioBuffer) return null;
        const channelData = this.audioBuffer.getChannelData(0);
        const startSample = Math.floor(this.inTime * this.sampleRate);
        const endSample = Math.floor(this.outTime * this.sampleRate);
        return channelData.slice(startSample, endSample);
    }

    encodeWAV(samples) {
        let buffer = new ArrayBuffer(44 + samples.length * 2);
        let view = new DataView(buffer);
        const writeString = (view, offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
        
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); 
        view.setUint16(22, 1, true); 
        view.setUint32(24, this.sampleRate, true);
        view.setUint32(28, this.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        let offset = 44;
        for (let i = 0; i < samples.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return new Blob([view], { type: 'audio/wav' });
    }

    downloadSnip() {
        const slicedData = this.getSlicedFloatArray();
        if (!slicedData) return;
        
        const wavBlob = this.encodeWAV(slicedData);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `snip_${this.inTime.toFixed(0)}s_to_${this.outTime.toFixed(0)}s.wav`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }

    async analyzeSnip() {
        const duration = this.outTime - this.inTime;
        
        if (duration > 300) {
            this.showStatus('Cannot process snips longer than 5 minutes. Please set the IN and OUT points closer together.', 'error');
            return;
        }

        const slicedData = this.getSlicedFloatArray();
        if (!slicedData) return;

        this.showStatus('<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block align-middle mr-2"></i> Chunking and sending to Vercel STT...', 'info');
        if (window.lucide) window.lucide.createIcons();

        const chunkSizeSamples = this.sampleRate * 30; 
        let wavChunks = [];
        
        for(let i = 0; i < slicedData.length; i += chunkSizeSamples) {
            let segment = slicedData.slice(i, Math.min(i + chunkSizeSamples, slicedData.length));
            wavChunks.push(this.encodeWAV(segment));
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
                            body: JSON.stringify({ audioContent: base64data, mimeType: 'audio/wav' })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            resolve({ index: index, transcript: data.transcript ? data.transcript.trim() : '', words: data.words || [] });
                        } else {
                            resolve({ index: index, transcript: '', words: [], error: `HTTP ${response.status}` });
                        }
                    } catch (e) {
                        resolve({ index: index, transcript: '', words: [], error: e.message });
                    }
                };
            });
        });

        const volumeData = [];
        const windowSize = Math.floor(this.sampleRate * 0.1);
        for(let i = 0; i < slicedData.length; i += windowSize) {
            let sumSquares = 0; let count = 0;
            for(let j = 0; j < windowSize && (i+j) < slicedData.length; j++) {
                sumSquares += slicedData[i+j] * slicedData[i+j];
                count++;
            }
            let rms = Math.sqrt(sumSquares / count);
            let db = 20 * Math.log10(Math.max(rms, 0.0001));
            volumeData.push({ time: (i / this.sampleRate), rms: rms, db: db });
        }

        try {
            const resolvedChunks = await Promise.all(uploadPromises);
            resolvedChunks.sort((a, b) => a.index - b.index); 
            
            const finalStitchedTranscript = resolvedChunks.map(r => r.transcript).filter(t => t.length > 0).join(' ');
                
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

            this.hideStatus();

            if (window.THPS && window.THPS.Audio) {
                window.THPS.Audio.recordedAudio = true;
                window.THPS.Audio.lastRecordedDuration = duration;
                window.THPS.Audio.wordTimestamps = finalStitchedWords;
                window.THPS.Audio.volumeData = volumeData;
            }

            const inputEl = document.getElementById('cba-inputText');
            if (inputEl) {
                inputEl.value = finalStitchedTranscript;
            }

            if (typeof window.analyze === 'function') window.analyze();

        } catch (globalError) {
            console.error("Vercel Processing Error:", globalError);
            this.showStatus(`Failed to process audio chunks: ${globalError.message}`, 'error');
        }
    }
}

customElements.define('thps-upload-speech', ThpsUploadSpeech);

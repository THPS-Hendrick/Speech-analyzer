// ==========================================
// THPS WIDGET: LARGE RECORD REEL
// Handles live webcam preview and MP4/WEBM recording
// ==========================================

class ThpsRecordReel extends HTMLElement {
    connectedCallback() {
        const currentYear = new Date().getFullYear();
        
        this.innerHTML = `
            <div class="glass-panel p-5 sm:p-6 rounded-2xl border-t-4 border-rose-500 shadow-sm flex flex-col bg-white relative w-full h-full transition-transform hover:-translate-y-1 hover:shadow-md group cursor-move">
                
                <!-- SELF DESTRUCT BUTTON -->
                <button class="thps-close-btn absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Record Reel</h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">Capture your presentation and body language</p>
                    </div>
                </div>

                <!-- Video Container (16:9 Aspect Ratio) -->
                <div class="relative w-full bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-4 shadow-inner border border-slate-700">
                    <video class="thps-cam-video w-full h-full object-cover transform -scale-x-100 hidden" autoplay muted playsinline></video>
                    
                    <!-- Recording Red Dot Indicator -->
                    <div class="thps-rec-indicator hidden absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm z-10">
                        <span class="animate-pulse w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span class="text-[9px] font-bold text-rose-400 uppercase tracking-widest">REC</span>
                    </div>

                    <div class="thps-cam-placeholder flex flex-col items-center text-slate-600">
                        <i data-lucide="camera-off" class="w-8 h-8 mb-2 opacity-50"></i>
                        <span class="text-[10px] font-bold tracking-widest uppercase opacity-70">Camera Off</span>
                    </div>
                </div>

                <!-- Director's Controls (Horizontal Layout) -->
                <div class="flex flex-row gap-3 w-full mb-3">
                    <button class="thps-btn-camera flex-1 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                        <i data-lucide="camera" class="w-4 h-4"></i> <span class="thps-camera-text">Camera</span>
                    </button>
                    
                    <button class="thps-btn-record flex-1 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95" disabled>
                        <i data-lucide="video" class="w-4 h-4"></i> <span class="thps-record-text">Record</span>
                    </button>
                    
                    <a class="thps-btn-download hidden flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer text-center">
                        <i data-lucide="download" class="w-4 h-4"></i> Download
                    </a>
                </div>

                <!-- Legal Footer -->
                <p class="text-[9px] text-slate-400 text-center leading-relaxed mt-2 px-4">
                    Daily Mic-Check is owned and licensed by Tom Hendrick and Talent Academy Pty Ltd Copyright ${currentYear} all rights reserved.
                </p>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        this.stream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

        this.videoEl = this.querySelector('.thps-cam-video');
        this.placeholderEl = this.querySelector('.thps-cam-placeholder');
        this.recIndicator = this.querySelector('.thps-rec-indicator');
        
        this.btnCamera = this.querySelector('.thps-btn-camera');
        this.btnRecord = this.querySelector('.thps-btn-record');
        this.btnDownload = this.querySelector('.thps-btn-download');
        this.cameraText = this.querySelector('.thps-camera-text');
        this.recordText = this.querySelector('.thps-record-text');

        this.setupListeners();
    }

    setupListeners() {
        this.querySelector('.thps-close-btn').addEventListener('click', () => {
            if (this.stream) this.stopCamera();
            const wrapper = this.closest('.cursor-move');
            if (wrapper) wrapper.remove(); 
            else this.remove(); 
        });

        this.btnCamera.addEventListener('click', async () => {
            if (this.stream) {
                this.stopCamera();
            } else {
                await this.startCamera();
            }
        });

        this.btnRecord.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } 
            });
            
            this.videoEl.srcObject = this.stream;
            this.videoEl.classList.remove('hidden');
            this.placeholderEl.classList.add('hidden');

            this.btnCamera.classList.replace('bg-slate-800', 'bg-slate-200');
            this.btnCamera.classList.replace('hover:bg-slate-700', 'hover:bg-slate-300');
            this.btnCamera.classList.replace('text-white', 'text-slate-700');
            this.cameraText.innerText = "Turn Off";

            this.btnRecord.disabled = false;
            
            // Hide download button if visible from a previous recording
            this.btnDownload.classList.add('hidden');
            this.btnDownload.classList.remove('flex');
            this.btnRecord.classList.remove('hidden');
            this.btnRecord.classList.add('flex');

        } catch (err) {
            console.error("Camera Error:", err);
            alert("Camera & Microphone access is required to use the Record Reel.");
        }
    }

    stopCamera() {
        if (this.isRecording) this.stopRecording();

        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
        this.videoEl.srcObject = null;
        
        this.videoEl.classList.add('hidden');
        this.placeholderEl.classList.remove('hidden');

        this.btnCamera.classList.replace('bg-slate-200', 'bg-slate-800');
        this.btnCamera.classList.replace('hover:bg-slate-300', 'hover:bg-slate-700');
        this.btnCamera.classList.replace('text-slate-700', 'text-white');
        this.cameraText.innerText = "Camera";

        this.btnRecord.disabled = true;
    }

    startRecording() {
        if (!this.stream) return;

        let mimeType = 'video/webm;codecs=vp8,opus';
        let ext = 'webm';

        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
            ext = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
            mimeType = 'video/webm;codecs=h264';
            ext = 'mp4'; // Browsers handle h264 inside mp4 wrappers well
        }

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: mimeType });
        this.recordedChunks = [];
        this.fileExtension = ext;

        this.mediaRecorder.ondataavailable = (e) => { 
            if (e.data.size > 0) this.recordedChunks.push(e.data); 
        };
        
        this.mediaRecorder.onstop = () => this.handleRecordingStop();

        this.mediaRecorder.start();
        this.isRecording = true;

        // UI Updates
        this.recIndicator.classList.remove('hidden');
        this.btnRecord.classList.replace('bg-indigo-600', 'bg-rose-600');
        this.btnRecord.classList.replace('hover:bg-indigo-500', 'hover:bg-rose-500');
        this.btnRecord.innerHTML = `<i data-lucide="square" class="w-4 h-4"></i> Stop`;
        if (window.lucide) window.lucide.createIcons();
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
        this.isRecording = false;

        // UI Updates
        this.recIndicator.classList.add('hidden');
        this.btnRecord.classList.replace('bg-rose-600', 'bg-indigo-600');
        this.btnRecord.classList.replace('hover:bg-rose-500', 'hover:bg-indigo-500');
        this.btnRecord.innerHTML = `<i data-lucide="video" class="w-4 h-4"></i> Record`;
        if (window.lucide) window.lucide.createIcons();
    }

    handleRecordingStop() {
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toISOString().split('T')[0];
        
        this.btnDownload.href = url;
        this.btnDownload.download = `MicCheck_Reel_${dateStr}.${this.fileExtension}`;
        
        this.btnRecord.classList.add('hidden');
        this.btnRecord.classList.remove('flex');
        this.btnDownload.classList.remove('hidden');
        this.btnDownload.classList.add('flex');
    }
}

customElements.define('thps-record-reel', ThpsRecordReel);

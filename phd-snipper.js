// ==========================================
// THPS PhD SNIPPER ENGINE
// Handles local video/audio parsing & trimming
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('phd-media-upload');
    const waveformContainer = document.getElementById('snipper-waveform');
    const actionsContainer = document.getElementById('snipper-actions');
    const instructions = document.getElementById('snipper-instructions');
    
    let wavesurfer = null;
    let wsRegions = null;

    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        waveformContainer.classList.remove('hidden');
        instructions.classList.remove('hidden');
        actionsContainer.classList.remove('hidden', 'flex');
        actionsContainer.classList.add('flex');

        if (wavesurfer) wavesurfer.destroy();
        
        wavesurfer = WaveSurfer.create({
            container: '#snipper-waveform',
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            height: 128,
            normalize: true,
            cursorColor: '#1e293b'
        });

        wsRegions = wavesurfer.registerPlugin(WaveSurfer.Regions.create());
        
        const fileURL = URL.createObjectURL(file);
        wavesurfer.load(fileURL);

        wavesurfer.on('ready', () => {
            const duration = wavesurfer.getDuration();
            wsRegions.addRegion({
                start: Math.max(0, (duration / 2) - 15),
                end: Math.min(duration, (duration / 2) + 15),
                color: 'rgba(59, 130, 246, 0.3)',
                resize: true,
                drag: true,
            });
        });
    });

    const getFileName = (startTimeSec) => {
        const pId = document.getElementById('phd-part-id').value || 'P00';
        const date = document.getElementById('phd-date').value || 'YYMMDD';
        const session = document.getElementById('phd-session').value || 'S00';
        
        const h = Math.floor(startTimeSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((startTimeSec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(startTimeSec % 60).toString().padStart(2, '0');
        
        return `${pId}-${date}-${session}-${h}-${m}-${s}`;
    };

    // Helper: Convert AudioBuffer to WAV Blob
    const bufferToWav = (buffer) => {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const out = new ArrayBuffer(length);
        const view = new DataView(out);
        const channels = [];
        let sample = 0;
        let offset = 0;
        let pos = 0;

        const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
        const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
        
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8);
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt "
        setUint32(16);
        setUint16(1);
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2);
        setUint16(16);
        setUint32(0x61746164); // "data"
        setUint32(length - pos - 4);

        for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

        while (pos < length) {
            for (let i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        return new Blob([out], { type: "audio/wav" });
    };

    const extractRegionWav = async () => {
        if (!wsRegions) return null;
        const regions = wsRegions.getRegions();
        if (regions.length === 0) return null;

        const region = regions[0];
        const originalBuffer = wavesurfer.getDecodedData();
        const sampleRate = originalBuffer.sampleRate;
        
        const startSample = Math.floor(region.start * sampleRate);
        const endSample = Math.floor(region.end * sampleRate);
        const frameCount = endSample - startSample;

        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
            originalBuffer.numberOfChannels, frameCount, sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = originalBuffer;
        source.connect(offlineCtx.destination);
        source.start(0, region.start, region.end - region.start);

        const renderedBuffer = await offlineCtx.startRendering();
        return {
            blob: bufferToWav(renderedBuffer),
            fileName: getFileName(region.start),
            startTime: region.start
        };
    };

    // DOWNLOAD ACTION
    document.getElementById('btn-download-snip').addEventListener('click', async () => {
        const data = await extractRegionWav();
        if(!data) return;
        
        const url = URL.createObjectURL(data.blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${data.fileName}.wav`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    });

    // INJECT ACTION
    document.getElementById('btn-inject-snip').addEventListener('click', async () => {
        const data = await extractRegionWav();
        if(!data) return;

        document.getElementById('analyzer-workspace').classList.remove('hidden');
        document.getElementById('grid-workspace').classList.remove('hidden');

        // Scroll to workspace
        document.getElementById('analyzer-workspace').scrollIntoView({ behavior: 'smooth' });

        // Dispatch to Timeline Engine
        window.dispatchEvent(new CustomEvent('thps-inject-snip', { detail: data }));
    });
});

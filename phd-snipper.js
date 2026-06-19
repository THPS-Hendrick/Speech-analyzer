// ==========================================
// THPS PhD SNIPPER ENGINE
// Handles local video/audio parsing & trimming
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('phd-media-upload');
    const waveformContainer = document.getElementById('snipper-waveform');
    const actionsContainer = document.getElementById('snipper-actions');
    let wavesurfer = null;
    let wsRegions = null;
    let currentFileBlob = null;

    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        waveformContainer.classList.remove('hidden');
        actionsContainer.classList.remove('hidden', 'flex');
        actionsContainer.classList.add('flex');

        // Initialize WaveSurfer locally
        if (wavesurfer) wavesurfer.destroy();
        wavesurfer = WaveSurfer.create({
            container: '#snipper-waveform',
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            height: 128,
            normalize: true,
        });

        // Initialize Regions for In/Out Snipping
        wsRegions = wavesurfer.registerPlugin(WaveSurfer.Regions.create());
        
        const fileURL = URL.createObjectURL(file);
        wavesurfer.load(fileURL);

        wavesurfer.on('ready', () => {
            // Create a default 30-second snip region in the center
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

    // Helper: Build the Filename
    const getFileName = (startTimeSec) => {
        const pId = document.getElementById('phd-part-id').value || 'P00';
        const date = document.getElementById('phd-date').value || 'YY-MM-DD';
        const session = document.getElementById('phd-session').value || 'S00';
        
        // Convert seconds to HH-MM-SS
        const h = Math.floor(startTimeSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((startTimeSec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(startTimeSec % 60).toString().padStart(2, '0');
        
        return `${pId}-${date}-${session}-${h}-${m}-${s}.wav`;
    };

    // INJECT TO ANALYZER ACTION
    document.getElementById('btn-inject-snip').addEventListener('click', () => {
        if (!wsRegions) return;
        const regions = wsRegions.getRegions();
        if (regions.length === 0) return;

        const region = regions[0];
        const fileName = getFileName(region.start);
        
        // Reveal the workspaces
        document.getElementById('analyzer-workspace').classList.remove('hidden');
        document.getElementById('grid-workspace').classList.remove('hidden');
        
        // Pass the audio buffer data to the Timeline Engine (Next step)
        window.dispatchEvent(new CustomEvent('thps-inject-snip', {
            detail: {
                start: region.start,
                end: region.end,
                fileName: fileName,
                sourceSurfer: wavesurfer
            }
        }));
    });
});

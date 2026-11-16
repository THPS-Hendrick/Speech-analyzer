// ==========================================
// THPS MINI-APP CORE ENGINE (engines/thps-mini-core.js)
// Lightweight orchestrator for standalone lesson & diagnostic pages.
// Pairs audio-engine-headless.js + nlp-scorer.js with <thps-*> widgets.
// ==========================================

window.THPS = window.THPS || {};
window.THPS_MINI_CONFIG = Object.assign({
    maxDuration: 240,        // Default max recording length in seconds (override per page if needed)
    enableFamiliarity: false // Set true only on pages that display Zipf familiarity scores
}, window.THPS_MINI_CONFIG || {});

// Global state expected by <thps-timer-med> and <thps-*> widgets
window.isActive = false;
window.thps_isProcessing = false;
window.gameTimerInterval = null;
window.thps_lastPayload = null;
window.thps_sessionHistory = [];
window.thps_currentAttemptId = 1;
window.thps_currentTranscript = "";

// ==========================================
// 1. RECORDING LIFECYCLE CONTROLLER
// ==========================================
window.toggleRecording = async function() {
    if (window.thps_isProcessing) return; // Prevent double-taps while STT is running

    const maxDuration = window.THPS_MINI_CONFIG.maxDuration || 240;

    // --- STOP & TRANSCRIBE ---
    if (window.isActive) {
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
            window.gameTimerInterval = null;
        }

        window.isActive = false;
        window.thps_isProcessing = true;
        window.dispatchEvent(new CustomEvent('thps-recording-state', {
            detail: { isRecording: false, status: 'processing' }
        }));

        try {
            if (window.THPS?.Audio && typeof window.THPS.Audio.stopRecordingProcess === 'function') {
                const result = await window.THPS.Audio.stopRecordingProcess();

                if (result.error && !result.transcript) {
                    window.dispatchEvent(new CustomEvent('thps-recording-error', {
                        detail: { message: result.error }
                    }));
                }

                window.thps_currentTranscript = result.transcript || "";
                const hiddenEl = document.getElementById('cba-inputText');
                if (hiddenEl) hiddenEl.value = window.thps_currentTranscript;

                await window.analyze(window.thps_currentTranscript);
            }
        } catch (err) {
            console.error("THPS Mini Recording Stop Error:", err);
            window.dispatchEvent(new CustomEvent('thps-recording-error', {
                detail: { message: err.message || "Transcription failed." }
            }));
        } finally {
            window.thps_isProcessing = false;
            window.dispatchEvent(new CustomEvent('thps-recording-state', {
                detail: { isRecording: false, status: 'complete' }
            }));
        }
        return;
    }

    // --- START RECORDING ---
    window.clearAnalyzer(false); // Reset previous attempt state without firing an empty update

    if (!window.THPS?.Audio || typeof window.THPS.Audio.startRecordingProcess !== 'function') {
        console.error("audio-engine-headless.js must be loaded before thps-mini-core.js.");
        return;
    }

    const started = await window.THPS.Audio.startRecordingProcess();
    if (!started) {
        window.isActive = false;
        window.dispatchEvent(new CustomEvent('thps-recording-error', {
            detail: { message: "Microphone access denied or unavailable." }
        }));
        return;
    }

    window.isActive = true;
    window.dispatchEvent(new CustomEvent('thps-recording-state', {
        detail: { isRecording: true, status: 'recording' }
    }));

    if (window.gameTimerInterval) clearInterval(window.gameTimerInterval);
    window.gameTimerInterval = setInterval(() => {
        if (!window.isActive || !window.THPS?.Audio?.recordStartTime) return;

        const elapsedSecs = (Date.now() - window.THPS.Audio.recordStartTime) / 1000;
        if (elapsedSecs >= maxDuration) {
            window.toggleRecording(); // Auto-stop at maxDuration
        }
    }, 50);
};

// ==========================================
// 2. 10-METRIC LINEAR INTERPOLATION SCORER
// ==========================================
window.getMetricPoints = function(key, val) {
    const limits = {
        // Key: [minRed, minYellow, minGreen, maxGreen, maxYellow, maxRed]
        personal:   [0,    20,   30,   60,   70,   100],
        visual:     [0,    10,   20,   50,   60,   100],
        intangible: [0,    5,    10,   30,   35,   100],
        wpm:        [50,   90,   100,  155,  165,  200],
        sps:        [2.0,  3.0,  3.5,  4.5,  5.0,  6.0],
        pause:      [0,    10,   15,   35,   40,   60],
        runtime:    [0.0,  2.0,  3.0,  7.0,  9.0,  12.0],
        readlevel:  [2.0,  4.5,  6.0,  11.0, 12.5, 16.0],
        simple:     [50,   75,   80,   90,   95,   100],
        clarity:    [60,   80,   90,   100,  100.1, 100.2]
    };

    if (!limits[key] || val === undefined || val === null || isNaN(val)) return 0.0;
    const [minRed, minYellow, minGreen, maxGreen, maxYellow, maxRed] = limits[key];

    if (val >= minGreen && val <= maxGreen) return 10.0;

    if (val < minGreen) {
        if (val <= minRed) return 0.0;
        if (val >= minYellow) {
            if (minGreen === minYellow) return 10.0;
            const ratio = (val - minYellow) / (minGreen - minYellow);
            return Math.max(4.0, Math.min(10.0, 4.0 + (ratio * 6.0)));
        } else {
            if (minYellow === minRed) return 0.0;
            const ratio = (val - minRed) / (minYellow - minRed);
            return Math.max(0.0, Math.min(4.0, ratio * 4.0));
        }
    }

    if (val > maxGreen) {
        if (val >= maxRed) return 0.0;
        if (val <= maxYellow) {
            if (maxYellow === maxGreen) return 4.0;
            const ratio = (maxYellow - val) / (maxYellow - maxGreen);
            return Math.max(4.0, Math.min(10.0, 4.0 + (ratio * 6.0)));
        } else {
            if (maxRed === maxYellow) return 0.0;
            const ratio = (maxRed - val) / (maxRed - maxYellow);
            return Math.max(0.0, Math.min(4.0, ratio * 4.0));
        }
    }

    return 0.0;
};

// ==========================================
// 3. SPEECH ANALYSIS & WIDGET BROADCAST
// ==========================================
window.analyze = async function(textOverride = null) {
    if (!window.THPS || !window.THPS.NLP) return null;

    // Ensure dictionaries are loaded before scoring
    if (!window.THPS.NLP.dictsLoaded && typeof window.THPS.NLP.loadDictionaries === 'function') {
        await window.THPS.NLP.loadDictionaries();
    }

    let text = "";
    if (typeof textOverride === 'string') {
        text = textOverride.trim();
    } else if (window.thps_currentTranscript) {
        text = window.thps_currentTranscript.trim();
    } else {
        const widgetEl = document.getElementById('cba-inputText-widget');
        const hiddenEl = document.getElementById('cba-inputText');
        if (widgetEl && widgetEl.value.trim() !== '') text = widgetEl.value.trim();
        else if (hiddenEl) text = hiddenEl.value.trim();
    }

    if (!text) {
        window.dispatchEvent(new CustomEvent('thps-dashboard-update', { detail: { text: "" } }));
        return null;
    }

    let timestamps = [];
    let volumeData = [];
    let elapsedSecs = 0;

    if (window.THPS.Audio) {
        if (window.THPS.Audio.recordedAudio && window.THPS.Audio.wordTimestamps) {
            timestamps = window.THPS.Audio.wordTimestamps;
        }
        if (window.THPS.Audio.volumeData) {
            volumeData = window.THPS.Audio.volumeData;
        }
        elapsedSecs = window.THPS.Audio.recordedAudio ? (window.THPS.Audio.lastRecordedDuration || 0) : 0;
    }

    const masterData = typeof window.THPS.NLP.analyzeSpeech === 'function'
        ? window.THPS.NLP.analyzeSpeech(text, timestamps, volumeData, elapsedSecs)
        : window.THPS.NLP.analyzeTranscript(text, timestamps);

    const {
        numWords = 0, numSentences = 0, totalSyllables = 0, letterCount = 0, complexWordCount = 0,
        personalCount = 0, visualCount = 0, unifiedSimpleCount = 0, google10kCount = 0,
        highlightedHTML = "", reportMarkdownText = "", wordTimestamps = []
    } = masterData;

    const mumbleScore = masterData.mumbleScore || 0;
    const avgWpm = masterData.wpm || 0;
    const pausePercent = masterData.pausePercent || 0;
    const pauseBuckets = masterData.pauseBuckets || { micro: 0, short: 0, medium: 0, long: 0, vLong: 0, extreme: 0 };
    const paceBuckets = masterData.paceBuckets || { fastest: 0, fast: 0, normal: 0, slow: 0, slowest: 0 };
    const coreSimpleScore = numWords > 0 ? Math.round((unifiedSimpleCount / numWords) * 100) : 0;

    let avgGrade = 0;
    let readability = null;
    if (typeof window.THPS.NLP.calculateReadabilityMetrics === 'function') {
        readability = window.THPS.NLP.calculateReadabilityMetrics(numWords, numSentences, totalSyllables, letterCount, complexWordCount);
        avgGrade = readability.avgGrade;
    } else {
        const flesch = Math.max(0, (0.39 * (numWords / Math.max(1, numSentences))) + (11.8 * (totalSyllables / Math.max(1, numWords))) - 15.59);
        const fog = Math.max(0, 0.4 * ((numWords / Math.max(1, numSentences)) + 100 * (complexWordCount / Math.max(1, numWords))));
        const smog = Math.max(0, 1.0430 * Math.sqrt(complexWordCount * (30 / Math.max(1, numSentences))) + 3.1291);
        const coleman = Math.max(0, 0.0588 * ((letterCount / Math.max(1, numWords)) * 100) - 0.296 * ((numSentences / Math.max(1, numWords)) * 100) - 15.8);
        avgGrade = (flesch + fog + smog + coleman) / 4;
        readability = { flesch, fog, smog, coleman, avgGrade };
    }

    const personalPercent = numWords > 0 ? Math.round((personalCount / numWords) * 100) : 0;
    const visualPercent = numWords > 0 ? Math.round((visualCount / numWords) * 100) : 0;
    const intangiblePercent = Math.max(0, 100 - personalPercent - visualPercent);

    let clarityPercent = 0;
    if (timestamps && timestamps.length > 0) {
        const validWords = timestamps.filter(w => w.confidence !== undefined && w.confidence !== null);
        if (validWords.length > 0) {
            const sumConf = validWords.reduce((sum, w) => sum + w.confidence, 0);
            clarityPercent = Math.round((sumConf / validWords.length) * 100);
        }
    }

    const overrideGrade = (!window.THPS.Audio || !window.THPS.Audio.recordedAudio || elapsedSecs === 0);
    const finalRuntime = masterData.runtime || 0;

    const scoreKeys = [
        { k: 'personal', v: personalPercent },
        { k: 'visual', v: visualPercent },
        { k: 'intangible', v: intangiblePercent },
        { k: 'wpm', v: avgWpm },
        { k: 'sps', v: mumbleScore },
        { k: 'pause', v: pausePercent },
        { k: 'runtime', v: finalRuntime },
        { k: 'readlevel', v: avgGrade },
        { k: 'simple', v: coreSimpleScore },
        { k: 'clarity', v: clarityPercent }
    ];

    let totalPoints = 0;
    scoreKeys.forEach(metric => {
        totalPoints += window.getMetricPoints(metric.k, metric.v);
    });

    const payload = {
        id: window.thps_currentAttemptId,
        title: 'Attempt ' + window.thps_currentAttemptId,
        date: new Date(),
        sps: mumbleScore,
        wpm: avgWpm,
        readlevel: avgGrade,
        time: elapsedSecs,
        personal: personalPercent,
        visual: visualPercent,
        text: text,
        wordTimestamps: wordTimestamps,
        volumeData: volumeData,
        pauseBuckets: pauseBuckets,
        paceBuckets: paceBuckets,
        pause: pausePercent,
        intangible: intangiblePercent,
        runtime: finalRuntime,
        simple: coreSimpleScore,
        totalPoints: totalPoints,
        clarity: clarityPercent,
        overrideGrade: overrideGrade,
        recordedAudio: window.THPS.Audio ? window.THPS.Audio.recordedAudio : false,
        highlightedHTML: highlightedHTML,
        reportMarkdownText: reportMarkdownText,
        numWords: numWords,
        numSentences: numSentences,
        totalSyllables: totalSyllables,
        google10kCount: google10kCount,
        unifiedSimpleCount: unifiedSimpleCount,
        readability: readability,
        pauseEvents: masterData.pauseEvents || [],
        concretenessScores: masterData.concretenessScores || {},
        avgConcreteness: masterData.avgConcreteness ?? null,
        runPaces: masterData.runPaces || [],
        runBuckets: masterData.runBuckets || { vFast: 0, fast: 0, norm: 0, slow: 0, vSlow: 0 },
        volumeBuckets: masterData.volumeBuckets || { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 },
        volumeLabels: masterData.volumeLabels || [],
        volumeChunks: masterData.volumeChunks || []
    };

    window.thps_lastPayload = payload;

    // Maintain lightweight session history for multi-attempt widgets (e.g., Progress / MoE)
    const existingIndex = window.thps_sessionHistory.findIndex(h => h.id === window.thps_currentAttemptId);
    if (existingIndex >= 0) {
        window.thps_sessionHistory[existingIndex] = payload;
    } else {
        window.thps_sessionHistory.unshift(payload);
    }

    // Broadcast to all mounted <thps-*> widgets and lesson listeners
    window.dispatchEvent(new CustomEvent('thps-dashboard-update', { detail: payload }));

    // Optional Zipf familiarity fetch (off by default to avoid extra API calls)
    if (window.THPS_MINI_CONFIG.enableFamiliarity && text.trim() !== '') {
        fetch('/api/analyze_words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        })
        .then(res => res.json())
        .then(famData => {
            if (window.thps_lastPayload) window.thps_lastPayload.familiarity = famData;
            const attempt = window.thps_sessionHistory.find(h => h.id === payload.id);
            if (attempt) attempt.familiarity = famData;
            window.dispatchEvent(new CustomEvent('thps-familiarity-update', { detail: famData }));
        })
        .catch(err => console.warn("Familiarity fetch skipped/failed:", err));
    }

    return payload;
};

// ==========================================
// 4. UTILITIES & WIDGET SAFE-GUARDS
// ==========================================
window.clearAnalyzer = function(broadcastEmpty = true) {
    window.thps_currentTranscript = "";
    const hiddenEl = document.getElementById('cba-inputText');
    if (hiddenEl) hiddenEl.value = '';

    if (window.THPS?.Audio) {
        window.THPS.Audio.recordedAudio = false;
        window.THPS.Audio.lastRecordedDuration = 0;
        window.THPS.Audio.wordTimestamps = [];
        window.THPS.Audio.volumeData = [];
    }

    if (window.thps_lastPayload && (window.thps_lastPayload.text.trim() !== '' || window.thps_lastPayload.time > 0)) {
        window.thps_currentAttemptId++;
    }

    window.thps_lastPayload = null;

    if (broadcastEmpty) {
        window.dispatchEvent(new CustomEvent('thps-dashboard-update', { detail: { text: "" } }));
    }
};

window.formatMetric = function(key, val) {
    if (val === null || val === undefined) return '-';
    if (key === 'time') return `${Math.floor(val / 60)}:${Math.floor(val % 60).toString().padStart(2, '0')}`;
    if (['totalPoints', 'sps', 'grade', 'readlevel'].includes(key)) return val.toFixed(1);
    if (key === 'runtime') return val.toFixed(1) + 's';
    if (['pause', 'personal', 'visual', 'intangible', 'simple'].includes(key)) return val.toFixed(0) + '%';
    return Math.round(val);
};

// Safe-guard so clicking metric labels inside widgets like <thps-voice-timeline> never throws
window.FALLBACK_EXPLANATIONS = window.FALLBACK_EXPLANATIONS || {
    "Score Summary": "Measures your Content, Delivery, and Simplicity. Metrics in the green zone get +10 points. Total Grade out of 100.",
    "Clarity %": "How confident Google Speech-to-Text was at transcribing each word you pronounced. Aim for 90%+.",
    "Personal": "Measures storytelling. Aim for 30-60% content about specific people doing specific things.",
    "Visual": "Measures sensory words that paint a picture. Aim for 20-50%.",
    "Intangible": "Measures abstract concepts and filler. Keep it between 10-30%.",
    "Words/min": "Your speaking pace. The sweet spot is 100-155 words per minute.",
    "Syllable/sec": "Our 'Mumble Meter'. The green zone is 3.5 to 4.5 syllables per second.",
    "Pause %": "The percentage of time you spend silent. Aim for 15-35%.",
    "Runtime": "The average seconds you speak continuously before taking a meaningful pause. Aim for 3.0s to 7.0s.",
    "Read-Level": "The reading grade level of your speech. A grade of 6.0 to 11.0 is plain English.",
    "Simple %": "The percentage of your words within the common simple English dictionary. Aim for 80-90%.",
    "Pause Var.": "Measures how varied your pause lengths are across the speech.",
    "Vol Var.": "Measures how varied your speaking volume is relative to your baseline.",
    "Pace Var.": "Measures how varied your speaking speed is across continuous runs."
};

window.explain = window.explain || function(term) {
    const text = window.FALLBACK_EXPLANATIONS[term] || `Explanation for "${term}".`;
    window.dispatchEvent(new CustomEvent('thps-explain', { detail: { term, text } }));
};

// Pre-warm dictionaries immediately on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.THPS?.NLP && !window.THPS.NLP.dictsLoaded && typeof window.THPS.NLP.loadDictionaries === 'function') {
        window.THPS.NLP.loadDictionaries();
    }
});

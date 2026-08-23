// ==========================================
// THPS NLP SCORER ENGINE
// Pure logic. No UI manipulation.
// ==========================================

window.THPS = window.THPS || {};
window.THPS.NLP = window.THPS.NLP || {};

window.THPS.NLP.DICT_URLS = {
    simple: "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/simple.json",
    visual: "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/visualdict.json"
};

window.THPS.NLP.personalPronouns = new Set(["i", "i'd", "i'll", "i'm", "i've", "he", "he'd", "he'll", "he's", "she", "she'd", "she'll", "she's", "said", "say", "me", "my", "myself", "mine", "him", "himself", "her", "herself"]);
window.THPS.NLP.visualDictPronouns = new Set();
window.THPS.NLP.visualDictWords = new Set();
window.THPS.NLP.simpleSet = new Set(); 
window.THPS.NLP.google10kSet = new Set();
window.THPS.NLP.dictsLoaded = false;

window.THPS.NLP.loadDictionaries = async function() {
    try {
        const fetchDict = async (url) => {
            const res = await fetch(url + "?v=" + Date.now(), { cache: "no-store" });
            return await res.json();
        };

        const [simpleData, visualData] = await Promise.all([
            fetchDict(window.THPS.NLP.DICT_URLS.simple), 
            fetchDict(window.THPS.NLP.DICT_URLS.visual)
        ]).catch(() => [[], {}]); 

        const simpleWords = Array.isArray(simpleData) ? simpleData : Object.values(simpleData).flat();
        window.THPS.NLP.simpleSet = new Set(simpleWords.map(w => String(w).toLowerCase()));

        const getFuzzyKey = (obj, keyword) => {
            const key = Object.keys(obj).find(k => k.toLowerCase().includes(keyword));
            return key ? obj[key] : null;
        };
        
        let vPronouns = getFuzzyKey(visualData, "pronoun");
        let vWords = getFuzzyKey(visualData, "visual");
        if (vPronouns) window.THPS.NLP.visualDictPronouns = new Set(vPronouns.map(w => w.toLowerCase()));
        if (vWords) window.THPS.NLP.visualDictWords = new Set(vWords.map(w => w.toLowerCase()));
        
        try {
            const gRes = await fetch('https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-no-swears.txt');
            if(gRes.ok) {
                const gWords = (await gRes.text()).split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
                window.THPS.NLP.google10kSet = new Set(gWords);
            }
        } catch(e) { }

        window.THPS.NLP.dictsLoaded = true;
        window.dispatchEvent(new Event('thps-dicts-loaded'));

    } catch (e) { 
        console.error("Dict Load Error", e); 
    }
};

window.THPS.NLP.countSyllables = function(word) {
    // GHOST WORD SHIELD: Gracefully handle empty API transcription ticks
    if (!word || typeof word !== 'string' || word.trim() === '') return 1;

    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
};

window.THPS.NLP.calculateReadabilityMetrics = function(numWords, numSentences, totalSyllables, letterCount, complexWordCount) {
    numWords = Math.max(1, numWords);
    numSentences = Math.max(1, numSentences);

    let flesch = (0.39 * (numWords / numSentences)) + (11.8 * (totalSyllables / numWords)) - 15.59;
    let fog = 0.4 * ((numWords / numSentences) + 100 * (complexWordCount / numWords));
    let smog = 1.0430 * Math.sqrt(complexWordCount * (30 / numSentences)) + 3.1291;
    let coleman = 0.0588 * ((letterCount / numWords) * 100) - 0.296 * ((numSentences / numWords) * 100) - 15.8;
    
    let avgGrade = ((Math.max(0, flesch)) + (Math.max(0, fog)) + (Math.max(0, smog)) + (Math.max(0, coleman))) / 4;

    return {
        flesch: Math.max(0, flesch),
        fog: Math.max(0, fog),
        smog: Math.max(0, smog),
        coleman: Math.max(0, coleman),
        avgGrade: avgGrade
    };
};

window.THPS.NLP.analyzeTranscript = function(text, wordTimestamps = []) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
    
    let totalSyllables = 0; let complexWordCount = 0;
    let personalCount = 0; let visualCount = 0;
    let unifiedSimpleCount = 0; 
    let google10kCount = 0;

    let highlightedHTML = ""; let reportMarkdownText = ""; 
    let inQuotes = false;
    
    let useFallback = true;
    if (typeof window.nlp === 'function') {
        try {
            let doc = window.nlp(text);
            try { doc.compute('root'); } catch(e) {} 
            const jsonDoc = doc.json({ terms: true }); 
            
            for (let sIdx = 0; sIdx < jsonDoc.length; sIdx++) {
                const sentence = jsonDoc[sIdx];
                if (!sentence.terms) continue; 
                let personalCountdown = 0; let visualCountdown = 0; 

                for (let tIdx = 0; tIdx < sentence.terms.length; tIdx++) {
                    const term = sentence.terms[tIdx];
                    let rawText = term.text || ""; let rawPre = term.pre || ""; let rawPost = term.post || "";
                    let rawRoot = term.root || term.normal || rawText;

                    let root = String(rawRoot).toLowerCase().replace(/[^a-z]/g, '');
                    let normal = String(term.normal || rawText).toLowerCase().replace(/[^a-z']/g, ''); 
                    
                    if (rawPre.includes('"') || rawPre.includes('“') || rawText.includes('“') || rawText.startsWith('"')) inQuotes = true;
                    if (window.THPS.NLP.personalPronouns.has(normal)) personalCountdown = 6;
                    if (!window.THPS.NLP.personalPronouns.has(normal)) {
                        if (window.THPS.NLP.visualDictPronouns.has(normal) || window.THPS.NLP.visualDictWords.has(normal) || window.THPS.NLP.visualDictWords.has(root)) {
                            visualCountdown = Math.max(visualCountdown, 4);
                        }
                    }

                    let isSimple = window.THPS.NLP.simpleSet.has(normal);
                    if (!isSimple && root) isSimple = window.THPS.NLP.simpleSet.has(root);
                    let simpleTailwind = isSimple ? " underline decoration-2 underline-offset-4" : "";

                    let isPersonal = (inQuotes || personalCountdown > 0);
                    let isVisual = (visualCountdown > 0); 

                    if (personalCountdown > 0) personalCountdown--;
                    if (visualCountdown > 0) visualCountdown--;
                    if (/[.!?]/.test(rawText) || /[.!?]/.test(rawPost)) { visualCountdown = 0; personalCountdown = 0; }
                    if (rawPost.includes('"') || rawPost.includes('”') || rawText.includes('”') || rawText.endsWith('"')) inQuotes = false;

                    let safePre = rawPre.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    let safePost = rawPost.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    let safeText = rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                    if (/[a-zA-Z]/.test(rawText)) {
                        if (isPersonal && isVisual) {
                            highlightedHTML += `${safePre}<span class="text-purple-500 font-bold${simpleTailwind}">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}_**${rawText}**_${rawPost}`;
                            personalCount++; visualCount++;
                        } else if (isPersonal) {
                            highlightedHTML += `${safePre}<span class="text-blue-500 font-bold${simpleTailwind}">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}**${rawText}**${rawPost}`;
                            personalCount++;
                        } else if (isVisual) {
                            highlightedHTML += `${safePre}<span class="text-red-500 font-bold${simpleTailwind}">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}_${rawText}_${rawPost}`;
                            visualCount++;
                        } else if (isSimple) {
                            highlightedHTML += `${safePre}<span class="underline decoration-2 underline-offset-4">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}${rawText}${rawPost}`;
                        } else {
                            highlightedHTML += `${safePre}${safeText}${safePost}`;
                            reportMarkdownText += `${rawPre}${rawText}${rawPost}`;
                        }
                    } else {
                        highlightedHTML += `${safePre}${safeText}${safePost}`;
                        reportMarkdownText += `${rawPre}${rawText}${rawPost}`;
                    }
                }
            }
            useFallback = false;
        } catch(e) { useFallback = true; }
    }

    if (useFallback) {
        let tokens = text.split(/([a-zA-Z']+)/);
        let personalCountdown = 0; let visualCountdown = 0;
        tokens.forEach(token => {
            if (/[.!?]/.test(token)) { visualCountdown = 0; personalCountdown = 0; inQuotes = false; }
            if (/[a-zA-Z]/.test(token)) {
                let normal = token.toLowerCase().replace(/[^a-z']/g, '');
                let root = normal.replace(/(?:s|es|ed|ing)$/, ''); 
                if (window.THPS.NLP.personalPronouns.has(normal)) personalCountdown = 6;
                if (!window.THPS.NLP.personalPronouns.has(normal) && (window.THPS.NLP.visualDictPronouns.has(normal) || window.THPS.NLP.visualDictWords.has(normal) || window.THPS.NLP.visualDictWords.has(root))) {
                    visualCountdown = Math.max(visualCountdown, 4);
                }
                
                let isSimple = window.THPS.NLP.simpleSet.has(normal);
                if (!isSimple && root) isSimple = window.THPS.NLP.simpleSet.has(root);
                let simpleTailwind = isSimple ? " underline decoration-2 underline-offset-4" : "";

                let isPersonal = (inQuotes || personalCountdown > 0);
                let isVisual = (visualCountdown > 0);
                if (personalCountdown > 0) personalCountdown--;
                if (visualCountdown > 0) visualCountdown--;

                let safeText = token.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                
                if (isPersonal && isVisual) { highlightedHTML += `<span class="text-purple-500 font-bold${simpleTailwind}">${safeText}</span>`; reportMarkdownText += `_**${token}**_`; personalCount++; visualCount++; } 
                else if (isPersonal) { highlightedHTML += `<span class="text-blue-500 font-bold${simpleTailwind}">${safeText}</span>`; reportMarkdownText += `**${token}**`; personalCount++; } 
                else if (isVisual) { highlightedHTML += `<span class="text-red-500 font-bold${simpleTailwind}">${safeText}</span>`; reportMarkdownText += `_${token}_`; visualCount++; } 
                else if (isSimple) { highlightedHTML += `<span class="underline decoration-2 underline-offset-4">${safeText}</span>`; reportMarkdownText += token; }
                else { highlightedHTML += safeText; reportMarkdownText += token; }
            } else {
                let quoteMatches = (token.match(/["“”]/g) || []).length;
                if (quoteMatches % 2 !== 0) inQuotes = !inQuotes;
                highlightedHTML += token.replace(/</g, "&lt;").replace(/>/g, "&gt;"); reportMarkdownText += token;
            }
        });
    }

    words.forEach(word => {
        let cleanWord = word.toLowerCase().replace(/[^a-z']/g, '');
        let syl = window.THPS.NLP.countSyllables(cleanWord);
        totalSyllables += syl;
        if (syl >= 3) complexWordCount++;
        
        if (cleanWord.length > 0) {
            if (window.THPS.NLP.google10kSet.has(cleanWord)) google10kCount++;
            
            let isSimple = window.THPS.NLP.simpleSet.has(cleanWord);
            if (!isSimple && typeof window.nlp === 'function') {
                try {
                    let doc = window.nlp(cleanWord).compute('root').json();
                    if (doc.length > 0 && doc[0].terms.length > 0) {
                        let rootWord = doc[0].terms[0].root || doc[0].terms[0].normal;
                        if (rootWord) isSimple = window.THPS.NLP.simpleSet.has(rootWord);
                    }
                } catch(e) {}
            }
            if (isSimple) unifiedSimpleCount++;
            
            let tsObj = wordTimestamps.find(t => t.word.toLowerCase().replace(/[^a-z']/g, '') === cleanWord && !t.tagged);
            if (tsObj) {
                tsObj.tagged = true;
                
                let root = cleanWord.replace(/(?:s|es|ed|ing)$/, '');
                let isP = window.THPS.NLP.personalPronouns.has(cleanWord);
                let isV = (!isP && (window.THPS.NLP.visualDictPronouns.has(cleanWord) || window.THPS.NLP.visualDictWords.has(cleanWord) || window.THPS.NLP.visualDictWords.has(root)));
                
                if (isP && isV) { tsObj.colorType = 'overlap'; }
                else if (isP) { tsObj.colorType = 'personal'; }
                else if (isV) { tsObj.colorType = 'visual'; }
                else { tsObj.colorType = 'default'; }
            }
        }
    });

    return {
        numSentences: Math.max(1, sentences.length),
        numWords: Math.max(1, words.length),
        letterCount,
        totalSyllables,
        complexWordCount,
        personalCount,
        visualCount,
        unifiedSimpleCount, 
        google10kCount,
        highlightedHTML,
        reportMarkdownText,
        wordTimestamps 
    };
};

// ==========================================
// THPS MASTER ANALYZER & MATH ENGINE
// Centralizes all acoustic and text math into a single payload
// ==========================================

window.THPS.NLP.analyzeSpeech = function(text, timestamps, volumeData, elapsedSecs) {
    
    // 1. Process standard text-based NLP using explicit namespace
    const nlpData = window.THPS.NLP.analyzeTranscript(text, timestamps); 
    
    // 2. Initialize universal acoustic metrics
    let acousticData = {
        wpm: 0, 
        mumbleScore: 0, 
        pausePercent: 0, 
        runtime: 0, 
        activeSpeakingSecs: 0,
        pauseBuckets: { micro: 0, blue: 0, green: 0, orange: 0, red: 0 },
        paceBuckets: { fastest: 0, fast: 0, normal: 0, slow: 0, slowest: 0 },
        volumeData: volumeData || [],
        
        pauseEvents: [], 
        runPaces: [], 
        volumeBuckets: { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 },
        volumeLabels: [],
        volumeChunks: []
    };

    let duration = Math.min(240, elapsedSecs || 0);

    // 3. Process the Acoustic Elastic Grid
    if (timestamps && timestamps.length > 1 && elapsedSecs > 0) {
        let totalPauseTime = 0;
        let currentRunWords = []; 
        
        let localTotalSyllables = 0;
        timestamps.forEach(w => {
            // GHOST WORD SHIELD: Sanitize ghost words before counting
            if (!w.word || typeof w.word !== 'string') w.word = "";
            localTotalSyllables += window.THPS.NLP.countSyllables(w.word);
        });
        
        let totalAssumedUnits = localTotalSyllables + timestamps.length - 1;

        const firstWord = timestamps[0];
        const lastWord = timestamps[timestamps.length - 1];
        const lastWordSyllables = window.THPS.NLP.countSyllables(lastWord.word);
        const expectedLastWordEnd = lastWord.start + (lastWordSyllables * 0.35);
        duration = Math.max(0.1, expectedLastWordEnd - firstWord.start);

        let assumedUnitLength = duration / totalAssumedUnits;

        for (let i = 0; i < timestamps.length - 1; i++) {
            let currWord = timestamps[i];
            let nextWord = timestamps[i+1];
            
            // GHOST WORD SHIELD: Ensure ghost words don't break the physics object structure
            if (!currWord.word || typeof currWord.word !== 'string') currWord.word = "";
            if (!nextWord.word || typeof nextWord.word !== 'string') nextWord.word = "";
            
            let gap = Math.max(0.01, nextWord.start - currWord.start);

            let sylCount = window.THPS.NLP.countSyllables(currWord.word);
            let expectedUnits = sylCount + 1;
            let expectedTime = expectedUnits * assumedUnitLength;

            let syllableUnitLength = 0;
            let pauseUnitValue = 0;
            let isPauseOpp = false; 
            
            currentRunWords.push({ word: currWord, sylCount: sylCount });

            if (gap <= expectedTime) {
                syllableUnitLength = gap / sylCount;
                acousticData.pauseBuckets.micro++;
            } else {
                let evenExpansion = gap / expectedUnits;

                if (evenExpansion < 0.35) {
                    syllableUnitLength = gap / sylCount;
                    acousticData.pauseBuckets.micro++;
                } else {
                    syllableUnitLength = 0.35;
                    pauseUnitValue = gap - (sylCount * 0.35);

                    if (pauseUnitValue >= 0.35) {
                        totalPauseTime += pauseUnitValue; 
                        isPauseOpp = true; 
                        
                        let pColor = '', pY = 0;
                        if (pauseUnitValue >= 1.40) { acousticData.pauseBuckets.red++; pColor = '#f43f5e'; pY = 0.85; }
                        else if (pauseUnitValue >= 1.05) { acousticData.pauseBuckets.orange++; pColor = '#fbbf24'; pY = 0.65; }
                        else if (pauseUnitValue >= 0.70) { acousticData.pauseBuckets.green++; pColor = '#10b981'; pY = 0.50; }
                        else { acousticData.pauseBuckets.blue++; pColor = '#60a5fa'; pY = 0.35; }
                        
                        let expectedNextStart = currWord.start + (sylCount * 0.35); 
                        acousticData.pauseEvents.push({ start: expectedNextStart, duration: pauseUnitValue, color: pColor, yPct: pY });
                    } else {
                        acousticData.pauseBuckets.micro++; 
                    }
                }
            }

            let paceRatio = syllableUnitLength / assumedUnitLength;
            if (paceRatio < 0.80) acousticData.paceBuckets.fastest++;
            else if (paceRatio < 0.95) acousticData.paceBuckets.fast++;
            else if (paceRatio <= 1.05) acousticData.paceBuckets.normal++;
            else if (paceRatio <= 1.20) acousticData.paceBuckets.slow++;
            else acousticData.paceBuckets.slowest++;

            currWord.telemetry = {
                sylCount: sylCount,
                expectedDurationMs: Math.round((sylCount * assumedUnitLength) * 1000),
                actualDurationMs: Math.round(isPauseOpp ? (sylCount * 0.35 * 1000) : (gap * 1000)),
                pauseOpp: isPauseOpp,
                pauseOppMs: Math.round(pauseUnitValue * 1000),
                accordionSyllableMs: Math.round(syllableUnitLength * 1000)
            };

            if (isPauseOpp || i === timestamps.length - 2) {
                let ratio = 1.0;
                let blockWidth = sylCount * assumedUnitLength; 
                
                if (currentRunWords.length >= 2) {
                    let actualTime = currentRunWords[currentRunWords.length - 1].word.start - currentRunWords[0].word.start;
                    let expectedSyllables = 0;
                    for (let j = 0; j < currentRunWords.length - 1; j++) expectedSyllables += currentRunWords[j].sylCount;
                    let expectedTime = expectedSyllables * assumedUnitLength;
                    ratio = expectedTime > 0 ? (actualTime / expectedTime) : 1.0;
                    blockWidth = actualTime + (currentRunWords[currentRunWords.length - 1].sylCount * assumedUnitLength);
                }

                let paceColor = '', paceRow = 2;
                if (ratio < 0.75) { paceColor = '#f43f5e'; paceRow = 4; }
                else if (ratio < 0.91) { paceColor = '#fbbf24'; paceRow = 3; }
                else if (ratio <= 1.10) { paceColor = '#10b981'; paceRow = 2; }
                else if (ratio <= 1.30) { paceColor = '#60a5fa'; paceRow = 1; }
                else { paceColor = '#cbd5e1'; paceRow = 0; }

                acousticData.runPaces.push({ start: currentRunWords[0].word.start, width: blockWidth, color: paceColor, row: paceRow });
                currentRunWords = []; 
            }
        }
        
        let lastWordObj = timestamps[timestamps.length - 1];
        if (!lastWordObj.word || typeof lastWordObj.word !== 'string') lastWordObj.word = ""; // Shield the final word
        
        let lastWordSyl = window.THPS.NLP.countSyllables(lastWordObj.word);
        lastWordObj.telemetry = {
            sylCount: lastWordSyl,
            expectedDurationMs: Math.round((lastWordSyl * assumedUnitLength) * 1000),
            actualDurationMs: Math.round((lastWordSyl * assumedUnitLength) * 1000),
            pauseOpp: false,
            pauseOppMs: 0,
            accordionSyllableMs: Math.round(assumedUnitLength * 1000)
        };

        acousticData.activeSpeakingSecs = Math.max(0, duration - totalPauseTime);
        acousticData.pausePercent = Math.max(0, Math.min(100, (totalPauseTime / duration) * 100));
        acousticData.wpm = Math.round((nlpData.numWords / duration) * 60);
        acousticData.mumbleScore = acousticData.activeSpeakingSecs > 0 ? (nlpData.totalSyllables / acousticData.activeSpeakingSecs) : 0;
        
        let meaningfulPauses = acousticData.pauseBuckets.blue + acousticData.pauseBuckets.green + acousticData.pauseBuckets.orange + acousticData.pauseBuckets.red;
        acousticData.runtime = acousticData.activeSpeakingSecs > 0 ? (acousticData.activeSpeakingSecs / (meaningfulPauses + 1)) : 0;

    } else if (timestamps && timestamps.length === 1) {
        acousticData.activeSpeakingSecs = 1.0;
        acousticData.pausePercent = 0;
        acousticData.runtime = 1.0;
    } else {
        acousticData.activeSpeakingSecs = 0;
        acousticData.pausePercent = 0;
        acousticData.runtime = 0;
    }

    // ==========================================
    // 4. PERCENTILE CLAMP VOLUME ENGINE
    // ==========================================
    let validChunks = [];
    let volumeBuckets = { vLow: 0, low: 0, norm: 0, high: 0, vHigh: 0 };
    let volumeLabels = ['< -35dB', '-35dB', '-25dB', '-15dB', '> -15dB']; 

    if (volumeData && volumeData.length > 0) {
        let numChunks = Math.ceil(elapsedSecs / 3);
        for(let c = 0; c < numChunks; c++) {
            let chunkStart = c * 3;
            let chunkEnd = chunkStart + 3;
            
            let linearSum = 0; let dbCount = 0;
            volumeData.forEach(v => {
                if (v.time >= chunkStart && v.time < chunkEnd) {
                    linearSum += Math.pow(10, v.db / 10);
                    dbCount++;
                }
            });
            if (dbCount > 0) {
                let avgDb = 10 * Math.log10(linearSum / dbCount);
                validChunks.push({ start: chunkStart, end: chunkEnd, db: avgDb });
            }
        }

        validChunks.sort((a, b) => a.db - b.db);

        let floorDb = -40, ceilingDb = -10;
        if (validChunks.length > 0) {
            let floorIndex = Math.floor(validChunks.length * 0.05); 
            let ceilIndex = Math.floor(validChunks.length * 0.95);  
            if (ceilIndex >= validChunks.length) ceilIndex = validChunks.length - 1;
            floorDb = validChunks[floorIndex].db;
            ceilingDb = validChunks[ceilIndex].db;
        }

        let range = ceilingDb - floorDb;
        if (range < 15) {
            let midPoint = (ceilingDb + floorDb) / 2;
            floorDb = midPoint - 7.5;
            ceilingDb = midPoint + 7.5;
            range = 15;
        }

        let step = range / 5;
        let bounds = [floorDb + step, floorDb + (step * 2), floorDb + (step * 3), floorDb + (step * 4)];

        volumeLabels = [
            `< ${Math.round(bounds[0])}dB`,
            `${Math.round(bounds[0])}dB`,
            `${Math.round(bounds[1])}dB`,
            `${Math.round(bounds[2])}dB`,
            `> ${Math.round(bounds[3])}dB`
        ];
        
        validChunks.forEach(vc => {
            if (vc.db < bounds[0]) { volumeBuckets.vLow++; vc.color = '#8b5cf6'; vc.hPct = 0.15; } 
            else if (vc.db < bounds[1]) { volumeBuckets.low++; vc.color = '#3b82f6'; vc.hPct = 0.30; } 
            else if (vc.db < bounds[2]) { volumeBuckets.norm++; vc.color = '#10b981'; vc.hPct = 0.50; } 
            else if (vc.db < bounds[3]) { volumeBuckets.high++; vc.color = '#f59e0b'; vc.hPct = 0.75; } 
            else { volumeBuckets.vHigh++; vc.color = '#ef4444'; vc.hPct = 0.97; } 
        });
    }

    acousticData.volumeBuckets = volumeBuckets;
    acousticData.volumeLabels = volumeLabels;
    acousticData.volumeChunks = validChunks;

    return { ...nlpData, ...acousticData, trueDuration: duration };
};

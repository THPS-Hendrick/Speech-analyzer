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

window.THPS.NLP.personalPronouns = new Set(["i", "i'd", "i'll", "i'm", "i've", "he", "he'd", "he'll", "he's", "she", "she'd", "she'll", "she's"]);
window.THPS.NLP.visualDictPronouns = new Set();
window.THPS.NLP.visualDictWords = new Set();
window.THPS.NLP.simpleMap = new Map();
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
        ]).catch(() => [{}, {}]);

        for (const [tier, words] of Object.entries(simpleData)) {
            let t = tier.toLowerCase();
            let finalTier = 'outside';
            if (t.includes('5yr') || t.includes('5 yr')) finalTier = '5yr Old 1000';
            else if (t.includes('esl')) finalTier = 'ESL 2000';
            else if (t.includes('kitchen') || t.includes('kit')) finalTier = 'Kitchen 1000';
            if (finalTier !== 'outside') words.forEach(w => window.THPS.NLP.simpleMap.set(w.toLowerCase(), finalTier));
        }

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

window.THPS.NLP.analyzeTranscript = function(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
    
    let totalSyllables = 0; let complexWordCount = 0;
    let personalCount = 0; let visualCount = 0;
    let simpleCounts = { '5yr Old 1000': 0, 'ESL 2000': 0, 'Kitchen 1000': 0, 'outside': 0 };
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
                            highlightedHTML += `${safePre}<span class="overlap-word">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}_**${rawText}**_${rawPost}`;
                            personalCount++; visualCount++;
                        } else if (isPersonal) {
                            highlightedHTML += `${safePre}<span class="personal-word">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}**${rawText}**${rawPost}`;
                            personalCount++;
                        } else if (isVisual) {
                            highlightedHTML += `${safePre}<span class="visual-word">${safeText}</span>${safePost}`;
                            reportMarkdownText += `${rawPre}_${rawText}_${rawPost}`;
                            visualCount++;
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
                let isPersonal = (inQuotes || personalCountdown > 0);
                let isVisual = (visualCountdown > 0);
                if (personalCountdown > 0) personalCountdown--;
                if (visualCountdown > 0) visualCountdown--;

                let safeText = token.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if (isPersonal && isVisual) { highlightedHTML += `<span class="overlap-word">${safeText}</span>`; reportMarkdownText += `_**${token}**_`; personalCount++; visualCount++; } 
                else if (isPersonal) { highlightedHTML += `<span class="personal-word">${safeText}</span>`; reportMarkdownText += `**${token}**`; personalCount++; } 
                else if (isVisual) { highlightedHTML += `<span class="visual-word">${safeText}</span>`; reportMarkdownText += `_${token}_`; visualCount++; } 
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
            let sTier = window.THPS.NLP.simpleMap.get(cleanWord);
            if (!sTier && typeof window.nlp === 'function') {
                try {
                    let doc = window.nlp(cleanWord).compute('root').json();
                    if (doc.length > 0 && doc[0].terms.length > 0) {
                        let rootWord = doc[0].terms[0].root || doc[0].terms[0].normal;
                        if (rootWord) sTier = window.THPS.NLP.simpleMap.get(rootWord);
                    }
                } catch(e) {}
            }
            simpleCounts[sTier || 'outside']++;
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
        simpleCounts,
        google10kCount,
        highlightedHTML,
        reportMarkdownText
    };
};
```

### Step 2: Ensure Squarespace has the complete function
Because the previous code block was cut off in your prompt window, I want to ensure you have the **entire, complete `window.analyze` function** for Squarespace so nothing gets dropped. 

In your `analyzer-app.html` file, replace your entire `window.analyze = function() { ... }` block (all the way down to where the Copy Button logic starts) with this:

```javascript
        window.analyze = function() {
            try {
                if (!window.THPS || !window.THPS.NLP || typeof window.THPS.NLP.loadDictionaries !== 'function') {
                    console.warn("GitHub modules not loaded yet. Waiting...");
                    return;
                }
            } catch(e) { return; }
            
            if (!window.THPS.NLP.dictsLoaded) return;
            const text = inputEl.value.trim();
            
            if (!text) {
                document.getElementById('cba-highlightContainer').classList.add('hidden');
                document.getElementById('cba-copyBtn').classList.add('hidden');
                updateCelebrationPanel(0, 0, true, false, 0); 
                return;
            }

            // --- DELEGATE TO THE GITHUB BRAIN ---
            const nlpData = window.THPS.NLP.analyzeTranscript(text);

            const { 
                numWords, numSentences, totalSyllables, letterCount, complexWordCount, 
                personalCount, visualCount, simpleCounts, google10kCount, 
                highlightedHTML, reportMarkdownText: newReportMarkdown 
            } = nlpData;

            reportMarkdownText = newReportMarkdown; 

            // --- THE TRACKMAN FIX: SAFE UI UPDATERS ---
            const safeSetText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            const safeSetWidth = (id, widthPct) => { const el = document.getElementById(id); if (el) el.style.width = widthPct; };
            const safeSetColor = (id, color) => { const el = document.getElementById(id); if (el) el.style.color = color; };
            const safeSetBg = (id, color) => { const el = document.getElementById(id); if (el) el.style.backgroundColor = color; };
            const safeSetBorder = (id, color) => { const el = document.getElementById(id); if (el) el.style.borderLeftColor = color; };

            safeSetText('cba-statWords', numWords);
            safeSetText('cba-statSentences', numSentences);
            safeSetText('cba-statSyllables', totalSyllables);

            const highlightContainer = document.getElementById('cba-highlightContainer');
            if (highlightContainer) highlightContainer.classList.remove('hidden'); 
            const copyBtn = document.getElementById('cba-copyBtn');
            if (copyBtn) copyBtn.classList.remove('hidden'); 
            const highlightTextEl = document.getElementById('cba-highlightedText');
            if (highlightTextEl) highlightTextEl.innerHTML = highlightedHTML.replace(/\n/g, '<br>');

            let gPct = Math.round((google10kCount / numWords) * 100);
            if (window.THPS.NLP.google10kSet.size > 0 && numWords > 0) {
                safeSetText('cba-googleScore', `${gPct}%`);
                safeSetWidth('cba-googleProgress', `${Math.min(100, Math.max(0, gPct))}%`);
                safeSetText('cba-googleCount', `${google10kCount} out of ${numWords} words`);
                let gColor = gPct > 80 ? "#10b981" : gPct > 60 ? "#f59e0b" : "#ef4444";
                safeSetText('cba-googleInterpret', gPct > 80 ? "Highly Common" : gPct > 60 ? "Moderately Common" : "Highly Unique/Niche");
                safeSetBorder('cba-googleCard', gColor);
                safeSetBg('cba-googleProgress', gColor);
                safeSetColor('cba-googleScore', gColor);
            }

            let s5yrPct = Math.round((simpleCounts['5yr Old 1000'] / numWords) * 100) || 0;
            let sEslPct = Math.round((simpleCounts['ESL 2000'] / numWords) * 100) || 0;
            let sKitPct = Math.round((simpleCounts['Kitchen 1000'] / numWords) * 100) || 0;
            let coreSimpleScore = s5yrPct + sEslPct + sKitPct; 
            
            safeSetText('cba-simpleScore', `${coreSimpleScore}%`);
            safeSetWidth('cba-simpleBar5yr', `${s5yrPct}%`);
            safeSetWidth('cba-simpleBarEsl', `${sEslPct}%`);
            safeSetWidth('cba-simpleBarKit', `${sKitPct}%`);
            safeSetText('cba-s5yr', `${s5yrPct}%`);
            safeSetText('cba-sEsl', `${sEslPct}%`);
            safeSetText('cba-sKit', `${sKitPct}%`);
            safeSetText('cba-sOut', `${Math.round((simpleCounts['outside'] / numWords) * 100) || 0}%`);
            safeSetText('cba-simpleInterpret', coreSimpleScore > 85 ? "Extremely Accessible" : coreSimpleScore > 70 ? "Good Accessibility" : "Highly advanced vocabulary");

            let elapsedSecs = window.THPS.Audio.recordedAudio ? (window.THPS.Audio.lastRecordedDuration || 0) : 0;
            let transcribedDuration = Math.min(240, elapsedSecs);
            
            let mumbleScore = 0; 
            let estimatedPauseTime = 0; 
            let pausePercent = 0; 
            let avgWpm = 0;
            let activeSpeakingSecs = 0;

            const mmCard = document.getElementById('cba-mumbleCard');
            const wCard = document.getElementById('cba-wpmCard');

            if (window.THPS.Audio.recordedAudio && elapsedSecs > 0) {
                if (mmCard) mmCard.classList.remove('opacity-50');
                if (wCard) wCard.classList.remove('opacity-50');

                const periods = (text.match(/[.!?]/g) || []).length;
                const commas = (text.match(/[,;:-]/g) || []).length;
                
                estimatedPauseTime = (periods * 1.3) + (commas * 0.5); 
                
                let minAllowedPause = transcribedDuration * 0.10;
                let maxAllowedPause = transcribedDuration * 0.40;
                if (estimatedPauseTime < minAllowedPause) estimatedPauseTime = minAllowedPause;
                if (estimatedPauseTime > maxAllowedPause) estimatedPauseTime = maxAllowedPause;
                
                activeSpeakingSecs = transcribedDuration - estimatedPauseTime;
                pausePercent = (estimatedPauseTime / transcribedDuration) * 100;
                
                avgWpm = Math.round((numWords / transcribedDuration) * 60);
                mumbleScore = totalSyllables / activeSpeakingSecs;

                let mColor, mText;
                if (mumbleScore < 2.5) { mColor = "#3b82f6"; mText = "Slightly too slow"; } 
                else if (mumbleScore < 4.0) { mColor = "#10b981"; mText = "Very clear, no mumble"; } 
                else if (mumbleScore <= 5.5) { mColor = "#f97316"; mText = "Slight mumble"; } 
                else { mColor = "#ef4444"; mText = "High Mumbling Risk"; } 

                safeSetText('cba-mumbleScore', mumbleScore.toFixed(1));
                safeSetText('cba-mumbleInterpret', mText);
                safeSetColor('cba-mumbleInterpret', mColor);
                safeSetColor('cba-mumbleScore', mColor);
                if (mmCard) mmCard.style.borderLeftColor = mColor;
                
                const marker = document.getElementById('cba-mumbleMarker');
                if (marker) marker.style.left = Math.min(100, Math.max(0, (mumbleScore / 8) * 100)) + "%";
                safeSetText('cba-mumbleStats', `${activeSpeakingSecs.toFixed(1)}s active / ${estimatedPauseTime.toFixed(1)}s pause / ${transcribedDuration.toFixed(1)}s analyzed`);

                safeSetText('cba-wpmScore', avgWpm);
                const wpmScoreEl = document.getElementById('cba-wpmScore');
                if (wpmScoreEl) wpmScoreEl.className = 'text-3xl sm:text-4xl font-bold text-amber-500';

                let wpmDataArray = [];
                let numIntervals = Math.ceil(transcribedDuration / 20);
                for (let i = 0; i < numIntervals; i++) {
                    let intervalDuration = (i === numIntervals - 1) ? (transcribedDuration % 20 || 20) : 20;
                    let share = intervalDuration / transcribedDuration;
                    let baseWords = numWords * share;
                    let variation = 1 + (Math.sin(i * 1.5) * 0.12); 
                    let intervalWords = Math.round(baseWords * variation);
                    let intervalWpm = Math.round((intervalWords / intervalDuration) * 60);
                    wpmDataArray.push(intervalWpm);
                }

                if (wpmChartInstance) wpmChartInstance.destroy();
                const chartCanvas = document.getElementById('cba-wpmChart');
                if (chartCanvas && typeof window.Chart !== 'undefined') {
                    wpmChartInstance = new window.Chart(chartCanvas, {
                        type: 'bar',
                        data: { 
                            labels: wpmDataArray.map((_, i) => `${(i+1)*20}s`), 
                            datasets: [{ 
                                label: 'WPM', 
                                data: wpmDataArray, 
                                backgroundColor: 'rgba(245, 158, 11, 0.5)', 
                                borderColor: 'rgba(245, 158, 11, 1)', 
                                borderWidth: 1, 
                                borderRadius: 4 
                            }] 
                        },
                        options: { responsive: true, scales: { y: { beginAtZero: true, suggestedMax: 180 } }, plugins: { legend: { display: false } } }
                    });
                }

            } else {
                if (mmCard) mmCard.classList.add('opacity-50');
                if (wCard) wCard.classList.add('opacity-50');
                safeSetText('cba-mumbleInterpret', "Waiting for Audio...");
                const wpmScoreEl = document.getElementById('cba-wpmScore');
                if (wpmScoreEl) wpmScoreEl.className = 'text-3xl sm:text-4xl font-bold text-slate-400';
            }

            let avgGrade = 0;
            let readability = null;
            if (typeof window.THPS.NLP.calculateReadabilityMetrics === 'function') {
                 readability = window.THPS.NLP.calculateReadabilityMetrics(numWords, numSentences, totalSyllables, letterCount, complexWordCount);
                 avgGrade = readability.avgGrade;
            } else {
                let flesch = (0.39 * (numWords / numSentences)) + (11.8 * (totalSyllables / numWords)) - 15.59;
                let fog = 0.4 * ((numWords / numSentences) + 100 * (complexWordCount / numWords));
                let smog = 1.0430 * Math.sqrt(complexWordCount * (30 / numSentences)) + 3.1291;
                let coleman = 0.0588 * ((letterCount / numWords) * 100) - 0.296 * ((numSentences / numWords) * 100) - 15.8;
                avgGrade = ((Math.max(0, flesch)) + (Math.max(0, fog)) + (Math.max(0, smog)) + (Math.max(0, coleman))) / 4;
                readability = { flesch: Math.max(0, flesch), fog: Math.max(0, fog), smog: Math.max(0, smog), coleman: Math.max(0, coleman) };
            }

            safeSetText('cba-avgScore', avgGrade.toFixed(1));
            safeSetText('cba-fleschScore', readability.flesch.toFixed(1));
            safeSetText('cba-fogScore', readability.fog.toFixed(1));
            safeSetText('cba-smogScore', readability.smog.toFixed(1));
            safeSetText('cba-colemanScore', readability.coleman.toFixed(1));

            safeSetText('cba-gradeLevel', avgGrade.toFixed(1));
            let gradeColor = avgGrade <= 4.4 ? "#f97316" : avgGrade <= 8.4 ? "#10b981" : avgGrade <= 9.5 ? "#00B700" : avgGrade <= 12.5 ? "#f59e0b" : "#ef4444";
            safeSetText('cba-gradeInterpret', avgGrade <= 4.4 ? "Pitched to 5-10 yr old" : avgGrade <= 8.4 ? "Short & Simple" : avgGrade <= 9.5 ? "Perfect Plain English" : avgGrade <= 12.5 ? "Audience Strain" : "Too Complex");
            safeSetColor('cba-gradeInterpret', gradeColor);
            safeSetBorder('cba-simpleComplexCard', gradeColor);
            safeSetBg('cba-gradeProgress', gradeColor);
            safeSetWidth('cba-gradeProgress', `${Math.min(100, Math.max(0, (avgGrade / 18) * 100))}%`);

            let personalPercent = Math.round((personalCount / numWords) * 100);
            safeSetText('cba-personalScore', `${personalPercent}%`);
            let pColor = personalPercent <= 29 ? "#94a3b8" : personalPercent <= 44 ? "#10b981" : personalPercent <= 60 ? "#00B700" : "#a855f7";
            safeSetText('cba-personalInterpret', personalPercent <= 29 ? "Highly Detached" : personalPercent <= 44 ? "Good Balance" : personalPercent <= 60 ? "Highly Personal" : "Overly Conversational?");
            safeSetBorder('cba-personalCard', pColor);
            safeSetBg('cba-personalProgress', pColor);
            safeSetColor('cba-personalScore', pColor);
            safeSetWidth('cba-personalProgress', `${Math.min(100, Math.max(0, personalPercent))}%`);

            let visualPercent = Math.round((visualCount / numWords) * 100);
            safeSetText('cba-visualScore', `${visualPercent}%`);
            let vColor = visualPercent <= 29 ? "#94a3b8" : visualPercent <= 44 ? "#10b981" : visualPercent <= 60 ? "#00B700" : "#a855f7";
            safeSetText('cba-visualInterpret', visualPercent <= 29 ? "Very Intangible" : visualPercent <= 44 ? "Good" : visualPercent <= 60 ? "Very Vivid" : "Reaching poetic levels");
            safeSetBorder('cba-visualCard', vColor);
            safeSetBg('cba-visualProgress', vColor);
            safeSetColor('cba-visualScore', vColor);
            safeSetWidth('cba-visualProgress', `${Math.min(100, Math.max(0, visualPercent))}%`);

            let avgWpsFloat = numSentences > 0 ? (numWords / numSentences) : 0;
            const avgWps = Math.round(avgWpsFloat);
            safeSetText('cba-snScore', avgWpsFloat.toFixed(1));
            let snColor = avgWps <= 9 ? "#00B700" : avgWps <= 16 ? "#6366f1" : avgWps <= 25 ? "#f59e0b" : "#ef4444";
            safeSetText('cba-snInterpret', avgWps <= 9 ? "Very high signal, low noise" : avgWps <= 16 ? "High signal; moderate noise" : avgWps <= 25 ? "Moderate signal; high noise" : "Low signal; very high noise");
            safeSetColor('cba-snInterpret', snColor);
            safeSetBorder('cba-snCard', snColor);
            safeSetColor('cba-snScore', snColor);
            safeSetBg('cba-snProgress', snColor);
            safeSetWidth('cba-snProgress', `${Math.min(100, Math.max(0, (avgWps / 40) * 100))}%`);

            try {
                let totalPoints = 0;
                let overrideGrade = false;

                const setEval = (id, text, colorClass) => {
                    const el = document.getElementById(id);
                    if(el) { 
                        el.textContent = text; 
                        el.className = `text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${colorClass} ml-1 pointer-events-none`; 
                    }
                };

                if (window.THPS.Audio.recordedAudio && elapsedSecs > 0) {
                    let m = Math.floor(elapsedSecs / 60);
                    let s = Math.floor(elapsedSecs % 60).toString().padStart(2, '0');
                    document.getElementById('sum-time').textContent = `${m}:${s}`;
                    totalPoints += 1.0;
                } else {
                    document.getElementById('sum-time').textContent = "Text Only";
                    overrideGrade = true;
                }

                document.getElementById('sum-personal').textContent = `${personalPercent}%`;
                let pStatus = 'just right'; let pColorClass = 'bg-green-100 text-green-700';
                if (personalPercent < 30) { pStatus = 'not enough'; pColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else if (personalPercent > 60) { pStatus = 'too much'; pColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else { totalPoints += 1; }
                setEval('sum-personal-eval', pStatus, pColorClass);

                document.getElementById('sum-visual').textContent = `${visualPercent}%`;
                let vStatus = 'just right'; let vColorClass = 'bg-green-100 text-green-700';
                if (visualPercent < 20) { vStatus = 'not enough'; vColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else if (visualPercent > 50) { vStatus = 'too much'; vColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else { totalPoints += 1; }
                setEval('sum-visual-eval', vStatus, vColorClass);

                let intangiblePercent = Math.max(0, 100 - personalPercent - visualPercent);
                document.getElementById('sum-intangible').textContent = `${intangiblePercent}%`;
                let iStatus = 'just right'; let iColorClass = 'bg-green-100 text-green-700';
                if (intangiblePercent > 45) { iStatus = 'too much'; iColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else if (intangiblePercent >= 30) { iStatus = 'bit much'; iColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else { totalPoints += 1; }
                setEval('sum-intangible-eval', iStatus, iColorClass);

                if (window.THPS.Audio.recordedAudio && elapsedSecs > 0) {
                    document.getElementById('sum-wpm').textContent = avgWpm;
                    let wpmStatus = 'just right'; let wpmColorClass = 'bg-green-100 text-green-700';
                    if (avgWpm < 100) { wpmStatus = 'speed up'; wpmColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                    else if (avgWpm > 150) { wpmStatus = 'strain'; wpmColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                    else { totalPoints += 1; }
                    setEval('sum-wpm-eval', wpmStatus, wpmColorClass);

                    document.getElementById('sum-sps').textContent = mumbleScore.toFixed(1);
                    let spsStatus = 'just right'; let spsColorClass = 'bg-green-100 text-green-700';
                    if (mumbleScore < 3) { spsStatus = 'speed up'; spsColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                    else if (mumbleScore > 5) { spsStatus = 'strain'; spsColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                    else { totalPoints += 1; }
                    setEval('sum-sps-eval', spsStatus, spsColorClass);

                    document.getElementById('sum-pause').textContent = `${pausePercent.toFixed(0)}%`;
                    let pzStatus = 'just right'; let pzColorClass = 'bg-green-100 text-green-700';
                    if (pausePercent < 10) { pzStatus = 'too little'; pzColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                    else if (pausePercent > 30) { pzStatus = 'too much'; pzColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                    else { totalPoints += 1; }
                    setEval('sum-pause-eval', pzStatus, pzColorClass);
                } else {
                    document.getElementById('sum-wpm').textContent = "-";
                    document.getElementById('sum-sps').textContent = "-";
                    document.getElementById('sum-pause').textContent = "-";
                    const fallbackEl = (id) => { const el = document.getElementById(id); if(el) { el.textContent = 'Text Only'; el.className = 'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-500 ml-1 pointer-events-none'; }};
                    fallbackEl('sum-wpm-eval'); fallbackEl('sum-sps-eval'); fallbackEl('sum-pause-eval');
                }

                document.getElementById('sum-wps').textContent = avgWpsFloat.toFixed(1);
                let wpsStatus = 'just right'; let wpsColorClass = 'bg-green-100 text-green-700';
                if (avgWpsFloat < 5) { wpsStatus = 'simple'; wpsColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else if (avgWpsFloat > 15) { wpsStatus = 'complex'; wpsColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else { totalPoints += 1; }
                setEval('sum-wps-eval', wpsStatus, wpsColorClass);

                document.getElementById('sum-grade').textContent = avgGrade.toFixed(1);
                let gradeStatus = 'just right'; let gradeColorClass = 'bg-green-100 text-green-700';
                if (avgGrade < 5) { gradeStatus = 'simple'; gradeColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else if (avgGrade > 10) { gradeStatus = 'complex'; gradeColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else { totalPoints += 1; }
                setEval('sum-grade-eval', gradeStatus, gradeColorClass);

                document.getElementById('sum-simple').textContent = `${coreSimpleScore}%`;
                let simpleStatus = 'just right'; let simpleColorClass = 'bg-green-100 text-green-700';
                if (coreSimpleScore < 85) { simpleStatus = 'complex'; simpleColorClass = 'bg-red-100 text-red-700'; totalPoints += 0.25; }
                else if (coreSimpleScore > 95) { simpleStatus = 'simple'; simpleColorClass = 'bg-amber-100 text-amber-700'; totalPoints += 0.75; }
                else { totalPoints += 1; }
                setEval('sum-simple-eval', simpleStatus, simpleColorClass);
                
                if (overrideGrade) {
                    document.getElementById('cba-overallGrade').textContent = "- / 10";
                } else {
                    let formattedScore = totalPoints % 1 === 0 ? totalPoints : totalPoints.toFixed(2);
                    document.getElementById('cba-overallGrade').textContent = `${formattedScore} / 10`;
                }

                updateCelebrationPanel(totalPoints, elapsedSecs, overrideGrade, window.THPS.Audio.recordedAudio, text.length);

            } catch(e) { console.error("Summary Dashboard Error:", e); }
        };

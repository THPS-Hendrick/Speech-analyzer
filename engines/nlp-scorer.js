// ==========================================
// THPS NLP SCORER ENGINE
// Pure logic. No UI manipulation.
// ==========================================

// Establish the Global Trackman Namespace
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
        // Broadcast a custom message to the browser that the brain is ready!
        window.dispatchEvent(new Event('thps-dicts-loaded'));

    } catch (e) { 
        console.error("Dict Load Error", e); 
    }
};

// -----------------------------------------------------
// SYLLABLE COUNTER
// -----------------------------------------------------
window.THPS.NLP.countSyllables = function(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
};

// -----------------------------------------------------
// ACADEMIC READABILITY CALCULATORS
// -----------------------------------------------------
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

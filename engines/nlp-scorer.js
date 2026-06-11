// ==========================================
// THPS NLP SCORER ENGINE
// Pure logic. No UI manipulation.
// ==========================================

const DICT_URLS = {
    simple: "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/simple.json",
    visual: "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/visualdict.json"
};

let personalPronouns = new Set(["i", "i'd", "i'll", "i'm", "i've", "he", "he'd", "he'll", "he's", "she", "she'd", "she'll", "she's"]);
let visualDictPronouns = new Set();
let visualDictWords = new Set();
let simpleMap = new Map();
let google10kSet = new Set();
let dictsLoaded = false;

async function loadDictionaries() {
    try {
        const fetchDict = async (url) => {
            const res = await fetch(url + "?v=" + Date.now(), { cache: "no-store" });
            return await res.json();
        };

        const [simpleData, visualData] = await Promise.all([
            fetchDict(DICT_URLS.simple), fetchDict(DICT_URLS.visual)
        ]).catch(() => [{}, {}]);

        for (const [tier, words] of Object.entries(simpleData)) {
            let t = tier.toLowerCase();
            let finalTier = 'outside';
            if (t.includes('5yr') || t.includes('5 yr')) finalTier = '5yr Old 1000';
            else if (t.includes('esl')) finalTier = 'ESL 2000';
            else if (t.includes('kitchen') || t.includes('kit')) finalTier = 'Kitchen 1000';
            if (finalTier !== 'outside') words.forEach(w => simpleMap.set(w.toLowerCase(), finalTier));
        }

        const getFuzzyKey = (obj, keyword) => {
            const key = Object.keys(obj).find(k => k.toLowerCase().includes(keyword));
            return key ? obj[key] : null;
        };
        
        let vPronouns = getFuzzyKey(visualData, "pronoun");
        let vWords = getFuzzyKey(visualData, "visual");
        if (vPronouns) visualDictPronouns = new Set(vPronouns.map(w => w.toLowerCase()));
        if (vWords) visualDictWords = new Set(vWords.map(w => w.toLowerCase()));
        
        try {
            const gRes = await fetch('https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-no-swears.txt');
            if(gRes.ok) {
                const gWords = (await gRes.text()).split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
                google10kSet = new Set(gWords);
            }
        } catch(e) { }

        dictsLoaded = true;
        
        // Broadcast a custom message to the browser that the brain is ready!
        window.dispatchEvent(new Event('thps-dicts-loaded'));

    } catch (e) { 
        console.error("Dict Load Error", e); 
    }
}

// -----------------------------------------------------
// SYLLABLE COUNTER
// -----------------------------------------------------
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
}

// -----------------------------------------------------
// ACADEMIC READABILITY CALCULATORS
// -----------------------------------------------------
function calculateReadabilityMetrics(numWords, numSentences, totalSyllables, letterCount, complexWordCount) {
    // Safety check to prevent division by zero
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
}

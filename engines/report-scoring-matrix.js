window.THPS_ReportScoring = {
    
    // 1. Vocal Inhibition Algorithm
    scoreVocalInhibition: function(vocalData) {
        if (!vocalData || !vocalData.recorded) {
            return {
                hasInhibition: false,
                label: "No Inhibition",
                pauseVariety: "low", voiceVariety: "low", runVariety: "low",
                bars: { pause: [0,0,0,0,0], voice: [0,0,0,0,0], run: [0,0,0,0,0] }
            };
        }

        // Extract variety levels or bucket distributions
        const pauseBars = vocalData.pauseBuckets ? Object.values(vocalData.pauseBuckets) : [10, 20, 30, 20, 10];
        const voiceBars = vocalData.volumeBuckets ? Object.values(vocalData.volumeBuckets) : [15, 25, 20, 25, 15];
        const runBars = vocalData.runBuckets ? Object.values(vocalData.runBuckets) : [5, 15, 60, 15, 5];

        // PLACEHOLDER THRESHOLD FORMULAS
        const pauseVariety = pauseBars[2] > 50 ? "low" : "high";
        const voiceVariety = voiceBars[2] > 50 ? "low" : "high";
        const runVariety = runBars[2] > 50 ? "low" : "high";

        const hasInhibition = (pauseVariety === "low" || voiceVariety === "low");
        let label = "No Inhibition";
        if (pauseVariety === "low" && voiceVariety === "low") label = "High Inhibition";
        else if (pauseVariety === "low") label = "Pause Inhibition";
        else if (voiceVariety === "low") label = "Volume Inhibition";

        return {
            hasInhibition: hasInhibition,
            label: label,
            pauseVariety: pauseVariety,
            voiceVariety: voiceVariety,
            runVariety: runVariety,
            bars: { pause: pauseBars, voice: voiceBars, run: runBars }
        };
    },

    // 2. Image / Imagination Inhibition Algorithm
scoreVocalInhibition: function(vocalData) {
        if (!vocalData || !vocalData.recorded) {
            return {
                hasInhibition: false, label: "No Inhibition",
                pauseVariety: "low", voiceVariety: "low", runVariety: "low",
                bars: { pause: [0,0,0,0,0], voice: [0,0,0,0,0], run: [0,0,0,0,0] }
            };
        }

        // 1. Safely extract raw buckets (fallback to zeroes if missing)
        const pBuckets = vocalData.pauseBuckets || [0, 0, 0, 0, 0];
        const vBuckets = vocalData.volumeBuckets || [0, 0, 0, 0, 0];
        const rBuckets = vocalData.runBuckets || [0, 0, 0, 0, 0];

        // 2. Pause Evaluation: Needs >= 2 in indices 2, 3, and 4 (Medium, Long, Very Long)
        const pausePass = pBuckets[2] >= 2 && pBuckets[3] >= 2 && pBuckets[4] >= 2;
        const pauseVariety = pausePass ? "high" : "low";

        // 3. Volume Evaluation: Calculate percentages, fail if >= 2 buckets are < 10%
        const totalWords = Math.max(1, vBuckets.reduce((sum, count) => sum + count, 0));
        const vPercentages = vBuckets.map(count => (count / totalWords) * 100);
        const voiceFailCount = vPercentages.filter(pct => pct < 10).length;
        const voicePass = voiceFailCount < 2;
        const voiceVariety = voicePass ? "high" : "low";

        // 4. Run Evaluation: Fail if >= 2 buckets have < 2 runs
        const runFailCount = rBuckets.filter(count => count < 2).length;
        const runPass = runFailCount < 2;
        const runVariety = runPass ? "high" : "low";

        // 5. Overarching Diagnosis Routing
        let fails = 0;
        if (!pausePass) fails++;
        if (!voicePass) fails++;
        if (!runPass) fails++;

        let label = "No Inhibition";
        if (fails >= 2) {
            label = "High Inhibition";
        } else if (fails === 1) {
            if (!pausePass) label = "Pause Inhibition";
            if (!voicePass) label = "Volume Inhibition";
            if (!runPass) label = "Run Inhibition";
        }

        // 6. Chart Normalization (Scale highest value to 100% for CSS rendering)
        const normalize = (arr) => {
            const max = Math.max(...arr, 1); // Avoid division by zero
            return arr.map(val => (val / max) * 100);
        };

        return {
            hasInhibition: fails > 0,
            label: label,
            pauseVariety: pauseVariety,
            voiceVariety: voiceVariety,
            runVariety: runVariety,
            bars: { 
                pause: normalize(pBuckets), 
                voice: normalize(vBuckets), 
                run: normalize(rBuckets) 
            }
        };
    },

        // House Test Thresholds: Time ~60s, WPM < 100, Visual > 50%
        const hTimePass = h.recorded;
        const hPacePass = h.wpm > 0 && h.wpm < 100;
        const hVisPass = h.visual >= 50;
        const hScore = (hTimePass ? 1 : 0) + (hPacePass ? 1 : 0) + (hVisPass ? 1 : 0);

        // Imagination Test Thresholds: Time ~60s, WPM > 170, Visual > 50%
        const iTimePass = i.recorded;
        const iPacePass = i.wpm > 170;
        const iVisPass = i.visual >= 50;
        const iScore = (iTimePass ? 1 : 0) + (iPacePass ? 1 : 0) + (iVisPass ? 1 : 0);

        // Determine Top Label
        let label = "Not Inhibited";
        if (hScore < 2 && iScore < 2) label = "Very Inhibited";
        else if (hScore < 2) label = "Image Inhibited";
        else if (iScore < 2) label = "Imagination Inhibited";

        return {
            label: label,
            house: { time: 60, timePass: hTimePass, pace: h.wpm, pacePass: hPacePass, vis: h.visual, visPass: hVisPass, score: hScore },
            imagination: { time: 60, timePass: iTimePass, pace: i.wpm, pacePass: iPacePass, vis: i.visual, visPass: iVisPass, score: iScore }
        };
    },

    // 3. Category / Rules Inhibition Algorithm
    scoreCategoryInhibition: function(repeatData) {
        if (!repeatData || repeatData.length === 0) return { label: "Not Inhibited" };

        let totalCorrect = 0;
        repeatData.forEach(r => totalCorrect += r.correct);

        let label = "Not Inhibited";
        if (totalCorrect < 15) label = "Very Inhibited";
        else if (totalCorrect < 22) label = "Category Inhibited";

        return { label: label };
    },

    // 4. Strengths & Gaps Sorter
    sortStrengthsAndGaps: function(diagData, jsonExplanations) {
        if (!jsonExplanations) return { strengths: [], gaps: [] };

        // Test scores evaluation (Placeholder benchmarks)
        const tests = [
            { id: "sams", score: diagData.nervesScore <= 20 ? 80 : 40, name: "Nerve Control" },
            { id: "phantasia", score: 70, name: "Mind's Eye" },
            { id: "vocal", score: diagData.vocalInhibition?.recorded ? 85 : 30, name: "Vocal Release" },
            { id: "visual", score: (diagData.visualAssociation?.A?.visual || 0) >= 50 ? 90 : 40, name: "Visual Flow" },
            { id: "repeat", score: 75, name: "Repeat Engine" }
        ];

        // Sort best to worst
        tests.sort((a, b) => b.score - a.score);

        const strengths = [];
        const gaps = [];

        tests.forEach(t => {
            if (t.score >= 70) {
                strengths.push({ name: t.name, text: jsonExplanations[t.id]?.strength || "Demonstrates strong operational performance." });
            } else {
                gaps.push({ name: t.name, text: jsonExplanations[t.id]?.gap || "Requires focused practice to balance performance." });
            }
        });

        return { strengths, gaps };
    },

    // 5. Total Score Algorithm
    calculateTotalScore: function(diagData) {
        // Example math calculation out of 90
        const total = 65; 
        let grade = "Average";
        if (total > 75) grade = "High";
        else if (total < 45) grade = "Low";

        return { score: total, grade: grade };
    }
};

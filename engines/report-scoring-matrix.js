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
    scoreVisualInhibition: function(visualData) {
        const h = visualData?.A || { wpm: 0, visual: 0, recorded: false };
        const i = visualData?.B || { wpm: 0, visual: 0, recorded: false };

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

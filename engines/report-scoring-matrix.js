window.THPS_ReportScoring = {
    
    // 1. Vocal Inhibition Algorithm
    scoreVocalInhibition: function(vocalData) {
        if (!vocalData || !vocalData.recorded) {
            return {
                hasInhibition: false, label: "No Inhibition",
                pauseVariety: "low", voiceVariety: "low", runVariety: "low",
                bars: { pause: [0,0,0,0,0], voice: [0,0,0,0,0], run: [0,0,0,0,0] }
            };
        }

        const pBuckets = vocalData.pauseBuckets || [0, 0, 0, 0, 0];
        const vBuckets = vocalData.volumeBuckets || [0, 0, 0, 0, 0];
        const rBuckets = vocalData.runBuckets || [0, 0, 0, 0, 0];

        const pausePass = pBuckets[2] >= 2 && pBuckets[3] >= 2 && pBuckets[4] >= 2;
        const pauseVariety = pausePass ? "high" : "low";

        const totalWords = Math.max(1, vBuckets.reduce((sum, count) => sum + count, 0));
        const vPercentages = vBuckets.map(count => (count / totalWords) * 100);
        const voiceFailCount = vPercentages.filter(pct => pct < 10).length;
        const voicePass = voiceFailCount < 2;
        const voiceVariety = voicePass ? "high" : "low";

        const runFailCount = rBuckets.filter(count => count < 2).length;
        const runPass = runFailCount < 2;
        const runVariety = runPass ? "high" : "low";

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

        const normalize = (arr) => {
            const max = Math.max(...arr, 1);
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

    // 2. Image / Imagination Inhibition Algorithm
    scoreVisualInhibition: function(visualData) {
        const h = visualData?.A || { wpm: 0, visual: 0, time: 0, recorded: false };
        const i = visualData?.B || { wpm: 0, visual: 0, time: 0, recorded: false };

        // House Test Thresholds
        const hTimePass = h.time > 59; 
        const hPacePass = h.wpm > 0 && h.wpm < 100;
        const hVisPass = h.visual > 50;
        const hScore = (hTimePass ? 1 : 0) + (hPacePass ? 1 : 0) + (hVisPass ? 1 : 0);

        // Imagination Test Thresholds
        const iTimePass = i.time > 59;
        const iPacePass = i.wpm > 170;
        const iVisPass = i.visual > 50;
        const iScore = (iTimePass ? 1 : 0) + (iPacePass ? 1 : 0) + (iVisPass ? 1 : 0);

        let label = "Not Inhibited";
        if (hScore < 3 && iScore < 3) label = "Very Inhibited";
        else if (hScore < 3) label = "Image Inhibited";
        else if (iScore < 3) label = "Imagination Inhibited";

        return {
            label: label,
            house: { time: h.time || 0, timePass: hTimePass, pace: h.wpm, pacePass: hPacePass, vis: h.visual, visPass: hVisPass, score: hScore },
            imagination: { time: i.time || 0, timePass: iTimePass, pace: i.wpm, pacePass: iPacePass, vis: i.visual, visPass: iVisPass, score: iScore }
        };
    },

    // 3. Category / Rules Inhibition Algorithm
    scoreCategoryInhibition: function(repeatData) {
        if (!repeatData || repeatData.length === 0) return { total: 0, label: "Not Inhibited", grade: "Average" };

        let total = 0;
        repeatData.forEach(r => {
            total += r.correct + r.noDelay + r.voice;
        });

        let label = "Very Inhibited";
        let grade = "Very Low";
        
        if (total > 85) {
            label = "Not Inhibited";
            grade = "Very High";
        } else if (total >= 80) {
            label = "Category Inhibited";
            grade = "High";
        } else if (total >= 70) {
            label = "Rules Inhibited";
            grade = "Average";
        } else {
            label = "Very Inhibited";
            grade = "Low";
        }

        return { total, label, grade };
    },

    // 4. Strengths & Gaps Sorter (Now out of 4)
    sortStrengthsAndGaps: function(diagData, jsonExplanations) {
        if (!jsonExplanations) return { strengths: [], gaps: [] };

        const strengths = [];
        const gaps = [];

        // 1. Nerve Control (<= 16 is a Strength)
        const nervesScore = diagData.nervesScore || 0;
        const nervesPass = nervesScore > 0 && nervesScore <= 16;
        const nervesText = jsonExplanations.sams ? (nervesPass ? jsonExplanations.sams.strength : jsonExplanations.sams.gap) : "Data missing.";
        (nervesPass ? strengths : gaps).push({ name: "Nerve Control", text: nervesText });

        // 2. Vocal Release (No Inhibition = Strength)
        const vocalRes = this.scoreVocalInhibition(diagData.vocalInhibition);
        const vocalPass = !vocalRes.hasInhibition && diagData.vocalInhibition?.recorded;
        const vocalText = jsonExplanations.vocal ? (vocalPass ? jsonExplanations.vocal.strength : jsonExplanations.vocal.gap) : "Data missing.";
        (vocalPass ? strengths : gaps).push({ name: "Vocal Release", text: vocalText });

        // 3. Visual Flow (Perfect 6 is a Strength)
        const visRes = this.scoreVisualInhibition(diagData.visualAssociation);
        const visPass = (visRes.house.score === 3 && visRes.imagination.score === 3);
        const visText = jsonExplanations.visual ? (visPass ? jsonExplanations.visual.strength : jsonExplanations.visual.gap) : "Data missing.";
        (visPass ? strengths : gaps).push({ name: "Visual Flow", text: visText });

        // 4. Repeat Engine / Category (>= 85 is a Strength)
        const catRes = this.scoreCategoryInhibition(diagData.repeatCount);
        const catPass = catRes.total >= 85;
        const catText = jsonExplanations.repeat ? (catPass ? jsonExplanations.repeat.strength : jsonExplanations.repeat.gap) : "Data missing.";
        (catPass ? strengths : gaps).push({ name: "Repeat Engine", text: catText });

        return { strengths, gaps };
    }
};

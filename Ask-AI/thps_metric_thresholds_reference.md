# THPS Master Metrics & Thresholds Reference

This document serves as the architectural blueprint for the THPS analyzer grading engine and timeline variety metrics.

## 1. Core Score Summary Metrics
These metrics dictate the 0-10 point scores on the dashboard. 
*Note: Scores scale via multi-tiered linear interpolation. Falling into a Yellow zone drops the score to a floor of `4.0`, and falling into the Red drops the score toward `0.0`.*

| Metric | Green (10 pts) | Yellow (4.0 - 10 pts) | Red (0.0 - 4.0 pts) |
| :--- | :--- | :--- | :--- |
| **Personal %** | 30% to 60% | 20% - 30% / 60% - 70% | < 20% / > 70% |
| **Visual %** | 20% to 50% | 10% - 20% / 50% - 60% | < 10% / > 60% |
| **Intangible %** | 10% to 30% | 5% - 10% / 30% - 35% | < 5% / > 35% |
| **Words / Min** | 100 to 155 | 90 - 100 / 155 - 165 | < 90 / > 165 |
| **Syllables / Sec** | 3.5 to 4.5 | 3.0 - 3.5 / 4.5 - 5.0 | < 3.0 / > 5.0 |
| **Pause %** | 15% to 35% | 10% - 15% / 35% - 40% | < 10% / > 40% |
| **Runtime (s)** | 3.0s to 7.0s | 2.0s - 3.0s / 7.0s - 9.0s | < 2.0s / > 9.0s |
| **Read-Level (Grade)** | 6.0 to 11.0 | 4.5 - 6.0 / 11.0 - 12.5 | < 4.5 / > 12.5 |
| **Simple %** | 80% to 90% | 75% - 80% / 90% - 95% | < 75% / > 95% |
| **Clarity %** | > 90% | 80% - 90% | < 80% |

---

## 2. Voice Timeline Variety Metrics
These metrics calculate the "spread" of a speaker's delivery to ensure they aren't speaking in a monotone, rhythmic, or robotic fashion.

### The Non-Dominance Formula
Variety is calculated by identifying the single most used category (the "dominant" bucket), removing it, and evaluating what percentage of the total speech fell into all other "non-dominant" buckets.
*   **Math:** `((Total Occurrences - Max Bucket Occurrences) / Total Occurrences) * 100`

### Variety Score Thresholds
*   **Low Variety (Score -1):** `< 50%` (Speaker heavily favored one bucket)
*   **Med Variety (Score 0):** `50% to 60%`
*   **High Variety (Score +1):** `> 60%` (Speaker successfully utilized multiple acoustic ranges)

### Acoustic Category Boundaries
These dictate the raw buckets that feed the Non-Dominance Formula.

**1. Pause Variation** *(Measured in flat seconds. Excludes < 0.35s micro-pauses)*
*   **Short (Red):** `0.35s to 0.70s`
*   **Medium (Orange):** `0.70s to 1.20s`
*   **Long (Green):** `1.20s to 1.70s`
*   **Very Long (Blue):** `1.70s to 2.20s`
*   **Extreme (Purple):** `> 2.20s`

**2. Volume Variation** *(Measured in relative 8dB jumps from the speaker's average baseline)*
*   **Very Quiet (Purple):** `< Baseline - 11dB`
*   **Quiet (Blue):** `Baseline - 11dB` to `Baseline - 3dB`
*   **Normal (Green):** `Baseline - 3dB` to `Baseline + 3dB`
*   **Loud (Orange):** `Baseline + 3dB` to `Baseline + 11dB`
*   **Very Loud (Red):** `> Baseline + 11dB`

**3. Pace Variation** *(Measured in syllables per second (sps) in 0.7 steps from a 4.0 center)*
*   **Very Slow (Purple):** `< 3.1 sps`
*   **Slow (Blue):** `3.1 sps to 3.8 sps`
*   **Normal (Green):** `3.8 sps to 4.2 sps`
*   **Fast (Orange):** `4.2 sps to 4.9 sps`
*   **Very Fast (Red):** `> 4.9 sps`

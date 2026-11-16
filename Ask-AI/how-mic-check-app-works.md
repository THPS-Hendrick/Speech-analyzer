When a speaker hits record in `analyzer-app.html`, their voice travels through a four-stage client-and-cloud pipeline before landing as interactive metrics and visualizations in `<thps-main-dash>` and `<thps-voice-timeline>`.

## 1. Raw Acoustic Capture in the Browser

Clicking the center microphone button inside `<thps-timer-med>` triggers the global `window.toggleRecording()` controller, which clears any previous session state via `window.clearAnalyzer()`, starts a 240-second safety timer, and initializes the Web Audio API pipeline:

* **Unprocessed Microphone Stream:** `window.THPS.Audio.startRecordingProcess()` requests mono audio via `navigator.mediaDevices.getUserMedia` with `autoGainControl`, `noiseSuppression`, and `echoCancellation` explicitly disabled so the browser does not flatten natural vocal volume dynamics.
* **Dual-Path `16kHz` Audio Graph:** An `AudioContext` running at `16,000 Hz` routes the live microphone source into two parallel nodes:
* **PCM Sample Collector (`ScriptProcessorNode`, 4096 buffer):** Appends raw `Float32Array` audio chunks into `audioBuffers` for up to 4 minutes.
* **Decibel Sampler (`AnalyserNode`, `fftSize: 2048`):** A `100ms` interval calculates Root Mean Square (RMS) energy, converts it to decibels via $20 \log_{10}(\max(\text{rms}, 0.0001))$, and logs `{ time, rms, db }` points into `window.THPS.Audio.volumeData`.


* **Live Visual Feedback:** While recording, `<thps-timer-med>` runs a `requestAnimationFrame` loop that advances an 80-second circular SVG progress ring and illuminates milestone stars at `20s` (25%) and `60s` (75%).



## 2. 30-Second WAV Slicing & Parallel Cloud Transcription

Tapping stop (or reaching the 240-second cap) fires `window.THPS.Audio.stopRecordingProcess()`, which displays the `#cba-processing-panel` overlay and prepares the audio for transcription:

* **Contiguous Merge & Chunking:** All captured `Float32Array` buffers are stitched into a single array and sliced into 30-second segments (`480,000` samples each at `16kHz`), with each segment wrapped in a 44-byte, 16-bit PCM WAV header (`encodeWAV`).
* **Parallel Vercel & Google STT Execution:** Every WAV blob is Base64-encoded and dispatched concurrently via `Promise.all` to `[https://mic-check-backend.vercel.app/api/transcribe](https://mic-check-backend.vercel.app/api/transcribe)`, a Node `24.x` serverless endpoint powered by `@google-cloud/speech`.
* **Chronological Re-Stitching:** As responses return, they are sorted by chunk `index`. Transcripts are joined with spaces, and every word object has `index * 30` seconds added to its `start` and `end` timestamps while preserving Google's word-level `confidence` score inside `window.THPS.Audio.wordTimestamps`.
* **Analysis Trigger:** The stitched transcript is written into the hidden `#cba-inputText` field and `window.analyze()` is called.



## 3. Linguistic & Psychoacoustic Telemetry (`nlp-scorer.js`)

`window.analyze()` passes the transcript, `wordTimestamps`, `volumeData`, and `elapsedSecs` into `window.THPS.NLP.analyzeSpeech()`, which runs three analytical engines in sequence:

* **Grammar & Dictionary Tagging (`analyzeTranscript`):**
* Parses the text with `compromise.js` (computing word roots, with a regex fallback) against `simple.json`, `visualdict.json`, and the Google 10k word list.
* Applies directional countdown windows—tagging the next **6 words** after personal pronouns/quotes as **Personal** (blue) and the next **4 words** after visual pronouns/words as **Visual** (red), or **Overlap** (purple) when both overlap—while underlining words matched in `simple.json`.
* Calculates total syllables, `Simple %`, and an averaged grade level (`Read-Level`) across Flesch-Kincaid, Gunning Fog, SMOG, and Coleman-Liau formulas.


* **The Acoustic Elastic Grid (Pace, Mumble & Pauses):**
* Establishes a baseline syllable unit of `0.35s` and compares the `gap` between consecutive word start times against expected syllable duration.
* When a gap expands beyond `0.35s` per unit, the engine isolates articulation speed (**Syllables/sec** "Mumble Meter" over active speaking time) from true silence (`pauseUnitValue >= 0.35s`), sorting pauses into `micro`, `short` (`0.35–0.70s`), `medium` (`0.70–1.20s`), `long` (`1.20–1.70s`), `vLong` (`1.70–2.20s`), and `extreme` (`>2.20s`) buckets.
* Any pause `>= 0.70s` splits speech into continuous **Runtime** blocks (`runPaces`), computing each run's duration, `WPM`, and `SPS`.


* **Psychoacoustic Volume Engine:**
* Aligns the `100ms` dB samples to each word's active time span using linear energy averaging ($10 \log_{10}(\text{linearSum} / \text{dbCount})$), filtering out pause silence so room noise does not skew volume stats.
* Computes the speaker's personal average spoken decibel level (`avgSpokenDb`) and sets five relative volume buckets (`-11dB`, `-3dB`, `+3dB`, and `+11dB` around their baseline).





## 4. Grading, Broadcast & Widget Rendering

Back in `analyzer-app.html`, `window.analyze()` scores 10 core metrics (`Personal`, `Visual`, `Intangible`, `WPM`, `SPS`, `Pause %`, `Runtime`, `Read-Level`, `Simple %`, and `Clarity %`) through `window.getMetricPoints()`. Metrics inside the Green target zone earn `10.0` points, while Yellow (`4.0–10.0`) and Red (`0.0–4.0`) zones are linearly interpolated to produce a `totalPoints` grade out of `100`. The full payload is cached in `window.thps_lastPayload`, prepended to `window.thps_sessionHistory`, and broadcast globally via `thps-dashboard-update` (alongside a background `/api/analyze_words` fetch for Zipf familiarity scores).

### Inside `<thps-main-dash>` (The Trackman Console)

* **Summary Tab:** Displays `Clarity %`, `Overall Grade / 100`, and the 9 core metrics grouped under **Content**, **Delivery**, and **Simplicity**, each paired with a color-coded point badge (`+10`, `+7.4`, etc.). Clicking any metric row loads its definition into the bottom explainer bar and fires `thps-metric-select` to sync progress views.
* **Progress Tab:** Renders a Chart.js line chart across chronological attempts with a custom `zoneBackground` plugin shading the Red, Yellow, and Green target zones behind the data line.
* **MoE (Margin of Error) Tab:** Draws 9 horizontal dispersion tracks centered on each metric's Green zone, plotting every session attempt as a collision-dodging dot so the speaker can see shot-pattern consistency at a glance.
* **History Tab:** Mirrors `window.thps_sessionHistory` so users can reload past attempts or export PDFs.



### Inside `<thps-voice-timeline>` (The Acoustic Strip & Variety Analyzer)

* **Variety Badges:** Calculates distribution spread ($\frac{\text{total} - \max}{\text{total}} \times 100$) across pause, volume, and run buckets to grade **Pause Var.**, **Vol Var.**, **Pace Var.**, and an **Overall Variety** badge (`Low`, `Med`, or `High`, with `<50%` flagged Low and `>60%` flagged High).
* **Synchronized 3-Layer Timeline (`50px/sec`):**
* **Time Axis:** Renders second ticks with major labels every `5s`.
* **Volume Canvas:** A `2x` Retina-scaled `<canvas>` paints glowing vertical bars (`validChunks`) colored and height-scaled by relative dB tier.
* **Speech Staff:** A 5-line musical-style staff layers background **Pace Run** bars, staggered word badges (`row = index % 5`) colored by syllable-rate pace, and "invisible word" **Pause Blocks** positioned centrally on the staff.


* **Heat Maps & Telemetry Inspector:** Three distribution bar charts (Pause, Volume, Pace) sit beneath the timeline, and clicking any word badge, pause block, or run bar populates the dark `#timeline-telemetry-content` console with its exact `00:mm:ss.ms` start timecode, average dB, millisecond duration/delta, clarity score, WPM, or SPS.

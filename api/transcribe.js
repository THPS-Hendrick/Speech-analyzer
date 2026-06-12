// A stable, error-resilient CommonJS serverless function for Vercel.
// Connects safely to Google Cloud Speech-to-Text using ENCODING_UNSPECIFIED to auto-detect all container formats.

const speech = require('@google-cloud/speech');

module.exports = async function handler(req, res) {
    // 1. Set CORS headers immediately to prevent browser handshake blocks
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Respond instantly to pre-flight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!process.env.GOOGLE_CREDENTIALS) {
            return res.status(500).json({ error: 'Server configuration error: GOOGLE_CREDENTIALS is empty.' });
        }

        let credentials;
        let rawCreds = process.env.GOOGLE_CREDENTIALS.trim();
        
        if (rawCreds.startsWith('"') && rawCreds.endsWith('"')) {
            rawCreds = rawCreds.substring(1, rawCreds.length - 1);
        }

        try {
            credentials = JSON.parse(rawCreds);
        } catch (parseError) {
            try {
                const sanitized = rawCreds.replace(/\r?\n/g, '').trim();
                credentials = JSON.parse(sanitized);
            } catch (secondParseError) {
                return res.status(500).json({ error: 'Server configuration error: GOOGLE_CREDENTIALS is not valid JSON.' });
            }
        }

        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        const client = new speech.SpeechClient({ credentials });

        const { audioContent } = req.body;
        if (!audioContent) {
            return res.status(400).json({ error: 'Audio input payload is empty.' });
        }

        const request = {
            config: {
                encoding: 'ENCODING_UNSPECIFIED',
                languageCode: 'en-AU',
                alternativeLanguageCodes: ['en-US', 'en-GB'],
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: true, // <-- NEW: Turns on exact timestamps!
            },
            audio: {
                content: audioContent,
            },
        };

        const [response] = await client.recognize(request);
        
        const transcript = response.results
            ?.map(result => result.alternatives?.[0]?.transcript || '')
            .join(' ') || '';

        // Extract the exact timestamps for every single word!
        let words = [];
        response.results?.forEach(result => {
            const alt = result.alternatives?.[0];
            if (alt && alt.words) {
                alt.words.forEach(w => {
                    const startSecs = parseInt(w.startTime.seconds || 0, 10);
                    const startNanos = parseInt(w.startTime.nanos || 0, 10);
                    const endSecs = parseInt(w.endTime.seconds || 0, 10);
                    const endNanos = parseInt(w.endTime.nanos || 0, 10);
                    
                    words.push({
                        word: w.word,
                        start: startSecs + (startNanos / 1e9),
                        end: endSecs + (endNanos / 1e9)
                    });
                });
            }
        });

        // Send BOTH the full string and the timestamp array back to the app
        return res.status(200).json({ transcript, words });

    } catch (error) {
        console.error('Error transcribing audio:', error);
        return res.status(500).json({ 
            error: 'Google Cloud STT Failed', 
            details: error.message,
            stack: error.stack 
        });
    }
};

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
        // 2. Validate Google credentials loaded from your Vercel digital vault
        if (!process.env.GOOGLE_CREDENTIALS) {
            return res.status(500).json({ error: 'Server configuration error: GOOGLE_CREDENTIALS is empty.' });
        }

        let credentials;
        let rawCreds = process.env.GOOGLE_CREDENTIALS.trim();
        
        // Strip out accidental surrounding quotes
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

        // 3. Initialize Google STT Client
        const client = new speech.SpeechClient({ credentials });

        const { audioContent } = req.body;
        if (!audioContent) {
            return res.status(400).json({ error: 'Audio input payload is empty.' });
        }

        // 4. Use ENCODING_UNSPECIFIED with auto-detection!
        // This instructs Google Cloud to inspect the binary headers of the container file (WebM, Ogg, MP4/AAC, WAV)
        // and decode it dynamically. This eliminates browser, container, and sample rate mismatches!
        const request = {
            config: {
                encoding: 'ENCODING_UNSPECIFIED',
                languageCode: 'en-AU',
                alternativeLanguageCodes: ['en-US', 'en-GB'],
                enableAutomaticPunctuation: true,
            },
            audio: {
                content: audioContent,
            },
        };

        // 5. Query Google and extract perfectly punctuated transcriptions
        const [response] = await client.recognize(request);
        const transcript = response.results
            ?.map(result => result.alternatives?.[0]?.transcript || '')
            .join(' ') || '';

        return res.status(200).json({ transcript });

    } catch (error) {
        console.error('Error transcribing audio:', error);
        return res.status(500).json({ 
            error: 'Google Cloud STT Failed', 
            details: error.message,
            stack: error.stack 
        });
    }
};

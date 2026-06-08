// A stable, error-resilient CommonJS serverless function for Vercel.
// Connects safely to Google Cloud Speech-to-Text with robust dependency loading.

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

        // 3. Initialize Google STT Client with robust, dynamic sub-module verification
        let client;
        try {
            // Attempt to resolve SpeechClient from the preferred v1p1beta1 namespace
            if (speech.v1p1beta1 && speech.v1p1beta1.SpeechClient) {
                client = new speech.v1p1beta1.SpeechClient({ credentials });
            } else {
                client = new speech.SpeechClient({ credentials });
            }
        } catch (initError) {
            // Absolute baseline fallback to the standard SpeechClient
            client = new speech.SpeechClient({ credentials });
        }

        const { audioContent, mimeType } = req.body;
        if (!audioContent) {
            return res.status(400).json({ error: 'Audio input payload is empty.' });
        }

        // 4. Intelligent format negotiator
        let encoding = 'WEBM_OPUS';
        let sampleRateHertz = 48000;
        
        const clientMime = (mimeType || '').toLowerCase();
        if (clientMime.includes('mp4') || clientMime.includes('m4a') || clientMime.includes('aac')) {
            encoding = 'ENCODING_UNSPECIFIED';
            sampleRateHertz = 16000;
        } else if (clientMime.includes('ogg') || clientMime.includes('opus')) {
            encoding = 'OGG_OPUS';
            sampleRateHertz = 48000;
        }

        const request = {
            config: {
                encoding: encoding,
                sampleRateHertz: sampleRateHertz,
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

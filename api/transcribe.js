const speech = require('@google-cloud/speech').v2;

module.exports = async function handler(req, res) {
    // 1. Send CORS headers immediately so the browser handshake never fails
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Respond immediately to browser pre-flight checks
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 2. Validate Google credentials loaded from Vercel's environment variables
        if (!process.env.GOOGLE_CREDENTIALS) {
            return res.status(500).json({ error: 'Missing GOOGLE_CREDENTIALS environment variable on Vercel.' });
        }

        // 3. Robust, error-resilient JSON parser
        let credentials;
        let rawCreds = process.env.GOOGLE_CREDENTIALS.trim();
        
        // Remove accidental surrounding wrapper quotes if pasted with them
        if (rawCreds.startsWith('"') && rawCreds.endsWith('"')) {
            rawCreds = rawCreds.substring(1, rawCreds.length - 1);
        }

        try {
            credentials = JSON.parse(rawCreds);
        } catch (firstParseError) {
            // Fallback: strip line breaks and try parsing again
            try {
                const sanitized = rawCreds.replace(/\r?\n/g, '').trim();
                credentials = JSON.parse(sanitized);
            } catch (secondParseError) {
                console.error("JSON Parse Error:", firstParseError.message);
                return res.status(500).json({ 
                    error: 'JSON Parse Error: Your Vercel GOOGLE_CREDENTIALS env var has broken JSON formatting.',
                    details: firstParseError.message,
                    preview: rawCreds.substring(0, 60) + '...'
                });
            }
        }

        const projectId = credentials.project_id;
        if (!projectId) {
            return res.status(500).json({ error: 'Missing project_id in credentials JSON.' });
        }

        // Google Cloud client library expects literal newlines in private_key strings
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        // 4. Initialize Google Cloud Client using credentials
        const client = new speech.SpeechClient({ credentials });

        const { audioContent } = req.body;
        if (!audioContent) {
            return res.status(400).json({ error: 'Audio input payload is empty.' });
        }

        // 5. Construct Speech V2 Configuration
        const request = {
            recognizer: `projects/${projectId}/locations/global/recognizers/_`,
            config: {
                autoDecodingConfig: {}, 
                languageCodes: ['en-AU', 'en-US', 'en-GB'],
                features: {
                    enableAutomaticPunctuation: true,
                }
            },
            content: audioContent,
        };

        // 6. Query Google and extract perfectly punctuated transcriptions
        const [response] = await client.recognize(request);
        const transcript = response.results
            ?.map(result => result.alternatives?.[0]?.transcript || '')
            .join(' ') || '';

        return res.status(200).json({ transcript });

    } catch (error) {
        console.error('Error transcribing audio:', error);
        return res.status(500).json({ error: 'Google Cloud STT V2 Failed', details: error.message });
    }
};

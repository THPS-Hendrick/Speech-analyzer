// A 100% stable CommonJS serverless function for Vercel.
// Connects safely to Google Cloud Speech-to-Text V2 with auto-decoding configurations.

const speech = require('@google-cloud/speech').v2;

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
            return res.status(500).json({ error: 'Server configuration error: Missing GOOGLE_CREDENTIALS in environment variables.' });
        }

        let credentials;
        try {
            credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        } catch (parseError) {
            return res.status(500).json({ error: 'Server configuration error: GOOGLE_CREDENTIALS environment variable is not valid JSON.' });
        }

        const projectId = credentials.project_id;
        if (!projectId) {
            return res.status(500).json({ error: 'Server configuration error: Missing project_id inside credentials JSON.' });
        }

        // 3. Initialize Google STT client
        const client = new speech.SpeechClient({ credentials });

        const { audioContent } = req.body;
        if (!audioContent) {
            return res.status(400).json({ error: 'Audio input payload is empty.' });
        }

        // 4. Construct Speech V2 Configuration
        // autoDecodingConfig is set to empty {} to instruct Google to automatically
        // detect and decode formats (including Chrome WebM and Apple iOS MP4 containers)!
        const request = {
            recognizer: `projects/${projectId}/locations/global/recognizers/_`,
            config: {
                autoDecodingConfig: {}, 
                languageCodes: ['en-AU', 'en-US', 'en-GB'],
                features: {
                    enableAutomaticPunctuation: true, // Google automatically applies commas & periods
                }
            },
            content: audioContent,
        };

        // 5. Query Google and extract perfectly punctuated transcriptions
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

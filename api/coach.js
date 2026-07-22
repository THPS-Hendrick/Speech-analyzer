const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    // 1. CORS Headers (Crucial for cross-origin requests from your frontend)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Restrict to your domain in production
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Block non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { question, payload } = req.body;

    if (!question || !payload) {
        return res.status(400).json({ error: 'Missing question or payload data.' });
    }

    try {
        // 2. Initialize Gemini API securely using your Vercel Environment Variable
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // We use gemini-1.5-flash as it is lightning-fast and perfect for text reasoning
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // 3. Construct the Context-Injected Prompt
        const systemPrompt = `
You are a world-class vocal and speech coach. Your job is to read the attached JSON data from the user's latest speech and answer their questions concisely, warmly, and encouragingly.
If a score is outside the target range, explain why based on the data. Pick a specific sentence or word from their transcript to show them exactly how to improve. 

[USER PAYLOAD DATA]:
${JSON.stringify(payload, null, 2)}
`;

        const fullPrompt = `${systemPrompt}\n\n[USER QUESTION]: ${question}`;

        // 4. Call the Gemini API
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // 5. Send the advice back to the frontend
        return res.status(200).json({ answer: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Failed to generate coaching advice.' });
    }
};

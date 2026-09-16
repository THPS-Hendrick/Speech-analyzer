const { google } = require('googleapis');

export default async function handler(req, res) {
    // 1. Grab the client's email address from the request
    const clientEmail = req.query.email;
    if (!clientEmail) return res.status(400).json({ error: "No email provided." });

    try {
        // 2. Authenticate using your Vercel Environment Variables
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // 3. Search your inbox for threads containing the client's email
        const searchRes = await gmail.users.messages.list({
            userId: 'me',
            q: `to:${clientEmail} OR from:${clientEmail}`,
            maxResults: 3 // Only grab the 3 most recent emails
        });

        const messages = searchRes.data.messages || [];
        const threads = [];

        // 4. Get the Subject and Snippet for each email found
        for (const msg of messages) {
            const msgDetail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject']
            });
            
            const subject = msgDetail.data.payload.headers.find(h => h.name === 'Subject');
            threads.push({
                subject: subject ? subject.value : 'No Subject',
                snippet: msgDetail.data.snippet
            });
        }

        // 5. Send the emails back to the CRM dashboard
        res.status(200).json({ success: true, threads });

    } catch (error) {
        console.error("Gmail API Error:", error);
        res.status(500).json({ error: "Failed to fetch emails." });
    }
}

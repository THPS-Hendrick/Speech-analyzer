const { google } = require('googleapis');
const admin = require('firebase-admin');

// 1. Safely initialize Firebase Admin "God Mode"
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    // Allow cross-origin requests from tomhendrick.com
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Missing required enquiry fields.' });
    }

    try {
        const nowIso = new Date().toISOString();
        const clientId = email.trim().toLowerCase();
        const clientRef = db.collection("Clients").doc(clientId);

        // 2. Upsert client record into "Enquiry Received" and log the enquiry
        await clientRef.set({
            name: name.trim(),
            email: email.trim(),
            stage: "Enquiry Received",
            manualStageOverride: null,
            tags: admin.firestore.FieldValue.arrayUnion("Website Enquiry"),
            last_contact_date: nowIso,
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "client",
                action: `Website Enquiry:\n${message.trim()}`,
                timestamp: nowIso
            })
        }, { merge: true });

        // 3. Send email notification to Tom (non-blocking if email fails)
        try {
            if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );
                oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
                const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

                const subject = `New Website Enquiry from ${name.trim()}`;
                const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

                const emailHtml = `
                    <p><strong>New Contact Form Enquiry</strong></p>
                    <p><strong>Name:</strong> ${name.trim()}</p>
                    <p><strong>Email:</strong> ${email.trim()}</p>
                    <p><strong>Message:</strong></p>
                    <pre style="font-family: sans-serif; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px;">${message.trim()}</pre>
                `;

                const messageParts = [
                    `To: tom@tomhendrick.com`,
                    `Reply-To: ${email.trim()}`,
                    `Subject: ${utf8Subject}`,
                    'Content-Type: text/html; charset=utf-8',
                    '',
                    emailHtml
                ];

                const encodedMessage = Buffer.from(messageParts.join('\n'))
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: encodedMessage }
                });
            }
        } catch (emailErr) {
            console.error("Enquiry Notification Email Warning:", emailErr);
        }

        res.status(200).json({ success: true, message: 'Enquiry received!' });

    } catch (error) {
        console.error("Submit Enquiry Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

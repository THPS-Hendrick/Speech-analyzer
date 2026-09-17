const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // 2. Add Client Record to Firebase CRM
        await addDoc(collection(db, "Clients"), {
            name: name,
            email: email,
            notes: `Enquiry Message: ${message}`,
            stage: "Enquiry Received",
            tags: ["Website Enquiry"],
            last_contact_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        });

        // 3. Initialize Google Workspace Connection (Gmail API)
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // 4. Construct the Auto-Reply Email
        const subject = "Thanks for your enquiry!";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        // You can customize this HTML message however you like!
        const emailHtml = `
            <p>Hi ${name.split(' ')[0]},</p>
            <p>Thank you for reaching out! This is just a quick note to confirm that I have received your enquiry regarding public speaking coaching.</p>
            <p>I will review your message and get back to you shortly with next steps.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Tom Hendrick</strong></p>
        `;

        const messageParts = [
            `To: ${email}`,
            `Subject: ${utf8Subject}`,
            'Content-Type: text/html; charset=utf-8',
            '',
            emailHtml
        ];

        const messageContent = messageParts.join('\n');
        
        // Gmail requires Base64URL encoding
        const encodedMessage = Buffer.from(messageContent)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 5. Send the Email
        await gmail.users.messages.send({
            userId: 'me', // 'me' tells Google to use your authenticated account
            requestBody: {
                raw: encodedMessage
            }
        });

        res.status(200).json({ success: true, message: "Enquiry submitted and email sent!" });

    } catch (error) {
        console.error("Enquiry Submission Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

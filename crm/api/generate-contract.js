const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

    const { clientName, clientEmail, clientAddress, inclusions, paymentStructure, targetDate, applyGst, lineItems } = req.body;

    if (!clientName || !clientEmail || !lineItems || lineItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required contract fields or line items.' });
    }

    try {
        let subtotal = 0;
        lineItems.forEach(item => {
            subtotal += (item.rate * item.qty);
        });
        
        const gstAmount = applyGst ? (subtotal * 0.10) : 0;
        const totalFee = subtotal + gstAmount;

        const docRef = await addDoc(collection(db, "Contracts"), {
            clientName,
            clientEmail,
            clientAddress,
            inclusions,
            paymentStructure,
            targetDate,
            applyGst,
            lineItems,
            totalFee, 
            status: "pending",
            createdAt: new Date().toISOString()
        });

        const contractId = docRef.id;
        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${contractId}`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = "Your Service Agreement from Tom Hendrick";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        const emailHtml = `
            <p>Hi ${clientName.split(' ')[0]},</p>
            <p>I have prepared the Service Agreement for our upcoming public speaking coaching.</p>
            <p>You can review the scope, fees, and terms, and digitally accept the agreement using the secure link below:</p>
            <p><a href="${magicLink}" style="background-color: #1e293b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Review & Sign Contract</a></p>
            <br>
            <p>If you have any questions before signing, just reply directly to this email!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Tom Hendrick</strong></p>
        `;

        const messageParts = [
            `To: ${clientEmail}`,
            `Bcc: tom@tomhendrick.com`, // Added this line so you get a copy!
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

        res.status(200).json({ success: true, contractId: contractId });

    } catch (error) {
        console.error("Contract Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

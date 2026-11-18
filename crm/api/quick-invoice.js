const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, arrayUnion } = require('firebase/firestore');

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

    const { clientEmail, clientName, description, amount } = req.body;

    if (!clientEmail || !clientName || !description || !amount) {
        return res.status(400).json({ success: false, message: 'Missing required invoice fields.' });
    }

    try {
        const parsedAmount = parseFloat(amount);
        const gstAmount = parsedAmount * 0.10;
        const totalFee = parsedAmount + gstAmount;

        // 1. Create a lightweight "Contract" document to hold the invoice data
        // We use a random ID here so a client can have multiple invoices over time
        const invoiceId = `inv_${Date.now()}`;
        const contractRef = doc(db, "Contracts", invoiceId);
        
        await setDoc(contractRef, {
            clientName,
            clientEmail,
            clientAddress: "Address on file", // Quick invoice skips asking for this
            inclusions: "Quick Invoice",
            paymentStructure: "100% Upfront",
            targetDate: new Date().toISOString().split('T')[0],
            applyGst: true,
            lineItems: [{
                name: "Ad Hoc Service",
                desc: description,
                rate: parsedAmount,
                qty: 1
            }],
            totalFee,
            status: "signed", // Forces the contract page to skip the signature block and go straight to the invoice
            createdAt: new Date().toISOString()
        });

        // 2. Log the action to the client's CRM card
        const clientRef = doc(db, "Clients", clientEmail.toLowerCase());
        await updateDoc(clientRef, {
            activity_log: arrayUnion({
                type: "admin",
                action: `Generated Quick Invoice: $${totalFee.toFixed(2)}`,
                timestamp: new Date().toISOString()
            })
        });

        // 3. Email the invoice link to the client
        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${invoiceId}`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = "New Invoice from Tom Hendrick";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        const emailHtml = `
            <p>Hi ${clientName.split(' ')[0]},</p>
            <p>I have generated a new invoice for ${description}.</p>
            <p>You can view the itemized breakdown and payment details securely at the link below:</p>
            <p><a href="${magicLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Tax Invoice</a></p>
            <br>
            <p>Best regards,</p>
            <p><strong>Tom Hendrick</strong></p>
        `;

        const messageParts = [
            `To: ${clientEmail}`,
            `Bcc: tom@tomhendrick.com`, 
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

        res.status(200).json({ success: true, message: "Quick Invoice sent!" });

    } catch (error) {
        console.error("Quick Invoice Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

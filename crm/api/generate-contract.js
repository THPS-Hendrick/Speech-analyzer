const { google } = require('googleapis');
const admin = require('firebase-admin');

// Safely initialize Firebase Admin "God Mode"
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { clientName, clientEmail, clientAddress, inclusions, paymentStructure, targetDate, gstMode, lineItems } = req.body;

    if (!clientName || !clientEmail || !lineItems || lineItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required contract fields or line items.' });
    }

    try {
        let subtotal = 0;
        let adjustedLineItems = [];

        // Apply inclusive/exclusive math line-by-line
        lineItems.forEach(item => {
            let actualRate = item.rate;
            if (gstMode === "inclusive") {
                actualRate = parseFloat((item.rate / 1.1).toFixed(2));
            }
            subtotal += (actualRate * item.qty);
            adjustedLineItems.push({ ...item, rate: actualRate });
        });
        
        let gstAmount = 0;
        if (gstMode === "inclusive" || gstMode === "exclusive") {
            gstAmount = parseFloat((subtotal * 0.10).toFixed(2));
        }
        const totalFee = parseFloat((subtotal + gstAmount).toFixed(2));

        const docRef = await db.collection("Contracts").add({
            clientName,
            clientEmail,
            clientAddress,
            inclusions,
            paymentStructure,
            targetDate,
            gstMode: gstMode,
            applyGst: (gstMode !== "none"),
            lineItems: adjustedLineItems, // Save the properly calculated rates
            totalFee: totalFee, 
            status: "pending",
            createdAt: new Date().toISOString()
        });

        const contractId = docRef.id;

        // Log the full contract generation to the CRM card
        const clientRef = db.collection("Clients").doc(clientEmail.toLowerCase());
        await clientRef.update({
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "admin",
                action: `Generated Full Contract: $${totalFee.toFixed(2)}`,
                timestamp: new Date().toISOString()
            })
        });

        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${contractId}`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
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

        res.status(200).json({ success: true, contractId: contractId });

    } catch (error) {
        console.error("Contract Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

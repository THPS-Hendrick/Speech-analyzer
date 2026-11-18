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

    const { clientName, clientEmail, clientAddress, inclusions, paymentStructure, targetDate, gstMode, applyGst, lineItems } = req.body;

    if (!clientName || !clientEmail || !lineItems || lineItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required contract fields or line items.' });
    }

    try {
        // Resolve GST mode safely (defaults to inclusive)
        const mode = gstMode || (applyGst === false ? "none" : "inclusive");

        // 1. Sum line items using exact entered rates (no pre-division)
        let rawSubtotal = 0;
        const cleanLineItems = lineItems.map(item => {
            const rate = parseFloat(item.rate) || 0;
            const qty = parseFloat(item.qty) || 0;
            rawSubtotal += (rate * qty);
            return {
                name: item.name || "",
                desc: item.desc || "",
                rate: rate,
                qty: qty
            };
        });

        const subtotal = Math.max(0, rawSubtotal);

        let gstAmount = 0;
        let totalFee = 0;

        if (mode === "inclusive") {
            totalFee = parseFloat(subtotal.toFixed(2));
            gstAmount = parseFloat((totalFee / 11).toFixed(2));
        } else if (mode === "exclusive") {
            gstAmount = parseFloat((subtotal * 0.10).toFixed(2));
            totalFee = parseFloat((subtotal + gstAmount).toFixed(2));
        } else {
            totalFee = parseFloat(subtotal.toFixed(2));
        }

        // 2. Save the Contract document
        const docRef = await db.collection("Contracts").add({
            clientName,
            clientEmail,
            clientAddress,
            inclusions,
            paymentStructure,
            targetDate,
            gstMode: mode,
            applyGst: (mode !== "none"),
            lineItems: cleanLineItems,
            totalFee: totalFee,
            status: "pending",
            createdAt: new Date().toISOString()
        });

        const contractId = docRef.id;
        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${contractId}`;

        // 3. Log clickable contract entry & increment Total Charged on the Client record
        const clientRef = db.collection("Clients").doc(clientEmail.toLowerCase());
        await clientRef.set({
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "admin",
                action: `Generated Full Contract: $${totalFee.toFixed(2)}`,
                url: magicLink,
                timestamp: new Date().toISOString()
            }),
            totalCharged: admin.firestore.FieldValue.increment(totalFee)
        }, { merge: true });

        // 4. Send Service Agreement email via Gmail API
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

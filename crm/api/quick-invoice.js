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
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { clientEmail, clientName, description, units, rate, discount, applyGst } = req.body;

    if (!clientEmail || !clientName || !description || !units || !rate) {
        return res.status(400).json({ success: false, message: 'Missing required invoice fields.' });
    }

    try {
        const parsedUnits = parseInt(units) || 1;
        const parsedRate = parseFloat(rate) || 0;
        const parsedDiscount = parseFloat(discount) || 0;
        
        // The Math Strategy
        const baseAmount = parsedUnits * parsedRate;
        const subtotal = Math.max(0, baseAmount - parsedDiscount); // Prevents accidental negative subtotals
        const gstAmount = applyGst ? (subtotal * 0.10) : 0;
        const totalFee = subtotal + gstAmount;

        // Construct Line Items array
        let lineItems = [{
            name: "Coaching Services",
            desc: description,
            rate: parsedRate,
            qty: parsedUnits
        }];

        // Inject the negative discount line item if applicable
        if (parsedDiscount > 0) {
            lineItems.push({
                name: "Discount",
                desc: "Fixed discount applied",
                rate: -Math.abs(parsedDiscount), 
                qty: 1
            });
        }

        // 2. Create the invoice document using Admin syntax
        const invoiceId = `inv_${Date.now()}`;
        const contractRef = db.collection("Contracts").doc(invoiceId);
        
        await contractRef.set({
            clientName,
            clientEmail,
            clientAddress: "Address on file",
            inclusions: description,
            paymentStructure: "100% Upfront",
            targetDate: new Date().toISOString().split('T')[0],
            applyGst: applyGst,
            lineItems: lineItems,
            totalFee: totalFee,
            status: "signed",      
            type: "invoice_only",  
            createdAt: new Date().toISOString()
        });

        // 3. Update the client's activity log using Admin arrayUnion syntax
        const clientRef = db.collection("Clients").doc(clientEmail.toLowerCase());
        await clientRef.update({
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "admin",
                action: `Generated Quick Invoice: $${totalFee.toFixed(2)}`,
                timestamp: new Date().toISOString()
            })
        });

        // 4. Email the secure invoice link to the client
        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${invoiceId}`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = "Tax Invoice from Tom Hendrick";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        const emailHtml = `
            <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto;">
                <p>Hi ${clientName.split(' ')[0]},</p>
                <p>I have generated a new tax invoice for <strong>${description}</strong>.</p>
                <p>You can view the itemized breakdown and payment details securely at the link below:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${magicLink}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">View Tax Invoice</a>
                </div>
                
                <p>Best regards,</p>
                <p><strong>Tom Hendrick</strong></p>
            </div>
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

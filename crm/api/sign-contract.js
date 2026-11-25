const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin once per serverless container
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({
            success: false,
            message: 'Only POST requests allowed',
            error: 'Only POST requests allowed'
        });
    }

    const { id } = req.body || {};

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Contract ID is missing',
            error: 'Contract ID is missing'
        });
    }

    try {
        const docRef = db.collection('Contracts').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                message: 'Contract not found',
                error: 'Contract not found'
            });
        }

        const contractData = docSnap.data();

        // Idempotency guard: never overwrite a 'paid' contract or re-send receipts on double-click
        if (contractData.status === 'signed' || contractData.status === 'paid') {
            return res.status(200).json({
                success: true,
                alreadySigned: true,
                status: contractData.status,
                message: 'Contract was already signed.'
            });
        }

        const signedAt = new Date().toISOString();
        const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP';
        const signerIp = String(rawIp).split(',')[0].trim();

        const numericFee = Number(String(contractData.totalFee ?? 0).replace(/[^0-9.-]+/g, '')) || 0;
        const formattedFee = '$' + numericFee.toLocaleString('en-AU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const host = req.headers.host || 'thps-crm.vercel.app';
        const magicLink = `https://${host}/contract.html?id=${id}`;

        // 1. Record the digital signature in Firestore
        await docRef.update({
            status: 'signed',
            signedAt,
            signerIp
        });

        // 2. Log signature in the client's CRM activity feed (non-blocking)
        if (contractData.clientEmail) {
            try {
                const clientRef = db.collection('Clients').doc(contractData.clientEmail.toLowerCase());
                await clientRef.set({
                    activity_log: admin.firestore.FieldValue.arrayUnion({
                        type: 'admin',
                        action: `✍️ Contract Signed (${formattedFee} AUD)`,
                        url: magicLink,
                        timestamp: signedAt
                    })
                }, { merge: true });
            } catch (logErr) {
                console.error('Contract signed, but failed to update Clients activity_log:', logErr);
            }
        }

        // 3. Send finalized receipt email via Gmail (non-blocking so Stripe payment still unlocks)
        let emailSent = false;
        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                'https://developers.google.com/oauthplayground'
            );
            oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const subject = 'Executed Service Agreement & Tax Invoice - Tom Hendrick';
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

            const niceDate = new Date(signedAt).toLocaleString('en-AU', {
                timeZone: 'Australia/Adelaide',
                timeZoneName: 'short'
            });

            const firstName = (contractData.clientName || 'there').trim().split(/\s+/)[0];

            const emailHtml = `
                <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto;">
                    <p>Hi ${firstName},</p>
                    <p>Thank you for accepting the Service Agreement. We are all set to begin!</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${magicLink}" style="background-color: #ca8a04; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">View &amp; Pay Tax Invoice</a>
                        <p style="font-size: 13px; color: #64748b; margin-top: 12px;">This secure link also contains your permanent, time-stamped copy of the Service Agreement.</p>
                    </div>

                    <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 5px;">
                        <h3 style="margin-top:0; color: #0f172a;">Digital Signature Record</h3>
                        <p style="margin: 5px 0;"><strong>Signed By:</strong> ${contractData.clientName}</p>
                        <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${niceDate}</p>
                        <p style="margin: 5px 0;"><strong>IP Address:</strong> ${signerIp}</p>
                        
                        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                        
                        <h3 style="margin-top:0; color: #0f172a;">Schedule of Services</h3>
                        <p style="margin: 5px 0;"><strong>Inclusions:</strong> ${contractData.inclusions}</p>
                        <p style="margin: 5px 0;"><strong>Total Fee:</strong> ${formattedFee} AUD</p>
                    </div>
                    
                    <br>
                    <p>Best regards,</p>
                    <p><strong>Tom Hendrick</strong></p>
                </div>
            `;

            const messageParts = [
                `To: ${contractData.clientEmail}`,
                'Bcc: tom@tomhendrick.com',
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
            emailSent = true;
        } catch (emailErr) {
            console.error('Contract signed in Firestore, but Gmail receipt failed:', emailErr);
        }

        return res.status(200).json({
            success: true,
            status: 'signed',
            emailSent,
            message: emailSent
                ? 'Contract signed and receipts sent.'
                : 'Contract signed. Receipt email could not be sent automatically.'
        });
    } catch (error) {
        console.error('Sign Contract Error:', error);
        const errorMessage = error.message || 'Server error while signing contract.';
        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorMessage
        });
    }
}

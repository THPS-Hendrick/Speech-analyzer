const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

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

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Contract ID is missing' });
    }

    try {
        const docRef = doc(db, "Contracts", id);
        
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }
        const contractData = docSnap.data();

        const signedAt = new Date().toISOString();
        const signerIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        
        await updateDoc(docRef, {
            status: "signed",
            signedAt: signedAt,
            signerIp: signerIp
        });

        // Generate the permanent magic link
        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${id}`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = "Executed Service Agreement & Tax Invoice - Tom Hendrick";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        const niceDate = new Date(signedAt).toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' });

        // Email layout with the new Invoice button
        const emailHtml = `
            <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto;">
                <p>Hi ${contractData.clientName.split(' ')[0]},</p>
                <p>Thank you for accepting the Service Agreement. We are all set to begin!</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${magicLink}" style="background-color: #ca8a04; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">View & Download Tax Invoice</a>
                    <p style="font-size: 13px; color: #64748b; margin-top: 12px;">This secure link also contains your permanent, time-stamped copy of the Service Agreement.</p>
                </div>

                <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 5px;">
                    <h3 style="margin-top:0; color: #0f172a;">Digital Signature Record</h3>
                    <p style="margin: 5px 0;"><strong>Signed By:</strong> ${contractData.clientName}</p>
                    <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${niceDate} (ACST)</p>
                    <p style="margin: 5px 0;"><strong>IP Address:</strong> ${signerIp}</p>
                    
                    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                    
                    <h3 style="margin-top:0; color: #0f172a;">Schedule of Services</h3>
                    <p style="margin: 5px 0;"><strong>Inclusions:</strong> ${contractData.inclusions}</p>
                    <p style="margin: 5px 0;"><strong>Total Fee:</strong> $${contractData.totalFee}</p>
                </div>
                
                <br>
                <p>Best regards,</p>
                <p><strong>Tom Hendrick</strong></p>
            </div>
        `;

        // Remember to change your-email@gmail.com to your actual email so you get the BCC copy!
        const messageParts = [
            `To: ${contractData.clientEmail}`,
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

        res.status(200).json({ success: true, message: 'Contract signed and receipts sent.' });
    } catch (error) {
        console.error("Sign Contract Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

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
        
        // 1. Fetch the contract details so we can put them in the receipt email
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }
        const contractData = docSnap.data();

        // 2. Update the contract status to signed
        const signedAt = new Date().toISOString();
        const signerIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        
        await updateDoc(docRef, {
            status: "signed",
            signedAt: signedAt,
            signerIp: signerIp
        });

        // 3. Email the final receipt via Gmail API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const subject = "Executed Service Agreement - Tom Hendrick & " + contractData.clientName;
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        // Format the date nicely for the email
        const niceDate = new Date(signedAt).toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' });

        const emailHtml = `
            <p>Hi ${contractData.clientName.split(' ')[0]},</p>
            <p>Thank you for accepting the Service Agreement. This email serves as your finalized, time-stamped copy for your records.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 5px; margin-top: 20px;">
                <h3 style="margin-top:0;">Digital Signature Record</h3>
                <p><strong>Signed By:</strong> ${contractData.clientName}</p>
                <p><strong>Date/Time:</strong> ${niceDate} (ACST)</p>
                <p><strong>IP Address:</strong> ${signerIp}</p>
                <p><strong>Contract ID:</strong> ${id}</p>
                
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                
                <h3 style="margin-top:0;">Schedule of Services</h3>
                <p><strong>Inclusions:</strong> ${contractData.inclusions}</p>
                <p><strong>Total Fee:</strong> $${contractData.totalFee}</p>
                <p><strong>Payment Structure:</strong> ${contractData.paymentStructure}</p>
            </div>
            
            <p>I look forward to working with you!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Tom Hendrick</strong></p>
        `;

        // Send to the client, and BCC yourself so you get a copy too!
        // Replace 'your-email@gmail.com' with your actual business email address
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

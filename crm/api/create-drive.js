const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion } = require('firebase/firestore');

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

    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ success: false, message: 'Missing client email or name.' });
    }

    try {
        // 2. Initialize Google Drive API Connection
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // IMPORTANT: Replace this with the ID of your master CRM folder!
        const PARENT_FOLDER_ID = '1A5pxpeaTWyPt7pSnEOOO_VKsggr31Ldn'; 

        // 3. Create the new Client Folder
        const folderMetadata = {
            name: `Coaching - ${name}`,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [PARENT_FOLDER_ID] 
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, webViewLink'
        });

        const newFolderId = folder.data.id;
        const newFolderUrl = folder.data.webViewLink;

        // 4. Share the folder with the client
        await drive.permissions.create({
            fileId: newFolderId,
            requestBody: {
                type: 'user',
                role: 'writer', // Gives them permission to upload their MP3s!
                emailAddress: email 
            },
            sendNotificationEmail: true // Google will email them a link to the folder
        });

        // 5. Save the folder link to their CRM Card
        const clientRef = doc(db, "Clients", email.toLowerCase());
        
        await updateDoc(clientRef, {
            driveFolderUrl: newFolderUrl,
            activity_log: arrayUnion({
                type: "admin",
                action: "Automated Google Drive folder provisioned",
                timestamp: new Date().toISOString()
            })
        });

        res.status(200).json({ 
            success: true, 
            message: "Drive folder created and shared.",
            folderUrl: newFolderUrl
        });

    } catch (error) {
        console.error("Drive Creation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

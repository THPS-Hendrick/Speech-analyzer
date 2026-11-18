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

    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ success: false, message: 'Missing client email or name.' });
    }

    try {
        const clientId = email.toLowerCase();
        const clientRef = db.collection("Clients").doc(clientId);

        // Guard against duplicate folder creation if one already exists
        const existingSnap = await clientRef.get();
        if (existingSnap.exists && existingSnap.data().driveFolderUrl) {
            return res.status(200).json({
                success: true,
                message: "Drive folder already exists.",
                folderUrl: existingSnap.data().driveFolderUrl
            });
        }

        // 2. Initialize Google Drive API Connection
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Master CRM Folder ID
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
                role: 'writer',
                emailAddress: email
            },
            sendNotificationEmail: true
        });

        // 5. Save the folder link and clickable activity log to the Client record
        const nowIso = new Date().toISOString();
        await clientRef.set({
            name: name,
            email: email,
            driveFolderUrl: newFolderUrl,
            driveFolderId: newFolderId,
            manualStageOverride: null,
            last_contact_date: nowIso,
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "admin",
                action: "Generated Google Drive folder",
                url: newFolderUrl,
                timestamp: nowIso
            })
        }, { merge: true });

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

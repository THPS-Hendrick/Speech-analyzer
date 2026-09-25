import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace literal \n with actual line breaks for Vercel env vars
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { clientId, levelId, setIndex, manualGrades, telemetry, timestamp } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        const payload = {
            levelId,
            setIndex,
            manualGrades,
            telemetry,
            timestamp: timestamp || new Date().toISOString()
        };

        // Append the new attempt to the client's 'repeatCountProgress' array.
        // { merge: true } ensures the document is created if it doesn't exist yet.
        await db.collection('clients').doc(clientId).set({
            repeatCountProgress: admin.firestore.FieldValue.arrayUnion(payload),
            lastActive: new Date().toISOString()
        }, { merge: true });

        return res.status(200).json({ success: true, message: 'Attempt saved to CRM' });

    } catch (error) {
        console.error("Error saving RC attempt:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

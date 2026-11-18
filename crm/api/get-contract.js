const admin = require('firebase-admin');

// Safely initialize Firebase Admin "God Mode"
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Only GET requests allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Contract ID is missing' });
    }

    try {
        const docRef = db.collection("Contracts").doc(id);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            res.status(200).json({ success: true, contract: docSnap.data() });
        } else {
            res.status(404).json({ success: false, message: 'Contract not found' });
        }
    } catch (error) {
        console.error("Fetch Contract Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

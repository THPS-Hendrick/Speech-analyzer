import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { clientId } = req.query;

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        const docRef = db.collection('clients').doc(clientId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // Return an empty template if the client exists but has no data yet
            return res.status(200).json({
                client: { name: clientId, dateStarted: new Date().toLocaleDateString() },
                attempts: []
            });
        }

        const clientData = docSnap.data();
        
        return res.status(200).json({
            client: {
                name: clientData.name || clientId,
                dateStarted: clientData.dateCreated || new Date().toLocaleDateString()
            },
            attempts: clientData.repeatCountProgress || []
        });

    } catch (error) {
        console.error("Error fetching RC progress:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

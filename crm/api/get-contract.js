const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Only GET requests allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Contract ID is missing' });
    }

    try {
        const docRef = doc(db, "Contracts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            res.status(200).json({ success: true, contract: docSnap.data() });
        } else {
            res.status(404).json({ success: false, message: 'Contract not found' });
        }
    } catch (error) {
        console.error("Fetch Contract Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

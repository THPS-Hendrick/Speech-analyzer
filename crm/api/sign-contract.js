const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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
        
        // Update the contract status to signed and record the timestamp
        await updateDoc(docRef, {
            status: "signed",
            signedAt: new Date().toISOString(),
            // Capturing the client's IP address adds legal weight to the digital signature
            signerIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress 
        });

        // Note: In Phase 2, we can add logic here to automatically move the client to "Contract Signed" in the CRM!

        res.status(200).json({ success: true, message: 'Contract signed successfully' });
    } catch (error) {
        console.error("Sign Contract Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

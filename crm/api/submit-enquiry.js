const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// 1. Firebase Configuration (Same as your booking API)
const firebaseConfig = {
    apiKey: "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    // Block anyone trying to load this URL directly in their browser
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // 2. Add Client Record to Firebase
        await addDoc(collection(db, "Clients"), {
            name: name,
            email: email,
            notes: `Enquiry Message: ${message}`, // Saves their message so you can read it later
            stage: "Enquiry Received",
            tags: ["Website Enquiry"],
            last_contact_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: "Enquiry submitted successfully!" });

    } catch (error) {
        console.error("Enquiry Submission Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

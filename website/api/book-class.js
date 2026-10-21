const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// Use your existing Firebase Config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY, // Ensure this is added to Vercel Env Vars
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { name, email, selectedIso } = req.body;

    try {
        // 1. Add directly to CRM Kanban Board
        await addDoc(collection(db, "Clients"), {
            name: name,
            email: email,
            tags: ["Fun Fridays Class"],
            stage: "Friday Class RSVP", // Native kanban routing column
            bookedDateIso: selectedIso,
            createdAt: new Date().toISOString(),
            last_contact_date: new Date().toISOString()
        });

        // 2. Return Success with the Static Group Meet Link
        res.status(200).json({ 
            success: true, 
            meetLink: "https://meet.google.com/YOUR-STATIC-LINK-HERE" // Replace with your recurring Meet link
        });

    } catch (error) {
        console.error("CRM Error:", error);
        res.status(500).json({ success: false, error: "Failed to save booking to CRM." });
    }
}

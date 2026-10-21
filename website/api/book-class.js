const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY, 
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

    // Frontend now sends an array of ISO strings: selectedIsos
    const { name, email, selectedIsos } = req.body;

    try {
        // Save to CRM, appending the array of booked dates so you know exactly which classes they are attending
        await addDoc(collection(db, "Clients"), {
            name: name,
            email: email,
            tags: ["Fun Fridays Class"],
            stage: "Friday Class RSVP", 
            bookedDates: selectedIsos, // Array of ISO strings
            createdAt: new Date().toISOString(),
            last_contact_date: new Date().toISOString()
        });

        res.status(200).json({ 
            success: true, 
            meetLink: "https://meet.google.com/YOUR-STATIC-LINK-HERE" // Replace with your static Friday Meet link
        });

    } catch (error) {
        console.error("CRM Error:", error);
        res.status(500).json({ success: false, error: "Failed to save bookings to CRM." });
    }
}

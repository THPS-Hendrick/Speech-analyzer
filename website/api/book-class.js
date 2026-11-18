const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, doc, setDoc, arrayUnion } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { name, email, selectedIsos } = req.body;

    if (!name || !email || !Array.isArray(selectedIsos) || selectedIsos.length === 0) {
        return res.status(400).json({ success: false, error: "Missing required class booking fields." });
    }

    try {
        const nowIso = new Date().toISOString();
        const clientId = email.trim().toLowerCase();
        const clientRef = doc(db, "Clients", clientId);

        const readableDates = selectedIsos.map(iso =>
            new Date(iso).toLocaleDateString('en-AU', {
                timeZone: 'Australia/Adelaide',
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })
        ).join(', ');

        // Upsert client record into "Online Classes", append bookedDates (C:#), and log activity
        await setDoc(clientRef, {
            name: name.trim(),
            email: email.trim(),
            tags: arrayUnion("Fun Fridays Class"),
            stage: "Online Classes",
            manualStageOverride: null,
            bookedDates: arrayUnion(...selectedIsos),
            last_contact_date: nowIso,
            activity_log: arrayUnion({
                type: "client",
                action: `Booked Online Class (${selectedIsos.length}): ${readableDates}`,
                timestamp: nowIso
            })
        }, { merge: true });

        res.status(200).json({
            success: true,
            meetLink: "https://meet.google.com/YOUR-STATIC-LINK-HERE" // Replace with your static Friday Meet link
        });

    } catch (error) {
        console.error("CRM Error:", error);
        res.status(500).json({ success: false, error: "Failed to save bookings to CRM." });
    }
}

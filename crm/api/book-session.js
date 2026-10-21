const { google } = require('googleapis');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

// Prevent duplicate Firebase initialization in serverless environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { name, email, selectedIso } = req.body;

    if (!name || !email || !selectedIso) {
        return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
    }

    try {
        // 2. Initialize Google Calendar API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 3. Calculate 1-hour session end time
        const startTime = new Date(selectedIso);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        // 4. Create Google Calendar Event with Google Meet
        const eventPayload = {
            summary: `Public Speaking Assessment - ${name}`,
            description: `1-on-1 Public Speaking Assessment with ${name} (${email}).`,
            start: { dateTime: startTime.toISOString(), timeZone: 'Australia/Adelaide' },
            end: { dateTime: endTime.toISOString(), timeZone: 'Australia/Adelaide' },
            attendees: [{ email: email }],
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };

        const calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: eventPayload,
            conferenceDataVersion: 1,
            sendUpdates: 'all' // Automatically emails calendar invite + Meet link to client
        });

        // 5. Add Client Record to Firebase Firestore
        await addDoc(collection(db, "Clients"), {
            name: name,
            email: email,
            stage: "Assessment Booked",
            tags: ["Speech Assessment booked"],
            last_contact_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        });

        res.status(200).json({
            success: true,
            message: "Booking confirmed!",
            eventLink: calendarResponse.data.htmlLink,
            meetLink: calendarResponse.data.hangoutLink
        });

    } catch (error) {
        console.error("Booking Execution Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

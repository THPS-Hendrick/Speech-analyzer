const { google } = require('googleapis');

export default async function handler(req, res) {
    // 1. Initialize Google Calendar Connection
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        // 2. Define our search window (Today to 7 days from now)
        const timeZone = 'Australia/Adelaide';
        const now = new Date();
        const timeMin = new Date(now);
        const timeMax = new Date(now);
        timeMax.setDate(timeMax.getDate() + 7);

        // 3. Ask Google for times you are already booked
        const freeBusyResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: timeZone,
                items: [{ id: 'primary' }] // 'primary' is your main Google Calendar
            }
        });
        const busySlots = freeBusyResponse.data.calendars.primary.busy;

        // 4. Generate open 1-hour slots between 9 AM and 5 PM
        let availableSlots = [];
        
        // Loop through the next 7 days
        for (let i = 1; i <= 7; i++) {
            let currentDay = new Date(now);
            currentDay.setDate(currentDay.getDate() + i);
            
            // Skip weekends (0 is Sunday, 6 is Saturday)
            if (currentDay.getDay() === 0 || currentDay.getDay() === 6) continue;

            // Check 9 AM through 4 PM (for 1-hour sessions ending at 5 PM)
            for (let hour = 9; hour <= 16; hour++) {
                let slotStart = new Date(currentDay);
                slotStart.setHours(hour, 0, 0, 0);
                let slotEnd = new Date(slotStart);
                slotEnd.setHours(hour + 1, 0, 0, 0);

                // Check if this slot overlaps with any busy periods
                let isBusy = busySlots.some(busy => {
                    let busyStart = new Date(busy.start);
                    let busyEnd = new Date(busy.end);
                    return (slotStart < busyEnd && slotEnd > busyStart);
                });

                // If it is not busy, add it to our available list
                if (!isBusy) {
                    availableSlots.push({
                        date: slotStart.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' }),
                        time: slotStart.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
                        iso: slotStart.toISOString() // We will send this back to the server when booking
                    });
                }
            }
        }

        // 5. Send the available slots to the browser
        res.status(200).json({ success: true, slots: availableSlots });

    } catch (error) {
        console.error("Calendar Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

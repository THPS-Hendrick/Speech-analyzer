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
        const timeZone = 'Australia/Adelaide';
        const now = new Date();
        const timeMin = new Date(now);
        const timeMax = new Date(now);
        timeMax.setDate(timeMax.getDate() + 7);

        // Define the specific calendar IDs you want to pool
        const primaryId = 'primary'; // tom@tomhendrick.com
        const taTomId = 'tom@talentacademy.com.au';
        const taInfoId = 'info@talentacademy.com.au';

        let allBusySlots = [];

        // ====================================================================
        // STEP 1: Fast FreeBusy Query for personal and direct TA emails
        // ====================================================================
        const freeBusyResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: timeZone,
                items: [{ id: primaryId }, { id: taTomId }] 
            }
        });

        // Merge the busy blocks from both direct calendars
        const calendarsData = freeBusyResponse.data.calendars;
        if (calendarsData[primaryId]?.busy) {
            allBusySlots = allBusySlots.concat(calendarsData[primaryId].busy);
        }
        if (calendarsData[taTomId]?.busy) {
            allBusySlots = allBusySlots.concat(calendarsData[taTomId].busy);
        }

        // ====================================================================
        // STEP 2: Intelligent Events List Query for shared info@ email
        // ====================================================================
        const eventsResponse = await calendar.events.list({
            calendarId: taInfoId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: timeZone
        });

        const infoEvents = eventsResponse.data.items || [];
        
        infoEvents.forEach(event => {
            const title = event.summary || '';
            const description = event.description || '';
            const attendees = event.attendees || [];

            // Intelligent filter: Check if "Tom" is mentioned, or if his email is an attendee
            const mentionsTom = /tom/i.test(title) || /tom/i.test(description);
            const isAttendee = attendees.some(a => a.email.toLowerCase().includes('tom'));

            if (mentionsTom || isAttendee) {
                // Handle both standard events and all-day events
                const start = event.start.dateTime || event.start.date;
                const end = event.end.dateTime || event.end.date;
                
                if (start && end) {
                    allBusySlots.push({ start: start, end: end });
                }
            }
        });

        // ====================================================================
        // STEP 3: Generate open 1-hour slots against the unified busy array
        // ====================================================================
        let availableSlots = [];
        
        for (let i = 1; i <= 7; i++) {
            let currentDay = new Date(now);
            currentDay.setDate(currentDay.getDate() + i);
            
            // Skip weekends (0 is Sunday, 6 is Saturday)
            if (currentDay.getDay() === 0 || currentDay.getDay() === 6) continue;

            for (let hour = 9; hour <= 16; hour++) {
                let slotStart = new Date(currentDay);
                slotStart.setHours(hour, 0, 0, 0);
                let slotEnd = new Date(slotStart);
                slotEnd.setHours(hour + 1, 0, 0, 0);

                // Check if this slot overlaps with ANY busy period from ANY calendar
                let isBusy = allBusySlots.some(busy => {
                    let busyStart = new Date(busy.start);
                    let busyEnd = new Date(busy.end);
                    return (slotStart < busyEnd && slotEnd > busyStart);
                });

                if (!isBusy) {
                    availableSlots.push({
                        date: slotStart.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' }),
                        time: slotStart.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
                        iso: slotStart.toISOString() 
                    });
                }
            }
        }

        res.status(200).json({ success: true, slots: availableSlots });

    } catch (error) {
        console.error("Calendar Pooling Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

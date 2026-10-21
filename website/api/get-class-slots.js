const { google } = require('googleapis');
process.env.TZ = 'Australia/Adelaide'; 

module.exports = async function handler(req, res) {
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
        
        // Define a 90-day window to ensure we can find 10 Fridays even if you block a few out
        const timeMin = new Date(now);
        const timeMax = new Date(now);
        timeMax.setDate(timeMax.getDate() + 90);

        const freeBusyResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: timeZone,
                items: [{ id: 'primary' }]
            }
        });
        
        const busySlots = freeBusyResponse.data.calendars.primary.busy || [];
        let availableSlots = [];
        let currentDay = new Date(timeMin);
        currentDay.setHours(0, 0, 0, 0); 
        
        // Loop until we collect exactly 10 classes, or we hit the 90-day cap
        while (availableSlots.length < 10 && currentDay <= timeMax) {
            
            // STRICTLY FRIDAYS ONLY (5 is Friday)
            if (currentDay.getDay() === 5) {
                let slotStart = new Date(currentDay);
                slotStart.setHours(12, 0, 0, 0); // 12:00 PM Adelaide
                
                let slotEnd = new Date(slotStart);
                slotEnd.setHours(13, 0, 0, 0);   // 1:00 PM Adelaide

                if (slotStart > now) {
                    let isBusy = busySlots.some(busy => {
                        let busyStart = new Date(busy.start);
                        let busyEnd = new Date(busy.end);
                        return (slotStart < busyEnd && slotEnd > busyStart);
                    });

                    if (!isBusy) {
                        availableSlots.push({
                            date: slotStart.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' }),
                            iso: slotStart.toISOString() 
                        });
                    }
                }
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }

        res.status(200).json({ success: true, slots: availableSlots });

    } catch (error) {
        console.error("Calendar Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

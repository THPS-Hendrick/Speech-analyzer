const { google } = require('googleapis');
process.env.TZ = 'Australia/Adelaide'; // Force server into Adelaide time

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
        
        let targetMonth = req.query.month ? parseInt(req.query.month) : now.getMonth();
        let targetYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();

        const isCurrentMonth = (targetMonth === now.getMonth() && targetYear === now.getFullYear());
        const timeMin = isCurrentMonth ? now : new Date(targetYear, targetMonth, 1);
        const timeMax = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const maxAllowedDate = new Date(now);
        maxAllowedDate.setMonth(now.getMonth() + 3);
        if (timeMin > maxAllowedDate) {
            return res.status(200).json({ success: true, slots: [] });
        }

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
        
        while (currentDay <= timeMax) {
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
                            // Pass the raw date so the frontend can manipulate it
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

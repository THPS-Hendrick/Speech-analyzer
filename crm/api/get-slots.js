const { google } = require('googleapis');

export default async function handler(req, res) {
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
        
        // 1. Pagination: Determine the requested month/year or default to current
        let targetMonth = req.query.month ? parseInt(req.query.month) : now.getMonth();
        let targetYear = req.query.year ? parseInt(req.query.year) : now.getFullYear();

        // 2. Define the exact boundary for the requested month
        // If the requested month is the current month, start from 'now'. Otherwise, start at the 1st of the month.
        const isCurrentMonth = (targetMonth === now.getMonth() && targetYear === now.getFullYear());
        const timeMin = isCurrentMonth ? now : new Date(targetYear, targetMonth, 1);
        const timeMax = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        // Limit the lookahead to roughly 90 days (3 months)
        const maxAllowedDate = new Date(now);
        maxAllowedDate.setMonth(now.getMonth() + 3);
        if (timeMin > maxAllowedDate) {
            return res.status(200).json({ success: true, slots: [] }); // Prevent booking too far ahead
        }

        // 3. Query Google Free/Busy for the specific month
        const freeBusyResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: timeZone,
                items: [{ id: 'primary' }]
            }
        });
        const busySlots = freeBusyResponse.data.calendars.primary.busy;

        // 4. Generate open 1-hour slots
        let availableSlots = [];
        let currentDay = new Date(timeMin);
        
        while (currentDay <= timeMax) {
            // Skip weekends (0 is Sunday, 6 is Saturday)
            if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) {
                // Check 9 AM through 4 PM (for 1-hour sessions ending at 5 PM)
                for (let hour = 9; hour <= 16; hour++) {
                    let slotStart = new Date(currentDay);
                    slotStart.setHours(hour, 0, 0, 0);
                    let slotEnd = new Date(slotStart);
                    slotEnd.setHours(hour + 1, 0, 0, 0);

                    // Skip slots that have already passed today
                    if (slotStart < now) continue;

                    let isBusy = busySlots.some(busy => {
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
            currentDay.setDate(currentDay.getDate() + 1);
        }

        res.status(200).json({ success: true, slots: availableSlots });

    } catch (error) {
        console.error("Calendar Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

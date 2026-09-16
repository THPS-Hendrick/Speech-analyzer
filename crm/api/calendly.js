export default async function handler(req, res) {
    // Webhooks always use the 'POST' method to send data
    if (req.method === 'POST') {
        const bookingData = req.body;
        
        // This logs the booking payload to your Vercel logs so we can inspect it
        console.log("🔔 New Calendly Booking Received!");
        console.log(JSON.stringify(bookingData, null, 2));

        // Tell Calendly we received the data successfully
        res.status(200).json({ success: true, message: "Webhook received" });
    } else {
        // Block anyone trying to visit this URL directly in their browser
        res.status(405).json({ message: "Only POST requests allowed" });
    }
}

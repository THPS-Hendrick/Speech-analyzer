export default async function handler(req, res) {
    const token = process.env.CALENDLY_API_TOKEN;

    if (!token) {
        return res.status(500).json({ error: "Missing CALENDLY_API_TOKEN in Vercel Environment Variables." });
    }

    try {
        // 1. Get your unique User and Organization URIs from Calendly
        const meResponse = await fetch("https://api.calendly.com/users/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const meData = await meResponse.json();
        
        const userUri = meData.resource.uri;
        const orgUri = meData.resource.current_organization;

        // 2. Figure out your live Vercel URL
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const webhookUrl = `${protocol}://${host}/api/calendly`;

        // 3. Tell Calendly to send bookings to that URL
        const webhookPayload = {
            url: webhookUrl,
            events: ["invitee.created", "invitee.canceled"],
            organization: orgUri,
            user: userUri,
            scope: "user"
        };

        const webhookResponse = await fetch("https://api.calendly.com/webhook_subscriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(webhookPayload)
        });

        const webhookData = await webhookResponse.json();

        // 4. Report the results back to your screen
        if (webhookResponse.ok) {
            res.status(200).json({
                success: true,
                message: `Success! Calendly is now securely linked to ${webhookUrl}`,
                details: webhookData
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Calendly rejected the request.",
                error: webhookData
            });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

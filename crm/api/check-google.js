const { google } = require('googleapis');

export default async function handler(req, res) {
    try {
        // 1. Initialize the Google OAuth2 client using your Vercel Environment Variables
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground" // The authorized redirect URI
        );

        // 2. Set the Refresh Token so you never have to log in manually again
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // 3. Test the connection by requesting your own email address from the Gmail API
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });

        // 4. Send a success message back to the browser
        res.status(200).json({
            success: true,
            message: "Successfully connected to Google Workspace!",
            connectedEmail: profile.data.emailAddress
        });

    } catch (error) {
        console.error("Google API Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to connect to Google.",
            error: error.message
        });
    }
}

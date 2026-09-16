export default function handler(req, res) {
    // This logs to your secure Vercel dashboard, not the public browser console
    console.log("Test API was pinged!");

    // This sends a successful response back to the browser or webhook
    res.status(200).json({ 
        success: true, 
        message: "Your Vercel backend is officially live and ready for Google APIs!" 
    });
}

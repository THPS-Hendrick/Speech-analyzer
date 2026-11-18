const Stripe = require('stripe');
const admin = require('firebase-admin');

// Initialize Firebase Admin once per serverless container
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Verify Firebase ID Token from Authorization header
        const authHeader = req.headers.authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!idToken) {
            return res.status(401).json({ error: 'Missing authentication token. Please sign in again.' });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Load Member profile to retrieve stripeCustomerId
        const memberSnap = await db.collection('Members').doc(uid).get();
        const memberData = memberSnap.exists ? memberSnap.data() : {};

        if (!memberData.stripeCustomerId) {
            return res.status(400).json({
                error: 'No Stripe billing account found for this profile yet. Start a free trial first.'
            });
        }

        // 3. Generate hosted Stripe Customer Portal session
        const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://www.tomhendrick.com');

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: memberData.stripeCustomerId,
            return_url: `${origin}/members/account.html`
        });

        return res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Create Portal Session Error:', error);
        return res.status(500).json({ error: error.message || 'Unable to open billing portal.' });
    }
};

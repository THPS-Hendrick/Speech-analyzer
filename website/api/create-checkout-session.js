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

// Server-side price allowlist (prevents price tampering from the browser)
const ALLOWED_PRICES = {
    monthly: 'price_1Ud8UkJHLc7hqaW6M1bdvYlx', // $9.90 AUD / month
    yearly: 'price_1Ud8UkJHLc7hqaW6tJD7SCkl'   // $99.00 AUD / year
};

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
        const email = decodedToken.email;

        // 2. Validate requested plan
        const { plan } = req.body || {};
        const priceId = ALLOWED_PRICES[plan];
        if (!priceId) {
            return res.status(400).json({ error: 'Invalid subscription plan selected.' });
        }

        // 3. Load Member profile from Firestore
        const memberRef = db.collection('Members').doc(uid);
        const memberSnap = await memberRef.get();
        const memberData = memberSnap.exists ? memberSnap.data() : {};

        // Prevent duplicate active subscriptions
        if (
            memberData.isPro === true &&
            ['active', 'trialing'].includes(memberData.subscriptionStatus)
        ) {
            return res.status(400).json({
                error: 'You already have an active Mic-Check Pro subscription. Use "Manage Subscription" to switch plans.'
            });
        }

        // 4. Reuse or create Stripe Customer linked to Firebase UID
        let stripeCustomerId = memberData.stripeCustomerId || null;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: email || memberData.email,
                name: memberData.name || decodedToken.name || undefined,
                metadata: { firebaseUid: uid }
            });
            stripeCustomerId = customer.id;

            await memberRef.set({
                stripeCustomerId,
                billingProvider: 'stripe'
            }, { merge: true });
        }

        // 5. Grant 7-day free trial only if member has not used a trial before
        const hasUsedTrial = Boolean(memberData.hasUsedTrial);

        const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://www.tomhendrick.com');

        const sessionParams = {
            mode: 'subscription',
            customer: stripeCustomerId,
            client_reference_id: uid,
            customer_update: {
                name: 'auto',
                address: 'auto'
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            payment_method_collection: 'always',
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    firebaseUid: uid,
                    planInterval: plan
                },
                ...(hasUsedTrial ? {} : { trial_period_days: 7 })
            },
            metadata: {
                firebaseUid: uid,
                planInterval: plan
            },
            success_url: `${origin}/members/account.html?checkout=success`,
            cancel_url: `${origin}/members/account.html?checkout=canceled`
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Create Checkout Session Error:', error);
        return res.status(500).json({ error: error.message || 'Unable to start checkout session.' });
    }
};

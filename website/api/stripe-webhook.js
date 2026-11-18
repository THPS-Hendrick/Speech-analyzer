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

// Subscription statuses that grant live access to Mic-Check Pro
const ACCESS_GRANTED_STATUSES = new Set(['trialing', 'active']);

// Read raw request bytes so Stripe signature verification succeeds on Vercel
async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

// Resolve Firebase UID from subscription metadata, customer metadata, or Firestore lookup
async function resolveFirebaseUid(subscription, fallbackUid = null) {
    if (subscription?.metadata?.firebaseUid) {
        return subscription.metadata.firebaseUid;
    }
    if (fallbackUid) {
        return fallbackUid;
    }

    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) return null;

    // Fallback 1: Check Stripe Customer metadata
    try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && customer.metadata?.firebaseUid) {
            return customer.metadata.firebaseUid;
        }
    } catch (err) {
        console.warn('Unable to retrieve Stripe customer metadata:', err.message);
    }

    // Fallback 2: Query Firestore Members by stripeCustomerId
    const snap = await db.collection('Members')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

    if (!snap.empty) {
        return snap.docs[0].id;
    }

    return null;
}

// Sync authoritative Stripe subscription state into Members/{uid}
async function syncSubscriptionToFirestore(subscription, fallbackUid = null) {
    const firebaseUid = await resolveFirebaseUid(subscription, fallbackUid);
    if (!firebaseUid) {
        console.warn(`Webhook skipped: could not map subscription ${subscription.id} to a Firebase UID.`);
        return;
    }

    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || null;

    const status = subscription.status; // 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'
    const isPro = ACCESS_GRANTED_STATUSES.has(status);

    const firstItem = subscription.items?.data?.[0];
    const planInterval = firstItem?.price?.recurring?.interval
        || subscription.metadata?.planInterval
        || null;

    const periodEndUnix = subscription.current_period_end
        || firstItem?.current_period_end
        || null;

    const updatePayload = {
        isPro,
        membershipTier: isPro ? 'pro' : 'free',
        subscriptionStatus: status,
        hasUsedTrial: true,
        billingProvider: 'stripe',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        planInterval,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
        updatedAt: new Date().toISOString()
    };

    await db.collection('Members').doc(firebaseUid).set(updatePayload, { merge: true });
    console.log(`Synced Member ${firebaseUid}: status=${status}, isPro=${isPro}`);
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return res.status(400).json({ error: 'Missing Stripe-Signature header' });
    }

    let event;
    try {
        const rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode === 'subscription' && session.subscription) {
                    const fallbackUid = session.metadata?.firebaseUid || session.client_reference_id || null;
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    await syncSubscriptionToFirestore(subscription, fallbackUid);
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await syncSubscriptionToFirestore(subscription);
                break;
            }

            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription
                    || invoice.parent?.subscription_details?.subscription
                    || null;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    await syncSubscriptionToFirestore(subscription);
                }
                break;
            }

            default:
                // Acknowledge unhandled event types cleanly
                break;
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error(`Error processing Stripe event ${event.type}:`, err);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
}

module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: false
    }
};

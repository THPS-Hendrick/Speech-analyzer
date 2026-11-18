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

// Disable Vercel's default body parser to verify the raw Stripe signature
export const config = {
    api: { bodyParser: false }
};

async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
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

    // Process the completed invoice payment
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Ensure this is an invoice payment from the CRM, not a website membership subscription
        if (session.mode === 'payment' && session.metadata?.type === 'crm_invoice') {
            const invoiceId = session.metadata.invoiceId;

            try {
                const contractRef = db.collection('Contracts').doc(invoiceId);
                const docSnap = await contractRef.get();

                if (docSnap.exists) {
                    const contractData = docSnap.data();
                    const clientEmail = contractData.clientEmail;
                    const amountPaid = (session.amount_total / 100).toFixed(2);
                    
                    // 1. Mark Invoice as Paid
                    await contractRef.update({
                        status: 'paid',
                        paidAt: new Date().toISOString(),
                        stripeSessionId: session.id,
                        paymentMethodType: session.payment_method_types[0] || 'unknown'
                    });

                    // 2. Log Payment in Client's CRM Activity Feed
                    if (clientEmail) {
                        const clientRef = db.collection('Clients').doc(clientEmail.toLowerCase());
                        
                        // We use a green success icon for the action text visually in the CRM UI
                        const actionText = `✅ Invoice Paid Online: $${amountPaid}`;
                        const magicLink = `https://${req.headers.host}/contract.html?id=${invoiceId}`;

                        await clientRef.set({
                            activity_log: admin.firestore.FieldValue.arrayUnion({
                                type: "admin",
                                action: actionText,
                                url: magicLink,
                                timestamp: new Date().toISOString()
                            })
                        }, { merge: true });
                    }
                    
                    console.log(`Successfully marked invoice ${invoiceId} as paid.`);
                }
            } catch (err) {
                console.error(`Error updating CRM for invoice ${invoiceId}:`, err);
                return res.status(500).json({ error: 'Database update failed' });
            }
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
}

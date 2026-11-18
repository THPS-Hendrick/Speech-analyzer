const Stripe = require('stripe');
const admin = require('firebase-admin');

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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { invoiceId } = req.body;

    if (!invoiceId) {
        return res.status(400).json({ error: 'Missing invoiceId' });
    }

    try {
        const docRef = db.collection('Contracts').doc(invoiceId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }

        const contract = docSnap.data();

        if (contract.status === 'paid') {
            return res.status(400).json({ error: 'This invoice has already been paid.' });
        }

        if (contract.status !== 'signed') {
            return res.status(400).json({ error: 'Contract must be signed before payment.' });
        }

        // Smart Routing Threshold: Over $1000 limits to AU BECS Direct Debit (capped at $3.50 fee)
        const amountCents = Math.round(contract.totalFee * 100);
        const paymentMethodTypes = contract.totalFee >= 1000 
            ? ['au_becs_debit'] 
            : ['card', 'au_becs_debit']; // 'link' (Apple/Google Pay) is automatically bundled with 'card'

        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethodTypes,
            mode: 'payment',
            customer_email: contract.clientEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'aud',
                        product_data: {
                            name: `Tax Invoice for ${contract.clientName}`,
                            description: contract.inclusions
                        },
                        unit_amount: amountCents
                    },
                    quantity: 1
                }
            ],
            metadata: {
                invoiceId: invoiceId,
                type: 'crm_invoice'
            },
            // Return back to the contract page, appending a success or cancel flag
            success_url: `${req.headers.origin}/contract.html?id=${invoiceId}&payment=success`,
            cancel_url: `${req.headers.origin}/contract.html?id=${invoiceId}&payment=canceled`
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return res.status(500).json({ error: 'Failed to create checkout session.' });
    }
}

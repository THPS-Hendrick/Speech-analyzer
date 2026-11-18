const admin = require('firebase-admin');

// Safely initialize Firebase Admin "God Mode"
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST requests allowed' });
    }

    const { clientEmail, clientName, description, units, rate, discount, gstMode } = req.body;

    if (!clientEmail || !clientName || !description || !units || !rate) {
        return res.status(400).json({ success: false, message: 'Missing required invoice fields.' });
    }

    try {
        const parsedUnits = parseInt(units) || 1;
        const parsedRate = parseFloat(rate) || 0;
        const parsedDiscount = parseFloat(discount) || 0;
        
        // 1. Math Strategy (Strict 2-Decimal Precision)
        let actualRate = parsedRate;
        if (gstMode === "inclusive") {
            // Reverse calculate the exclusive base rate from the inputted inclusive total
            actualRate = parseFloat((parsedRate / 1.1).toFixed(2));
        }

        const baseAmount = parsedUnits * actualRate;
        const subtotal = Math.max(0, baseAmount - parsedDiscount); 

        let gstAmount = 0;
        if (gstMode === "inclusive" || gstMode === "exclusive") {
            gstAmount = parseFloat((subtotal * 0.10).toFixed(2));
        }
        const totalFee = parseFloat((subtotal + gstAmount).toFixed(2));

        // 2. Construct Line Items array
        let lineItems = [{
            name: "Coaching Services",
            desc: description,
            rate: actualRate,
            qty: parsedUnits
        }];

        if (parsedDiscount > 0) {
            lineItems.push({
                name: "Discount",
                desc: "Fixed discount applied",
                rate: -Math.abs(parsedDiscount), 
                qty: 1
            });
        }

        // 3. Create the invoice document
        const invoiceId = `inv_${Date.now()}`;
        const contractRef = db.collection("Contracts").doc(invoiceId);
        
        await contractRef.set({
            clientName,
            clientEmail,
            clientAddress: "Address on file",
            inclusions: description,
            paymentStructure: "100% Upfront",
            targetDate: new Date().toISOString().split('T')[0],
            gstMode: gstMode, // Save the new explicit mode
            applyGst: (gstMode !== "none"), // Fallback for legacy safety
            lineItems: lineItems,
            totalFee: totalFee,
            status: "signed",      
            type: "invoice_only",  
            createdAt: new Date().toISOString()
        });

        // 4. Update the client's CRM activity log
        const clientRef = db.collection("Clients").doc(clientEmail.toLowerCase());
        await clientRef.update({
            activity_log: admin.firestore.FieldValue.arrayUnion({
                type: "admin",
                action: `Generated Quick Invoice: $${totalFee.toFixed(2)}`,
                timestamp: new Date().toISOString()
            })
        });

        const magicLink = `https://thps-crm.vercel.app/contract.html?id=${invoiceId}`;

        // Return the link straight to the CRM dashboard (Gmail automation removed!)
        res.status(200).json({ success: true, invoiceId: invoiceId, magicLink: magicLink });

    } catch (error) {
        console.error("Quick Invoice Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

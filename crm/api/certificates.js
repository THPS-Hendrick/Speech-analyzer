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
const ADMIN_EMAIL = 'tom@tomhendrick.com';

async function verifyAdmin(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return { ok: false, status: 401, error: 'Missing Authorization token.' };
    }

    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
        return { ok: false, status: 401, error: 'Empty Authorization token.' };
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        if (!decoded.email || decoded.email.toLowerCase() !== ADMIN_EMAIL) {
            return { ok: false, status: 403, error: 'Admin privileges required.' };
        }
        return { ok: true, user: decoded };
    } catch (err) {
        console.error('Auth verification failed:', err.message);
        return { ok: false, status: 401, error: 'Invalid or expired session token.' };
    }
}

export default async function handler(req, res) {
    const authResult = await verifyAdmin(req);
    if (!authResult.ok) {
        return res.status(authResult.status).json({
            success: false,
            error: authResult.error,
            message: authResult.error
        });
    }

    // GET /api/certificates?batchId=cert_...
    if (req.method === 'GET') {
        const { batchId } = req.query || {};
        if (!batchId) {
            return res.status(400).json({
                success: false,
                error: 'Missing batchId query parameter.',
                message: 'Missing batchId query parameter.'
            });
        }

        try {
            const docSnap = await db.collection('Certificates').doc(String(batchId)).get();
            if (!docSnap.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Certificate batch not found.',
                    message: 'Certificate batch not found.'
                });
            }

            return res.status(200).json({
                success: true,
                batch: {
                    id: docSnap.id,
                    ...docSnap.data()
                }
            });
        } catch (err) {
            console.error('Error fetching certificate batch:', err);
            return res.status(500).json({
                success: false,
                error: err.message || 'Failed to load certificate batch.',
                message: err.message || 'Failed to load certificate batch.'
            });
        }
    }

    // POST /api/certificates (Create or update batch + append CRM activity log)
    if (req.method === 'POST') {
        const { batchId, clientEmail, clientName, defaults, certificates } = req.body || {};

        if (!clientEmail || !Array.isArray(certificates) || certificates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing clientEmail or certificates array.',
                message: 'Missing clientEmail or certificates array.'
            });
        }

        try {
            const nowIso = new Date().toISOString();
            const normalizedEmail = String(clientEmail).trim().toLowerCase();
            const safeClientName = String(clientName || normalizedEmail).trim();

            const sanitizedCertificates = certificates.map((cert, index) => ({
                id: String(cert.id || `c_${index + 1}`),
                recipientName: String(cert.recipientName || '').trim(),
                date: String(cert.date || '').trim(),
                programLine: String(cert.programLine || '').trim(),
                connectorLine: String(cert.connectorLine || '').trim(),
                skillsetsLine: String(cert.skillsetsLine || '').trim(),
                footnote: String(cert.footnote || '').trim()
            }));

            const finalBatchId = batchId ? String(batchId).trim() : `cert_${Date.now()}`;
            const batchRef = db.collection('Certificates').doc(finalBatchId);
            const existingSnap = await batchRef.get();
            const isUpdate = existingSnap.exists;

            const host = req.headers.host || 'thps-crm.vercel.app';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const magicLink = `${protocol}://${host}/admin-certificates.html?batchId=${encodeURIComponent(finalBatchId)}`;

            const batchPayload = {
                clientEmail: normalizedEmail,
                clientName: safeClientName,
                defaults: defaults || {},
                certificates: sanitizedCertificates,
                count: sanitizedCertificates.length,
                updatedAt: nowIso
            };

            if (!isUpdate) {
                batchPayload.createdAt = nowIso;
            }

            await batchRef.set(batchPayload, { merge: true });

            // Build human-readable CRM activity log entry
            const count = sanitizedCertificates.length;
            const firstRecipient = sanitizedCertificates[0]?.recipientName || safeClientName;
            let actionText;
            if (count === 1) {
                actionText = isUpdate
                    ? `🎓 Updated Certificate: ${firstRecipient}`
                    : `🎓 Generated Certificate: ${firstRecipient}`;
            } else {
                actionText = isUpdate
                    ? `🎓 Updated Certificate Batch (${count} Certificates)`
                    : `🎓 Generated ${count} Certificates`;
            }

            const clientRef = db.collection('Clients').doc(normalizedEmail);
            await clientRef.set({
                last_contact_date: nowIso,
                manualStageOverride: null,
                activity_log: admin.firestore.FieldValue.arrayUnion({
                    type: 'admin',
                    action: actionText,
                    url: magicLink,
                    timestamp: nowIso
                })
            }, { merge: true });

            return res.status(200).json({
                success: true,
                batchId: finalBatchId,
                magicLink,
                isUpdate,
                count
            });
        } catch (err) {
            console.error('Error saving certificate batch:', err);
            return res.status(500).json({
                success: false,
                error: err.message || 'Failed to save certificate batch.',
                message: err.message || 'Failed to save certificate batch.'
            });
        }
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({
        success: false,
        error: 'Method not allowed.',
        message: 'Method not allowed.'
    });
}
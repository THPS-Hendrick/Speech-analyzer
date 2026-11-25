const { google } = require('googleapis');
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

function extractDriveFolderId(client) {
    if (client.driveFolderId) return String(client.driveFolderId).trim();
    if (!client.driveFolderUrl) return null;
    const match = String(client.driveFolderUrl).match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function isFunFridaysEvent(event) {
    const summary = String(event.summary || '').toLowerCase();
    return summary.includes('fun fridays') || summary.includes('fun friday');
}

function getEventStartIso(event) {
    return event.start?.dateTime || event.start?.date || null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({
            success: false,
            error: 'Only POST requests allowed',
            message: 'Only POST requests allowed'
        });
    }

    const authResult = await verifyAdmin(req);
    if (!authResult.ok) {
        return res.status(authResult.status).json({
            success: false,
            error: authResult.error,
            message: authResult.error
        });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 1. Load canonical Clients map from Firestore
        const clientsSnap = await db.collection('Clients').get();
        const clientsByEmail = {};

        clientsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.email) return;
            const emailKey = String(data.email).trim().toLowerCase();
            if (!clientsByEmail[emailKey] || docSnap.id === emailKey) {
                clientsByEmail[emailKey] = {
                    docId: docSnap.id,
                    emailKey,
                    data
                };
            }
        });

        const clientEntries = Object.values(clientsByEmail);
        if (clientEntries.length === 0) {
            return res.status(200).json({
                success: true,
                syncedCount: 0,
                syncedAt: new Date().toISOString()
            });
        }

        // 2. Global Calendar Query (±12 months)
        const now = new Date();
        const windowStart = new Date(now);
        windowStart.setFullYear(windowStart.getFullYear() - 1);
        const windowEnd = new Date(now);
        windowEnd.setFullYear(windowEnd.getFullYear() + 1);

        const windowStartIso = windowStart.toISOString();
        const windowEndIso = windowEnd.toISOString();

        let calendarEvents = [];
        let pageToken = undefined;

        do {
            const calRes = await calendar.events.list({
                calendarId: 'primary',
                timeMin: windowStartIso,
                timeMax: windowEndIso,
                singleEvents: true,
                showDeleted: false,
                maxResults: 2500,
                pageToken
            });
            if (Array.isArray(calRes.data.items)) {
                calendarEvents = calendarEvents.concat(calRes.data.items);
            }
            pageToken = calRes.data.nextPageToken;
        } while (pageToken);

        // Index active calendar events by attendee email
        const calByEmail = {};
        for (const event of calendarEvents) {
            if (event.status === 'cancelled') continue;
            const attendees = Array.isArray(event.attendees) ? event.attendees : [];
            if (attendees.length === 0) continue;

            const startIso = getEventStartIso(event);
            if (!startIso) continue;

            const isClass = isFunFridaysEvent(event);
            const eventRecord = {
                summary: event.summary || (isClass ? 'Fun Fridays' : 'Coaching Session'),
                start: startIso
            };

            for (const attendee of attendees) {
                if (!attendee.email) continue;
                if (attendee.responseStatus === 'declined') continue;
                const attEmail = attendee.email.trim().toLowerCase();
                if (!clientsByEmail[attEmail]) continue;

                if (!calByEmail[attEmail]) {
                    calByEmail[attEmail] = { sessions: {}, classes: {} };
                }
                if (isClass) {
                    calByEmail[attEmail].classes[event.id] = eventRecord;
                } else {
                    calByEmail[attEmail].sessions[event.id] = eventRecord;
                }
            }
        }

        // 3. Process per-client Gmail + Drive + Additive Calendar Merge in parallel chunks of 8
        const CHUNK_SIZE = 8;
        const syncedAt = new Date().toISOString();

        for (let i = 0; i < clientEntries.length; i += CHUNK_SIZE) {
            const chunk = clientEntries.slice(i, i + CHUNK_SIZE);

            await Promise.all(chunk.map(async ({ emailKey, data }) => {
                // A. Additive Calendar Merge (preserves events older than 12 months)
                const existingSessions = (data.syncedSessions && typeof data.syncedSessions === 'object')
                    ? { ...data.syncedSessions }
                    : {};
                const existingClasses = (data.syncedClasses && typeof data.syncedClasses === 'object')
                    ? { ...data.syncedClasses }
                    : {};

                // Remove events inside the ±12m window that no longer exist on Calendar (cancelled/deleted)
                for (const [evId, evMeta] of Object.entries(existingSessions)) {
                    if (evMeta?.start && evMeta.start >= windowStartIso && evMeta.start <= windowEndIso) {
                        delete existingSessions[evId];
                    }
                }
                for (const [evId, evMeta] of Object.entries(existingClasses)) {
                    if (evMeta?.start && evMeta.start >= windowStartIso && evMeta.start <= windowEndIso) {
                        delete existingClasses[evId];
                    }
                }

                // Merge fresh window matches back in
                const freshCal = calByEmail[emailKey] || { sessions: {}, classes: {} };
                Object.assign(existingSessions, freshCal.sessions);
                Object.assign(existingClasses, freshCal.classes);

                // B. Gmail Unread / Total Counts
                let gmailUnread = typeof data.gmailUnread === 'number' ? data.gmailUnread : 0;
                let gmailTotal = typeof data.gmailTotal === 'number' ? data.gmailTotal : 0;
                let latestGmailIso = null;

                try {
                    const baseQuery = `(from:${emailKey} OR to:${emailKey})`;
                    const [totalRes, unreadRes] = await Promise.all([
                        gmail.users.messages.list({
                            userId: 'me',
                            q: baseQuery,
                            maxResults: 1
                        }),
                        gmail.users.messages.list({
                            userId: 'me',
                            q: `${baseQuery} is:unread`,
                            maxResults: 1
                        })
                    ]);

                    gmailTotal = totalRes.data.resultSizeEstimate ?? 0;
                    gmailUnread = unreadRes.data.resultSizeEstimate ?? 0;

                    // Fetch timestamp of newest message to keep dormancy accurate
                    const newestMsg = totalRes.data.messages?.[0];
                    if (newestMsg?.id) {
                        const msgMeta = await gmail.users.messages.get({
                            userId: 'me',
                            id: newestMsg.id,
                            format: 'minimal'
                        });
                        if (msgMeta.data.internalDate) {
                            latestGmailIso = new Date(Number(msgMeta.data.internalDate)).toISOString();
                        }
                    }
                } catch (gmailErr) {
                    console.warn(`Gmail sync skipped for ${emailKey}:`, gmailErr.message);
                }

                // C. Google Drive New Files Since Last Visit
                let driveNewFiles = 0;
                let latestDriveIso = null;
                const folderId = extractDriveFolderId(data);

                if (folderId) {
                    try {
                        const baselineIso = data.lastDriveVisitedAt || data.createdAt || '1970-01-01T00:00:00.000Z';
                        const safeBaseline = new Date(baselineIso).toISOString();

                        const driveRes = await drive.files.list({
                            q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and modifiedTime > '${safeBaseline}'`,
                            fields: 'files(id, modifiedTime)',
                            orderBy: 'modifiedTime desc',
                            pageSize: 50
                        });

                        const newFiles = driveRes.data.files || [];
                        driveNewFiles = newFiles.length;
                        if (newFiles[0]?.modifiedTime) {
                            latestDriveIso = new Date(newFiles[0].modifiedTime).toISOString();
                        }
                    } catch (driveErr) {
                        console.warn(`Drive sync skipped for ${emailKey}:`, driveErr.message);
                    }
                }

                // D. Compute latest activity timestamp (ignore future calendar events for dormancy)
                const nowMs = Date.now();
                const candidates = [data.last_contact_date, latestGmailIso, latestDriveIso];

                for (const evMeta of [...Object.values(existingSessions), ...Object.values(existingClasses)]) {
                    if (evMeta?.start) {
                        const t = new Date(evMeta.start).getTime();
                        if (!isNaN(t) && t <= nowMs) {
                            candidates.push(new Date(t).toISOString());
                        }
                    }
                }

                let newestContactIso = data.last_contact_date || null;
                let newestContactMs = newestContactIso ? new Date(newestContactIso).getTime() : 0;
                if (isNaN(newestContactMs)) newestContactMs = 0;

                for (const iso of candidates) {
                    if (!iso) continue;
                    const t = new Date(iso).getTime();
                    if (!isNaN(t) && t > newestContactMs) {
                        newestContactMs = t;
                        newestContactIso = new Date(t).toISOString();
                    }
                }

                // E. Persist strictly to sync-owned fields (never overwrite manual fields)
                const updatePayload = {
                    syncedSessions: existingSessions,
                    syncedClasses: existingClasses,
                    gmailUnread,
                    gmailTotal,
                    driveNewFiles,
                    lastSyncedAt: syncedAt
                };

                if (folderId && !data.driveFolderId) {
                    updatePayload.driveFolderId = folderId;
                }
                if (newestContactIso) {
                    updatePayload.last_contact_date = newestContactIso;
                }

                await db.collection('Clients').doc(emailKey).set(updatePayload, { merge: true });
            }));
        }

        return res.status(200).json({
            success: true,
            syncedCount: clientEntries.length,
            syncedAt
        });
    } catch (error) {
        console.error('Workspace Sync Error:', error);
        const message = error.message || 'Failed to sync Google Workspace data.';
        return res.status(500).json({
            success: false,
            error: message,
            message
        });
    }
}

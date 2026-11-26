const { Readable } = require('stream');
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
const MASTER_DRIVE_PARENT_ID = '1A5pxpeaTWyPt7pSnEOOO_VKsggr31Ldn';
const MEMBER_PORTAL_URL = 'https://www.tomhendrick.com/members/login';
const BOOKING_LINK_URL = 'https://www.tomhendrick.com/services/thps-speech-assessment';

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

function getGoogleAuth() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return oauth2Client;
}

function extractDriveFolderId(clientData) {
    if (!clientData) return null;
    if (clientData.driveFolderId) return String(clientData.driveFolderId).trim();
    if (!clientData.driveFolderUrl) return null;
    const match = String(clientData.driveFolderUrl).match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

async function ensureClientDriveFolder(drive, clientRef, clientEmail, clientName) {
    const snap = await clientRef.get();
    const existing = snap.exists ? snap.data() : {};
    const existingId = extractDriveFolderId(existing);

    if (existingId && existing.driveFolderUrl) {
        return {
            folderId: existingId,
            folderUrl: existing.driveFolderUrl,
            createdNow: false
        };
    }

    const folder = await drive.files.create({
        resource: {
            name: `Coaching - ${clientName}`,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [MASTER_DRIVE_PARENT_ID]
        },
        fields: 'id, webViewLink'
    });

    const folderId = folder.data.id;
    const folderUrl = folder.data.webViewLink;

    await drive.permissions.create({
        fileId: folderId,
        requestBody: {
            type: 'user',
            role: 'writer',
            emailAddress: clientEmail
        },
        sendNotificationEmail: true
    });

    const nowIso = new Date().toISOString();
    await clientRef.set({
        name: clientName,
        email: clientEmail,
        driveFolderId: folderId,
        driveFolderUrl: folderUrl,
        lastDriveVisitedAt: nowIso,
        driveNewFiles: 0,
        manualStageOverride: null,
        last_contact_date: nowIso,
        activity_log: admin.firestore.FieldValue.arrayUnion({
            type: 'admin',
            action: 'Generated Google Drive folder',
            url: folderUrl,
            timestamp: nowIso
        })
    }, { merge: true });

    return {
        folderId,
        folderUrl,
        createdNow: true
    };
}

async function sendHtmlEmail(gmail, toEmail, subject, htmlBody) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${toEmail}`,
        `Bcc: ${ADMIN_EMAIL}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody
    ];

    const encodedMessage = Buffer.from(messageParts.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
    });
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

    const { action, clientEmail, clientName } = req.body || {};
    if (!action || !clientEmail) {
        return res.status(400).json({
            success: false,
            error: 'Missing action or clientEmail.',
            message: 'Missing action or clientEmail.'
        });
    }

    const normalizedEmail = String(clientEmail).trim().toLowerCase();
    const safeName = String(clientName || normalizedEmail).trim();
    const firstName = safeName.split(' ')[0] || 'there';
    const clientRef = db.collection('Clients').doc(normalizedEmail);
    const nowIso = new Date().toISOString();

    try {
        const oauth2Client = getGoogleAuth();

        // ============================================================
        // ACTION 1: UPLOAD ASSESSMENT JSON DIRECTLY TO CLIENT DRIVE
        // ============================================================
        if (action === 'upload_drive_json') {
            const { payload, fileName } = req.body;
            if (!payload || typeof payload !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'Missing assessment payload object.',
                    message: 'Missing assessment payload object.'
                });
            }

            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const folderInfo = await ensureClientDriveFolder(drive, clientRef, normalizedEmail, safeName);

            const cleanFileName = String(fileName || `${safeName.replace(/[^a-zA-Z0-9_-]/g, '-')}-Speech-Assessment-${nowIso.slice(0, 10)}.json`);
            const jsonString = JSON.stringify(payload, null, 2);

            const uploaded = await drive.files.create({
                resource: {
                    name: cleanFileName,
                    parents: [folderInfo.folderId]
                },
                media: {
                    mimeType: 'application/json',
                    body: Readable.from([jsonString])
                },
                fields: 'id, name, webViewLink'
            });

            const fileUrl = uploaded.data.webViewLink || folderInfo.folderUrl;

            await clientRef.set({
                lastDriveVisitedAt: nowIso,
                driveNewFiles: 0,
                manualStageOverride: null,
                last_contact_date: nowIso,
                activity_log: admin.firestore.FieldValue.arrayUnion({
                    type: 'admin',
                    action: `Uploaded Speech Assessment JSON (${cleanFileName})`,
                    url: fileUrl,
                    timestamp: nowIso
                })
            }, { merge: true });

            return res.status(200).json({
                success: true,
                folderId: folderInfo.folderId,
                folderUrl: folderInfo.folderUrl,
                fileId: uploaded.data.id,
                fileUrl,
                fileName: cleanFileName
            });
        }

        // ============================================================
        // ACTION 2: OPTION 1 — FREE 1-MONTH TRIAL (DIY) ONBOARDING EMAIL
        // ============================================================
        if (action === 'send_trial_email') {
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const subject = 'Your Free 1-Month THPS Member Portal Trial — Login Instructions';

            const htmlBody = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <p>Hi ${escapeHtml(firstName)},</p>
                    <p>Great chatting with you today! As discussed, I've set you up with <strong>1 month of free DIY access</strong> to the Tom Hendrick Public Speaking (THPS) Member Portal so you can start practising right away.</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">How to Log In &amp; Get Started</h3>
                        <ol style="padding-left: 20px; margin: 12px 0;">
                            <li style="margin-bottom: 8px;">Go to the Member Portal login page:<br>
                                <a href="${MEMBER_PORTAL_URL}" style="color: #4f46e5; font-weight: 600;">${MEMBER_PORTAL_URL}</a>
                            </li>
                            <li style="margin-bottom: 8px;">Sign in or create your account using this email address (<strong>${escapeHtml(normalizedEmail)}</strong>).</li>
                            <li style="margin-bottom: 8px;">Allow microphone access when prompted so the live speech analyzer can measure your pace, pauses, visual language, and vocal variety.</li>
                            <li>Start with <strong>Mic-Check Daily</strong> or <strong>Voice Choice</strong> for 5–10 minutes a day.</li>
                        </ol>
                        <div style="margin-top: 18px;">
                            <a href="${MEMBER_PORTAL_URL}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; display: inline-block;">Open Member Portal</a>
                        </div>
                    </div>

                    <p>If you decide you'd like 1-on-1 coaching feedback alongside your practice, you can book a session anytime here: <a href="${BOOKING_LINK_URL}" style="color: #4f46e5;">${BOOKING_LINK_URL}</a>.</p>
                    <p>Reply directly to this email if you have any trouble logging in!</p>
                    <br>
                    <p>Best regards,<br><strong>Tom Hendrick</strong><br>Tom Hendrick Public Speaking</p>
                </div>
            `;

            await sendHtmlEmail(gmail, normalizedEmail, subject, htmlBody);

            await clientRef.set({
                name: safeName,
                email: normalizedEmail,
                stage: 'Online Classes',
                manualStageOverride: null,
                tags: admin.firestore.FieldValue.arrayUnion('1-Month Free Trial'),
                last_contact_date: nowIso,
                activity_log: admin.firestore.FieldValue.arrayUnion({
                    type: 'admin',
                    action: 'Sent Free 1-Month Trial (DIY) onboarding email',
                    url: MEMBER_PORTAL_URL,
                    timestamp: nowIso
                })
            }, { merge: true });

            return res.status(200).json({
                success: true,
                message: 'Free 1-month trial email sent and logged to CRM.'
            });
        }

        // ============================================================
        // ACTION 3: OPTION 2 & 3 — SEND PACKAGE INVOICE + HUB LINKS
        // ============================================================
        if (action === 'send_package_invoice') {
            const { packageTitle, totalFee, magicLink, customNotes } = req.body;
            if (!magicLink) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing invoice magicLink.',
                    message: 'Missing invoice magicLink.'
                });
            }

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const formattedTotal = `$${Number(totalFee || 0).toFixed(2)} AUD`;
            const subject = `Your THPS Coaching Invoice & Onboarding Links (${packageTitle || 'Coaching Package'})`;

            const notesBlock = customNotes && String(customNotes).trim()
                ? `<p style="background-color: #fefce8; border: 1px solid #fef08a; padding: 12px 16px; border-radius: 8px; color: #854d0e;">${escapeHtml(String(customNotes).trim())}</p>`
                : '';

            const htmlBody = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <p>Hi ${escapeHtml(firstName)},</p>
                    <p>Thank you for choosing the <strong>${escapeHtml(packageTitle || 'THPS Coaching Package')}</strong>! Here are your invoice link, session booking link, and Member Hub login details to get started.</p>
                    ${notesBlock}

                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 22px 0;">
                        <h3 style="margin-top: 0; color: #14532d; font-size: 16px;">1. View &amp; Pay Your Tax Invoice (${escapeHtml(formattedTotal)})</h3>
                        <p style="margin-bottom: 14px; font-size: 14px;">You can pay securely online (Card, Apple Pay, Google Pay, or Bank Transfer) or download a PDF copy via the link below:</p>
                        <a href="${escapeHtml(magicLink)}" style="background-color: #15803d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; display: inline-block;">Open Tax Invoice</a>
                    </div>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 22px 0;">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">2. Book Your Coaching Sessions</h3>
                        <p style="margin-bottom: 10px; font-size: 14px;">Schedule your 1-on-1 sessions at a time that suits you:</p>
                        <a href="${BOOKING_LINK_URL}" style="color: #4f46e5; font-weight: 700;">${BOOKING_LINK_URL}</a>

                        <h3 style="margin-top: 20px; color: #0f172a; font-size: 16px;">3. Log In to the THPS Member Hub (1-Year Access)</h3>
                        <ol style="padding-left: 20px; margin: 8px 0; font-size: 14px;">
                            <li style="margin-bottom: 6px;">Visit <a href="${MEMBER_PORTAL_URL}" style="color: #4f46e5; font-weight: 700;">${MEMBER_PORTAL_URL}</a></li>
                            <li style="margin-bottom: 6px;">Log in with <strong>${escapeHtml(normalizedEmail)}</strong>.</li>
                            <li>Use the speech analyzer, Voice Choice drills, and daily prompts between our sessions.</li>
                        </ol>
                    </div>

                    <p>Let me know if you have any questions at all—looking forward to working together!</p>
                    <br>
                    <p>Best regards,<br><strong>Tom Hendrick</strong><br>Tom Hendrick Public Speaking</p>
                </div>
            `;

            await sendHtmlEmail(gmail, normalizedEmail, subject, htmlBody);

            await clientRef.set({
                name: safeName,
                email: normalizedEmail,
                stage: 'Active',
                manualStageOverride: null,
                last_contact_date: nowIso,
                activity_log: admin.firestore.FieldValue.arrayUnion({
                    type: 'admin',
                    action: `Emailed ${packageTitle || 'Package'} Invoice (${formattedTotal}) + Onboarding Links`,
                    url: magicLink,
                    timestamp: nowIso
                })
            }, { merge: true });

            return res.status(200).json({
                success: true,
                message: 'Invoice and onboarding links emailed to client.'
            });
        }

        // ============================================================
        // ACTION 4: BATCH CALENDAR + GOOGLE MEET INVITATIONS
        // ============================================================
        if (action === 'batch_book_sessions') {
            const { sessions } = req.body;
            if (!Array.isArray(sessions) || sessions.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Provide at least one session date and time.',
                    message: 'Provide at least one session date and time.'
                });
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const createdEvents = [];
            const CHUNK_SIZE = 3;

            for (let i = 0; i < sessions.length; i += CHUNK_SIZE) {
                const chunk = sessions.slice(i, i + CHUNK_SIZE);

                const chunkResults = await Promise.all(chunk.map(async (sess, idx) => {
                    const startDate = new Date(sess.startIso);
                    if (isNaN(startDate.getTime())) {
                        throw new Error(`Invalid session date/time: ${sess.startIso}`);
                    }
                    const durationMins = Number(sess.durationMinutes) || 60;
                    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
                    const summary = String(sess.title || `1-on-1 Public Speaking Coaching - ${safeName}`).trim();

                    const eventPayload = {
                        summary,
                        description: `1-on-1 Public Speaking Coaching session with ${safeName} (${normalizedEmail}).\n\nMember Portal: ${MEMBER_PORTAL_URL}`,
                        start: {
                            dateTime: startDate.toISOString(),
                            timeZone: 'Australia/Adelaide'
                        },
                        end: {
                            dateTime: endDate.toISOString(),
                            timeZone: 'Australia/Adelaide'
                        },
                        attendees: [{ email: normalizedEmail }],
                        conferenceData: {
                            createRequest: {
                                requestId: `thps-batch-${Date.now()}-${i + idx}-${Math.random().toString(36).slice(2, 6)}`,
                                conferenceSolutionKey: { type: 'hangoutsMeet' }
                            }
                        }
                    };

                    const calRes = await calendar.events.insert({
                        calendarId: 'primary',
                        resource: eventPayload,
                        conferenceDataVersion: 1,
                        sendUpdates: 'all'
                    });

                    return {
                        eventId: calRes.data.id,
                        summary,
                        start: startDate.toISOString(),
                        htmlLink: calRes.data.htmlLink,
                        meetLink: calRes.data.hangoutLink || ''
                    };
                }));

                createdEvents.push(...chunkResults);
            }

            // Merge directly into syncedSessions map so Kanban S:# updates immediately
            const sessionMapUpdates = {};
            createdEvents.forEach((ev) => {
                sessionMapUpdates[ev.eventId] = {
                    summary: ev.summary,
                    start: ev.start
                };
            });

            await clientRef.set({
                name: safeName,
                email: normalizedEmail,
                stage: 'Active',
                manualStageOverride: null,
                last_contact_date: nowIso,
                syncedSessions: sessionMapUpdates,
                activity_log: admin.firestore.FieldValue.arrayUnion({
                    type: 'admin',
                    action: `Booked ${createdEvents.length} coaching session${createdEvents.length === 1 ? '' : 's'} (Calendar + Meet invites sent)`,
                    url: createdEvents[0]?.htmlLink || null,
                    timestamp: nowIso
                })
            }, { merge: true });

            return res.status(200).json({
                success: true,
                bookedCount: createdEvents.length,
                events: createdEvents
            });
        }

        return res.status(400).json({
            success: false,
            error: `Unsupported action: ${action}`,
            message: `Unsupported action: ${action}`
        });
    } catch (error) {
        console.error('Onboarding Action Error:', error);
        const message = error.message || 'Failed to complete onboarding action.';
        return res.status(500).json({
            success: false,
            error: message,
            message
        });
    }
}

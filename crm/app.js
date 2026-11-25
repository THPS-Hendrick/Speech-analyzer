import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
    authDomain: "thps-crm.firebaseapp.com",
    projectId: "thps-crm",
    storageBucket: "thps-crm.firebasestorage.app",
    messagingSenderId: "297605373498",
    appId: "1:297605373498:web:606241a173f3150a16df03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global State
let clientsMap = {}; 
let currentFocusClient = null;
let currentAdminUser = null;
let isSyncing = false;

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const SYNC_STORAGE_KEY = 'thps_last_workspace_sync';
const syncStatusBtn = document.getElementById('sync-status-btn');

// 2. Auth Guard
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else if (user.email !== "tom@tomhendrick.com") {
        alert("Unauthorized Access: Admin privileges required.");
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    } else {
        currentAdminUser = user;
        loadClients().then(() => {
            syncWorkspace(false);
        });
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.href = "login.html";
                });
            });
        }
    }
});

// ==========================================
// GOOGLE WORKSPACE BACKGROUND SYNC
// ==========================================
function formatSyncLabel(timestampMs) {
    if (!timestampMs) return 'Sync';
    const diffMins = Math.floor((Date.now() - timestampMs) / 60000);
    if (diffMins < 1) return 'Synced just now';
    if (diffMins === 1) return 'Synced 1m ago';
    if (diffMins < 60) return `Synced ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `Synced ${diffHours}h ago`;
}

async function syncWorkspace(force = false) {
    if (!currentAdminUser || isSyncing) return;

    const lastSyncMs = Number(localStorage.getItem(SYNC_STORAGE_KEY) || 0);
    if (!force && lastSyncMs && (Date.now() - lastSyncMs) < SYNC_COOLDOWN_MS) {
        if (syncStatusBtn) syncStatusBtn.innerText = formatSyncLabel(lastSyncMs);
        return;
    }

    isSyncing = true;
    if (syncStatusBtn) {
        syncStatusBtn.innerText = 'Syncing...';
    }

    try {
        const idToken = await currentAdminUser.getIdToken();
        const res = await fetch('/api/sync-workspace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.error || result.message || 'Workspace sync failed.');
        }

        const nowMs = Date.now();
        localStorage.setItem(SYNC_STORAGE_KEY, String(nowMs));
        if (syncStatusBtn) {
            syncStatusBtn.innerText = formatSyncLabel(nowMs);
        }

        await loadClients();

        // Refresh open modal counters live if a client card is currently open
        if (currentFocusClient) {
            const key = currentFocusClient.email.toLowerCase();
            if (clientsMap[key]) {
                openFocusModal(clientsMap[key]);
            }
        }
    } catch (err) {
        console.warn('Workspace sync warning:', err.message);
        if (syncStatusBtn) {
            syncStatusBtn.innerText = 'Sync retry';
        }
    } finally {
        isSyncing = false;
    }
}

if (syncStatusBtn) {
    syncStatusBtn.addEventListener('click', () => syncWorkspace(true));
}

// ==========================================
// RECENCY & STAGE RESOLUTION HELPERS
// ==========================================
function getLastActivityTimestamp(client) {
    let latest = 0;

    if (Array.isArray(client.activity_log) && client.activity_log.length > 0) {
        latest = client.activity_log.reduce((max, entry) => {
            const t = new Date(entry.timestamp).getTime();
            return (!isNaN(t) && t > max) ? t : max;
        }, 0);
    }

    const contactTime = client.last_contact_date ? new Date(client.last_contact_date).getTime() : NaN;
    if (!isNaN(contactTime) && contactTime > latest) {
        latest = contactTime;
    }

    if (latest > 0) return latest;

    const fallback = client.createdAt || client.created_at;
    const fallbackTime = fallback ? new Date(fallback).getTime() : NaN;
    return !isNaN(fallbackTime) ? fallbackTime : Date.now();
}

function resolveClientStage(client) {
    if (client.manualStageOverride === "Cold" || client.manualStageOverride === "Dormant") {
        return client.manualStageOverride;
    }

    const daysInactive = (Date.now() - getLastActivityTimestamp(client)) / (1000 * 60 * 60 * 24);
    if (daysInactive >= 30) return "Dormant";
    if (daysInactive >= 7) return "Cold";

    if (client.stage === "Enquiry Received") return "Enquiry Received";
    if (client.stage === "Online Classes" || client.stage === "Friday Class RSVP") return "Online Classes";
    return "Active";
}

// 3. HTML Card Builder
function createClientCard(client) {
    let tagsHtml = (client.tags || []).map(tag => 
        `<span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">${tag}</span>`
    ).join('');

    const emailKey = client.email.toLowerCase();

    const syncedSessionsCount = (client.syncedSessions && typeof client.syncedSessions === 'object')
        ? Object.keys(client.syncedSessions).length
        : 0;
    const syncedClassesCount = (client.syncedClasses && typeof client.syncedClasses === 'object')
        ? Object.keys(client.syncedClasses).length
        : 0;
    const legacySessionsCount = Array.isArray(client.bookedSessions) ? client.bookedSessions.length : 0;
    const legacyClassesCount = Array.isArray(client.bookedDates) ? client.bookedDates.length : 0;

    const sessionsCount = Math.max(syncedSessionsCount, legacySessionsCount);
    const classesCount = Math.max(syncedClassesCount, legacyClassesCount);

    const unreadCount = Number(client.gmailUnread || 0);
    const newDriveCount = Number(client.driveNewFiles || 0);
    const hasAlerts = unreadCount > 0 || newDriveCount > 0;

    const alertTitleParts = [];
    if (unreadCount > 0) alertTitleParts.push(`${unreadCount} unread email${unreadCount === 1 ? '' : 's'}`);
    if (newDriveCount > 0) alertTitleParts.push(`${newDriveCount} new Drive file${newDriveCount === 1 ? '' : 's'}`);

    const alertBadge = hasAlerts
        ? `<span title="${alertTitleParts.join(' • ')}" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-extrabold flex-shrink-0 border border-red-200">!</span>`
        : '';

    const totalChargedFormatted = parseFloat(client.totalCharged || 0).toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    let cardHtml = `
    <div class="client-card bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all mb-3 cursor-pointer" data-id="${emailKey}">
        <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-gray-800">${client.name}</h3>
            ${alertBadge}
        </div>
        <p class="text-sm text-gray-500 mt-1 mb-3">${client.email}</p>
        <div class="flex flex-wrap gap-2">
            ${tagsHtml}
        </div>
        <div class="mt-2.5 flex items-center gap-2 text-xs font-bold text-slate-700">
            <span class="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">S:${sessionsCount} C:${classesCount}</span>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-100 text-xs font-semibold text-slate-600">
            Total Charged: $${totalChargedFormatted}
        </div>
    `;

    if (client.bookedDates && client.bookedDates.length > 0) {
        const dateListItems = client.bookedDates.map(iso => {
            const readableDate = new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
            return `<li>${readableDate}</li>`;
        }).join('');
        
        cardHtml += `
        <details class="text-sm border border-gray-200 rounded-md p-2 mt-3 bg-gray-50 card-details-stop">
            <summary class="font-medium text-blue-600 cursor-pointer outline-none select-none">
                Classes Booked (${client.bookedDates.length})
            </summary>
            <ul class="mt-2 pl-4 list-disc text-gray-600 space-y-1">
                ${dateListItems}
            </ul>
        </details>
        `;
    }

    cardHtml += `</div>`;
    return cardHtml;
}

// 4. Fetch and Load Data
async function loadClients() {
    try {
        const querySnapshot = await getDocs(collection(db, "Clients"));
        
        const cols = ["col-enquiry", "col-online-classes", "col-active", "col-cold", "col-dormant"];
        cols.forEach(col => {
            const el = document.getElementById(col);
            if (el) el.innerHTML = "";
        });
        
        clientsMap = {}; 

        querySnapshot.forEach((docSnap) => {
            const clientData = docSnap.data();
            if (!clientData.email) return;
            const emailKey = clientData.email.toLowerCase();

            // Prefer canonical email-keyed document if legacy duplicates exist
            if (!clientsMap[emailKey] || docSnap.id === emailKey) {
                clientsMap[emailKey] = clientData;
            }
        });

        Object.values(clientsMap).forEach((clientData) => {
            const resolvedStage = resolveClientStage(clientData);
            
            let colId = "col-active";
            if (resolvedStage === "Enquiry Received") colId = "col-enquiry";
            if (resolvedStage === "Online Classes") colId = "col-online-classes";
            if (resolvedStage === "Active") colId = "col-active";
            if (resolvedStage === "Cold") colId = "col-cold";
            if (resolvedStage === "Dormant") colId = "col-dormant";
            
            const columnElement = document.getElementById(colId);
            if (columnElement) columnElement.innerHTML += createClientCard(clientData);
        });

        document.querySelectorAll('.client-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('details')) return; 
                
                const emailKey = card.getAttribute('data-id');
                if (clientsMap[emailKey]) {
                    openFocusModal(clientsMap[emailKey]);
                }
            });
        });

    } catch (error) {
        console.error("Error loading clients from Firebase:", error);
    }
}

// 5. Client Focus Modal Logic (Activity Log, Routing, Workspace Status, Drive & Billing)
const focusModal = document.getElementById('client-focus-modal');
const closeFocusModalBtn = document.getElementById('close-focus-modal');
const focusStageSelect = document.getElementById('focus-stage-select');
const btnDriveToggle = document.getElementById('btn-drive-toggle');

// Workspace Status Elements
const btnClientEmails = document.getElementById('btn-client-emails');
const focusEmailCounts = document.getElementById('focus-email-counts');
const focusGoogleReview = document.getElementById('focus-google-review');

// Billing & Document Elements
const btnFullContract = document.getElementById('btn-full-contract');
const btnQuickInvoiceToggle = document.getElementById('btn-quick-invoice-toggle');
const btnCertificates = document.getElementById('btn-certificates');
const quickInvoiceForm = document.getElementById('quick-invoice-form');

function updateDriveToggleButton(client) {
    if (!btnDriveToggle) return;
    if (client.driveFolderUrl) {
        const newCount = Number(client.driveNewFiles || 0);
        const badgeHtml = newCount > 0
            ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">[${newCount} new]</span>`
            : '';
        btnDriveToggle.innerHTML = `<span>Go to Drive</span> ${badgeHtml}`;
        btnDriveToggle.className = "w-full mb-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-md shadow-sm hover:bg-blue-700 transition-colors flex justify-center items-center gap-2";
    } else {
        btnDriveToggle.innerText = "Generate Drive";
        btnDriveToggle.className = "w-full mb-3 border-2 border-blue-600 text-blue-600 font-bold py-3 px-4 rounded-md hover:bg-blue-50 transition-colors flex justify-center items-center gap-2";
    }
}

function openFocusModal(client) {
    currentFocusClient = client;
    
    document.getElementById('focus-name').innerText = client.name;
    document.getElementById('focus-email').innerText = client.email;
    focusStageSelect.value = resolveClientStage(client);

    // Sync Workspace Status Row (Emails [X/Y] + Manual Google Review Toggle)
    const unreadCount = Number(client.gmailUnread || 0);
    const totalCount = Number(client.gmailTotal || 0);
    if (focusEmailCounts) {
        focusEmailCounts.innerText = `[${unreadCount}/${totalCount}]`;
        focusEmailCounts.className = unreadCount > 0 ? 'text-red-600 font-extrabold' : 'text-slate-600';
    }
    if (btnClientEmails) {
        btnClientEmails.href = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(client.email)}`;
    }
    if (focusGoogleReview) {
        focusGoogleReview.checked = Boolean(client.googleReview);
    }

    // Reset the mini-form state every time the modal opens
    quickInvoiceForm.reset();
    quickInvoiceForm.classList.add('hidden');

    // Sync Generate Drive / Go to Drive [X new] button state
    updateDriveToggleButton(client);

    const logContainer = document.getElementById('focus-activity-log');
    logContainer.innerHTML = '';
    
    const logs = client.activity_log || [];
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (sortedLogs.length === 0) {
        logContainer.innerHTML = '<p class="text-gray-500 italic text-sm">No activity recorded yet.</p>';
    } else {
        sortedLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString('en-AU', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const isAdmin = log.type === 'admin';
            
            const bgClass = isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200';
            const badge = isAdmin ? '<span class="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2">Admin</span>' : '';
            const linkBadge = log.url 
                ? '<span class="text-xs font-bold text-blue-600 group-hover:underline ml-2">Open Document ↗</span>' 
                : '';

            const cardContent = `
                <div class="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                    <div class="font-bold text-gray-800 flex items-center">
                        ${isAdmin ? 'Tom Hendrick' : client.name} ${badge}
                    </div>
                    <span class="text-xs text-gray-500 font-medium">${date}</span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-gray-700 font-medium">${log.action}</p>
                    ${linkBadge}
                </div>
            `;
            
            if (log.url) {
                logContainer.innerHTML += `
                    <a href="${log.url}" target="_blank" rel="noopener noreferrer" class="group block ${bgClass} border rounded-lg p-4 shadow-sm text-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer">
                        ${cardContent}
                    </a>
                `;
            } else {
                logContainer.innerHTML += `
                    <div class="${bgClass} border rounded-lg p-4 shadow-sm text-sm">
                        ${cardContent}
                    </div>
                `;
            }
        });
    }
    
    focusModal.classList.remove('hidden');
}

closeFocusModalBtn.addEventListener('click', () => {
    focusModal.classList.add('hidden');
    currentFocusClient = null;
});

// Manual Google Review Toggle
if (focusGoogleReview) {
    focusGoogleReview.addEventListener('change', async (e) => {
        if (!currentFocusClient) return;
        const checked = e.target.checked;
        const clientId = currentFocusClient.email.toLowerCase();
        const clientRef = doc(db, "Clients", clientId);

        try {
            await setDoc(clientRef, {
                googleReview: checked
            }, { merge: true });

            currentFocusClient.googleReview = checked;
            if (clientsMap[clientId]) {
                clientsMap[clientId].googleReview = checked;
            }
        } catch (err) {
            console.error("Error updating Google Review status:", err);
            e.target.checked = !checked;
            alert("Failed to update Google Review status.");
        }
    });
}

// Manual Stage Routing
focusStageSelect.addEventListener('change', async (e) => {
    if (!currentFocusClient) return;
    
    const newStage = e.target.value;
    const clientId = currentFocusClient.email.toLowerCase();
    const clientRef = doc(db, "Clients", clientId);
    const nowIso = new Date().toISOString();

    try {
        if (newStage === "Cold" || newStage === "Dormant") {
            // Set manual override without resetting inactivity timestamp
            await setDoc(clientRef, {
                stage: newStage,
                manualStageOverride: newStage
            }, { merge: true });

            currentFocusClient.stage = newStage;
            currentFocusClient.manualStageOverride = newStage;
        } else {
            // Clear manual override and log fresh activity timestamp
            await setDoc(clientRef, {
                stage: newStage,
                manualStageOverride: null,
                last_contact_date: nowIso,
                activity_log: arrayUnion({
                    type: "admin",
                    action: `Moved stage to: ${newStage}`,
                    timestamp: nowIso
                })
            }, { merge: true });

            currentFocusClient.stage = newStage;
            currentFocusClient.manualStageOverride = null;
            currentFocusClient.last_contact_date = nowIso;
            if (!currentFocusClient.activity_log) currentFocusClient.activity_log = [];
            currentFocusClient.activity_log.push({
                type: "admin",
                action: `Moved stage to: ${newStage}`,
                timestamp: nowIso
            });
        }

        await loadClients();
        openFocusModal(currentFocusClient); 
        
    } catch (error) {
        console.error("Error updating stage:", error);
        alert("Failed to update stage.");
    }
});

// ==========================================
// GOOGLE DRIVE TOGGLE LOGIC
// ==========================================
if (btnDriveToggle) {
    btnDriveToggle.addEventListener('click', async () => {
        if (!currentFocusClient) return;

        // If folder already exists, open it in a new tab & clear [X new] badge
        if (currentFocusClient.driveFolderUrl) {
            window.open(currentFocusClient.driveFolderUrl, '_blank', 'noopener,noreferrer');

            const nowIso = new Date().toISOString();
            const clientId = currentFocusClient.email.toLowerCase();
            const clientRef = doc(db, "Clients", clientId);

            try {
                await setDoc(clientRef, {
                    lastDriveVisitedAt: nowIso,
                    driveNewFiles: 0
                }, { merge: true });

                currentFocusClient.lastDriveVisitedAt = nowIso;
                currentFocusClient.driveNewFiles = 0;
                updateDriveToggleButton(currentFocusClient);
                await loadClients();
            } catch (err) {
                console.warn("Could not update lastDriveVisitedAt:", err);
            }
            return;
        }

        btnDriveToggle.disabled = true;
        btnDriveToggle.innerText = "Generating Drive...";

        try {
            const res = await fetch('/api/create-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentFocusClient.email,
                    name: current

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
let clientsMap = {}; // Stores client data in memory for instant modal popups
let currentFocusClient = null;

// 2. Auth Guard: Check Login Status & Admin Email
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else if (user.email !== "tom@tomhendrick.com") {
        alert("Unauthorized Access: Admin privileges required.");
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    } else {
        loadClients();
        
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

// 3. HTML Card Builder
function createClientCard(client) {
    let tagsHtml = (client.tags || []).map(tag => 
        `<span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">${tag}</span>`
    ).join('');

    const emailKey = client.email.toLowerCase();

    // We add 'client-card' class and 'data-id' to make it clickable
    let cardHtml = `
    <div class="client-card bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all mb-3 cursor-pointer" data-id="${emailKey}">
        <h3 class="font-bold text-gray-800">${client.name}</h3>
        <p class="text-sm text-gray-500 mt-1 mb-3">${client.email}</p>
        <div class="flex flex-wrap gap-2">
            ${tagsHtml}
        </div>
    `;

    if (client.stage === "Friday Class RSVP" && client.bookedDates && client.bookedDates.length > 0) {
        const dateListItems = client.bookedDates.map(iso => {
            const readableDate = new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
            return `<li>${readableDate}</li>`;
        }).join('');
        
        cardHtml += `
        <details class="text-sm border border-gray-200 rounded-md p-2 mt-4 bg-gray-50 card-details-stop">
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
        
        const cols = ["col-enquiry", "col-online-classes", "col-assessment", "col-session1", "col-session2", "col-session3", "col-session4"];
        cols.forEach(col => {
            const el = document.getElementById(col);
            if(el) el.innerHTML = "";
        });
        
        clientsMap = {}; // Reset the dictionary

        querySnapshot.forEach((doc) => {
            const clientData = doc.data();
            const emailKey = clientData.email.toLowerCase();
            clientsMap[emailKey] = clientData; // Save to memory
            
            let colId = "";
            if (clientData.stage === "Enquiry Received") colId = "col-enquiry";
            if (clientData.stage === "Friday Class RSVP") colId = "col-online-classes";
            if (clientData.stage === "Assessment Booked") colId = "col-assessment";
            if (clientData.stage === "Session 1 Booked") colId = "col-session1";
            if (clientData.stage === "Session 2 Booked") colId = "col-session2";
            if (clientData.stage === "Session 3 Booked") colId = "col-session3";
            if (clientData.stage === "Session 4 Booked") colId = "col-session4";
            
            if (colId) {
                const columnElement = document.getElementById(colId);
                if (columnElement) columnElement.innerHTML += createClientCard(clientData);
            }
        });

        // Attach click listeners to all freshly rendered cards
        document.querySelectorAll('.client-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open modal if they just clicked the details dropdown
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

// 5. Client Focus Modal Logic (Activity Log & Routing)
const focusModal = document.getElementById('client-focus-modal');
const closeFocusModalBtn = document.getElementById('close-focus-modal');
const focusStageSelect = document.getElementById('focus-stage-select');
const btnDriveFolder = document.getElementById('btn-drive-folder');
const btnQuickInvoice = document.getElementById('btn-quick-invoice');

function openFocusModal(client) {
    currentFocusClient = client;
    
    document.getElementById('focus-name').innerText = client.name;
    document.getElementById('focus-email').innerText = client.email;
    focusStageSelect.value = client.stage;

    // Toggle Drive folder button visibility
    if (client.driveFolderUrl) {
        btnDriveFolder.href = client.driveFolderUrl;
        btnDriveFolder.classList.remove('hidden');
        btnDriveFolder.classList.add('flex');
    } else {
        btnDriveFolder.classList.add('hidden');
        btnDriveFolder.classList.remove('flex');
    }

    // Render Activity Log (Sorted newest to oldest)
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
            
            // Visual styling based on who performed the action
            const bgClass = isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200';
            const badge = isAdmin ? '<span class="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2">Admin</span>' : '';
            
            logContainer.innerHTML += `
                <div class="${bgClass} border rounded-lg p-4 shadow-sm text-sm">
                    <div class="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                        <div class="font-bold text-gray-800 flex items-center">
                            ${isAdmin ? 'Tom Hendrick' : client.name} ${badge}
                        </div>
                        <span class="text-xs text-gray-500 font-medium">${date}</span>
                    </div>
                    <p class="text-gray-700 font-medium">${log.action}</p>
                </div>
            `;
        });
    }
    
    focusModal.classList.remove('hidden');
}

closeFocusModalBtn.addEventListener('click', () => {
    focusModal.classList.add('hidden');
    currentFocusClient = null;
});

// Stage Routing & Drive Automation
focusStageSelect.addEventListener('change', async (e) => {
    if (!currentFocusClient) return;
    
    const newStage = e.target.value;
    const clientId = currentFocusClient.email.toLowerCase();
    const clientRef = doc(db, "Clients", clientId);

    try {
        await updateDoc(clientRef, {
            stage: newStage,
            activity_log: arrayUnion({
                type: "admin",
                action: `Moved stage to: ${newStage}`,
                timestamp: new Date().toISOString()
            })
        });

        // 1. Update the local dictionary so the modal stays accurate if we don't refresh
        currentFocusClient.stage = newStage;
        if (!currentFocusClient.activity_log) currentFocusClient.activity_log = [];
        currentFocusClient.activity_log.push({
            type: "admin",
            action: `Moved stage to: ${newStage}`,
            timestamp: new Date().toISOString()
        });

        // 2. Drive folder automation check
        const qualifiesForDrive = (newStage === "Assessment Booked" || newStage === "Session 1 Booked");
        if (qualifiesForDrive && !currentFocusClient.driveFolderUrl) {
            console.log("Triggering Drive creation in background...");
            // Notice there is no 'await' here. This lets the UI update instantly!
            fetch('/api/create-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: clientId, name: currentFocusClient.name })
            });
        }

        // 3. Silently refresh the Kanban board in the background
        loadClients();
        openFocusModal(currentFocusClient); // Re-render the modal to show the new log bubble!
        
    } catch (error) {
        console.error("Error updating stage:", error);
        alert("Failed to update stage.");
    }
});

// Quick Invoice Placeholder
btnQuickInvoice.addEventListener('click', () => {
    alert("Quick Invoice backend coming next! We will build /api/quick-invoice shortly.");
});

// 6. New Client Modal Logic (Deduplication Upgrade)
const newClientBtn = document.getElementById('new-client-btn');
const newClientModal = document.getElementById('new-client-modal');
const closeModalX = document.getElementById('close-modal-x');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const newClientForm = document.getElementById('new-client-form');
const saveClientBtn = document.getElementById('save-client-btn');

if (newClientBtn) {
    newClientBtn.addEventListener('click', () => newClientModal.classList.remove('hidden'));
}

const closeNewClientModal = () => {
    newClientModal.classList.add('hidden');
    newClientForm.reset();
};

if (closeModalX) closeModalX.addEventListener('click', closeNewClientModal);
if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeNewClientModal);

if (newClientForm) {
    newClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveClientBtn.disabled = true;
        saveClientBtn.innerText = "Saving...";

        try {
            const rawEmail = document.getElementById('modal-email').value;
            const clientId = rawEmail.toLowerCase();
            const clientRef = doc(db, "Clients", clientId);

            // We use setDoc with { merge: true } to enforce the Email Deduplication rule
            await setDoc(clientRef, {
                name: document.getElementById('modal-name').value,
                email: rawEmail,
                tags: arrayUnion(document.getElementById('modal-source').value), // Appends tags safely
                stage: "Enquiry Received",
                createdAt: new Date().toISOString(),
                last_contact_date: new Date().toISOString(),
                activity_log: arrayUnion({
                    type: "admin",
                    action: "Manually added to CRM Pipeline",
                    timestamp: new Date().toISOString()
                })
            }, { merge: true });

            closeNewClientModal();
            window.location.reload(); 
        } catch (error) {
            console.error("Error adding client: ", error);
            alert("Failed to add client. Check console.");
        } finally {
            saveClientBtn.disabled = false;
            saveClientBtn.innerText = "Save";
        }
    });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// 2. Auth Guard: Check Login Status & Admin Email
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not logged in
        window.location.href = "login.html";
    } else if (user.email !== "tom@tomhendrick.com") {
        // Logged in, but WRONG account
        alert("Unauthorized Access: Admin privileges required.");
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    } else {
        // Logged in AND verified as Admin
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

    let cardHtml = `
    <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3 cursor-grab">
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
        <details class="text-sm border border-gray-200 rounded-md p-2 mt-4 bg-gray-50">
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
        
        querySnapshot.forEach((doc) => {
            const clientData = doc.data();
            
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
    } catch (error) {
        console.error("Error loading clients from Firebase:", error);
    }
}

// 5. New Client Modal Logic
const newClientBtn = document.getElementById('new-client-btn');
const newClientModal = document.getElementById('new-client-modal');
const closeModalX = document.getElementById('close-modal-x');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const newClientForm = document.getElementById('new-client-form');
const saveClientBtn = document.getElementById('save-client-btn');

if (newClientBtn) {
    newClientBtn.addEventListener('click', () => newClientModal.classList.remove('hidden'));
}

const closeModal = () => {
    newClientModal.classList.add('hidden');
    newClientForm.reset();
};

if (closeModalX) closeModalX.addEventListener('click', closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

if (newClientForm) {
    newClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveClientBtn.disabled = true;
        saveClientBtn.innerText = "Saving...";

        try {
            await addDoc(collection(db, "Clients"), {
                name: document.getElementById('modal-name').value,
                email: document.getElementById('modal-email').value,
                tags: [document.getElementById('modal-source').value],
                stage: "Enquiry Received",
                createdAt: new Date().toISOString(),
                last_contact_date: new Date().toISOString()
            });

            closeModal();
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

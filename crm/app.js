import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDOUyOnxrYzL_lFe86pA5M61CI1N7ER5gU",
  authDomain: "thps-crm.firebaseapp.com",
  projectId: "thps-crm",
  storageBucket: "thps-crm.firebasestorage.app",
  messagingSenderId: "297605373498",
  appId: "1:297605373498:web:606241a173f3150a16df03"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Function to build the HTML card dynamically
function createClientCard(client) {
    // Map the array of tags into colorful HTML spans
    let tagsHtml = (client.tags || []).map(tag => 
        `<span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">${tag}</span>`
    ).join('');

    return `
    <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <h3 class="font-bold text-gray-800">${client.name}</h3>
        <p class="text-sm text-gray-500 mt-1">${client.email}</p>
        <div class="flex flex-wrap gap-2 mt-3">
            ${tagsHtml}
        </div>
    </div>
    `;
}

// 3. Fetch data and place it in columns
async function loadClients() {
    try {
        const querySnapshot = await getDocs(collection(db, "Clients"));
        
        // Clear columns before loading to prevent duplicates if you run this twice
        document.getElementById("col-enquiry").innerHTML = "";
        document.getElementById("col-assessment").innerHTML = "";
        
        querySnapshot.forEach((doc) => {
            const clientData = doc.data();
            
            // Determine which column this client belongs in
            let colId = "";
            if (clientData.stage === "Enquiry Received") colId = "col-enquiry";
            if (clientData.stage === "Assessment Booked") colId = "col-assessment";
            if (clientData.stage === "Session 1 Booked") colId = "col-session1";
            if (clientData.stage === "Session 2 Booked") colId = "col-session2";
            if (clientData.stage === "Session 3 Booked") colId = "col-session3";
            if (clientData.stage === "Session 4 Booked") colId = "col-session4";
            
            if (colId) {
                const columnElement = document.getElementById(colId);
                if (columnElement) {
                    columnElement.innerHTML += createClientCard(clientData);
                }
            }
        });
        console.log("Successfully loaded clients!");
    } catch (error) {
        console.error("Error loading clients from Firebase:", error);
    }
}

// Run this function when the page loads
loadClients();


// --- 4. NEW CLIENT MODAL LOGIC ---
const newClientBtn = document.getElementById('new-client-btn');
const newClientModal = document.getElementById('new-client-modal');
const closeModalX = document.getElementById('close-modal-x');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const newClientForm = document.getElementById('new-client-form');
const saveClientBtn = document.getElementById('save-client-btn');

// Open Modal
newClientBtn.addEventListener('click', () => {
    newClientModal.classList.remove('hidden');
});

// Close Modal
const closeModal = () => {
    newClientModal.classList.add('hidden');
    newClientForm.reset(); // Clear inputs when closing
};
closeModalX.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// Save Data to Firebase
newClientForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page from refreshing early
    saveClientBtn.disabled = true;
    saveClientBtn.innerText = "Saving...";

    try {
        await addDoc(collection(db, "Clients"), {
            name: document.getElementById('modal-name').value,
            email: document.getElementById('modal-email').value,
            tags: [document.getElementById('modal-source').value], // Saving as an array for your tag bubbles
            stage: "Enquiry Received", // Drops them directly into column 1
            createdAt: new Date().toISOString(),
            last_contact_date: new Date().toISOString()
        });

        closeModal();
        // Reload the page to fetch the newly updated list of clients
        window.location.reload(); 
    } catch (error) {
        console.error("Error adding client: ", error);
        alert("Failed to add client. Check console.");
    } finally {
        saveClientBtn.disabled = false;
        saveClientBtn.innerText = "Save";
    }
});

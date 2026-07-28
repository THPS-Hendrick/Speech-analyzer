// Phase 3: The Brain (Auth + Database Sync)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDv6NFyiPUEhRCJtSLzA2bi5wwaz5o4_Y",
    authDomain: "thps-portal.firebaseapp.com",
    projectId: "thps-portal",
    storageBucket: "thps-portal.firebasestorage.app",
    messagingSenderId: "413378317664",
    appId: "1:413378317664:web:53198604a39321f197e205"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to determine the Wreath Color based on your XP rules
function getWreathColorClass(xp) {
    if (xp >= 10000) return 'wreath-gold';
    if (xp >= 5000) return 'wreath-silver';
    if (xp >= 3000) return 'wreath-red';
    if (xp >= 1000) return 'wreath-blue';
    if (xp >= 100) return 'wreath-green';
    return 'wreath-yellow'; // Base level
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Silently Authenticate the User
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Logged in as Anonymous UID:", user.uid);
            document.getElementById('user-initial').innerText = "U"; // 'U' for User, since they are anonymous
            
            // 2. Fetch or Create Database Profile
            const userRef = doc(db, "users", user.uid);
            let userSnap = await getDoc(userRef);
            let userData = {};

            if (userSnap.exists()) {
                userData = userSnap.data();
            } else {
                // Brand new user! Create their starting stats
                userData = {
                    xp: 0,
                    streak: 1,
                    unlockedTrophies: [] // Array of trophy IDs they have earned
                };
                await setDoc(userRef, userData);
            }

            // 3. Update the UI with Database info
            document.getElementById('xp-counter').innerText = `${userData.xp.toLocaleString()} XP`;
            document.getElementById('streak-counter').innerText = userData.streak;

            // Change Laurel Wreath color dynamically
            const wreathSvg = document.querySelector('svg.drop-shadow-sm');
            wreathSvg.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(userData.xp)}`;

            // 4. Fetch the UI Content (JSON) and cross-reference with Database
            loadContentAndRender(userData, userRef);

        } else {
            // Trigger the anonymous login if they aren't logged in yet
            signInAnonymously(auth).catch((error) => console.error("Auth Error:", error.message));
        }
    });

    async function loadContentAndRender(userData, userRef) {
        try {
            const response = await fetch('content.json');
            const data = await response.json();
            
            // Render Daily Quest
            document.getElementById('quest-title').innerText = data.dailyQuest.title;
            document.getElementById('quest-desc').innerText = data.dailyQuest.description;
            document.getElementById('quest-xp').innerText = "+" + data.dailyQuest.xp;

            // TEST FUNCTION: Wire the "Start Recording" button to actually give XP to test the database!
            const startBtn = document.querySelector('.btn-chunky-primary');
            startBtn.addEventListener('click', async () => {
                const newXp = userData.xp + data.dailyQuest.xp;
                await updateDoc(userRef, { xp: newXp }); // Save to Firebase
                userData.xp = newXp; // Update local memory
                
                // Update UI instantly
                document.getElementById('xp-counter').innerText = `${newXp.toLocaleString()} XP`;
                const wreathSvg = document.querySelector('svg.drop-shadow-sm');
                wreathSvg.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(newXp)}`;
                
                alert(`Boom! +${data.dailyQuest.xp} XP added and saved to Firebase!`);
            });

            // Render Prompts
            const promptsContainer = document.getElementById('prompts-container');
            promptsContainer.innerHTML = ''; // Clear loading state
            data.prompts.forEach(prompt => {
                promptsContainer.innerHTML += `
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div class="h-28 flex items-center justify-center" style="background-color: ${prompt.bgColor}">
                            <i data-lucide="${prompt.icon}" class="w-10 h-10 text-white/50"></i>
                        </div>
                        <div class="p-4 flex-1">
                            <div class="flex items-center gap-1 text-slate-400 text-xs font-bold mb-2">
                                <i data-lucide="clock" class="w-3 h-3"></i> ${prompt.time}
                            </div>
                            <p class="text-sm font-medium leading-tight">${prompt.title}</p>
                        </div>
                    </div>
                `;
            });

            // Render Trophies (Cross-referencing Firebase!)
            const trophiesContainer =Awesome news! Getting Firebase provisioned and ready to go is a massive milestone. 

Since I don't have our previous project roadmap in front of me, I want to make sure we're perfectly aligned before we start writing code. Typically, right after the database is set up, the next phase tackles one of these core areas:

*   **Database Integration:** Writing the CRUD (Create, Read, Update, Delete) operations to connect your frontend (React, Flutter, etc.) to Firebase.
*   **Authentication:** Locking things down and managing user sign-ups/logins with Firebase Auth.
*   **Security Rules:** Securing your Firestore or Realtime Database endpoints so only authorized users can read or write data.
*   **Real-time Listeners:** Hooking up subscriptions so your app's UI updates automatically the second your database changes.

To make sure we hit the ground running, what exactly is on the docket for our Phase 3? Tell me what we're building or configuring next, and we'll dive right in!

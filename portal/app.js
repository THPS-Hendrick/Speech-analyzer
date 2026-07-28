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
            document.getElementById('user-initial').innerText = "T"; // 
            
            // 2. Fetch or Create Database Profile
            const userRef = doc(db, "users", user.uid);
            let userSnap = await getDoc(userRef);
            let userData = {};

            if (userSnap.exists()) {
                userData = userSnap.data();
            } else {
                // Brand new user! Create their starting stats in Firestore
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

            // Change Laurel Wreath color dynamically based on loaded XP
            const wreathSvg = document.querySelector('svg.drop-shadow-sm');
            if (wreathSvg) {
                wreathSvg.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(userData.xp)}`;
            }

            // 4. Fetch the UI Content (JSON) and cross-reference with Database
            loadContentAndRender(userData, userRef);

        } else {
            // Trigger the anonymous login if they aren't logged in yet
            signInAnonymously(auth).catch((error) => console.error("Auth Error:", error.message));
        }
    });

    async function loadContentAndRender(userData, userRef) {
        try {
            const response = await fetch('content.json?v=2');
            const data = await response.json();
            
            // Render Daily Talk
            document.getElementById('talk-title').innerText = data.dailyTalk.title;
            document.getElementById('talk-desc').innerText = data.dailyTalk.description;
            document.getElementById('talk-xp').innerText = "+" + data.dailyTalk.xp;

            // TEST FUNCTION: Wire the "Start Recording" button to actually give XP to test the database!
            const startBtn = document.querySelector('.btn-chunky-primary');
            startBtn.addEventListener('click', async () => {
                const newXp = userData.xp + data.dailyTalk.xp;
                
                // Update Firebase Database
                await updateDoc(userRef, { xp: newXp }); 
                
                // Update local memory
                userData.xp = newXp; 
                
                // Update UI instantly
                document.getElementById('xp-counter').innerText = `${newXp.toLocaleString()} XP`;
                const wreathSvg = document.querySelector('svg.drop-shadow-sm');
                if (wreathSvg) {
                    wreathSvg.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(newXp)}`;
                }
                
                alert(`Boom! +${data.dailyTalk.xp} XP added and saved to Firebase! Check your Firestore console.`);
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

            // Render Trophies (Cross-referencing Firebase profile with JSON file!)
            const trophiesContainer = document.getElementById('trophies-container');
            trophiesContainer.innerHTML = ''; 
            
            data.trophies.forEach(t => {
                // If the user's database array contains this trophy's ID, it is unlocked
                const isUnlocked = userData.unlockedTrophies.includes(t.id);
                
                const opacity = isUnlocked ? 'opacity-100' : 'opacity-60 bg-slate-100/50';
                const border = isUnlocked ? 'border-l-4 border-l-green-400 bg-white' : 'border border-slate-200';
                const iconBg = isUnlocked ? 'bg-green-100 text-green-500' : 'bg-slate-200 text-slate-400';
                
                trophiesContainer.innerHTML += `
                    <div class="flex gap-4 p-4 rounded-2xl shadow-sm ${border} ${opacity}">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}">
                            <i data-lucide="${t.icon}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-sm ${!isUnlocked ? 'text-slate-500' : ''}">${t.title}</h4>
                            <p class="text-xs text-slate-500 mt-1">${t.desc}</p>
                        </div>
                    </div>
                `;
            });

            if (window.lucide) window.lucide.createIcons(); // Initialize loaded icons
        } catch (error) {
            console.error("Failed to load content.json", error);
        }
    }

    // Navigation Listeners
    const drawer = document.getElementById('trophy-drawer');
    const overlay = document.getElementById('drawer-overlay');

    const toggleDrawer = () => {
        drawer.classList.toggle('translate-x-full');
        overlay.classList.toggle('hide');
    };

    document.getElementById('trigger-drawer').addEventListener('click', toggleDrawer);
    document.getElementById('nav-trophies').addEventListener('click', toggleDrawer);
    document.getElementById('close-drawer').addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    const switchTab = (tab) => {
        document.getElementById('view-home').classList.add('hide');
        document.getElementById('view-stats').classList.add('hide');
        document.getElementById('nav-home').classList.replace('text-slate-800', 'text-slate-400');
        document.getElementById('nav-stats').classList.replace('text-slate-800', 'text-slate-400');

        document.getElementById(`view-${tab}`).classList.remove('hide');
        document.getElementById(`nav-${tab}`).classList.replace('text-slate-400', 'text-slate-800');
    };

    document.getElementById('nav-home').addEventListener('click', () => switchTab('home'));
    document.getElementById('nav-stats').addEventListener('click', () => switchTab('stats'));
});

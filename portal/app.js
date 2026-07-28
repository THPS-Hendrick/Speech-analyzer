// Phase 2 Preparation: Import Firebase modular SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Phase 2 Preparation: Import Firebase modular SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your web app's Firebase configuration
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

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Authenticate the User Anonymously
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Logged in as Anonymous UID:", user.uid);
            document.getElementById('user-initial').innerText = "A"; // Mock initial
            // Here you would fetch the user's XP and Streak from Firestore
            document.getElementById('xp-counter').innerText = "150 XP"; 
        } else {
            signInAnonymously(auth).catch((error) => {
                console.error("Auth Error:", error.message);
            });
        }
    });

    // 2. Fetch Content and Render UI
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        
        // Render Daily Quest
        document.getElementById('quest-title').innerText = data.dailyQuest.title;
        document.getElementById('quest-desc').innerText = data.dailyQuest.description;
        document.getElementById('quest-xp').innerText = "+" + data.dailyQuest.xp;

        // Render Prompts
        const promptsContainer = document.getElementById('prompts-container');
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

        // Render Trophies
        const trophiesContainer = document.getElementById('trophies-container');
        data.trophies.forEach(t => {
            const opacity = t.achieved ? 'opacity-100' : 'opacity-60 bg-slate-100/50';
            const border = t.achieved ? 'border-l-4 border-l-green-400 bg-white' : 'border border-slate-200';
            const iconBg = t.achieved ? 'bg-green-100 text-green-500' : 'bg-slate-200 text-slate-400';
            
            trophiesContainer.innerHTML += `
                <div class="flex gap-4 p-4 rounded-2xl shadow-sm ${border} ${opacity}">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}">
                        <i data-lucide="${t.icon}" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm ${!t.achieved ? 'text-slate-500' : ''}">${t.title}</h4>
                        <p class="text-xs text-slate-500 mt-1">${t.desc}</p>
                    </div>
                </div>
            `;
        });

        lucide.createIcons(); // Initialize loaded icons
    } catch (error) {
        console.error("Failed to load content.json", error);
    }

    // 3. Navigation Listeners
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

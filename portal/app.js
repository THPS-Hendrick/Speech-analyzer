import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { wreathSVG } from './wreath.js';

const firebaseConfig = {
    apiKey: "AIzaSyDDv6NFyiPUEhRCJtSLzA2bi5wwaz5o4_Y",
    authDomain: "thps-portal.firebaseapp.com",
    projectId: "thps-portal",
    storageBucket: "thps-portal.firebasestorage.app",
    messagingSenderId: "413378317664",
    appId: "1:413378317664:web:53198604a39321f197e205"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let challengeData = null;
let currentPrompterLine = 0;

// Prompter State Variables
let timerInterval;
let elapsedMs = 0;
const maxDurationMs = 30000; // Simulated 30-second max fill for progress bar
let isRecording = false;

function getWreathColorClass(xp) {
    if (xp >= 10000) return 'wreath-gold';
    if (xp >= 5000) return 'wreath-silver';
    if (xp >= 3000) return 'wreath-red';
    if (xp >= 1000) return 'wreath-blue';
    if (xp >= 100) return 'wreath-green';
    return 'wreath-yellow'; 
}

document.addEventListener('DOMContentLoaded', () => {
    
    document.querySelectorAll('.wreath-container').forEach(container => {
        container.innerHTML = wreathSVG;
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.getElementById('user-initial').innerText = "T"; 
            
            const userRef = doc(db, "users", user.uid);
            let userSnap = await getDoc(userRef);
            let userData = {};

            if (userSnap.exists()) {
                userData = userSnap.data();
            } else {
                userData = { xp: 0, streak: 1, unlockedTrophies: [] };
                await setDoc(userRef, userData);
            }

            document.getElementById('xp-counter').innerText = `${userData.xp.toLocaleString()} XP`;
            document.getElementById('streak-counter').innerText = userData.streak;

            const topWreath = document.querySelector('header .wreath-container svg');
            if (topWreath) topWreath.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(userData.xp)}`;

            loadContentAndRender(userData, userRef);
        } else {
            signInAnonymously(auth).catch((error) => console.error("Auth Error:", error.message));
        }
    });

    async function loadContentAndRender(userData, userRef) {
        try {
            const response = await fetch('content.json?v=4'); // Cache buster bumped
            const data = await response.json();
            
            document.getElementById('talk-title').innerText = data.dailyTalk.title;
            document.getElementById('talk-desc').innerText = data.dailyTalk.description;
            document.getElementById('talk-xp').innerText = "+" + data.dailyTalk.xp;

            const promptsContainer = document.getElementById('prompts-container');
            promptsContainer.innerHTML = ''; 
            
            data.prompts.forEach(prompt => {
                let metaHtml = '';
                if (prompt.tags) {
                    metaHtml = `<div class="flex gap-1">${prompt.tags.map(t => `<span class="bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">${t}</span>`).join('')}</div>`;
                } else {
                    metaHtml = `<div class="flex items-center gap-1 text-white/70 text-xs font-bold mb-2"><i data-lucide="clock" class="w-3 h-3"></i> ${prompt.time}</div>`;
                }

                let xpHtml = prompt.xp ? `<div class="absolute top-3 right-3 bg-black/20 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-lg">+${prompt.xp} XP</div>` : '';
                const idAttr = prompt.id ? `id="prompt-${prompt.id}"` : '';

                promptsContainer.innerHTML += `
                    <div ${idAttr} class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative ${prompt.id ? 'cursor-pointer active:scale-95 transition-transform' : ''}">
                        ${xpHtml}
                        <div class="h-28 flex flex-col items-center justify-center p-4 gap-2" style="background-color: ${prompt.bgColor}">
                            <i data-lucide="${prompt.icon}" class="w-8 h-8 text-white/50"></i>
                            ${metaHtml}
                        </div>
                        <div class="p-4 flex-1 flex items-center">
                            <p class="text-sm font-medium leading-tight text-slate-800">${prompt.title}</p>
                        </div>
                    </div>
                `;
            });

            // Wire up Challenge Prompt & Reset States
            document.getElementById('prompt-truth')?.addEventListener('click', () => {
                challengeData = data.truthChallenge;
                document.getElementById('prompter-title').innerText = challengeData.title;
                
                // Reset Briefing UI States
                document.getElementById('challenge-video-area').classList.remove('hide');
                document.getElementById('challenge-results-area').classList.add('hide');
                document.getElementById('challenge-score-display').innerHTML = `<span class="text-3xl font-black tracking-tighter">--</span>`;
                
                // Reset Button to "Go!"
                document.getElementById('text-go').innerText = 'Go!';
                document.getElementById('icon-go').setAttribute('data-lucide', 'mic');
                if (window.lucide) window.lucide.createIcons();

                switchTab('challenge');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Render Trophies
            const trophiesContainer = document.getElementById('trophies-container');
            trophiesContainer.innerHTML = ''; 
            data.trophies.forEach(t => {
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

            if (window.lucide) window.lucide.createIcons();

            // --- TELEPROMPTER LOGIC ---
            const renderPrompterScript = () => {
                const container = document.getElementById('prompter-script');
                container.innerHTML = '';
                
                challengeData.lines.forEach((line, index) => {
                    const isActive = index === currentPrompterLine;
                    const colors = {
                        1: { pill: "bg-[#CAB4F4]", activePill: "bg-[#B08DF0]", border: "border-[#B08DF0]" },
                        3: { pill: "bg-[#A7E6CE]", activePill: "bg-[#71D6B4]", border: "border-[#71D6B4]" },
                        5: { pill: "bg-[#FAD1D7]", activePill: "bg-[#E3354C]", border: "border-[#E3354C]" }
                    }[line.intensity];

                    const borderClass = isActive ? `border-2 ${colors.border}` : 'border-2 border-transparent';
                    const pillClass = isActive ? colors.activePill : colors.pill;
                    const textClass = isActive ? 'text-slate-800 font-black' : 'text-slate-300 font-bold';
                    const boxClass = isActive ? 'bg-white shadow-md scale-[1.02]' : 'opacity-70';

                    container.innerHTML += `
                        <div class="flex gap-4 items-center p-3 rounded-2xl transition-all duration-300 ${borderClass} ${boxClass}" id="line-${index}">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shrink-0 transition-colors ${pillClass}">
                                ${line.intensity}
                            </div>
                            <p class="text-lg leading-snug transition-colors ${textClass}">${line.text}</p>
                        </div>
                    `;
                });
                
                const activeEl = document.getElementById(`line-${currentPrompterLine}`);
                if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            const resetPrompterToReady = () => {
                clearInterval(timerInterval);
                elapsedMs = 0;
                isRecording = false;
                document.getElementById('prompter-progress').style.width = '0%';
                
                const actionBtn = document.getElementById('btn-prompter-action');
                actionBtn.className = 'bg-green-500 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 active:scale-95 transition-all shadow-md';
                document.getElementById('text-prompter-action').innerText = 'Start';
                
                const iconContainer = document.getElementById('icon-prompter-action');
                iconContainer.setAttribute('data-lucide', 'play');
                if (window.lucide) window.lucide.createIcons();
                
                currentPrompterLine = 0;
                renderPrompterScript();
            };

            document.getElementById('btn-prompter-down').addEventListener('click', () => {
                if (currentPrompterLine < challengeData.lines.length - 1) {
                    currentPrompterLine++;
                    renderPrompterScript();
                }
            });

            document.getElementById('btn-prompter-up').addEventListener('click', () => {
                if (currentPrompterLine > 0) {
                    currentPrompterLine--;
                    renderPrompterScript();
                }
            });

            // Open Prompter Drawer
            document.getElementById('btn-go').addEventListener('click', () => {
                resetPrompterToReady();
                document.getElementById('prompter-drawer').classList.remove('-translate-x-full');
            });

            // Close/Abandon Prompter Drawer
            document.getElementById('btn-close-prompter').addEventListener('click', () => {
                resetPrompterToReady();
                document.getElementById('prompter-drawer').classList.add('-translate-x-full');
            });

            // Start/Stop Timer Logic
            document.getElementById('btn-prompter-action').addEventListener('click', () => {
                if (!isRecording) {
                    // Turn to Red Stop state
                    isRecording = true;
                    const actionBtn = document.getElementById('btn-prompter-action');
                    actionBtn.className = 'bg-[#E3354C] text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 active:scale-95 transition-all shadow-md';
                    document.getElementById('text-prompter-action').innerText = 'Stop';
                    
                    document.getElementById('icon-prompter-action').setAttribute('data-lucide', 'square');
                    if (window.lucide) window.lucide.createIcons();

                    const startTime = Date.now();
                    timerInterval = setInterval(() => {
                        elapsedMs = Date.now() - startTime;
                        let percentage = (elapsedMs / maxDurationMs) * 100;
                        if (percentage > 100) percentage = 100;
                        document.getElementById('prompter-progress').style.width = `${percentage}%`;
                    }, 100);

                } else {
                    // User Hit Stop - Process Flow
                    resetPrompterToReady();
                    document.getElementById('prompter-drawer').classList.add('-translate-x-full'); 
                    document.getElementById('view-loading').classList.remove('hide'); 
                    
                    // Simulate processing
                    setTimeout(async () => {
                        document.getElementById('view-loading').classList.add('hide'); 
                        
                        // Switch inline area to Results
                        document.getElementById('challenge-video-area').classList.add('hide');
                        document.getElementById('challenge-results-area').classList.remove('hide');

                        // Update Pill with Score
                        document.getElementById('challenge-score-display').innerHTML = `
                            <span class="text-3xl font-black tracking-tighter text-[#34D399]">4.2</span>
                            <span class="text-[10px] font-bold tracking-widest text-[#34D399]">SPS</span>
                        `;

                        // Change Go button to Redo
                        document.getElementById('text-go').innerText = 'Redo';
                        document.getElementById('icon-go').setAttribute('data-lucide', 'rotate-ccw');
                        if (window.lucide) window.lucide.createIcons();

                        // Add XP
                        const newXp = userData.xp + 100; 
                        await updateDoc(userRef, { xp: newXp }); 
                        userData.xp = newXp; 
                        
                        document.getElementById('xp-counter').innerText = `${newXp.toLocaleString()} XP`;
                        const topWreath = document.querySelector('header .wreath-container svg');
                        if (topWreath) topWreath.className.baseVal = `w-full h-full drop-shadow-sm ${getWreathColorClass(newXp)}`;
                        
                    }, 3000); 
                }
            });

        } catch (error) {
            console.error("Failed to load content.json", error);
        }
    }

    // --- NAVIGATION & DRAWERS ---
    const toggleDrawer = (drawerId, overlayObj) => {
        document.getElementById(drawerId).classList.toggle('translate-x-full');
        if(overlayObj) overlayObj.classList.toggle('hide');
    };

    const overlay = document.getElementById('drawer-overlay');
    
    // Trophies Drawer
    document.getElementById('trigger-drawer').addEventListener('click', () => toggleDrawer('trophy-drawer', overlay));
    document.getElementById('nav-trophies').addEventListener('click', () => toggleDrawer('trophy-drawer', overlay));
    document.getElementById('close-drawer').addEventListener('click', () => toggleDrawer('trophy-drawer', overlay));
    overlay.addEventListener('click', () => {
        document.getElementById('trophy-drawer').classList.add('translate-x-full');
        document.getElementById('tips-drawer').classList.add('translate-x-full');
        overlay.classList.add('hide');
    });

    // Tips Drawer
    document.getElementById('btn-tips').addEventListener('click', () => toggleDrawer('tips-drawer', overlay));
    document.getElementById('close-tips').addEventListener('click', () => toggleDrawer('tips-drawer', overlay));

    // Tab Switcher
    const switchTab = (tab) => {
        ['home', 'stats', 'challenge'].forEach(t => {
            const el = document.getElementById(`view-${t}`);
            if(el) el.classList.add('hide');
        });
        
        ['home', 'stats', 'trophies'].forEach(t => {
            const navBtn = document.getElementById(`nav-${t}`);
            if(navBtn) navBtn.classList.replace('text-slate-800', 'text-slate-400');
        });

        const viewEl = document.getElementById(`view-${tab}`);
        if(viewEl) viewEl.classList.remove('hide');
        
        const navEl = document.getElementById(`nav-${tab}`);
        if(navEl) navEl.classList.replace('text-slate-400', 'text-slate-800');
    };

    document.getElementById('nav-home').addEventListener('click', () => switchTab('home'));
    document.getElementById('nav-stats').addEventListener('click', () => switchTab('stats'));
    document.getElementById('btn-back-home')?.addEventListener('click', () => switchTab('home'));
});

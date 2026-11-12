import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

// Expose these globally for other scripts to use
window.thpsAuth = auth;
window.thpsDb = db;
window.thpsProvider = provider;

// Check auth state silently on every page
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.body.classList.add('logged-in');
        document.querySelectorAll('.auth-user-name').forEach(el => {
            el.innerText = user.displayName ? user.displayName.split(' ')[0] : 'Member';
        });
        
        // Ensure Member profile exists in Firestore
        ensureMemberProfile(user);
    } else {
        document.body.classList.remove('logged-in');
    }
});

async function ensureMemberProfile(user) {
    const docRef = doc(db, "Members", user.uid);
    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                name: user.displayName || "Unknown",
                email: user.email,
                joinedDate: new Date().toISOString(),
                progress: {}
            });
            console.log("New Member profile created.");
        }
    } catch (error) {
        console.error("Error checking member profile:", error);
    }
}

// Reusable function to save lesson progress from any public page
window.saveLessonProgress = async function(lessonId, scoreData) {
    const user = auth.currentUser;
    if (!user) {
        console.warn("User not logged in. Progress not saved to cloud.");
        return false; // Return false so the UI knows to prompt a login
    }
    
    try {
        const docRef = doc(db, "Members", user.uid);
        
        // We use setDoc with merge:true to update just this lesson without overwriting others
        await setDoc(docRef, {
            progress: {
                [lessonId]: {
                    completed: true,
                    completedAt: new Date().toISOString(),
                    scoreData: scoreData
                }
            }
        }, { merge: true });
        
        console.log(`Progress saved for ${lessonId}`);
        return true;
    } catch (error) {
        console.error("Error saving progress:", error);
        return false;
    }
};

window.handleGoogleLogin = async function() {
    try {
        await signInWithPopup(auth, provider);
        // Let the onAuthStateChanged listener handle the profile creation, then redirect
        setTimeout(() => {
            window.location.href = '/members/progress.html';
        }, 1000);
    } catch (error) {
        console.error(error);
        alert("Login failed: " + error.message);
    }
};

window.handleLogout = async function() {
    try {
        await signOut(auth);
        window.location.href = '/index.html';
    } catch (error) {
        console.error("Logout error:", error);
    }
};

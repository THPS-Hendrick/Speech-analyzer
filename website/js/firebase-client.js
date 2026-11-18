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

// Toggle to true once Stripe Checkout & Webhook endpoints are live
const PAYWALL_ENABLED = false;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Expose globally for member pages & billing UI
window.thpsAuth = auth;
window.thpsDb = db;
window.thpsProvider = provider;
window.THPS_PAYWALL_ENABLED = PAYWALL_ENABLED;
window.thpsMemberProfile = null;

// Check auth state silently on every page
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.body.classList.add('logged-in');
        document.querySelectorAll('.auth-user-name').forEach(el => {
            el.innerText = user.displayName ? user.displayName.split(' ')[0] : 'Member';
        });
        
        // Ensure Member profile exists in Firestore and cache billing/tier state
        window.thpsMemberProfile = await ensureMemberProfile(user);
        window.dispatchEvent(new CustomEvent('thps-member-ready', { detail: window.thpsMemberProfile }));
    } else {
        document.body.classList.remove('logged-in');
        window.thpsMemberProfile = null;
        window.dispatchEvent(new CustomEvent('thps-member-ready', { detail: null }));
    }
});

async function ensureMemberProfile(user) {
    const docRef = doc(db, "Members", user.uid);
    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            const newProfile = {
                name: user.displayName || "Unknown",
                email: user.email,
                joinedDate: new Date().toISOString(),
                membershipTier: "free",            // "free" | "pro"
                subscriptionStatus: "active_free", // "active_free" | "trialing" | "active" | "past_due" | "canceled"
                isPro: false,                      // Flipped true/false by Stripe webhook
                planInterval: null,                // "month" | "year" | null
                hasUsedTrial: false,               // Prevents repeated 7-day free trials
                billingProvider: "stripe",
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                currentPeriodEnd: null,
                progress: {}
            };
            await setDoc(docRef, newProfile);
            console.log("New Member profile created.");
            return newProfile;
        }
        return docSnap.data();
    } catch (error) {
        console.error("Error checking member profile:", error);
        return null;
    }
}

// Centralized access check for Mic-Check Pro & member pages
window.checkMemberAccess = async function({ redirectIfUnpaid = false, upgradeUrl = '/members/account.html?upgrade=1' } = {}) {
    const user = auth.currentUser || await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            unsubscribe();
            resolve(u);
        });
    });

    if (!user) {
        return { allowed: false, reason: 'unauthenticated', profile: null };
    }

    const profile = window.thpsMemberProfile || await ensureMemberProfile(user);

    // Free access phase: all signed-in users are granted access
    if (!PAYWALL_ENABLED) {
        return { allowed: true, reason: 'free_access_period', profile };
    }

    // Paywall phase: grant access only if Stripe webhook marked isPro === true (trialing or active)
    const hasActiveAccess = Boolean(profile && profile.isPro === true);
    if (!hasActiveAccess && redirectIfUnpaid) {
        window.location.href = upgradeUrl;
    }

    return {
        allowed: hasActiveAccess,
        reason: hasActiveAccess ? 'active_subscription' : 'payment_required',
        profile
    };
};

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
        const result = await signInWithPopup(auth, provider);
        // Guarantee Firestore profile is created before redirecting
        window.thpsMemberProfile = await ensureMemberProfile(result.user);
        window.location.href = '/members/progress.html';
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

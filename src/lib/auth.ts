import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import type { Profile } from './types';

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your credentials to a .env.local file for local development, and to your Vercel project's Environment Variables for deployment.";

interface AuthResult {
    user?: FirebaseUser | null;
    error?: string | null;
}

export const signInWithUsername = async (username: string, password: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        const email = `${username.toLowerCase().replace(/\s/g, '')}@trackademic.local`;
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            return { error: "Invalid username or password." };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const register = async (username: string, password: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    
    try {
        const email = `${username.toLowerCase().replace(/\s/g, '')}@trackademic.local`;
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        await updateProfile(user, { displayName: username });

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            username: username.toLowerCase(),
            displayName: username,
            profiles: [],
            activeProfileName: null,
        });

        return { user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'permission-denied') {
             return { error: "Database permission denied. Please check your Firestore security rules in the Firebase console." };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'Username is already taken.' };
        }
        if (error.code === 'auth/invalid-email') {
            return { error: 'Username contains invalid characters.' };
        }
        if (error.code === 'auth/weak-password') {
            return { error: 'Password should be at least 6 characters.' };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const signOut = () => {
    if (!isFirebaseConfigured || !auth) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    return firebaseSignOut(auth);
};

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
    if (typeof window === 'undefined') {
        return () => {};
    }
    
    if (!isFirebaseConfigured || !auth) {
        console.error(FIREBASE_NOT_CONFIGURED_ERROR);
        return () => {};
    }
    return onFirebaseAuthStateChanged(auth, callback);
};

interface UserData {
    profiles: Profile[];
    activeProfileName: string | null;
}

export const getUserData = async (uid: string): Promise<UserData | null> => {
    if (!isFirebaseConfigured || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const data = userDoc.data();
        return {
            profiles: data.profiles || [],
            activeProfileName: data.activeProfileName || null,
        }
    }
    return null;
}

const stripIcons = (profiles: Profile[]) => {
    if (!profiles) return [];
    return profiles.map(p => ({
        ...p,
        subjects: p.subjects.map(({ icon, ...rest }) => rest)
    }));
};

export const saveUserData = async (uid: string, profiles: Profile[], activeProfileName: string | null) => {
    if (!isFirebaseConfigured || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, { 
        profiles: stripIcons(profiles),
        activeProfileName: activeProfileName 
    }, { merge: true });
}

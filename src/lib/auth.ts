import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import type { Profile } from './types';

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your credentials to a .env.local file for local development, and to your Vercel project's Environment Variables for deployment.";

const checkFirebaseConfig = () => {
    if (!isFirebaseConfigured || !auth || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
}

export const signInWithUsername = async (username: string, password: string): Promise<FirebaseUser> => {
    checkFirebaseConfig();
    try {
        const usersRef = collection(db!, 'users');
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid username or password.");
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const email = userData.email;

        if (!email) {
            throw new Error("No email associated with this username.");
        }

        const result = await signInWithEmailAndPassword(auth!, email, password);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            throw new Error("Invalid username or password.");
        }
        throw error;
    }
};

export const register = async (username: string, password: string): Promise<FirebaseUser> => {
    checkFirebaseConfig();
    
    const usersRef = collection(db!, 'users');
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Username is already taken.");
    }
    
    try {
        const email = `${username.toLowerCase().replace(/\s/g, '')}@trackademic.local`;
        const result = await createUserWithEmailAndPassword(auth!, email, password);
        const user = result.user;

        await updateProfile(user, { displayName: username });

        const userDocRef = doc(db!, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            username: username.toLowerCase(),
            displayName: username,
            profiles: [],
            activeProfileName: null,
        });

        return user;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This username might be too similar to an existing one. Please try another.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Username contains invalid characters.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters.');
        }
        throw error;
    }
};

export const signOut = () => {
    checkFirebaseConfig();
    return firebaseSignOut(auth!);
};

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
    // Guard against running this on the server during build.
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
    checkFirebaseConfig();
    const userDocRef = doc(db!, 'users', uid);
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
    return profiles.map(p => ({
        ...p,
        subjects: p.subjects.map(({ icon, ...rest }) => rest)
    }));
};

export const saveUserData = async (uid: string, profiles: Profile[], activeProfileName: string | null) => {
    checkFirebaseConfig();
    const userDocRef = doc(db!, 'users', uid);
    await setDoc(userDocRef, { 
        profiles: stripIcons(profiles),
        activeProfileName: activeProfileName 
    }, { merge: true });
}

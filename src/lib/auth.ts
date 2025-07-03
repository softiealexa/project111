import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import type { Subject } from './types';

export interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
}

const provider = new GoogleAuthProvider();

export const signIn = async (): Promise<FirebaseUser | null> => {
    if (!auth) return null;
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Authentication failed:", error);
        return null;
    }
};

export const signOut = () => {
    if (!auth) return;
    firebaseSignOut(auth);
};

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
    if (!auth) return () => {};
    return onFirebaseAuthStateChanged(auth, callback);
};

export const getUserData = async (uid: string): Promise<Subject[] | null> => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.subjects || null;
    }
    return null;
}

export const saveUserData = async (uid: string, subjects: Subject[]) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', uid);
    const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
    await setDoc(userDocRef, { subjects: subjectsToStore }, { merge: true });
}

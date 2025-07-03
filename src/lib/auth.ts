import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Subject } from './types';

export interface User {
    uid: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
}

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your project credentials to a .env.local file.";

export const signInWithUsername = async (username: string, password: string): Promise<FirebaseUser | null> => {
    if (!auth || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    try {
        const usersRef = collection(db, 'users');
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

        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            throw new Error("Invalid username or password.");
        }
        if (error.code === 'auth/configuration-not-found') {
            throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
        }
        throw error;
    }
};

export const register = async (email: string, password: string, username: string): Promise<FirebaseUser | null> => {
    if (!auth || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error("Username is already taken.");
    }
    
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        await updateProfile(user, { displayName: username });

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            username: username,
            displayName: username,
        }, { merge: true });

        return user;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email address is already in use.');
        }
        if (error.code === 'auth/configuration-not-found') {
            throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
        }
        throw error;
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

export const getUserData = async (uid: string) => {
    if (!db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const data = userDoc.data();
        return {
            subjects: data.subjects || null,
            username: data.username || null,
        }
    }
    return null;
}

export const saveUserData = async (uid: string, subjects: Subject[]) => {
    if (!db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
    await setDoc(userDocRef, { subjects: subjectsToStore }, { merge: true });
}

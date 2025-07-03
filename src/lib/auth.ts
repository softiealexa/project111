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

export const signInWithUsername = async (username: string, password: string): Promise<FirebaseUser | null> => {
    if (!auth || !db) return null;
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error("User with that username not found.");
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const email = userData.email;

        if (!email) {
            console.error("No email associated with this username.");
            return null;
        }

        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Authentication failed:", error);
        return null;
    }
};

export const register = async (email: string, password: string, username: string): Promise<FirebaseUser | null> => {
    if (!auth || !db) return null;
    
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
        console.error("Registration failed:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email address is already in use.');
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
    if (!db) return null;
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
    if (!db) return;
    const userDocRef = doc(db, 'users', uid);
    const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
    await setDoc(userDocRef, { subjects: subjectsToStore }, { merge: true });
}

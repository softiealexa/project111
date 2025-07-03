import { db } from './firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import type { Subject } from './types';

export interface User {
    username: string;
}

const SESSION_KEY = 'trackademic_session';

export const register = async (username: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !username || !password) return false;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return false; 
    }

    // In a real app, you should hash the password before storing it!
    const userDocRef = doc(db, 'users', username.toLowerCase());
    await setDoc(userDocRef, { username, password });

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    return true;
};

export const login = async (username: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    const userDocRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().password === password) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
        return true;
    }

    return false;
};

export const logout = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = sessionStorage.getItem(SESSION_KEY);
    return user ? JSON.parse(user) : null;
};

export const getUserData = async (username: string): Promise<Subject[] | null> => {
    const userDocRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.subjects || null;
    }
    return null;
}

export const saveUserData = async (username: string, subjects: Subject[]) => {
    const userDocRef = doc(db, 'users', username.toLowerCase());
    // Remove icon component before storing in Firestore
    const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
    await setDoc(userDocRef, { subjects: subjectsToStore }, { merge: true });
}

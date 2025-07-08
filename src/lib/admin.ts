
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { AppUser } from './types';

export async function getAllUsers(): Promise<AppUser[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Authentication required. Please log in.");
    }
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    
    if (!adminEmails.includes(currentUser.email?.toLowerCase() || '')) {
        throw new Error("Permission denied. You are not authorized to perform this action.");
    }

    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: data.uid,
            username: data.displayName,
            email: data.email
        };
    });

    return userList;
}

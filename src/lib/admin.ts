
'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser } from './types';

export async function getAllUsers(): Promise<AppUser[]> {
    // This server action is simplified for prototyping.
    // In a production environment, this action should verify the caller's identity
    // and permissions, for example by verifying a Firebase ID token passed from the client.
    // The permission check is currently handled on the client-side in AdminPage.

    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: data.uid,
            username: data.displayName,
            email: data.email,
        };
    });

    return userList;
}

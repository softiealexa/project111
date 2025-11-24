
'use server';

import { collection, getDocs, query, where, documentId, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser } from './types';

export async function getAllUsers(): Promise<AppUser[]> {
    // This server action is simplified for prototyping.
    // In a production environment, this action should verify the caller's identity
    // and permissions, for example by verifying a Firebase ID token passed from the client.
    // The permission check is currently handled on the client-side in AdminPage.
    if (!db) {
        console.error("Firebase is not configured. Unable to fetch users.");
        return [];
    }

    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>): AppUser => {
        const data = doc.data();
        return {
            uid: doc.id,
            username: data.displayName || data.username || 'Unknown',
            email: data.email || 'No email provided',
            role: data.role === 'admin' ? 'admin' : 'user',
        };
    });

    return userList;
}

export async function exportUsersData(uids: string[]): Promise<string> {
    // This server action should also have robust permission checks in a real app.
    if (!db) {
        throw new Error("Firebase is not configured. Could not export data.");
    }
    
    if (!uids || uids.length === 0) {
        return "[]";
    }

    // Firestore 'in' queries are limited to 30 elements.
    // We chunk the UIDs to handle more than 30 selections.
    const chunks: string[][] = [];
    for (let i = 0; i < uids.length; i += 30) {
        chunks.push(uids.slice(i, i + 30));
    }
    
    const allUserData: any[] = [];
    
    for (const chunk of chunks) {
        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
        const userSnapshot = await getDocs(usersQuery);
        userSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            allUserData.push(doc.data());
        });
    }
    
    return JSON.stringify(allUserData, null, 2);
}

    

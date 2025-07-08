
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Feedback } from './types';

export async function submitFeedback(formData: FormData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("You must be logged in to submit feedback.");
    }

    const type = formData.get('type') as Feedback['type'];
    const message = formData.get('message') as string;

    if (!type || !message) {
        throw new Error("Both type and message are required fields.");
    }
    
    if (message.trim().length < 10) {
        throw new Error("Message must be at least 10 characters long.");
    }

    const feedbackData: Feedback = {
        userId: currentUser.uid,
        userEmail: currentUser.email || 'N/A',
        type: type,
        message: message,
        createdAt: serverTimestamp()
    };
    
    try {
        await addDoc(collection(db, "feedback"), feedbackData);
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw new Error("Could not save your feedback to the database. Please check your Firestore security rules.");
    }

    return { success: true };
}

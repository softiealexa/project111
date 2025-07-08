
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Feedback } from './types';

interface FeedbackInput {
    userId: string;
    userEmail: string;
    type: 'Bug Report' | 'Feature Request' | 'Other';
    message: string;
}

export async function submitFeedback(input: FeedbackInput) {
    if (!db) {
        throw new Error("Firebase is not configured. Could not submit feedback.");
    }

    const { type, message, userId, userEmail } = input;

    if (!userId) {
        throw new Error("You must be logged in to submit feedback.");
    }

    if (!type || !message) {
        throw new Error("Both type and message are required fields.");
    }
    
    if (message.trim().length < 10) {
        throw new Error("Message must be at least 10 characters long.");
    }

    const feedbackData: Omit<Feedback, 'id'> = {
        userId: userId,
        userEmail: userEmail,
        type: type,
        message: message,
        createdAt: serverTimestamp(),
        status: 'Pending'
    };
    
    try {
        await addDoc(collection(db, "feedback"), feedbackData);
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw new Error("Could not save your feedback to the database. Please check your Firestore security rules.");
    }

    return { success: true };
}

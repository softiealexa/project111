
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, updateProfile, User as FirebaseUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import type { Profile, AppUser, Subject, Note, ImportantLink, SmartTodo, SimpleTodo, ProgressPoint, QuestionSession, ExamCountdown, TimeEntry, Project, TimesheetData } from './types';

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your credentials to a .env.local file for local development, and to your Vercel project's Environment Variables for deployment.";

interface AuthResult {
    user?: FirebaseUser | null;
    error?: string | null;
}

export const signInWithUsername = async (username: string, password: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        const email = `${username.toLowerCase().replace(/\s/g, '')}@trackademic.local`;
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            return { error: "Invalid username or password." };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const register = async (username: string, password: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    
    try {
        const email = `${username.toLowerCase().replace(/\s/g, '')}@trackademic.local`;
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        await updateProfile(user, { displayName: username });

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            username: username.toLowerCase(),
            displayName: username,
            profiles: [],
            activeProfileName: null,
            role: 'user', // Default role
        });

        return { user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'permission-denied') {
             return { error: "Database permission denied. Please check your Firestore security rules in the Firebase console." };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'Username is already taken.' };
        }
        if (error.code === 'auth/invalid-email') {
            return { error: 'Username contains invalid characters.' };
        }
        if (error.code === 'auth/weak-password') {
            return { error: 'Password should be at least 6 characters.' };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const linkGoogleEmail = async (email: string): Promise<{ error?: string }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    const user = auth.currentUser;
    if (!user) {
        return { error: "You must be logged in to link an email." };
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { error: "Please enter a valid Gmail address." };
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { googleEmail: email });
        return {};
    } catch (error: any) {
        return { error: error.message || "An unexpected error occurred." };
    }
};


export const sendPasswordReset = async (): Promise<{ error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    const user = auth.currentUser;
    if (!user || !user.email) {
        return { error: "No user or email found to send reset link." };
    }
    try {
        await sendPasswordResetEmail(auth, user.email);
        return {};
    } catch (error: any) {
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const signOut = () => {
    if (!isFirebaseConfigured || !auth) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    return firebaseSignOut(auth);
};

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
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
    userDocument: AppUser;
}

export const getUserData = async (uid: string): Promise<UserData | null> => {
    if (!isFirebaseConfigured || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const userDocument: AppUser = {
            uid: data.uid,
            username: data.displayName,
            email: data.email,
            googleEmail: data.googleEmail,
            role: data.role
        };
        return {
            profiles: data.profiles || [],
            activeProfileName: data.activeProfileName || null,
            userDocument: userDocument
        }
    }
    return null;
}

type UserDataToSave = Partial<{
  profiles: Profile[];
  activeProfileName: string | null;
  subjects: Subject[];
  plannerNotes: Record<string, string>;
  notes: Note[];
  importantLinks: ImportantLink[];
  todos: SmartTodo[];
  simpleTodos: SimpleTodo[];
  progressHistory: ProgressPoint[];
  questionSessions: QuestionSession[];
  examCountdowns: ExamCountdown[];
  timeEntries: TimeEntry[];
  projects: Project[];
  timesheetData: TimesheetData;
}>;


export const saveUserData = async (uid: string, data: UserDataToSave) => {
    if (!isFirebaseConfigured || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, data, { merge: true });
};

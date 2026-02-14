
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged as onFirebaseAuthStateChanged, signOut as firebaseSignOut, updateProfile, User as FirebaseUser, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence, Persistence } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, query, collection, where, getCountFromServer } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import type { Profile, AppUser, Subject, Note, ImportantLink, SmartTodo, SimpleTodo, ProgressPoint, QuestionSession, ExamCountdown, TimeEntry, Project, TimesheetData, TimeOffPolicy, TimeOffRequest } from './types';

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your credentials to a .env.local file for local development, and to your Vercel project's Environment Variables for deployment.";

interface AuthResult {
    user?: FirebaseUser | null;
    error?: string | null;
}

function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: any) => removeUndefined(item));
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = removeUndefined(value);
      }
    }
  }
  return newObj;
}

const googleProvider = new GoogleAuthProvider();

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to set user document with retry logic
const setUserDocumentWithRetry = async (userId: string, userData: any, maxRetries = 3): Promise<void> => {
    const userDocRef = doc(db!, 'users', userId);
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Wait a bit before trying to allow auth state to propagate
            if (i > 0) {
                console.log(`Retry attempt ${i} for setting user document...`);
                await wait(500 * i);
            }
            
            await setDoc(userDocRef, userData);
            console.log('User document created successfully');
            return;
        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed:`, error.code, error.message);
            
            if (error.code === 'permission-denied') {
                // Continue to retry on permission denied
                continue;
            }
            // For other errors, throw immediately
            throw error;
        }
    }
    
    // All retries exhausted
    throw lastError;
};

export const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !db) {
        return { available: false, error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        const normalizedUsername = username.toLowerCase().trim();
        if (normalizedUsername.length < 3) {
            return { available: false, error: "Username must be at least 3 characters." };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
            return { available: false, error: "Username can only contain letters, numbers, and underscores." };
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', normalizedUsername));
        const snapshot = await getCountFromServer(q);
        
        return { available: snapshot.data().count === 0 };
    } catch (error: any) {
        return { available: false, error: error.message || "Failed to check username availability." };
    }
};

export const signInWithGoogle = async (rememberMe: boolean = false): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        console.log('Starting Google sign in...');
        
        if (rememberMe) {
            await setPersistence(auth, browserLocalPersistence);
        } else {
            await setPersistence(auth, browserSessionPersistence);
        }

        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        console.log('Google sign in successful, user:', firebaseUser.uid);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log('Creating new user document...');
            const username = firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`;
            const baseUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
            let finalUsername = baseUsername;
            let counter = 1;
            
            while (true) {
                const checkResult = await checkUsernameAvailability(finalUsername);
                if (checkResult.available) break;
                finalUsername = `${baseUsername}${counter}`;
                counter++;
            }

            await setUserDocumentWithRetry(firebaseUser.uid, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: finalUsername,
                displayName: firebaseUser.displayName || finalUsername,
                googleEmail: firebaseUser.email,
                profiles: [],
                activeProfileName: null,
                role: 'user',
                createdAt: serverTimestamp(),
                lastActivityAt: serverTimestamp(),
            });
        }

        return { user: firebaseUser };
    } catch (error: any) {
        console.error('Google sign in error:', error.code, error.message);
        
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/popup-closed-by-user') {
            return { error: "Sign in was cancelled." };
        }
        if (error.code === 'auth/popup-blocked') {
            return { error: "Sign in popup was blocked by your browser. Please allow popups for this site and try again." };
        }
        if (error.code === 'auth/unauthorized-domain') {
            return { error: "This domain is not authorized for Google sign in. Please add 'localhost' to your Firebase Console Authentication > Settings > Authorized domains." };
        }
        if (error.code === 'auth/operation-not-allowed') {
            return { error: "Google sign in is not enabled. Please enable Google sign-in provider in your Firebase Console." };
        }
        if (error.code === 'permission-denied') {
            return { error: "Permission denied. Please check your Firestore security rules. The authenticated user UID must match the document ID." };
        }
        return { error: error.message || "An unexpected error occurred during Google sign in." };
    }
};

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        if (rememberMe) {
            await setPersistence(auth, browserLocalPersistence);
        } else {
            await setPersistence(auth, browserSessionPersistence);
        }

        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            return { error: "Invalid email or password." };
        }
        if (error.code === 'auth/invalid-email') {
            return { error: "Invalid email format." };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const legacyLogin = async (fullEmail: string, password: string, rememberMe: boolean = false): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        if (rememberMe) {
            await setPersistence(auth, browserLocalPersistence);
        } else {
            await setPersistence(auth, browserSessionPersistence);
        }

        const result = await signInWithEmailAndPassword(auth, fullEmail, password);
        return { user: result.user };
    } catch (error: any) {
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            return { error: "Invalid email or password." };
        }
        if (error.code === 'auth/invalid-email') {
            return { error: "Invalid email format." };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const register = async (email: string, username: string, password: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    
    try {
        console.log('Starting email/password registration...');
        
        const usernameCheck = await checkUsernameAvailability(username);
        if (!usernameCheck.available) {
            return { error: usernameCheck.error || 'Username is already taken.' };
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        console.log('User created successfully:', user.uid);

        await updateProfile(user, { displayName: username });

        await setUserDocumentWithRetry(user.uid, {
            uid: user.uid,
            email: user.email,
            username: username.toLowerCase(),
            displayName: username,
            profiles: [],
            activeProfileName: null,
            role: 'user',
            createdAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
        });

        return { user };
    } catch (error: any) {
        console.error('Registration error:', error.code, error.message);
        
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'permission-denied') {
             return { error: "Database permission denied. Please check your Firestore security rules in the Firebase console. The authenticated user UID must match the document ID." };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'An account with this email already exists.' };
        }
        if (error.code === 'auth/invalid-email') {
            return { error: 'Invalid email address.' };
        }
        if (error.code === 'auth/weak-password') {
            return { error: 'Password should be at least 6 characters.' };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const registerWithGoogle = async (): Promise<AuthResult> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        console.log('Starting Google registration...');
        
        await setPersistence(auth, browserLocalPersistence);
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        console.log('Google auth successful, user:', firebaseUser.uid);

        // Generate username from Google account
        const username = firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`;
        const baseUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let finalUsername = baseUsername;
        let counter = 1;
        
        // Check username availability and generate unique one if needed
        while (true) {
            const checkResult = await checkUsernameAvailability(finalUsername);
            if (checkResult.available) break;
            finalUsername = `${baseUsername}${counter}`;
            counter++;
        }
        
        console.log('Using username:', finalUsername);

        await updateProfile(firebaseUser, { 
            displayName: finalUsername,
            photoURL: firebaseUser.photoURL
        });

        await setUserDocumentWithRetry(firebaseUser.uid, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: finalUsername.toLowerCase(),
            displayName: finalUsername,
            photoURL: firebaseUser.photoURL,
            googleEmail: firebaseUser.email,
            profiles: [],
            activeProfileName: null,
            role: 'user',
            createdAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
        });

        return { user: firebaseUser };
    } catch (error: any) {
        console.error('Google registration error:', error.code, error.message);
        
        if (error.code === 'auth/configuration-not-found') {
            return { error: FIREBASE_NOT_CONFIGURED_ERROR };
        }
        if (error.code === 'auth/popup-closed-by-user') {
            return { error: "Sign up was cancelled." };
        }
        if (error.code === 'auth/popup-blocked') {
            return { error: "Sign up popup was blocked by your browser. Please allow popups for this site and try again." };
        }
        if (error.code === 'auth/unauthorized-domain') {
            return { error: "This domain is not authorized for Google sign in. Please add 'localhost' to your Firebase Console Authentication > Settings > Authorized domains." };
        }
        if (error.code === 'auth/operation-not-allowed') {
            return { error: "Google sign in is not enabled. Please enable Google sign-in provider in your Firebase Console." };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'An account already exists with this Google email. Please login with Google or use email/password.' };
        }
        if (error.code === 'permission-denied') {
            return { error: "Permission denied. Please check your Firestore security rules. The authenticated user UID must match the document ID." };
        }
        return { error: error.message || "An unexpected error occurred during Google sign up." };
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

export const sendPasswordReset = async (email: string): Promise<{ error?: string; success?: boolean }> => {
    if (!isFirebaseConfigured || !auth) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }
    
    if (!email || !email.trim()) {
        return { error: "Please enter your email address." };
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { error: "Please enter a valid Gmail address." };
    }

    try {
        await sendPasswordResetEmail(auth, email.trim());
        return { success: true };
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            return { error: "Invalid email address." };
        }
        if (error.code === 'auth/user-not-found') {
            return { success: true };
        }
        return { error: error.message || "An unexpected error occurred." };
    }
};

export const sendPasswordResetByUsername = async (username: string): Promise<{ error?: string; success?: boolean }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        return { error: FIREBASE_NOT_CONFIGURED_ERROR };
    }

    try {
        const email = `${username.toLowerCase().trim()}@gmail.com`;
        const userDocRef = doc(db, 'users', email.split('@')[0]);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
            return { success: true };
        }

        return await sendPasswordReset(email);
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
            role: data.role,
            createdAt: data.createdAt,
            lastActivityAt: data.lastActivityAt,
        };
        return {
            profiles: data.profiles || [],
            activeProfileName: data.activeProfileName || null,
            userDocument: userDocument
        }
    }
    return null
}

type UserDataToSave = Partial<{
  profiles: Profile[];
  activeProfileName: string | null;
  [key: string]: any;
}>;

export const saveUserData = async (uid: string, data: UserDataToSave) => {
    if (!isFirebaseConfigured || !db) {
        throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }
    const userDocRef = doc(db, 'users', uid);
    
    const dataToSave = {
        ...data,
        lastActivityAt: serverTimestamp()
    };
    
    const cleanedData = removeUndefined(dataToSave);
    
    await setDoc(userDocRef, cleanedData, { merge: true });
};

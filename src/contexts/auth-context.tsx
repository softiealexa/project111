'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChanged, signInWithUsername as apiSignIn, signOut as apiSignOut, register as apiRegister, saveUserData, getUserData, User } from '@/lib/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase';
import { isFirebaseConfigured } from '@/lib/firebase';
import { subjects as initialSubjects } from "@/lib/data";
import type { Subject } from '@/lib/types';
import { BookOpenCheck, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AuthContextType {
  user: User | null;
  subjects: Subject[];
  signIn: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  updateSubjects: (newSubjects: Subject[]) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FirebaseNotConfiguredAlert = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Alert className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                It looks like your Firebase credentials are not set up. Please create a 
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold mx-1">.env.local</code> 
                file in your project's root directory and add your Firebase project details to connect to the database. The app will not work until this is done.
            </AlertDescription>
        </Alert>
    </div>
);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const loadUserAndSubjects = async (userId: string) => {
    const userData = await getUserData(userId);
    const userSubjects = userData?.subjects || initialSubjects;

    const restoredSubjects = userSubjects.map((savedSubject: any) => {
        const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
        return {
          ...savedSubject,
          icon: originalSubject ? originalSubject.icon : BookOpenCheck,
        };
      });
    setSubjects(restoredSubjects);
    
    const currentUser = firebaseAuthInstance?.currentUser;
    if (!userData?.subjects && currentUser) {
        await saveUserData(currentUser.uid, restoredSubjects);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (isFirebaseConfigured) {
      unsubscribe = onAuthChanged(async (authUser) => {
        if (authUser) {
          const userData = await getUserData(authUser.uid);
          const formattedUser: User = { 
            uid: authUser.uid, 
            email: authUser.email,
            displayName: authUser.displayName,
            username: userData?.username || null
          };
          setUser(formattedUser);
          await loadUserAndSubjects(formattedUser.uid);
        } else {
          setUser(null);
          setSubjects([]);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;
    
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user && !isAuthPage) {
      router.push('/login');
    }
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const handleSignIn = async (username: string, password: string) => {
    const user = await apiSignIn(username, password);
    return !!user;
  };
  
  const handleRegister = async (username: string, password: string) => {
    const user = await apiRegister(username, password);
    return !!user;
  };

  const handleSignOut = () => {
    apiSignOut();
    setUser(null);
    setSubjects([]);
    router.push('/login');
  };
  
  const updateSubjects = async (newSubjects: Subject[]) => {
      setSubjects(newSubjects);
      if(user) {
          await saveUserData(user.uid, newSubjects);
      }
  }

  const value = { user, subjects, signIn: handleSignIn, register: handleRegister, signOut: handleSignOut, updateSubjects, loading };
  
  if (!loading && !isFirebaseConfigured) {
    return <FirebaseNotConfiguredAlert />;
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser, saveUserData, getUserData } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { subjects as initialSubjects } from "@/lib/data";
import type { Subject } from '@/lib/types';
import { BookOpenCheck, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AuthContextType {
  user: User | null;
  subjects: Subject[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  
  const loadUserAndSubjects = async (username: string) => {
    const userData = await getUserData(username);
    
    const userSubjects = userData || initialSubjects;

    const restoredSubjects = userSubjects.map((savedSubject: any) => {
        const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
        return {
          ...savedSubject,
          icon: originalSubject ? originalSubject.icon : BookOpenCheck,
        };
      });
    setSubjects(restoredSubjects);
    
    if (!userData && user) {
        await saveUserData(user.username, restoredSubjects);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (isFirebaseConfigured) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await loadUserAndSubjects(currentUser.username);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;

    if (!user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
    if (user && (pathname === '/login' || pathname === '/register')) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const handleLogin = async (username: string, password: string) => {
    const success = await apiLogin(username, password);
    if (success) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if(currentUser) {
          await loadUserAndSubjects(currentUser.username);
      }
      return true;
    }
    return false;
  };

  const handleRegister = async (username: string, password: string) => {
    const success = await apiRegister(username, password);
    if (success) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        await loadUserAndSubjects(currentUser.username);
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setSubjects([]);
    router.push('/login');
  };
  
  const updateSubjects = async (newSubjects: Subject[]) => {
      setSubjects(newSubjects);
      if(user) {
          await saveUserData(user.username, newSubjects);
      }
  }

  const value = { user, subjects, login: handleLogin, register: handleRegister, logout: handleLogout, updateSubjects, loading };
  
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

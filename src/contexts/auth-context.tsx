'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser, saveUserData, getUserData } from '@/lib/auth';
import { subjects as initialSubjects } from "@/lib/data";
import type { Subject } from '@/lib/types';
import { BookOpenCheck } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  subjects: Subject[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const restoreSubjectsForUser = (username: string) => {
    const userData = getUserData(username);
    const restoredSubjects = (userData || initialSubjects).map((savedSubject: any) => {
        const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
        return {
          ...savedSubject,
          icon: originalSubject ? originalSubject.icon : BookOpenCheck,
        };
      });
    setSubjects(restoredSubjects);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      restoreSubjectsForUser(currentUser.username);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
    if (!loading && user && (pathname === '/login' || pathname === '/register')) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const handleLogin = async (username: string, password: string) => {
    const success = await apiLogin(username, password);
    if (success) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if(currentUser) {
          restoreSubjectsForUser(currentUser.username);
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
      setSubjects(initialSubjects);
      if (currentUser) {
        saveUserData(currentUser.username, initialSubjects);
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setSubjects([]);
  };
  
  const updateSubjects = (newSubjects: Subject[]) => {
      setSubjects(newSubjects);
      if(user) {
          saveUserData(user.username, newSubjects);
      }
  }

  const value = { user, subjects, login: handleLogin, register: handleRegister, logout: handleLogout, updateSubjects, loading };

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

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import { Book } from 'lucide-react';
import type { Subject, Profile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { onAuthChanged, signOut, getUserData, saveUserData } from '@/lib/auth';
import { subjects as initialSubjects } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// --- Local Storage Keys ---
const LOCAL_PROFILE_KEY_PREFIX = 'trackacademic_profile_';

interface DataContextType {
  user: FirebaseUser | null;
  profiles: Profile[];
  activeProfile: Profile | undefined;
  addProfile: (name: string) => void;
  switchProfile: (name: string) => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  exportData: () => void;
  importData: (file: File) => void;
  signOutUser: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Helper Functions ---
const getLocalKey = (username: string | null) => {
    return username ? `${LOCAL_PROFILE_KEY_PREFIX}${username}` : LOCAL_PROFILE_KEY_PREFIX + 'guest';
}

const restoreIcons = (profiles: Profile[]): Profile[] => {
    if (!profiles) return [];
    return profiles.map(profile => ({
        ...profile,
        subjects: profile.subjects.map(subject => ({
            ...subject,
            icon: initialSubjects.find(s => s.name === subject.name)?.icon || Book
        }))
    }));
};

const stripIcons = (profiles: Profile[]) => {
    return profiles.map(p => ({
        ...p,
        subjects: p.subjects.map(({ icon, ...rest }) => rest)
    }));
};


// --- Create Profile Screen ---
function CreateProfileScreen({ onProfileCreate }: { onProfileCreate: (name: string) => void }) {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onProfileCreate(name.trim());
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to TrackAcademic!</CardTitle>
                    <CardDescription>Create a profile to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="profile-name">Profile Name</Label>
                            <Input id="profile-name" type="text" placeholder="e.g., JEE Prep" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full">Create Profile</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


// --- Data Provider ---
export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pathname = usePathname();

  const saveData = useCallback(async (profilesToSave: Profile[], activeNameToSave: string | null) => {
    if (typeof window === 'undefined') return;

    // Always save to local storage for offline access
    const localKey = getLocalKey(user?.displayName || null);
    const dataToStore = { profiles: stripIcons(profilesToSave), activeProfileName: activeNameToSave };
    localStorage.setItem(localKey, JSON.stringify(dataToStore));

    // If logged in, also save to Firestore
    if (user) {
        try {
            await saveUserData(user.uid, profilesToSave, activeNameToSave);
        } catch (error) {
            console.error("Failed to save data to Firestore", error);
            toast({ title: "Sync Error", description: "Could not save progress to the cloud.", variant: "destructive" });
        }
    }
  }, [user, toast]);

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) { // User is logged in
          try {
              const firestoreData = await getUserData(firebaseUser.uid);
              if (firestoreData && firestoreData.profiles && firestoreData.profiles.length > 0) {
                  const restored = restoreIcons(firestoreData.profiles);
                  setProfiles(restored);
                  setActiveProfileName(firestoreData.activeProfileName);
              } else {
                  setProfiles([]);
                  setActiveProfileName(null);
              }
          } catch (error) {
              console.error("Failed to fetch user data:", error);
              setProfiles([]);
              setActiveProfileName(null);
              toast({ title: "Error", description: "Could not fetch your data from the cloud.", variant: "destructive" });
          }
      } else { // User is logged out or "guest"
          const localKey = getLocalKey(null);
          const storedData = localStorage.getItem(localKey);
          if (storedData) {
              try {
                const parsed = JSON.parse(storedData);
                const restored = restoreIcons(parsed.profiles);
                setProfiles(restored);
                setActiveProfileName(parsed.activeProfileName);
              } catch {
                setProfiles([]);
                setActiveProfileName(null);
                localStorage.removeItem(localKey);
              }
          } else {
              setProfiles([]);
              setActiveProfileName(null);
          }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  

  const addProfile = (name: string) => {
    const newProfile: Profile = { name, subjects: [] };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    setActiveProfileName(name);
    saveData(newProfiles, name);
  };

  const switchProfile = (name: string) => {
    setActiveProfileName(name);
    saveData(profiles, name);
  };

  const updateSubjects = (newSubjects: Subject[]) => {
      if (!activeProfileName) return;
      const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, subjects: newSubjects } : p);
      setProfiles(newProfiles);
      saveData(newProfiles, activeProfileName);
  };
  
  const exportData = () => {
    if (typeof window === 'undefined' || profiles.length === 0) {
        toast({ title: "Export Failed", description: "No data to export.", variant: "destructive" });
        return;
    };
    const dataToStore = { profiles: stripIcons(profiles), activeProfileName };
    const dataStr = JSON.stringify(dataToStore, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackacademic_data_${user ? user.displayName : 'guest'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Your data has been downloaded." });
  };

  const importData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.profiles && Array.isArray(data.profiles) && 'activeProfileName' in data) {
                  const restored = restoreIcons(data.profiles);
                  setProfiles(restored);
                  setActiveProfileName(data.activeProfileName);
                  saveData(restored, data.activeProfileName);
                  toast({ title: "Import Successful", description: "Your data has been restored." });
              } else {
                  throw new Error("Invalid file format.");
              }
          } catch (error) {
              toast({ title: "Import Failed", description: "The selected file is not valid.", variant: "destructive" });
          }
      };
      reader.readAsText(file);
  };
  
  const signOutUser = async () => {
    await signOut();
    setProfiles([]);
    setActiveProfileName(null);
    localStorage.removeItem(getLocalKey(null)); // Clear guest data on logout
  }

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.name === activeProfileName);
  }, [profiles, activeProfileName]);
  
  const value = { user, profiles, activeProfile, addProfile, switchProfile, updateSubjects, exportData, importData, signOutUser };
  
  if (loading) {
      return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  
  if (pathname.startsWith('/dashboard') && profiles.length === 0) {
      return (
        <DataContext.Provider value={value}>
            <CreateProfileScreen onProfileCreate={addProfile} />
        </DataContext.Provider>
      );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

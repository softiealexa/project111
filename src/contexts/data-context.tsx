'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { subjects as initialSubjects } from "@/lib/data";
import type { Subject, Profile } from '@/lib/types';
import { BookOpenCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/navbar';

// --- Local Storage Key ---
const DATA_KEY = 'trackademic_data_v2';

interface DataContextType {
  profiles: Profile[];
  activeProfile: Profile | undefined;
  addProfile: (name: string) => void;
  switchProfile: (name: string) => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Create Profile Screen (Internal to the provider) ---
function CreateProfileScreen({ onProfileCreate }: { onProfileCreate: (name: string) => void }) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onProfileCreate(name.trim());
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to Trackademic!</CardTitle>
                    <CardDescription>
                        Create a profile to get started. You'll be able to add your own subjects and track your progress.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="profile-name">Profile Name</Label>
                            <Input
                                id="profile-name"
                                type="text"
                                placeholder="e.g., Course-1, My Studies"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Create Profile
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Data Provider ---
export function DataProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveData = (profilesToSave: Profile[], activeNameToSave: string | null) => {
    if (typeof window === 'undefined') return;
    try {
        const dataToStore = {
            profiles: profilesToSave.map(p => ({
                ...p,
                subjects: p.subjects.map(({ icon, ...rest }) => rest)
            })),
            activeProfileName: activeNameToSave
        };
        localStorage.setItem(DATA_KEY, JSON.stringify(dataToStore));
    } catch (error) {
        console.error("Failed to save data to local storage", error);
        toast({
            title: "Error",
            description: "Could not save your progress.",
            variant: "destructive",
        });
    }
  };

  // Load data from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') {
        setLoading(false);
        return;
    }
    try {
      const storedData = localStorage.getItem(DATA_KEY);

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.profiles && parsedData.profiles.length > 0 && parsedData.activeProfileName) {
            // Restore icons
            const restoredProfiles = parsedData.profiles.map((savedProfile: any) => ({
                ...savedProfile,
                subjects: savedProfile.subjects.map((savedSubject: any) => {
                    const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
                    return {
                        ...savedSubject,
                        icon: originalSubject ? originalSubject.icon : BookOpenCheck,
                    };
                })
            }));

            setProfiles(restoredProfiles);
            setActiveProfileName(parsedData.activeProfileName);
        }
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
      localStorage.removeItem(DATA_KEY);
    }
    setLoading(false);
  }, []);

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

      const newProfiles = profiles.map(p => 
          p.name === activeProfileName ? { ...p, subjects: newSubjects } : p
      );
      setProfiles(newProfiles);
      saveData(newProfiles, activeProfileName);
  };
  
  const exportData = () => {
    if (typeof window === 'undefined') return;
    try {
        const dataToStore = {
            profiles: profiles.map(p => ({
                ...p,
                subjects: p.subjects.map(({ icon, ...rest }) => rest)
            })),
            activeProfileName,
        };
        const dataStr = JSON.stringify(dataToStore, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trackademic_profiles.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: "Export Successful",
            description: "Your progress has been downloaded."
        });
    } catch (error) {
        console.error("Export failed", error);
        toast({
            title: "Export Failed",
            description: "Could not export your data.",
            variant: "destructive",
        });
    }
  };

  const importData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);
              if (data.profiles && Array.isArray(data.profiles) && data.activeProfileName) {
                   const restoredProfiles = data.profiles.map((savedProfile: any) => ({
                        ...savedProfile,
                        subjects: savedProfile.subjects.map((savedSubject: any) => {
                           const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
                           return {
                               ...savedSubject,
                               icon: originalSubject ? originalSubject.icon : BookOpenCheck,
                           };
                        })
                   }));
                  setProfiles(restoredProfiles);
                  setActiveProfileName(data.activeProfileName);
                  saveData(restoredProfiles, data.activeProfileName);
                  toast({
                      title: "Import Successful",
                      description: "Your progress has been restored.",
                  });
              } else {
                  throw new Error("Invalid file format.");
              }
          } catch (error) {
              console.error("Import failed", error);
              toast({
                  title: "Import Failed",
                  description: "The selected file is not valid.",
                  variant: "destructive",
              });
          }
      };
      reader.readAsText(file);
  };

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.name === activeProfileName);
  }, [profiles, activeProfileName]);
  
  const value = { profiles, activeProfile, addProfile, switchProfile, updateSubjects, exportData, importData };
  
  if (loading) {
      return null; // Or a loading spinner
  }
  
  if (profiles.length === 0 || !activeProfile) {
      return <CreateProfileScreen onProfileCreate={addProfile} />;
  }

  return (
    <DataContext.Provider value={value}>
        <Navbar />
        <main>{children}</main>
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

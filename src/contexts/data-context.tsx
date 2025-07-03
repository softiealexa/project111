'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subjects as initialSubjects } from "@/lib/data";
import type { Subject } from '@/lib/types';
import { BookOpenCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/navbar';

// --- Local Storage Keys ---
const NICKNAME_KEY = 'trackademic_nickname';
const SUBJECTS_KEY = 'trackademic_subjects';

interface DataContextType {
  nickname: string | null;
  subjects: Subject[];
  setNickname: (name: string) => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Welcome Screen Component (Internal to the provider) ---
function WelcomeScreen({ onNicknameSet }: { onNicknameSet: (name:string) => void }) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNicknameSet(name.trim());
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to Trackademic!</CardTitle>
                    <CardDescription>
                        Please enter a nickname to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nickname">Nickname</Label>
                            <Input
                                id="nickname"
                                type="text"
                                placeholder="Your Nickname"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Save and Continue
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


// --- Data Provider ---
export function DataProvider({ children }: { children: ReactNode }) {
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedNickname = localStorage.getItem(NICKNAME_KEY);
      const storedSubjects = localStorage.getItem(SUBJECTS_KEY);

      if (storedNickname) {
        setNicknameState(storedNickname);
        if (storedSubjects) {
          const parsedSubjects = JSON.parse(storedSubjects);
          // Restore icons
          const restoredSubjects = parsedSubjects.map((savedSubject: any) => {
            const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
            return {
              ...savedSubject,
              icon: originalSubject ? originalSubject.icon : BookOpenCheck,
            };
          });
          setSubjects(restoredSubjects);
        } else {
          setSubjects(initialSubjects);
        }
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
      setSubjects(initialSubjects); // Fallback to initial data
    }
    setLoading(false);
  }, []);

  const setNickname = (name: string) => {
      localStorage.setItem(NICKNAME_KEY, name);
      setNicknameState(name);
      if(subjects.length === 0){
          localStorage.setItem(SUBJECTS_KEY, JSON.stringify(initialSubjects));
          setSubjects(initialSubjects);
      }
  };

  const updateSubjects = (newSubjects: Subject[]) => {
      setSubjects(newSubjects);
      try {
        const subjectsToStore = newSubjects.map(({ icon, ...rest }) => rest);
        localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjectsToStore));
      } catch (error) {
          console.error("Failed to save subjects to local storage", error);
          toast({
              title: "Error",
              description: "Could not save your progress.",
              variant: "destructive",
          });
      }
  };
  
  const exportData = () => {
    try {
        const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
        const dataStr = JSON.stringify({ nickname, subjects: subjectsToStore }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trackademic_progress.json';
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
              if (data.nickname && Array.isArray(data.subjects)) {
                   const restoredSubjects = data.subjects.map((savedSubject: any) => {
                        const originalSubject = initialSubjects.find(s => s.name === savedSubject.name);
                        return {
                        ...savedSubject,
                        icon: originalSubject ? originalSubject.icon : BookOpenCheck,
                        };
                    });
                  setNickname(data.nickname);
                  updateSubjects(restoredSubjects);
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

  const value = { nickname, subjects, setNickname, updateSubjects, exportData, importData };
  
  if (loading) {
      return null; // Or a loading spinner
  }
  
  if (!nickname) {
      return <DataContext.Provider value={value}><WelcomeScreen onNicknameSet={setNickname} /></DataContext.Provider>;
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

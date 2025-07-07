
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Subject, Profile, Chapter, Note, ImportantLink, Todo, Priority, ProgressPoint } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { onAuthChanged, signOut, getUserData, saveUserData } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

// --- Local Storage Keys ---
const LOCAL_PROFILE_KEY_PREFIX = 'trackacademic_profile_';
const THEME_KEY = 'trackacademic_theme';
const MODE_KEY = 'trackacademic_mode';

interface DataContextType {
  user: FirebaseUser | null;
  loading: boolean;
  profiles: Profile[];
  activeProfile: Profile | undefined;
  activeSubjectName: string | null;
  setActiveSubjectName: (name: string | null) => void;
  addProfile: (name: string) => void;
  switchProfile: (name: string) => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  addSubject: (subjectName: string, iconName: string) => void;
  removeSubject: (subjectNameToRemove: string) => void;
  addChapter: (subjectName: string, newChapter: Chapter) => void;
  removeChapter: (subjectName: string, chapterNameToRemove: string) => void;
  updateChapter: (subjectName: string, chapterName: string, newLectureCount: number) => void;
  updateTasks: (subjectName: string, newTasks: string[]) => void;
  updatePlannerNote: (dateKey: string, note: string) => void;
  addNote: (title: string, content: string) => void;
  updateNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  addLink: (title: string, url: string) => void;
  updateLink: (link: ImportantLink) => void;
  deleteLink: (linkId: string) => void;
  addTodo: (text: string, dueDate: Date | undefined, priority: Priority) => void;
  updateTodo: (todo: Todo) => void;
  deleteTodo: (todoId: string) => void;
  setTodos: (todos: Todo[]) => void;
  exportData: () => void;
  importData: (file: File) => void;
  signOutUser: () => Promise<void>;
  theme: string;
  setTheme: (theme: string) => void;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  completeOnboarding: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Helper Functions ---
const getLocalKey = (username: string | null) => {
    return username ? `${LOCAL_PROFILE_KEY_PREFIX}${username}` : LOCAL_PROFILE_KEY_PREFIX + 'guest';
}

const migrateAndHydrateProfiles = (profiles: any[]): Profile[] => {
    if (!profiles) return [];
    return profiles.map(profile => {
        const migratedSubjects = (profile.subjects || []).map((subject: any) => {
            let iconName = subject.icon;
            if (typeof iconName !== 'string') {
                // Legacy data, icon property is missing or not a string.
                // We'll assign one based on name for common subjects.
                switch (subject.name) {
                    case 'Physics': iconName = 'Zap'; break;
                    case 'Chemistry': iconName = 'FlaskConical'; break;
                    case 'Maths': iconName = 'Sigma'; break;
                    default: iconName = 'Book';
                }
            }
            return {
                ...subject,
                icon: iconName,
                // Ensure tasks are there for backwards compatibility
                tasks: subject.tasks || ['Lecture', 'DPP', 'Module', 'Class Qs'],
            };
        });
        return {
            ...profile,
            subjects: migratedSubjects,
            plannerNotes: profile.plannerNotes || {},
            notes: profile.notes || [],
            importantLinks: profile.importantLinks || [],
            todos: profile.todos || [],
            progressHistory: profile.progressHistory || [],
            hasCompletedOnboarding: profile.hasCompletedOnboarding ?? false,
        };
    });
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
  const [activeSubjectName, setActiveSubjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pathname = usePathname();

  const [theme, setTheme] = useState<string>('default');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Load theme from localStorage on initial load
    const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
    const savedMode = (localStorage.getItem(MODE_KEY) || 'dark') as 'light' | 'dark';
    setTheme(savedTheme);
    setMode(savedMode);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // The inline script in theme-script.tsx handles the initial load to prevent flashing.
    // This effect now only handles UPDATES when the user toggles the mode or theme.
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // remove old theme classes before adding the new one
    root.className.split(' ').forEach(c => {
        if (c.startsWith('theme-')) {
            root.classList.remove(c);
        }
    });
    
    if (theme !== 'default') {
        root.classList.add(`theme-${theme}`);
    }

    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(MODE_KEY, mode);
  }, [theme, mode]);

  const saveData = useCallback(async (profilesToSave: Profile[], activeNameToSave: string | null) => {
    if (typeof window === 'undefined') return;

    const localKey = getLocalKey(user?.displayName || null);
    const dataToStore = { profiles: profilesToSave, activeProfileName: activeNameToSave };
    localStorage.setItem(localKey, JSON.stringify(dataToStore));

    if (user) {
        try {
            await saveUserData(user.uid, profilesToSave, activeNameToSave);
        } catch (error) {
            console.error("Failed to save data to Firestore", error);
            toast({ title: "Sync Error", description: "Could not save progress to the cloud.", variant: "destructive" });
        }
    }
  }, [user, toast]);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.name === activeProfileName);
  }, [profiles, activeProfileName]);

  const calculateOverallProgress = useCallback((profile: Profile): number => {
    if (!profile || profile.subjects.length === 0) return 0;
    
    const subjectProgressions = profile.subjects.map(subject => {
        const tasksPerLecture = subject.tasks?.length || 0;
        if (tasksPerLecture === 0) return 0;

        let totalTasks = 0;
        let completedTasks = 0;
        subject.chapters.forEach(chapter => {
            totalTasks += chapter.lectureCount * tasksPerLecture;
            completedTasks += Object.values(chapter.checkedState || {}).filter(Boolean).length;
        });

        return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    });

    const totalProgressSum = subjectProgressions.reduce((acc, curr) => acc + curr, 0);

    return profile.subjects.length > 0 ? Math.round(totalProgressSum / profile.subjects.length) : 0;
  }, []);

  useEffect(() => {
    if (activeProfile && !loading) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const history = activeProfile.progressHistory || [];
      const hasTodayEntry = history.some(p => p.date === todayStr);

      if (!hasTodayEntry) {
        const currentProgress = calculateOverallProgress(activeProfile);
        let newHistory: ProgressPoint[] = [...history, { date: todayStr, progress: currentProgress }];
        
        if (newHistory.length > 90) {
          newHistory = newHistory.slice(newHistory.length - 90);
        }

        const newProfiles = profiles.map(p => 
            p.name === activeProfile.name 
            ? { ...p, progressHistory: newHistory } 
            : p
        );
        setProfiles(newProfiles);
        saveData(newProfiles, activeProfileName);
      }
    }
  }, [activeProfile, loading, calculateOverallProgress, profiles, activeProfileName, saveData]);


  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      setActiveSubjectName(null); 

      if (firebaseUser) {
          try {
              const firestoreData = await getUserData(firebaseUser.uid);
              if (firestoreData && firestoreData.profiles && firestoreData.profiles.length > 0) {
                  const processed = migrateAndHydrateProfiles(firestoreData.profiles);
                  setProfiles(processed);
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
      } else {
          const localKey = getLocalKey(null);
          const storedData = localStorage.getItem(localKey);
          if (storedData) {
              try {
                const parsed = JSON.parse(storedData);
                const processed = migrateAndHydrateProfiles(parsed.profiles);
                setProfiles(processed);
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
    const newProfile: Profile = { name, subjects: [], todos: [], hasCompletedOnboarding: false };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    setActiveProfileName(name);
    saveData(newProfiles, name);
  };

  const switchProfile = (name: string) => {
    setActiveProfileName(name);
    setActiveSubjectName(null);
    saveData(profiles, name);
  };

  const updateSubjects = (newSubjects: Subject[]) => {
    if (!activeProfileName || !activeProfile) return;

    const profileWithNewSubjects = { ...activeProfile, subjects: newSubjects };
    const currentProgress = calculateOverallProgress(profileWithNewSubjects);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let history = profileWithNewSubjects.progressHistory || [];
    const todayIndex = history.findIndex(h => h.date === todayStr);

    if (todayIndex > -1) {
        history[todayIndex] = { ...history[todayIndex], progress: currentProgress };
    } else {
        history.push({ date: todayStr, progress: currentProgress });
    }

    if (history.length > 90) {
      history = history.slice(history.length - 90);
    }
    
    const finalProfile = { ...profileWithNewSubjects, progressHistory: history };

    const newProfiles = profiles.map(p => 
        p.name === activeProfileName 
        ? finalProfile
        : p
    );

    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const addSubject = (subjectName: string, iconName: string) => {
    if (!activeProfileName) return;
    const newSubject: Subject = { 
        name: subjectName, 
        icon: iconName, 
        chapters: [],
        tasks: ['Lecture', 'DPP', 'Module', 'Class Qs'],
    };
    const activeProfile = profiles.find(p => p.name === activeProfileName);
    if (!activeProfile) return;
    
    const updatedSubjects = [...activeProfile.subjects, newSubject];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, subjects: updatedSubjects } : p);
    
    setProfiles(newProfiles);
    setActiveSubjectName(subjectName);
    saveData(newProfiles, activeProfileName);
  };
  
  const removeSubject = (subjectNameToRemove: string) => {
    if (!activeProfileName) return;
    const activeProfile = profiles.find(p => p.name === activeProfileName);
    if (!activeProfile) return;

    const updatedSubjects = activeProfile.subjects.filter(s => s.name !== subjectNameToRemove);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, subjects: updatedSubjects } : p);

    setProfiles(newProfiles);
    if (activeSubjectName === subjectNameToRemove) {
        setActiveSubjectName(updatedSubjects[0]?.name || null);
    }
    saveData(newProfiles, activeProfileName);
  };

  const addChapter = (subjectName: string, newChapter: Chapter) => {
      if (!activeProfileName) return;
      const newProfiles = profiles.map(p => {
          if (p.name === activeProfileName) {
              const newSubjects = p.subjects.map(s => {
                  if (s.name === subjectName) {
                      return { ...s, chapters: [...s.chapters, newChapter] };
                  }
                  return s;
              });
              return { ...p, subjects: newSubjects };
          }
          return p;
      });
      setProfiles(newProfiles);
      saveData(newProfiles, activeProfileName);
  };

  const removeChapter = (subjectName: string, chapterNameToRemove: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const newSubjects = p.subjects.map(s => {
                if (s.name === subjectName) {
                    const updatedChapters = s.chapters.filter(c => c.name !== chapterNameToRemove);
                    return { ...s, chapters: updatedChapters };
                }
                return s;
            });
            return { ...p, subjects: newSubjects };
        }
        return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const updateChapter = (subjectName: string, chapterName: string, newLectureCount: number) => {
    if (!activeProfileName) return;

    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const newSubjects = p.subjects.map(s => {
          if (s.name === subjectName) {
            const newChapters = s.chapters.map(c => {
              if (c.name === chapterName) {
                return { ...c, lectureCount: newLectureCount };
              }
              return c;
            });
            return { ...s, chapters: newChapters };
          }
          return s;
        });
        return { ...p, subjects: newSubjects };
      }
      return p;
    });

    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const updateTasks = (subjectName: string, newTasks: string[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(profile => {
      if (profile.name === activeProfileName) {
        const newSubjects = profile.subjects.map(subject => {
          if (subject.name === subjectName) {
            return { ...subject, tasks: newTasks };
          }
          return subject;
        });
        return { ...profile, subjects: newSubjects };
      }
      return profile;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const updatePlannerNote = (dateKey: string, note: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const newPlannerNotes = { ...(p.plannerNotes || {}) };
            if (note) {
                newPlannerNotes[dateKey] = note;
            } else {
                delete newPlannerNotes[dateKey];
            }
            return { ...p, plannerNotes: newPlannerNotes };
        }
        return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const addNote = (title: string, content: string) => {
    if (!activeProfileName) return;
    const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: Date.now(),
    };
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const updatedNotes = [...(p.notes || []), newNote];
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const updateNote = (updatedNote: Note) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const updatedNotes = (p.notes || []).map(n => n.id === updatedNote.id ? updatedNote : n);
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const deleteNote = (noteId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const updatedNotes = (p.notes || []).filter(n => n.id !== noteId);
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const addLink = (title: string, url: string) => {
    if (!activeProfileName) return;
    const newLink: ImportantLink = {
      id: crypto.randomUUID(),
      title,
      url,
    };
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedLinks = [...(p.importantLinks || []), newLink];
        return { ...p, importantLinks: updatedLinks };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const updateLink = (updatedLink: ImportantLink) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedLinks = (p.importantLinks || []).map(l => l.id === updatedLink.id ? updatedLink : l);
        return { ...p, importantLinks: updatedLinks };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const deleteLink = (linkId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedLinks = (p.importantLinks || []).filter(l => l.id !== linkId);
        return { ...p, importantLinks: updatedLinks };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  const addTodo = (text: string, dueDate: Date | undefined, priority: Priority) => {
    if (!activeProfileName) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      dueDate: dueDate?.getTime(), // Convert Date to timestamp
      priority,
    };
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = [newTodo, ...(p.todos || [])];
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  }

  const updateTodo = (updatedTodo: Todo) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = (p.todos || []).map(t => t.id === updatedTodo.id ? updatedTodo : t);
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  }

  const deleteTodo = (todoId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = (p.todos || []).filter(t => t.id !== todoId);
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  }

  const setTodos = (todos: Todo[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        return { ...p, todos: todos };
      }
      return p;
    });
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  }
  
  const exportData = () => {
    if (typeof window === 'undefined' || profiles.length === 0) {
        toast({ title: "Export Failed", description: "No data to export.", variant: "destructive" });
        return;
    };
    const dataToStore = { profiles, activeProfileName };
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
                  const processed = migrateAndHydrateProfiles(data.profiles);
                  setProfiles(processed);
                  setActiveProfileName(data.activeProfileName);
                  setActiveSubjectName(null);
                  saveData(processed, data.activeProfileName);
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
    setActiveSubjectName(null);
    localStorage.removeItem(getLocalKey(null)); // Clear guest data on logout
  }

  const completeOnboarding = () => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => 
        p.name === activeProfileName 
        ? { ...p, hasCompletedOnboarding: true }
        : p
    );
    setProfiles(newProfiles);
    saveData(newProfiles, activeProfileName);
  };

  
  const value = { 
    user, loading, profiles, activeProfile, activeSubjectName, setActiveSubjectName,
    addProfile, switchProfile, updateSubjects, addSubject, removeSubject, addChapter, removeChapter,
    updateChapter, updateTasks, updatePlannerNote, addNote, updateNote, deleteNote, addLink, updateLink, deleteLink,
    addTodo, updateTodo, deleteTodo, setTodos,
    exportData, importData, signOutUser,
    theme, setTheme, mode, setMode,
    completeOnboarding
  };
  
  if (!loading && pathname.startsWith('/dashboard') && profiles.length === 0) {
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



'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Subject, Profile, Chapter, Note, ImportantLink, Todo, Priority, ProgressPoint, QuestionSession } from '@/lib/types';
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
  renameSubject: (oldName: string, newName: string) => void;
  addChapter: (subjectName: string, newChapter: Chapter) => void;
  removeChapter: (subjectName: string, chapterNameToRemove: string) => void;
  updateChapter: (subjectName: string, chapterName: string, newLectureCount: number) => void;
  renameChapter: (subjectName: string, oldName: string, newName: string) => void;
  updateTasks: (subjectName: string, newTasks: string[]) => void;
  renameTask: (subjectName: string, oldName: string, newName: string) => void;
  updatePlannerNote: (dateKey: string, note: string) => void;
  addNote: (title: string, content: string) => Note | undefined;
  updateNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  setNotes: (notes: Note[]) => void;
  addLink: (title: string, url: string) => void;
  updateLink: (link: ImportantLink) => void;
  deleteLink: (linkId: string) => void;
  setLinks: (links: ImportantLink[]) => void;
  addTodo: (text: string, dueDate: Date | undefined, priority: Priority) => void;
  updateTodo: (todo: Todo) => void;
  deleteTodo: (todoId: string) => void;
  setTodos: (todos: Todo[]) => void;
  addQuestionSession: (session: QuestionSession) => void;
  exportData: () => void;
  importData: (file: File) => void;
  signOutUser: () => Promise<void>;
  theme: string;
  setTheme: (theme: string) => void;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
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
            questionSessions: profile.questionSessions || [],
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

  const [theme, setThemeState] = useState<string>('default');
  const [mode, setModeState] = useState<'light' | 'dark'>('dark');

  const setMode = useCallback((mode: 'light' | 'dark') => {
    setModeState(mode);
    localStorage.setItem(MODE_KEY, mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, []);

  const setTheme = useCallback((theme: string) => {
    setThemeState(theme);
    localStorage.setItem(THEME_KEY, theme);
     const root = window.document.documentElement;
     root.className.split(' ').forEach(c => {
        if (c.startsWith('theme-')) {
            root.classList.remove(c);
        }
    });
    if (theme !== 'default') {
        root.classList.add(`theme-${theme}`);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
    const savedMode = (localStorage.getItem(MODE_KEY) || 'dark') as 'light' | 'dark';
    setThemeState(savedTheme);
    setModeState(savedMode);
    document.documentElement.classList.toggle('dark', savedMode === 'dark');
     const root = window.document.documentElement;
     root.className.split(' ').forEach(c => {
        if (c.startsWith('theme-')) {
            root.classList.remove(c);
        }
    });
    if (savedTheme !== 'default') {
        root.classList.add(`theme-${savedTheme}`);
    }
  }, []);

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

  const updateProfileWithProgress = useCallback((profile: Profile): Profile => {
    const currentProgress = calculateOverallProgress(profile);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let history = [...(profile.progressHistory || [])];
    const todayIndex = history.findIndex(h => h.date === todayStr);

    if (todayIndex > -1) {
        history[todayIndex] = { ...history[todayIndex], progress: currentProgress };
    } else {
        history.push({ date: todayStr, progress: currentProgress });
    }

    if (history.length > 90) {
      history = history.slice(history.length - 90);
    }
    
    return { ...profile, progressHistory: history };
  }, [calculateOverallProgress]);

  const updateProfiles = useCallback((newProfiles: Profile[], newActiveProfileName: string | null) => {
    const profileToUpdate = newProfiles.find(p => p.name === newActiveProfileName);
    let profilesToSave = newProfiles;

    if (profileToUpdate) {
        const updatedProfile = updateProfileWithProgress(profileToUpdate);
        profilesToSave = newProfiles.map(p => p.name === newActiveProfileName ? updatedProfile : p);
    }
    
    setProfiles(profilesToSave);
    saveData(profilesToSave, newActiveProfileName);
  }, [saveData, updateProfileWithProgress]);


  useEffect(() => {
    if (activeProfile && !loading) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const history = activeProfile.progressHistory || [];
      const hasTodayEntry = history.some(p => p.date === todayStr);

      if (!hasTodayEntry) {
        updateProfiles(profiles, activeProfileName);
      }
    }
  }, [activeProfile, loading, profiles, activeProfileName, updateProfiles]);


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
  

  const addProfile = useCallback((name: string) => {
    const newProfile: Profile = { name, subjects: [], todos: [] };
    const newProfiles = [...profiles, newProfile];
    updateProfiles(newProfiles, name);
  }, [profiles, updateProfiles]);

  const switchProfile = useCallback((name: string) => {
    setActiveProfileName(name);
    setActiveSubjectName(null);
    saveData(profiles, name);
  }, [profiles, saveData]);

  const updateSubjects = useCallback((newSubjects: Subject[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, subjects: newSubjects } : p);
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const addSubject = useCallback((subjectName: string, iconName: string) => {
    if (!activeProfile) return;
    const newSubject: Subject = { 
        name: subjectName, 
        icon: iconName, 
        chapters: [],
        tasks: ['Lecture', 'DPP', 'Module', 'Class Qs'],
    };
    const updatedSubjects = [...activeProfile.subjects, newSubject];
    updateSubjects(updatedSubjects);
    setActiveSubjectName(subjectName);
  }, [activeProfile, updateSubjects]);
  
  const removeSubject = useCallback((subjectNameToRemove: string) => {
    if (!activeProfile) return;
    const updatedSubjects = activeProfile.subjects.filter(s => s.name !== subjectNameToRemove);
    updateSubjects(updatedSubjects);
    if (activeSubjectName === subjectNameToRemove) {
        setActiveSubjectName(updatedSubjects[0]?.name || null);
    }
  }, [activeProfile, activeSubjectName, updateSubjects]);

  const renameSubject = useCallback((oldName: string, newName: string) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === oldName) {
            const newChapters = s.chapters.map(c => {
                const newCheckedState: Record<string, boolean> = {};
                if (c.checkedState) {
                    Object.keys(c.checkedState).forEach(key => {
                        const newKey = key.replace(`${oldName}-`, `${newName}-`);
                        newCheckedState[newKey] = c.checkedState![key];
                    });
                }
                return { ...c, checkedState: newCheckedState };
            });
            return { ...s, name: newName, chapters: newChapters };
        }
        return s;
    });

    updateSubjects(newSubjects);
    if (activeSubjectName === oldName) {
        setActiveSubjectName(newName);
    }
    toast({ title: "Subject Renamed", description: `"${oldName}" is now "${newName}".` });
  }, [activeProfile, updateSubjects, activeSubjectName, toast]);

  const addChapter = useCallback((subjectName: string, newChapter: Chapter) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === subjectName) {
            return { ...s, chapters: [...s.chapters, newChapter] };
        }
        return s;
    });
    updateSubjects(newSubjects);
  }, [activeProfile, updateSubjects]);

  const removeChapter = useCallback((subjectName: string, chapterNameToRemove: string) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === subjectName) {
            const updatedChapters = s.chapters.filter(c => c.name !== chapterNameToRemove);
            return { ...s, chapters: updatedChapters };
        }
        return s;
    });
    updateSubjects(newSubjects);
  }, [activeProfile, updateSubjects]);

  const updateChapter = useCallback((subjectName: string, chapterName: string, newLectureCount: number) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
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
    updateSubjects(newSubjects);
  }, [activeProfile, updateSubjects]);

  const renameChapter = useCallback((subjectName: string, oldName: string, newName: string) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === subjectName) {
            const newChapters = s.chapters.map(c => {
                if (c.name === oldName) {
                     const newCheckedState: Record<string, boolean> = {};
                     if (c.checkedState) {
                        Object.keys(c.checkedState).forEach(key => {
                            const newKey = key.replace(`-${oldName}-`, `-${newName}-`);
                            newCheckedState[newKey] = c.checkedState![key];
                        });
                    }
                    return { ...c, name: newName, checkedState: newCheckedState };
                }
                return c;
            });
            return { ...s, chapters: newChapters };
        }
        return s;
    });
    updateSubjects(newSubjects);
    toast({ title: "Chapter Renamed", description: `"${oldName}" is now "${newName}".` });
  }, [activeProfile, updateSubjects, toast]);

  const updateTasks = useCallback((subjectName: string, newTasks: string[]) => {
    if (!activeProfile) return;
    const originalSubject = activeProfile.subjects.find(s => s.name === subjectName);
    if (!originalSubject) return;

    const oldTasks = originalSubject.tasks || [];
    const removedTasks = oldTasks.filter(t => !newTasks.includes(t));

    const newSubjects = activeProfile.subjects.map(subject => {
      if (subject.name === subjectName) {
        let updatedChapters = subject.chapters;

        if (removedTasks.length > 0) {
          updatedChapters = subject.chapters.map(chapter => {
            const oldCheckedState = chapter.checkedState || {};
            const newCheckedState: Record<string, boolean> = {};
            Object.keys(oldCheckedState).forEach(key => {
              const wasRemoved = removedTasks.some(removedTask => key.endsWith(`-${removedTask}`));
              if (!wasRemoved) {
                newCheckedState[key] = oldCheckedState[key];
              }
            });
            return { ...chapter, checkedState: newCheckedState };
          });
        }
        
        return { ...subject, tasks: newTasks, chapters: updatedChapters };
      }
      return subject;
    });
    updateSubjects(newSubjects);
  }, [activeProfile, updateSubjects]);

  const renameTask = useCallback((subjectName: string, oldName: string, newName: string) => {
    if (!activeProfile) return;
    const subject = activeProfile.subjects.find(s => s.name === subjectName);
    if (!subject) return;

    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === subjectName) {
            const newTasks = s.tasks.map(t => t === oldName ? newName : t);
            const newChapters = s.chapters.map(c => {
                const newCheckedState: Record<string, boolean> = {};
                if (c.checkedState) {
                    Object.keys(c.checkedState).forEach(key => {
                        if (key.endsWith(`-${oldName}`)) {
                            const newKey = key.replace(`-${oldName}`, `-${newName}`);
                            newCheckedState[newKey] = c.checkedState![key];
                        } else {
                            newCheckedState[key] = c.checkedState![key];
                        }
                    });
                }
                return { ...c, checkedState: newCheckedState };
            });
            return { ...s, tasks: newTasks, chapters: newChapters };
        }
        return s;
    });
    updateSubjects(newSubjects);
    toast({ title: "Task Renamed", description: `"${oldName}" is now "${newName}".`});
  }, [activeProfile, updateSubjects, toast]);

  const updatePlannerNote = useCallback((dateKey: string, note: string) => {
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
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const addNote = useCallback((title: string, content: string): Note | undefined => {
    if (!activeProfileName) return;
    const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: Date.now(),
    };
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const currentNotes = p.notes || [];
            // New notes are now added to the beginning of the array.
            const updatedNotes = [newNote, ...currentNotes];
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    updateProfiles(newProfiles, activeProfileName);
    toast({
        title: 'Note Saved',
        description: `Your note "${title || 'Untitled'}" has been saved.`,
    });
    return newNote;
  }, [activeProfileName, profiles, updateProfiles, toast]);

  const updateNote = useCallback((updatedNote: Note) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const updatedNotes = (p.notes || []).map(n => n.id === updatedNote.id ? updatedNote : n);
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const deleteNote = useCallback((noteId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            const updatedNotes = (p.notes || []).filter(n => n.id !== noteId);
            return { ...p, notes: updatedNotes };
        }
        return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const setNotes = useCallback((notes: Note[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            return { ...p, notes: notes };
        }
        return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);
  

  const addLink = useCallback((title: string, url: string) => {
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
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const updateLink = useCallback((updatedLink: ImportantLink) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedLinks = (p.importantLinks || []).map(l => l.id === updatedLink.id ? updatedLink : l);
        return { ...p, importantLinks: updatedLinks };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const deleteLink = useCallback((linkId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedLinks = (p.importantLinks || []).filter(l => l.id !== linkId);
        return { ...p, importantLinks: updatedLinks };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);
  
  const setLinks = useCallback((links: ImportantLink[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
        if (p.name === activeProfileName) {
            return { ...p, importantLinks: links };
        }
        return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const addTodo = useCallback((text: string, dueDate: Date | undefined, priority: Priority) => {
    if (!activeProfileName) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      dueDate: dueDate?.getTime(),
      priority,
    };
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = [newTodo, ...(p.todos || [])];
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const updateTodo = useCallback((updatedTodo: Todo) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = (p.todos || []).map(t => t.id === updatedTodo.id ? updatedTodo : t);
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const deleteTodo = useCallback((todoId: string) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const updatedTodos = (p.todos || []).filter(t => t.id !== todoId);
        return { ...p, todos: updatedTodos };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const setTodos = useCallback((todos: Todo[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        return { ...p, todos: todos };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);
  
  const addQuestionSession = useCallback((session: QuestionSession) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => {
      if (p.name === activeProfileName) {
        const currentSessions = p.questionSessions || [];
        // Add new session to the beginning and limit history to 50
        const updatedSessions = [session, ...currentSessions].slice(0, 50);
        return { ...p, questionSessions: updatedSessions };
      }
      return p;
    });
    updateProfiles(newProfiles, activeProfileName);
  }, [activeProfileName, profiles, updateProfiles]);

  const exportData = useCallback(() => {
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
  }, [profiles, activeProfileName, user, toast]);

  const importData = useCallback((file: File) => {
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
  }, [saveData, toast]);
  
  const signOutUser = useCallback(async () => {
    await signOut();
    setProfiles([]);
    setActiveProfileName(null);
    setActiveSubjectName(null);
    localStorage.removeItem(getLocalKey(null)); // Clear guest data on logout
  }, []);

  const value = useMemo(() => ({
    user, loading, profiles, activeProfile, activeSubjectName, setActiveSubjectName,
    addProfile, switchProfile, updateSubjects, addSubject, removeSubject, renameSubject,
    addChapter, removeChapter, updateChapter, renameChapter, updateTasks, renameTask,
    updatePlannerNote, addNote, updateNote, deleteNote, setNotes, addLink, updateLink, deleteLink, setLinks,
    addTodo, updateTodo, deleteTodo, setTodos,
    addQuestionSession,
    exportData, importData, signOutUser,
    theme, setTheme, mode, setMode,
  }), [
    user, loading, profiles, activeProfile, activeSubjectName,
    addProfile, switchProfile, updateSubjects, addSubject, removeSubject, renameSubject,
    addChapter, removeChapter, updateChapter, renameChapter, updateTasks, renameTask,
    updatePlannerNote, addNote, updateNote, deleteNote, setNotes, addLink, updateLink, deleteLink, setLinks,
    addTodo, updateTodo, deleteTodo, setTodos,
    addQuestionSession,
    exportData, importData, signOutUser,
    theme, setTheme, mode, setMode, setActiveSubjectName
  ]);
  
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

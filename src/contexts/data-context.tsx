

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, Suspense, lazy } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Subject, Profile, Chapter, Note, ImportantLink, SmartTodo, SimpleTodo, Priority, ProgressPoint, QuestionSession, AppUser, TimeEntry, Project, TimesheetData, SidebarWidth, TaskStatus, CheckedState, ExamCountdown, TimeOffPolicy, TimeOffRequest, Shift, TeamMember } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { onAuthChanged, signOut, getUserData, saveUserData } from '@/lib/auth';
import { format, getISOWeek, getYear } from 'date-fns';
import { LoadingSpinner } from '@/components/loading-spinner';

// Lazily load the create profile screen
const CreateProfileScreen = lazy(() => import('@/components/create-profile-screen'));

// --- Local Storage Keys ---
const LOCAL_PROFILE_KEY_PREFIX = 'studytracker_profile_';
const THEME_KEY = 'studytracker_theme';
const MODE_KEY = 'studytracker_mode';
const SIDEBAR_WIDTH_KEY = 'studytracker_sidebar_width';
const PROGRESS_DOWNLOAD_PROMPT_KEY = 'studytracker_progress_prompt';
const DEFAULT_SIDEBAR_WIDTH = 448; // Corresponds to md (28rem)

type DataToSave = Partial<Profile & { profiles: Profile[], activeProfileName: string | null }>;


interface DataContextType {
  user: FirebaseUser | null;
  userDoc: AppUser | null;
  loading: boolean;
  profiles: Profile[];
  activeProfile: Profile | undefined;
  activeSubjectName: string | null;
  setActiveSubjectName: (name: string | null) => void;
  addProfile: (name: string) => void;
  removeProfile: (name: string) => void;
  renameProfile: (oldName: string, newName: string) => void;
  switchProfile: (name: string) => void;
  updateSubjects: (newSubjects: Subject[]) => void;
  addSubject: (subjectName: string, iconName: string) => void;
  removeSubject: (subjectNameToRemove: string) => void;
  renameSubject: (oldName: string, newName: string) => void;
  addChapter: (subjectName: string, newChapter: Chapter) => void;
  removeChapter: (subjectName: string, chapterNameToRemove: string) => void;
  updateChapter: (subjectName: string, chapterName: string, newLectureCount: number) => void;
  renameChapter: (subjectName: string, oldName: string, newName: string) => void;
  updateChapterDeadline: (subjectName: string, chapterName: string, deadline: number | null) => void;
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
  addTodo: (text: string, forDate: string) => void;
  updateTodo: (todo: SmartTodo) => void;
  deleteTodo: (todoId: string) => void;
  setTodos: (todos: SmartTodo[]) => void;
  addSimpleTodo: (text: string, priority: Priority, deadline?: number) => void;
  updateSimpleTodo: (todo: SimpleTodo) => void;
  deleteSimpleTodo: (todoId: string) => void;
  setSimpleTodos: (todos: SimpleTodo[]) => void;
  addQuestionSession: (session: QuestionSession) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => TimeEntry | undefined;
  updateTimeEntry: (entry: TimeEntry) => void;
  deleteTimeEntry: (entryId: string) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  addProject: (name: string, color: string) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  updateTimesheetEntry: (projectId: string, date: string, seconds: number) => void;
  setTimesheetData: (data: TimesheetData) => void;
  addExamCountdown: (title: string, date: Date) => void;
  updateExamCountdown: (countdown: ExamCountdown) => void;
  deleteExamCountdown: (countdownId: string) => void;
  setExamCountdowns: (countdowns: ExamCountdown[]) => void;
  setPinnedCountdownId: (id: string | null) => void;
  addTimeOffRequest: (request: Omit<TimeOffRequest, 'id'>) => void;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (shiftId: string) => void;
  addTeamMember: (name: string) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (memberId: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
  signOutUser: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
  theme: string;
  setTheme: (theme: string) => void;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  isThemeHydrated: boolean;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  showProgressDownloadPrompt: boolean;
  setShowProgressDownloadPrompt: (show: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Helper Functions ---
const getLocalKey = (username: string | null) => {
    return username ? `${LOCAL_PROFILE_KEY_PREFIX}${username}` : LOCAL_PROFILE_KEY_PREFIX + 'guest';
}

const migrateAndHydrateProfiles = (profiles: any[]): Profile[] => {
    if (!profiles || !Array.isArray(profiles)) return [];
    
    return profiles.map(profile => {
        const migratedSubjects = (profile.subjects || []).map((subject: any) => {
            const migratedChapters = (subject.chapters || []).map((chapter: any) => {
                const newCheckedState: Record<string, CheckedState> = {};
                // This function now explicitly checks for old 'true' booleans and converts them,
                // while preserving any existing valid string states.
                if (chapter.checkedState && typeof chapter.checkedState === 'object') {
                    Object.keys(chapter.checkedState).forEach(key => {
                        const value = chapter.checkedState[key];
                        if (value === true || value === 'checked') {
                            newCheckedState[key] = { status: 'checked' };
                        } else if (value === 'checked-red') {
                             newCheckedState[key] = { status: 'checked-red' };
                        } else if (typeof value === 'object' && value.status) {
                            newCheckedState[key] = value;
                        }
                    });
                }
                return { 
                    ...chapter, 
                    checkedState: newCheckedState,
                };
            });

            return {
                ...subject,
                icon: subject.icon || 'Book',
                tasks: subject.tasks || ['Lecture', 'DPP', 'Module', 'Class Qs'],
                chapters: migratedChapters,
            };
        });
        
        const migratedSimpleTodos = (profile.simpleTodos || []).map((todo: any) => {
            if (typeof todo.status === 'boolean') {
                return {
                    ...todo,
                    status: todo.status ? 'checked' : 'unchecked',
                    completedAt: todo.status ? todo.completedAt || Date.now() : undefined,
                };
            }
            return todo;
        });

        const defaultPolicies: TimeOffPolicy[] = [
            { id: 'vacation', name: 'Vacation', allowance: 15, color: '#2196f3'},
            { id: 'sick', name: 'Sick Leave', allowance: 10, color: '#ff9800'},
        ];

        return {
            ...profile,
            subjects: migratedSubjects,
            simpleTodos: migratedSimpleTodos,
            plannerNotes: profile.plannerNotes || {},
            notes: profile.notes || [],
            importantLinks: profile.importantLinks || [],
            todos: profile.todos || [],
            progressHistory: profile.progressHistory || [],
            questionSessions: profile.questionSessions || [],
            examCountdowns: profile.examCountdowns || [],
            timeEntries: profile.timeEntries || [],
            projects: profile.projects || [],
            timesheetData: profile.timesheetData || {},
            timeOffPolicies: profile.timeOffPolicies || defaultPolicies,
            timeOffRequests: profile.timeOffRequests || [],
            team: profile.team || [{ id: '1', name: 'You' }],
            shifts: profile.shifts || [],
        };
    });
};

// --- Data Provider ---
export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<AppUser | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);
  const [activeSubjectName, setActiveSubjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setThemeState] = useState<string>('default');
  const [mode, setModeState] = useState<'light' | 'dark'>('dark');
  const [sidebarWidth, setSidebarWidthState] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);
  const [showProgressDownloadPrompt, setShowProgressDownloadPrompt] = useState(false);


  const setSidebarWidth = useCallback((width: number) => {
    setSidebarWidthState(width);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  }, []);

  const setMode = useCallback((newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem(MODE_KEY, newMode);
    document.documentElement.classList.toggle('dark', newMode === 'dark');
  }, []);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
     const root = window.document.documentElement;
     root.className.split(' ').forEach(c => {
        if (c.startsWith('theme-')) {
            root.classList.remove(c);
        }
    });
    if (newTheme !== 'default') {
        root.classList.add(`theme-${newTheme}`);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
    const savedMode = (localStorage.getItem(MODE_KEY) || 'dark') as 'light' | 'dark';
    const savedWidthStr = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const savedWidth = savedWidthStr ? parseInt(savedWidthStr, 10) : DEFAULT_SIDEBAR_WIDTH;
    
    setTheme(savedTheme);
    setMode(savedMode);
    setSidebarWidth(savedWidth);

    setIsThemeHydrated(true);
  }, [setTheme, setMode, setSidebarWidth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey) {
            switch (event.key) {
                case ',':
                    event.preventDefault();
                    router.push('/settings');
                    break;
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const today = new Date();
    const currentWeekId = `${getYear(today)}-${getISOWeek(today)}`;
    const lastPromptWeekId = localStorage.getItem(PROGRESS_DOWNLOAD_PROMPT_KEY);

    if (currentWeekId !== lastPromptWeekId) {
        setShowProgressDownloadPrompt(true);
    }
  }, [loading]);

  const saveData = useCallback(async (dataToSave: DataToSave) => {
    if (typeof window === 'undefined') return;

    // For local storage, we always save the entire profiles object
    const localKey = getLocalKey(user?.displayName || null);
    const fullLocalData = {
      profiles: 'profiles' in dataToSave ? dataToSave.profiles : profiles,
      activeProfileName: 'activeProfileName' in dataToSave ? dataToSave.activeProfileName : activeProfileName
    };
    localStorage.setItem(localKey, JSON.stringify(fullLocalData));
    
    // For Firestore, we only save the specific field that was passed in
    if (user) {
        try {
            await saveUserData(user.uid, dataToSave);
        } catch (error) {
            console.error("Failed to save data to Firestore", error);
            toast({ title: "Sync Error", description: "Could not save progress to the cloud.", variant: "destructive" });
        }
    }
  }, [user, toast, profiles, activeProfileName]);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.name === activeProfileName);
  }, [profiles, activeProfileName]);

  const calculateOverallProgress = useCallback((profile: Profile): number => {
    if (!profile || !profile.subjects || profile.subjects.length === 0) return 0;

    const subjectProgressions = profile.subjects.map(subject => {
        const tasksPerLecture = subject.tasks?.length || 0;
        if (tasksPerLecture === 0) return 0; // Avoid division by zero if a subject has no tasks

        let totalTasks = 0;
        let completedTasks = 0;
        (subject.chapters || []).forEach(chapter => {
            totalTasks += chapter.lectureCount * tasksPerLecture;
            completedTasks += Object.values(chapter.checkedState || {}).filter(item => item.status === 'checked' || item.status === 'checked-red').length;
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

  const updateProfiles = useCallback((newProfiles: Profile[], newActiveProfileName: string | null, dataToSync?: DataToSave) => {
    const profileToUpdate = newProfiles.find(p => p.name === newActiveProfileName);
    let profilesToSave = newProfiles;

    if (profileToUpdate) {
        const updatedProfile = updateProfileWithProgress(profileToUpdate);
        profilesToSave = newProfiles.map(p => p.name === newActiveProfileName ? updatedProfile : p);
    }
    
    setProfiles(profilesToSave);

    // If specific data is provided to sync, use it. Otherwise, sync the entire profiles array.
    const finalDataToSync = dataToSync 
        ? { ...dataToSync, profiles: profilesToSave, activeProfileName: newActiveProfileName }
        : { profiles: profilesToSave, activeProfileName: newActiveProfileName };

    saveData(finalDataToSync);
  }, [saveData, updateProfileWithProgress]);


  useEffect(() => {
    if (activeProfile && !loading) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const history = activeProfile.progressHistory || [];
      const hasTodayEntry = history.some(p => p.date === todayStr);

      if (!hasTodayEntry) {
         const updatedProfile = updateProfileWithProgress(activeProfile);
         const newProfiles = profiles.map(p => p.name === activeProfileName ? updatedProfile : p);
         updateProfiles(newProfiles, activeProfileName, { progressHistory: updatedProfile.progressHistory });
      }
    }
  }, [activeProfile, loading, profiles, activeProfileName, updateProfileWithProgress, updateProfiles]);


  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      setUserDoc(null);
      setActiveSubjectName(null); 

      if (firebaseUser) {
          try {
              const firestoreData = await getUserData(firebaseUser.uid);
              if (firestoreData && firestoreData.profiles && firestoreData.profiles.length > 0) {
                  const processed = migrateAndHydrateProfiles(firestoreData.profiles);
                  setProfiles(processed);
                  setActiveProfileName(firestoreData.activeProfileName);
                  setUserDoc(firestoreData.userDocument);
              } else {
                  setProfiles([]);
                  setActiveProfileName(null);
                  setUserDoc(null);
              }
          } catch (error) {
              console.error("Failed to fetch user data:", error);
              setProfiles([]);
              setActiveProfileName(null);
              setUserDoc(null);
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
  
  const refreshUserDoc = useCallback(async () => {
    if (user) {
        const data = await getUserData(user.uid);
        if (data) {
            setUserDoc(data.userDocument);
        }
    }
  }, [user]);

  // --- Smart Todo Rollover Logic ---
  useEffect(() => {
    if (!activeProfile || loading) return;

    const lastRolloverKey = `lastRollover_${activeProfile.name}`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastRolloverDate = localStorage.getItem(lastRolloverKey);

    if (lastRolloverDate === todayStr) {
        return;
    }

    let allTodos = activeProfile.todos || [];
    let updated = false;

    const uniquePastDates = [...new Set(allTodos.map(t => t.forDate).filter(d => d < todayStr))];
    
    uniquePastDates.forEach(dateStr => {
        const incompleteTasksOnDate = allTodos.filter(t => t.forDate === dateStr && t.status === 'pending');

        if (incompleteTasksOnDate.length > 0) {
            const rolledOverTasks = incompleteTasksOnDate.map(task => ({
                ...task,
                id: crypto.randomUUID(),
                forDate: todayStr,
                rolledOver: true,
                createdAt: Date.now()
            }));
            
            // Add new rolled-over tasks
            allTodos = [...allTodos, ...rolledOverTasks];
            
            // Remove the original incomplete tasks from their old date
            const originalTaskIds = incompleteTasksOnDate.map(t => t.id);
            allTodos = allTodos.filter(t => !originalTaskIds.includes(t.id));

            updated = true;
        }
    });

    if (updated) {
        const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, todos: allTodos } : p);
        updateProfiles(newProfiles, activeProfileName, { todos: allTodos });
    }
    
    localStorage.setItem(lastRolloverKey, todayStr);
  }, [activeProfile, loading, profiles, activeProfileName, updateProfiles]);


  const addProfile = useCallback((name: string) => {
    const newProfile: Profile = { name, subjects: [], todos: [] };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    setActiveProfileName(name);
    saveData({ profiles: newProfiles, activeProfileName: name });
    window.location.reload();
  }, [profiles, saveData]);
  
  const removeProfile = useCallback((name: string) => {
    if (profiles.length <= 1) {
        toast({ title: "Cannot Remove", description: "You must have at least one profile.", variant: "destructive" });
        return;
    }
    const newProfiles = profiles.filter(p => p.name !== name);
    let newActiveProfileName = activeProfileName;
    if (activeProfileName === name) {
        newActiveProfileName = newProfiles[0].name;
    }
    setProfiles(newProfiles);
    setActiveProfileName(newActiveProfileName);
    saveData({ profiles: newProfiles, activeProfileName: newActiveProfileName });
    toast({ title: "Profile Removed", description: `Profile "${name}" has been removed.`});
  }, [profiles, activeProfileName, saveData, toast]);

  const renameProfile = useCallback((oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (profiles.some(p => p.name.toLowerCase() === trimmedNewName.toLowerCase())) {
        toast({ title: "Error", description: "A profile with this name already exists.", variant: "destructive" });
        return;
    }
    const newProfiles = profiles.map(p => p.name === oldName ? { ...p, name: trimmedNewName } : p);
    let newActiveProfileName = activeProfileName;
    if (activeProfileName === oldName) {
        newActiveProfileName = trimmedNewName;
    }
    setProfiles(newProfiles);
    setActiveProfileName(newActiveProfileName);
    saveData({ profiles: newProfiles, activeProfileName: newActiveProfileName });
    toast({ title: "Profile Renamed", description: `"${oldName}" is now "${trimmedNewName}".`});
  }, [profiles, activeProfileName, saveData, toast]);

  const switchProfile = useCallback((name: string) => {
    setActiveProfileName(name);
    setActiveSubjectName(null);
    saveData({ activeProfileName: name });
  }, [saveData]);

  const updateSubjects = useCallback((newSubjects: Subject[]) => {
    if (!activeProfileName) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, subjects: newSubjects } : p);
    updateProfiles(newProfiles, activeProfileName, { subjects: newSubjects });
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
                const newCheckedState: Record<string, CheckedState> = {};
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
                     const newCheckedState: Record<string, CheckedState> = {};
                     if (c.checkedState) {
                        Object.keys(c.checkedState).forEach(key => {
                            const newKey = key.replace(`-${oldName}-`, `-${newName}-`);
                            newCheckedState[newKey] = c.checkedState![key];
                        });
                    }
                    const newLectureNames = { ...(c.lectureNames || {}) };
                    const newNotes = { ...(c.notes || {}) };

                    Object.keys(c.lectureNames || {}).forEach(key => {
                        if (key.includes(oldName)) {
                            const newKey = key.replace(oldName, newName);
                            newLectureNames[newKey] = c.lectureNames![key];
                            delete newLectureNames[key];
                        }
                    });

                    Object.keys(c.notes || {}).forEach(key => {
                         if (key.includes(oldName)) {
                            const newKey = key.replace(oldName, newName);
                            newNotes[newKey] = c.notes![key];
                            delete newNotes[key];
                        }
                    });

                    return { ...c, name: newName, checkedState: newCheckedState, lectureNames: newLectureNames, notes: newNotes };
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

  const updateChapterDeadline = useCallback((subjectName: string, chapterName: string, deadline: number | null) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
        if (s.name === subjectName) {
            const newChapters = s.chapters.map(c => {
                if (c.name === chapterName) {
                    const newChapter = { ...c };
                    if (deadline) {
                        newChapter.deadline = deadline;
                    } else {
                        delete newChapter.deadline;
                    }
                    return newChapter;
                }
                return c;
            });
            return { ...s, chapters: newChapters };
        }
        return s;
    });
    updateSubjects(newSubjects);
  }, [activeProfile, updateSubjects]);

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
            const newCheckedState: Record<string, CheckedState> = {};
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
                const newCheckedState: Record<string, CheckedState> = {};
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
    if (!activeProfile) return;
    const newPlannerNotes = { ...(activeProfile.plannerNotes || {}) };
    if (note) {
        newPlannerNotes[dateKey] = note;
    } else {
        delete newPlannerNotes[dateKey];
    }
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, plannerNotes: newPlannerNotes } : p);
    updateProfiles(newProfiles, activeProfileName, { plannerNotes: newPlannerNotes });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addNote = useCallback((title: string, content: string): Note | undefined => {
    if (!activeProfile) return;
    const newNote: Note = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
    };
    const updatedNotes = [newNote, ...(activeProfile.notes || [])];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, notes: updatedNotes } : p);
    updateProfiles(newProfiles, activeProfileName, { notes: updatedNotes });
    return newNote;
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateNote = useCallback((updatedNote: Note) => {
    if (!activeProfile) return;
    const updatedNotes = (activeProfile.notes || []).map(n => n.id === updatedNote.id ? { ...updatedNote, title: updatedNote.title.trim(), content: updatedNote.content.trim() } : n);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, notes: updatedNotes } : p);
    updateProfiles(newProfiles, activeProfileName, { notes: updatedNotes });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteNote = useCallback((noteId: string) => {
    if (!activeProfile) return;
    const updatedNotes = (activeProfile.notes || []).filter(n => n.id !== noteId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, notes: updatedNotes } : p);
    updateProfiles(newProfiles, activeProfileName, { notes: updatedNotes });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const setNotes = useCallback((notes: Note[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, notes } : p);
    updateProfiles(newProfiles, activeProfileName, { notes });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addLink = useCallback((title: string, url: string) => {
    if (!activeProfile) return;
    const newLink: ImportantLink = { id: crypto.randomUUID(), title, url };
    const updatedLinks = [...(activeProfile.importantLinks || []), newLink];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, importantLinks: updatedLinks } : p);
    updateProfiles(newProfiles, activeProfileName, { importantLinks: updatedLinks });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateLink = useCallback((updatedLink: ImportantLink) => {
    if (!activeProfile) return;
    const updatedLinks = (activeProfile.importantLinks || []).map(l => l.id === updatedLink.id ? updatedLink : l);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, importantLinks: updatedLinks } : p);
    updateProfiles(newProfiles, activeProfileName, { importantLinks: updatedLinks });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteLink = useCallback((linkId: string) => {
    if (!activeProfile) return;
    const updatedLinks = (activeProfile.importantLinks || []).filter(l => l.id !== linkId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, importantLinks: updatedLinks } : p);
    updateProfiles(newProfiles, activeProfileName, { importantLinks: updatedLinks });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);
  
  const setLinks = useCallback((links: ImportantLink[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, importantLinks: links } : p);
    updateProfiles(newProfiles, activeProfileName, { importantLinks: links });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addTodo = useCallback((text: string, forDate: string) => {
    if (!activeProfile) return;
    const newTodo: SmartTodo = {
      id: crypto.randomUUID(),
      text,
      forDate,
      status: 'pending',
      createdAt: Date.now(),
    };
    const updatedTodos = [newTodo, ...(activeProfile.todos || [])];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, todos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { todos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateTodo = useCallback((updatedTodo: SmartTodo) => {
    if (!activeProfile) return;
    const updatedTodos = (activeProfile.todos || []).map(t => t.id === updatedTodo.id ? updatedTodo : t);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, todos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { todos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteTodo = useCallback((todoId: string) => {
    if (!activeProfile) return;
    const updatedTodos = (activeProfile.todos || []).filter(t => t.id !== todoId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, todos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { todos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const setTodos = useCallback((todos: SmartTodo[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, todos } : p);
    updateProfiles(newProfiles, activeProfileName, { todos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addSimpleTodo = useCallback((text: string, priority: Priority, deadline?: number) => {
    if (!activeProfile) return;
    const newTodo: SimpleTodo = {
      id: crypto.randomUUID(),
      text,
      status: 'unchecked',
      createdAt: Date.now(),
      priority,
    };
    if (deadline) newTodo.deadline = deadline;
    const updatedTodos = [...(activeProfile.simpleTodos || []), newTodo];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, simpleTodos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { simpleTodos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateSimpleTodo = useCallback((updatedTodo: SimpleTodo) => {
    if (!activeProfile) return;
    const updatedTodos = (activeProfile.simpleTodos || []).map(t => t.id === updatedTodo.id ? updatedTodo : t);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, simpleTodos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { simpleTodos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteSimpleTodo = useCallback((todoId: string) => {
    if (!activeProfile) return;
    const updatedTodos = (activeProfile.simpleTodos || []).filter(t => t.id !== todoId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, simpleTodos: updatedTodos } : p);
    updateProfiles(newProfiles, activeProfileName, { simpleTodos: updatedTodos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);
  
  const setSimpleTodos = useCallback((todos: SimpleTodo[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, simpleTodos: todos } : p);
    updateProfiles(newProfiles, activeProfileName, { simpleTodos: todos });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);
  
  const addQuestionSession = useCallback((session: QuestionSession) => {
    if (!activeProfile) return;
    const currentSessions = activeProfile.questionSessions || [];
    const updatedSessions = [session, ...currentSessions].slice(0, 50);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, questionSessions: updatedSessions } : p);
    updateProfiles(newProfiles, activeProfileName, { questionSessions: updatedSessions });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addTimeEntry = useCallback((entry: Omit<TimeEntry, 'id'>): TimeEntry | undefined => {
    if (!activeProfile) return;
    const newEntry: TimeEntry = { id: crypto.randomUUID(), ...entry };
    const updatedEntries = [newEntry, ...(activeProfile.timeEntries || [])];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timeEntries: updatedEntries } : p);
    updateProfiles(newProfiles, activeProfileName, { timeEntries: updatedEntries });
    return newEntry;
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateTimeEntry = useCallback((updatedEntry: TimeEntry) => {
    if (!activeProfile) return;
    const updatedEntries = (activeProfile.timeEntries || []).map(entry => entry.id === updatedEntry.id ? updatedEntry : entry);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timeEntries: updatedEntries } : p);
    updateProfiles(newProfiles, activeProfileName, { timeEntries: updatedEntries });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteTimeEntry = useCallback((entryId: string) => {
    if (!activeProfile) return;
    const updatedEntries = (activeProfile.timeEntries || []).filter(entry => entry.id !== entryId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timeEntries: updatedEntries } : p);
    updateProfiles(newProfiles, activeProfileName, { timeEntries: updatedEntries });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const setTimeEntries = useCallback((entries: TimeEntry[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timeEntries: entries } : p);
    updateProfiles(newProfiles, activeProfileName, { timeEntries: entries });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addProject = useCallback((name: string, color: string) => {
    if (!activeProfile) return;
    const newProject: Project = { id: crypto.randomUUID(), name, color };
    const updatedProjects = [...(activeProfile.projects || []), newProject];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, projects: updatedProjects } : p);
    updateProfiles(newProfiles, activeProfileName, { projects: updatedProjects });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateProject = useCallback((updatedProject: Project) => {
    if (!activeProfile) return;
    const updatedProjects = (activeProfile.projects || []).map(proj => proj.id === updatedProject.id ? updatedProject : proj);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, projects: updatedProjects } : p);
    updateProfiles(newProfiles, activeProfileName, { projects: updatedProjects });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteProject = useCallback((projectId: string) => {
    if (!activeProfile) return;
    const updatedProjects = (activeProfile.projects || []).filter(proj => proj.id !== projectId);
    const updatedTimeEntries = (activeProfile.timeEntries || []).map(entry => 
        entry.projectId === projectId ? { ...entry, projectId: null } : entry
    );
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, projects: updatedProjects, timeEntries: updatedTimeEntries } : p);
    updateProfiles(newProfiles, activeProfileName, { projects: updatedProjects, timeEntries: updatedTimeEntries });
    toast({ title: "Project Deleted", description: "The project has been successfully deleted.", variant: "destructive" });
  }, [activeProfile, activeProfileName, profiles, updateProfiles, toast]);

  const updateTimesheetEntry = useCallback((projectId: string, date: string, seconds: number) => {
    if (!activeProfile) return;
    const newTimesheetData = { ...(activeProfile.timesheetData || {}) };
    if (!newTimesheetData[projectId]) newTimesheetData[projectId] = {};
    if (seconds > 0) newTimesheetData[projectId][date] = seconds;
    else delete newTimesheetData[projectId][date];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timesheetData: newTimesheetData } : p);
    updateProfiles(newProfiles, activeProfileName, { timesheetData: newTimesheetData });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);
  
  const setTimesheetData = useCallback((data: TimesheetData) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timesheetData: data } : p);
    updateProfiles(newProfiles, activeProfileName, { timesheetData: data });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addExamCountdown = useCallback((title: string, date: Date) => {
    if (!activeProfile) return;
    const newCountdown: ExamCountdown = { id: crypto.randomUUID(), title, date: date.getTime() };
    const updatedCountdowns = [...(activeProfile.examCountdowns || []), newCountdown];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, examCountdowns: updatedCountdowns } : p);
    updateProfiles(newProfiles, activeProfileName, { examCountdowns: updatedCountdowns });
    toast({ title: "Countdown Added", description: `"${title}" has been added.` });
  }, [activeProfile, activeProfileName, profiles, updateProfiles, toast]);

  const updateExamCountdown = useCallback((updatedCountdown: ExamCountdown) => {
    if (!activeProfile) return;
    const updatedCountdowns = (activeProfile.examCountdowns || []).map(cd => cd.id === updatedCountdown.id ? updatedCountdown : cd);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, examCountdowns: updatedCountdowns } : p);
    updateProfiles(newProfiles, activeProfileName, { examCountdowns: updatedCountdowns });
    toast({ title: "Countdown Updated", description: `"${updatedCountdown.title}" has been updated.` });
  }, [activeProfile, activeProfileName, profiles, updateProfiles, toast]);

  const deleteExamCountdown = useCallback((countdownId: string) => {
    if (!activeProfile) return;
    const updatedCountdowns = (activeProfile.examCountdowns || []).filter(cd => cd.id !== countdownId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, examCountdowns: updatedCountdowns } : p);
    updateProfiles(newProfiles, activeProfileName, { examCountdowns: updatedCountdowns });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);
  
  const setExamCountdowns = useCallback((countdowns: ExamCountdown[]) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, examCountdowns: countdowns } : p);
    updateProfiles(newProfiles, activeProfileName, { examCountdowns: countdowns });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const setPinnedCountdownId = useCallback((id: string | null) => {
    if (!activeProfile) return;
    const newProfiles = profiles.map(p => 
        p.name === activeProfileName ? { ...p, pinnedCountdownId: id } : p
    );
    updateProfiles(newProfiles, activeProfileName, { pinnedCountdownId: id });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addTimeOffRequest = useCallback((request: Omit<TimeOffRequest, 'id'>) => {
    if (!activeProfile) return;
    const newRequest: TimeOffRequest = { ...request, id: crypto.randomUUID() };
    const updatedRequests = [...(activeProfile.timeOffRequests || []), newRequest];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, timeOffRequests: updatedRequests } : p);
    updateProfiles(newProfiles, activeProfileName, { timeOffRequests: updatedRequests });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addShift = useCallback((shift: Omit<Shift, 'id'>) => {
    if (!activeProfile) return;
    const newShift: Shift = { ...shift, id: crypto.randomUUID() };
    const updatedShifts = [...(activeProfile.shifts || []), newShift];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, shifts: updatedShifts } : p);
    updateProfiles(newProfiles, activeProfileName, { shifts: updatedShifts });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateShift = useCallback((updatedShift: Shift) => {
    if (!activeProfile) return;
    const updatedShifts = (activeProfile.shifts || []).map(s => s.id === updatedShift.id ? updatedShift : s);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, shifts: updatedShifts } : p);
    updateProfiles(newProfiles, activeProfileName, { shifts: updatedShifts });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteShift = useCallback((shiftId: string) => {
    if (!activeProfile) return;
    const updatedShifts = (activeProfile.shifts || []).filter(s => s.id !== shiftId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, shifts: updatedShifts } : p);
    updateProfiles(newProfiles, activeProfileName, { shifts: updatedShifts });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const addTeamMember = useCallback((name: string) => {
    if (!activeProfile) return;
    const newMember: TeamMember = { id: crypto.randomUUID(), name };
    const updatedTeam = [...(activeProfile.team || []), newMember];
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, team: updatedTeam } : p);
    updateProfiles(newProfiles, activeProfileName, { team: updatedTeam });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const updateTeamMember = useCallback((updatedMember: TeamMember) => {
    if (!activeProfile) return;
    const updatedTeam = (activeProfile.team || []).map(m => m.id === updatedMember.id ? updatedMember : m);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, team: updatedTeam } : p);
    updateProfiles(newProfiles, activeProfileName, { team: updatedTeam });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const deleteTeamMember = useCallback((memberId: string) => {
    if (!activeProfile) return;
    const updatedTeam = (activeProfile.team || []).filter(m => m.id !== memberId);
    const updatedShifts = (activeProfile.shifts || []).filter(s => s.memberId !== memberId);
    const newProfiles = profiles.map(p => p.name === activeProfileName ? { ...p, team: updatedTeam, shifts: updatedShifts } : p);
    updateProfiles(newProfiles, activeProfileName, { team: updatedTeam, shifts: updatedShifts });
  }, [activeProfile, activeProfileName, profiles, updateProfiles]);

  const exportData = useCallback(() => {
    if (typeof window === 'undefined' || profiles.length === 0) {
        toast({ title: "Export Failed", description: "No data to export.", variant: "destructive" });
        return;
    };
    const dataToStore = {
        profiles,
        activeProfileName,
        settings: {
            theme,
            mode,
            sidebarWidth
        }
    };
    const dataStr = JSON.stringify(dataToStore, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const dateStr = format(new Date(), 'dd-MM-yy');
    const username = user?.displayName || 'guest';
    link.download = `studytracker_data_${username}_${dateStr}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Your data has been downloaded." });
  }, [profiles, activeProfileName, user, theme, mode, sidebarWidth, toast]);

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
                  
                  if (data.settings) {
                      setTheme(data.settings.theme || 'default');
                      setMode(data.settings.mode || 'dark');
                      setSidebarWidth(data.settings.sidebarWidth || DEFAULT_SIDEBAR_WIDTH);
                  }

                  saveData({ profiles: processed, activeProfileName: data.activeProfileName });
                  toast({ title: "Import Successful", description: "Your data has been restored." });
              } else {
                  throw new Error("Invalid file format.");
              }
          } catch (error) {
              toast({ title: "Import Failed", description: "The selected file is not valid.", variant: "destructive" });
          }
      };
      reader.readAsText(file);
  }, [saveData, toast, setTheme, setMode, setSidebarWidth]);
  
  const signOutUser = useCallback(async () => {
    await signOut();
    setProfiles([]);
    setActiveProfileName(null);
    setActiveSubjectName(null);
    localStorage.removeItem(getLocalKey(null));
  }, []);

  const value = useMemo(() => ({
    user, userDoc, loading, profiles, activeProfile, activeSubjectName, setActiveSubjectName,
    addProfile, removeProfile, renameProfile, switchProfile, updateSubjects, addSubject, removeSubject, renameSubject,
    addChapter, removeChapter, updateChapter, renameChapter, updateChapterDeadline, updateTasks, renameTask,
    updatePlannerNote, addNote, updateNote, deleteNote, setNotes, addLink, updateLink, deleteLink, setLinks,
    addTodo, updateTodo, deleteTodo, setTodos,
    addSimpleTodo, updateSimpleTodo, deleteSimpleTodo, setSimpleTodos,
    addQuestionSession, addTimeEntry, updateTimeEntry, deleteTimeEntry, setTimeEntries,
    addProject, updateProject, deleteProject, updateTimesheetEntry, setTimesheetData,
    addExamCountdown, updateExamCountdown, deleteExamCountdown, setExamCountdowns, setPinnedCountdownId,
    addTimeOffRequest, addShift, updateShift, deleteShift, addTeamMember, updateTeamMember, deleteTeamMember,
    exportData, importData, signOutUser, refreshUserDoc,
    theme, setTheme, mode, setMode, isThemeHydrated, sidebarWidth, setSidebarWidth,
    showProgressDownloadPrompt, setShowProgressDownloadPrompt,
  }), [
    user, userDoc, loading, profiles, activeProfile, activeSubjectName,
    addProfile, removeProfile, renameProfile, switchProfile, updateSubjects, addSubject, removeSubject, renameSubject,
    addChapter, removeChapter, updateChapter, renameChapter, updateChapterDeadline, updateTasks, renameTask,
    updatePlannerNote, addNote, updateNote, deleteNote, setNotes, addLink, updateLink, deleteLink, setLinks,
    addTodo, updateTodo, deleteTodo, setTodos,
    addSimpleTodo, updateSimpleTodo, deleteSimpleTodo, setSimpleTodos,
    addQuestionSession, addTimeEntry, updateTimeEntry, deleteTimeEntry, setTimeEntries,
    addProject, updateProject, deleteProject, updateTimesheetEntry, setTimesheetData,
    addExamCountdown, updateExamCountdown, deleteExamCountdown, setExamCountdowns, setPinnedCountdownId,
    addTimeOffRequest, addShift, updateShift, deleteShift, addTeamMember, updateTeamMember, deleteTeamMember,
    exportData, importData, signOutUser, refreshUserDoc,
    theme, setTheme, mode, setMode, isThemeHydrated, sidebarWidth, setSidebarWidth, setActiveSubjectName,
    showProgressDownloadPrompt
  ]);
  
  const shouldShowCreateProfile = useMemo(() => {
    const protectedPages = ['/dashboard', '/settings', '/clockify', '/admin', '/notes'];
    
    if (loading) return false;
    
    if (protectedPages.some(p => pathname.startsWith(p)) && profiles.length === 0) {
      return true;
    }
    
    return false;
  }, [loading, pathname, profiles.length]);


  if (shouldShowCreateProfile) {
      return (
        <DataContext.Provider value={value}>
            <Suspense fallback={<LoadingSpinner containerClassName="min-h-screen" text="Loading..." />}>
                <CreateProfileScreen onProfileCreate={addProfile} />
            </Suspense>
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







export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
}

export type Priority = "High" | "Medium" | "Low";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: number; // Using number (timestamp) for easier serialization
  priority: Priority;
}

export interface Chapter {
  name: string;
  lectureCount: number;
  checkedState?: Record<string, boolean>;
  notes?: Record<string, string>;
}

export interface Subject {
  name: string;
  icon: string;
  chapters: Chapter[];
  tasks: string[];
}

export interface ProgressPoint {
  date: string; // 'YYYY-MM-DD'
  progress: number;
}

export interface QuestionSession {
  id: string;
  date: number; // timestamp
  numQuestions: number;
  totalTime: number; // in ms
  questionTimes: number[]; // array of times in ms
}

export interface Profile {
  name:string;
  subjects: Subject[];
  plannerNotes?: Record<string, string>;
  notes?: Note[];
  importantLinks?: ImportantLink[];
  todos?: Todo[];
  progressHistory?: ProgressPoint[];
  questionSessions?: QuestionSession[];
}

export interface AppUser {
    uid: string;
    username: string;
    email: string;
    googleEmail?: string;
    role?: 'admin' | 'user';
}

export type FeedbackStatus = 'Pending' | 'In Progress' | 'Done' | 'Fixed';

export interface Feedback {
    id?: string;
    userId: string;
    userEmail: string;
    type: 'Bug Report' | 'Feature Request' | 'Other';
    message: string;
    createdAt: any; // Firestore ServerTimestamp
    status?: FeedbackStatus;
}

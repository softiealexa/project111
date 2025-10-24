

import type { Timestamp } from 'firebase/firestore';

export type TaskStatus = 'unchecked' | 'checked' | 'checked-red';
export type Priority = 'Low' | 'Medium' | 'High';

export interface CheckedState {
    status: TaskStatus;
    completedAt?: number; // Timestamp
}

export interface SimpleTodo {
  id: string;
  text: string;
  status: TaskStatus;
  completedAt?: number;
  createdAt: number;
  deadline?: number; // Optional timestamp
  priority?: Priority; // Optional priority
}

export interface SmartTodo {
  id: string;
  text: string;
  forDate: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
  completedAt?: number; // timestamp
  createdAt: number; // timestamp
  rolledOver?: boolean;
}

export interface TimesheetEntry {
  [date: string]: number; // date is 'YYYY-MM-DD', value is seconds
}

export interface TimesheetData {
  [projectId: string]: TimesheetEntry;
}

export interface Project {
    id: string;
    name: string;
    color: string;
}

export interface TimeEntry {
    id:string;
    task: string;
    projectId: string | null;
    tags: string[];
    billable: boolean;
    startTime: number; // timestamp
    endTime: number | null; // timestamp
    duration: number; // in seconds
}

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

export interface Topic {
  name: string;
  completed: boolean;
}

export interface Chapter {
  name: string;
  lectureCount: number;
  checkedState?: Record<string, CheckedState>;
  notes?: Record<string, string>;
  lectureNames?: Record<string, string>;
  deadline?: number;
  syllabus?: Topic[];
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

export interface ExamCountdown {
  id: string;
  title: string;
  date: number; // timestamp
}

export interface TimeOffPolicy {
    id: string;
    name: string;
    allowance: number; // in days
    color: string;
}

export interface TimeOffRequest {
    id: string;
    policyId: string;
    from: number; // timestamp
    to: number; // timestamp
    status: 'pending' | 'approved' | 'rejected';
    userName: string; // Simplified for now
}

export interface TeamMember {
    id: string;
    name: string;
}

export interface Shift {
    id: string;
    memberId: string;
    startTime: number; // timestamp
    endTime: number; // timestamp
    role?: string;
    note?: string;
}

export type SidebarWidth = number;

export interface StopwatchSession {
  id: string;
  type: 'study' | 'break';
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  laps?: number[]; // Array of lap durations in seconds
  manual?: boolean; // Flag for manually added sessions
  subject?: string | null;
}

export interface StopwatchDaySummary {
    date: string; // YYYY-MM-DD
    totalStudyTime: number;
    totalBreakTime: number;
    sessionCount: number;
    longestStreak: number;
}

export interface Profile {
  name:string;
  subjects: Subject[];
  plannerNotes?: Record<string, string>;
  notes?: Note[];
  importantLinks?: ImportantLink[];
  todos?: SmartTodo[];
  simpleTodos?: SimpleTodo[];
  progressHistory?: ProgressPoint[];
  questionSessions?: QuestionSession[];
  examCountdowns?: ExamCountdown[];
  pinnedCountdownId?: string | null;
  timeEntries?: TimeEntry[];
  projects?: Project[];
  timesheetData?: TimesheetData;
  timeOffPolicies?: TimeOffPolicy[];
  timeOffRequests?: TimeOffRequest[];
  team?: TeamMember[];
  shifts?: Shift[];
  stopwatchSessions?: Record<string, StopwatchSession[]>;
  stopwatchSummaries?: Record<string, StopwatchDaySummary>;
  stopwatchStudyGoal?: number; // Daily goal in seconds
}

export interface AppUser {
    uid: string;
    username: string;
    email: string;
    googleEmail?: string;
    role?: 'admin' | 'user';
    createdAt?: Timestamp;
    lastActivityAt?: Timestamp;
}

export interface DisplayUser extends AppUser {
    createdAtDate?: Date;
    lastActivityDate?: Date;
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

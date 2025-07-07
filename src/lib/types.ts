
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
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

export interface Profile {
  name: string;
  subjects: Subject[];
  plannerNotes?: Record<string, string>;
  notes?: Note[];
}

export interface Chapter {
  name: string;
  lectureCount: number;
  checkedState?: Record<string, boolean>;
  notes?: Record<string, string>;
}

export interface Subject {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  chapters: Chapter[];
  tasks: string[];
}

export interface Profile {
  name: string;
  subjects: Subject[];
}

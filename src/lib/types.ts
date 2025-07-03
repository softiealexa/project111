export interface Chapter {
  name: string;
  lectureCount: number;
  checkedState?: Record<string, boolean>;
}

export interface Subject {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  chapters: Chapter[];
}

export interface Profile {
  name: string;
  subjects: Subject[];
}

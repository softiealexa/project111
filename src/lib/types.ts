export interface Chapter {
  name: string;
  lectureCount: number;
  checkedState?: Record<string, boolean>;
}

export interface Subject {
  name: "Physics" | "Chemistry" | "Maths";
  icon: React.ComponentType<{ className?: string }>;
  chapters: Chapter[];
}

export interface User {
    uid: string;
    email: string | null;
}

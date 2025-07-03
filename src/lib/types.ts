export interface Chapter {
  name: string;
  lectureCount: number;
}

export interface Subject {
  name: "Physics" | "Chemistry" | "Maths";
  icon: React.ComponentType<{ className?: string }>;
  chapters: Chapter[];
}

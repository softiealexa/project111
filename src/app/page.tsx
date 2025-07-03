'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { subjects as initialSubjects } from "@/lib/data"
import LectureTracker from "@/components/lecture-tracker";
import { BookOpenCheck } from "lucide-react";
import type { Chapter } from '@/lib/types';

export default function Home() {
  const [subjects, setSubjects] = useState(initialSubjects);

  const handleAddChapter = (subjectName: string, newChapter: Chapter) => {
    setSubjects(currentSubjects => 
      currentSubjects.map(subject => {
        if (subject.name === subjectName) {
          const updatedChapters = [...subject.chapters, newChapter];
          return { ...subject, chapters: updatedChapters };
        }
        return subject;
      })
    );
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
      <header className="w-full max-w-5xl px-4 py-8 md:py-12">
        <div className="flex items-center gap-4">
          <BookOpenCheck className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            Trackademic
          </h1>
        </div>
        <p className="mt-2 text-lg text-foreground/80">
          Your daily guide to mastering concepts, one lecture at a time.
        </p>
      </header>
      <main className="w-full max-w-5xl flex-1 px-4 pb-12">
        <Tabs defaultValue={subjects[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            {subjects.map((subject) => (
              <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2">
                <subject.icon className="h-5 w-5" />
                <span>{subject.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {subjects.map((subject) => (
            <TabsContent key={subject.name} value={subject.name} className="mt-6">
              <LectureTracker subject={subject} onAddChapter={(newChapter) => handleAddChapter(subject.name, newChapter)} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <footer className="w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Built for focused learners. &copy; {new Date().getFullYear()} Trackademic.</p>
      </footer>
    </div>
  );
}

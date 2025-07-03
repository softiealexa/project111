'use client';

import { useData } from '@/contexts/data-context';
import type { Chapter, Subject } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LectureTracker from "@/components/lecture-tracker";
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { Book } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function Home() {
  const { activeProfile, updateSubjects } = useData();

  if (!activeProfile) {
    return (
       <div className="flex w-full flex-col items-center bg-background text-foreground">
         <div className="w-full max-w-5xl px-4 py-8 md:py-12 text-center">
            <h1 className="font-headline text-4xl md:text-5xl font-bold">Loading Profile...</h1>
            <p className="mt-2 text-lg text-foreground/80">Please wait or select a profile.</p>
         </div>
       </div>
    )
  }

  const handleAddChapter = (subjectName: string, newChapter: Chapter) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(subject => {
      if (subject.name === subjectName) {
        const updatedChapters = [...subject.chapters, newChapter];
        return { ...subject, chapters: updatedChapters };
      }
      return subject;
    });
    updateSubjects(newSubjects);
  };
  
  const handleAddSubject = (subjectName: string) => {
    if (!activeProfile) return;
    const newSubject: Subject = {
      name: subjectName,
      icon: Book,
      chapters: [],
    };
    const newSubjects = [...activeProfile.subjects, newSubject];
    updateSubjects(newSubjects);
  };

  return (
    <div className="flex w-full flex-col items-center bg-background text-foreground">
      <header className="w-full max-w-5xl px-4 py-8 md:py-12 border-b border-border/50 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Profile: {activeProfile.name}
          </h1>
        </div>
        <p className="mt-2 text-lg text-foreground/80">
          Your daily guide to mastering concepts, one lecture at a time.
        </p>
      </header>
      <div className="w-full max-w-5xl flex-1 px-4 pb-12">
        {activeProfile.subjects.length > 0 ? (
          <>
            <div className="flex justify-end mb-4">
              <AddSubjectDialog
                onAddSubject={handleAddSubject}
                existingSubjects={activeProfile.subjects.map(s => s.name)}
              />
            </div>
            <Tabs defaultValue={activeProfile.subjects[0]?.name} className="w-full">
              <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2.5">
                <TabsList className="bg-muted h-auto sm:h-10 justify-start">
                  {activeProfile.subjects.map((subject) => (
                    <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2">
                      {subject.icon && <subject.icon className="h-5 w-5" />}
                      <span>{subject.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              {activeProfile.subjects.map((subject) => (
                <TabsContent key={subject.name} value={subject.name} className="mt-6">
                  <LectureTracker subject={subject} onAddChapter={(newChapter) => handleAddChapter(subject.name, newChapter)} />
                </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-headline">No Subjects Yet!</h2>
            <p className="text-muted-foreground">Get started by adding your first subject.</p>
            <AddSubjectDialog
              onAddSubject={handleAddSubject}
              existingSubjects={[]}
            />
          </div>
        )}
      </div>
      <footer className="w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Built for focused learners. &copy; {new Date().getFullYear()} Trackademic.</p>
      </footer>
    </div>
  );
}

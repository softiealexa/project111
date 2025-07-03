'use client';

import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import type { Chapter, Subject } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LectureTracker from "@/components/lecture-tracker";
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { RemoveSubjectDialog } from '@/components/remove-subject-dialog';
import { AddChapterDialog } from '@/components/add-chapter-dialog';
import { RemoveChapterDialog } from '@/components/remove-chapter-dialog';
import { Book, FolderPlus, PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const { activeProfile, updateSubjects } = useData();
  const [activeTab, setActiveTab] = useState(activeProfile?.subjects[0]?.name ?? '');

  useEffect(() => {
    if (activeProfile) {
      const activeSubjectExists = activeProfile.subjects.some(s => s.name === activeTab);
      if (!activeSubjectExists) {
        setActiveTab(activeProfile.subjects[0]?.name ?? '');
      }
    }
  }, [activeProfile, activeTab]);

  const activeSubject = useMemo(() => {
    return activeProfile?.subjects.find(s => s.name === activeTab);
  }, [activeProfile, activeTab]);

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

  const handleAddChapter = (newChapter: Chapter) => {
    if (!activeProfile || !activeTab) return;
    const newSubjects = activeProfile.subjects.map(subject => {
      if (subject.name === activeTab) {
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
    setActiveTab(subjectName);
  };

  const handleRemoveSubject = (subjectNameToRemove: string) => {
    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.filter(s => s.name !== subjectNameToRemove);
    updateSubjects(newSubjects);
  }

  const handleRemoveChapter = (chapterNameToRemove: string) => {
    if (!activeProfile || !activeTab) return;
    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === activeTab) {
        const updatedChapters = s.chapters.filter((chapter) => chapter.name !== chapterNameToRemove);
        return { ...s, chapters: updatedChapters };
      }
      return s;
    });
    updateSubjects(newSubjects);
  }

  return (
    <div className="flex w-full flex-col items-center bg-background text-foreground pb-12">
      <TooltipProvider delayDuration={100}>
        <div className="w-full max-w-5xl flex-1 px-4 pt-8">
          {activeProfile.subjects.length > 0 ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between gap-4">
                  <ScrollArea className="flex-1 whitespace-nowrap rounded-md pb-2.5">
                    <TabsList className="bg-muted h-auto justify-start sm:h-10">
                      {activeProfile.subjects.map((subject) => (
                        <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2">
                          {subject.icon && <subject.icon className="h-5 w-5" />}
                          <span>{subject.name}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  
                  <div className="shrink-0">
                    <div className="flex items-center gap-1 p-1.5 shadow-lg border border-primary/20 bg-card/80 backdrop-blur-sm rounded-full">
                        <AddSubjectDialog 
                            onAddSubject={handleAddSubject} 
                            existingSubjects={activeProfile.subjects.map(s => s.name)}
                        />
                        {activeProfile.subjects.length > 0 && (
                            <RemoveSubjectDialog
                                subjects={activeProfile.subjects}
                                onConfirm={handleRemoveSubject}
                            />
                        )}
                        
                        {(activeProfile.subjects.length > 0) && <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />}

                        {activeSubject ? (
                            <>
                                <AddChapterDialog onAddChapter={handleAddChapter} />
                                {activeSubject.chapters.length > 0 && (
                                    <RemoveChapterDialog
                                        chapters={activeSubject.chapters}
                                        onConfirm={handleRemoveChapter}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" disabled>
                                  <PlusCircle className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" disabled>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </>
                        )}
                    </div>
                  </div>
                </div>

                {activeProfile.subjects.map((subject) => (
                  <TabsContent key={subject.name} value={subject.name} className="mt-6">
                    <LectureTracker subject={subject} />
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
      </TooltipProvider>

      <footer className="w-full max-w-5xl px-4 py-6 mt-8 text-center text-sm text-muted-foreground">
        <p>Built for focused learners. &copy; {new Date().getFullYear()} TrackAcademic.</p>
      </footer>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/live-clock';
import { getIconComponent } from '@/lib/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Timer, ListTodo, CalendarDays, Link as LinkIcon, Keyboard } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useSearchParams } from 'next/navigation';


// Lazy load components for better performance
const LectureTracker = dynamic(() => import("@/components/lecture-tracker"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Tracker..." />
});
const ProgressSummary = dynamic(() => import("@/components/progress-summary"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Progress..." />
});
const StudyPlanner = dynamic(() => import("@/components/study-planner"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Planner..." />
});
const TodoList = dynamic(() => import("@/components/todo-list"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading To-Do List..." />
});
const NotesWriter = dynamic(() => import("@/components/notes-writer"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Notes..." />
});
const PomodoroTimer = dynamic(() => import('@/components/pomodoro-timer'), {
    loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Timer..." />
});
const ImportantLinks = dynamic(() => import("@/components/important-links"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Links..." />
});
const QuestionTimer = dynamic(() => import('@/components/question-timer'), {
    loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Timer..." />
});

export default function DashboardClient() {
  const { activeProfile, activeSubjectName, setActiveSubjectName } = useData();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState('subjects');
  
  useEffect(() => {
    const validTabs = ['subjects', 'progress', 'tools'];
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      setMainTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (activeProfile && activeProfile.subjects.length > 0 && !activeSubjectName) {
      setActiveSubjectName(activeProfile.subjects[0].name);
    } else if (activeProfile && activeProfile.subjects.length > 0 && activeSubjectName) {
        const activeSubjectExists = activeProfile.subjects.some(s => s.name === activeSubjectName);
        if (!activeSubjectExists) {
            setActiveSubjectName(activeProfile.subjects[0]?.name ?? null);
        }
    } else if (activeProfile && activeProfile.subjects.length === 0) {
        setActiveSubjectName(null);
    }
  }, [activeProfile, activeSubjectName, setActiveSubjectName]);


  if (!activeProfile) {
    return (
       <div className="flex w-full flex-col items-center bg-background text-foreground">
         <div className="w-full max-w-5xl px-4 py-8 md:py-12 text-center">
            <LoadingSpinner containerClassName="h-48" text="Loading Profile..."/>
            <p className="mt-2 text-lg text-muted-foreground">Please wait or select a profile.</p>
         </div>
       </div>
    )
  }

  const hasMoreThanFourSubjects = activeProfile.subjects.length > 4;

  return (
    <div className="flex w-full flex-col items-center bg-background text-foreground pb-12">
      <h1 className="sr-only">TrackAcademic Dashboard</h1>
      <div className="w-full max-w-5xl flex-1 px-4 pt-8">
        {activeProfile.subjects.length > 0 ? (
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="subjects">My Subjects</TabsTrigger>
              <TabsTrigger value="progress">Progress Overview</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="subjects">
              <Tabs value={activeSubjectName ?? ''} onValueChange={setActiveSubjectName} className="w-full">
                <div className="flex items-center justify-between gap-4">
                  <ScrollArea className="flex-1 whitespace-nowrap rounded-md pb-2.5">
                    <TabsList className={cn(
                      "bg-muted h-auto transition-all duration-300",
                      hasMoreThanFourSubjects ? 'justify-start' : 'grid w-full grid-cols-4 sm:justify-center'
                    )}>
                      {activeProfile.subjects.map((subject) => {
                        const Icon = getIconComponent(subject.icon);
                        return (
                          <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span>{subject.name}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  <LiveClock />
                </div>

                {activeProfile.subjects.map((subject) => (
                  <TabsContent key={subject.name} value={subject.name} className="mt-6">
                    <LectureTracker subject={subject} />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            <TabsContent value="progress">
              <ProgressSummary profile={activeProfile} />
            </TabsContent>

            <TabsContent value="tools">
              <Tabs defaultValue="planner" orientation="vertical" className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr] gap-6">
                      <TabsList className="flex-col h-auto items-stretch justify-start bg-transparent border-none p-0">
                          <TabsTrigger value="planner" className="justify-start gap-2 py-2.5 text-base">
                              <CalendarDays className="h-5 w-5" />
                              Study Planner
                          </TabsTrigger>
                          <TabsTrigger value="todo" className="justify-start gap-2 py-2.5 text-base">
                              <ListTodo className="h-5 w-5" />
                              To-Do List
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="justify-start gap-2 py-2.5 text-base">
                              <Pencil className="h-5 w-5" />
                              Notes Writer
                          </TabsTrigger>
                          <TabsTrigger value="timer" className="justify-start gap-2 py-2.5 text-base">
                              <Timer className="h-5 w-5" />
                              Pomodoro Timer
                          </TabsTrigger>
                           <TabsTrigger value="links" className="justify-start gap-2 py-2.5 text-base">
                              <LinkIcon className="h-5 w-5" />
                              Important Links
                           </TabsTrigger>
                           <TabsTrigger value="question-timer" className="justify-start gap-2 py-2.5 text-base">
                              <Keyboard className="h-5 w-5" />
                              Question Timer
                            </TabsTrigger>
                      </TabsList>
                      <div className="md:col-start-2">
                          <TabsContent value="planner" className="mt-0">
                              <StudyPlanner />
                          </TabsContent>
                          <TabsContent value="todo" className="mt-0">
                              <TodoList />
                          </TabsContent>
                          <TabsContent value="notes" className="mt-0">
                              <NotesWriter />
                          </TabsContent>
                          <TabsContent value="timer" className="mt-0">
                              <Card>
                                  <CardHeader>
                                      <CardTitle>Pomodoro Timer</CardTitle>
                                      <CardDescription>Stay focused with the Pomodoro technique.</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                      <PomodoroTimer />
                                  </CardContent>
                              </Card>
                          </TabsContent>
                          <TabsContent value="links" className="mt-0">
                              <ImportantLinks />
                          </TabsContent>
                          <TabsContent value="question-timer" className="mt-0">
                              <QuestionTimer />
                          </TabsContent>
                      </div>
                  </div>
              </Tabs>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-headline">No Subjects Yet!</h2>
            <p className="text-muted-foreground">Get started by adding your first subject from the customization menu.</p>
          </div>
        )}
      </div>

      <footer className="w-full max-w-5xl px-4 py-6 mt-8 text-center text-sm text-muted-foreground">
        <p>Built for focused learners. &copy; {currentYear} TrackAcademic.</p>
      </footer>
    </div>
  );
}

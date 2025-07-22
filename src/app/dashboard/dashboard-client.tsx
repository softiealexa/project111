
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/live-clock';
import { getIconComponent } from '@/lib/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Timer, ListTodo, CalendarDays, Link as LinkIcon, Keyboard, Target, Beaker, CheckSquare, Calculator } from 'lucide-react';
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
const SmartTodoList = dynamic(() => import("@/components/smart-todo-list"), {
  loading: () => <LoadingSpinner containerClassName="h-96" text="Loading To-Do List..." />
});
const SimpleTodoList = dynamic(() => import("@/components/todo-list"), {
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
const ExamCountdown = dynamic(() => import('@/components/exam-countdown'), {
    loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Countdowns..." />
});
const UnitConverter = dynamic(() => import('@/components/unit-converter'), {
    loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Converter..." />
});
const BacklogPlanner = dynamic(() => import('@/components/backlog-planner'), {
    loading: () => <LoadingSpinner containerClassName="h-96" text="Loading Planner..." />
});


export default function DashboardClient() {
  const { activeProfile, activeSubjectName, setActiveSubjectName } = useData();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState('subjects');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // This ensures that background tabs only render on the client after initial hydration
    setIsClient(true);
  }, []);

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

  const hasMoreThanFourSubjects = activeProfile.subjects.length > 3;

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
                      "transition-all duration-300 p-1.5 sm:p-1 h-auto sm:h-10",
                      !hasMoreThanFourSubjects && "grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    )}>
                      {activeProfile.subjects.map((subject) => {
                        const Icon = getIconComponent(subject.icon);
                        return (
                          <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2 text-sm sm:text-base h-9 sm:h-auto">
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

            <TabsContent value="progress" forceMount={isClient} className={cn(mainTab !== 'progress' && 'hidden')}>
              <ProgressSummary profile={activeProfile} />
            </TabsContent>

            <TabsContent value="tools" forceMount={isClient} className={cn(mainTab !== 'tools' && 'hidden')}>
              <Tabs defaultValue="todo" orientation="vertical" className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr] gap-6">
                      <TabsList className="flex-col h-auto items-stretch justify-start bg-transparent border-none p-0">
                          <TabsTrigger value="todo" className="justify-start gap-2 py-2.5 text-base">
                              <ListTodo className="h-5 w-5" />
                              Smart To-Do
                          </TabsTrigger>
                           <TabsTrigger value="simple-todo" className="justify-start gap-2 py-2.5 text-base">
                              <CheckSquare className="h-5 w-5" />
                              Simple To-Do
                          </TabsTrigger>
                          <TabsTrigger value="backlog-planner" className="justify-start gap-2 py-2.5 text-base">
                              <Calculator className="h-5 w-5" />
                              Backlog Planner
                          </TabsTrigger>
                          <TabsTrigger value="unit-converter" className="justify-start gap-2 py-2.5 text-base">
                              <Beaker className="h-5 w-5" />
                              Unit Converter
                          </TabsTrigger>
                           <TabsTrigger value="links" className="justify-start gap-2 py-2.5 text-base">
                              <LinkIcon className="h-5 w-5" />
                              Important Links
                           </TabsTrigger>
                           <TabsTrigger value="question-timer" className="justify-start gap-2 py-2.5 text-base">
                              <Keyboard className="h-5 w-5" />
                              Question Timer
                            </TabsTrigger>
                          <TabsTrigger value="notes" className="justify-start gap-2 py-2.5 text-base">
                              <Pencil className="h-5 w-5" />
                              Notes Writer
                          </TabsTrigger>
                          <TabsTrigger value="planner" className="justify-start gap-2 py-2.5 text-base">
                              <CalendarDays className="h-5 w-5" />
                              Study Planner
                          </TabsTrigger>
                          <TabsTrigger value="timer" className="justify-start gap-2 py-2.5 text-base">
                              <Timer className="h-5 w-5" />
                              Pomodoro Timer
                          </TabsTrigger>
                          <TabsTrigger value="countdown" className="justify-start gap-2 py-2.5 text-base">
                              <Target className="h-5 w-5" />
                              Exam Countdown
                          </TabsTrigger>
                      </TabsList>
                      <div className="md:col-start-2">
                          <TabsContent value="todo" className="mt-0">
                              <SmartTodoList />
                          </TabsContent>
                          <TabsContent value="simple-todo" className="mt-0">
                              <SimpleTodoList />
                          </TabsContent>
                           <TabsContent value="backlog-planner" className="mt-0">
                              <BacklogPlanner />
                          </TabsContent>
                          <TabsContent value="unit-converter" className="mt-0">
                              <UnitConverter />
                          </TabsContent>
                          <TabsContent value="links" className="mt-0">
                              <ImportantLinks />
                          </TabsContent>
                          <TabsContent value="question-timer" className="mt-0">
                              <QuestionTimer />
                          </TabsContent>
                          <TabsContent value="notes" className="mt-0">
                              <NotesWriter />
                          </TabsContent>
                          <TabsContent value="planner" className="mt-0">
                              <StudyPlanner />
                          </TabsContent>
                          <TabsContent value="timer" className="mt-0">
                              <PomodoroTimer />
                          </TabsContent>
                          <TabsContent value="countdown" className="mt-0">
                              <ExamCountdown />
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

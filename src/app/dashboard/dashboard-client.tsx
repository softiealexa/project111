
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
import { Pencil, Timer, ListTodo, CalendarDays, Link as LinkIcon, Keyboard, Briefcase, Tag, DollarSign, ListTodo as ListTodoIcon, Play, MoreVertical, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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


// Helper types and functions for the new integrated timesheet
interface TimeEntry {
    id: string;
    task: string;
    project: string;
    projectColor: string;
    tags: string[];
    billable: boolean;
    startTime: Date;
    endTime: Date;
    duration: number; // in seconds
}

interface TimeEntryGroup {
    day: string;
    total: number; // in seconds
    items: TimeEntry[];
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatTimeRange = (start: Date, end: Date) => {
    const formatOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    return `${start.toLocaleTimeString([], formatOpts)} - ${end.toLocaleTimeString([], formatOpts)}`;
}


// The new integrated Timesheet component
function IntegratedTimeSheet() {
  const [task, setTask] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setTimerRunning(false);
    if (startTime && elapsedTime > 0) {
        const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            task: task || 'Unspecified Task',
            project: 'ACME',
            projectColor: 'text-blue-500',
            tags: [],
            billable: true,
            startTime: startTime,
            endTime: new Date(),
            duration: Math.round(elapsedTime),
        };
        setTimeEntries(prev => [newEntry, ...prev]);
    }
    setElapsedTime(0);
    setTask('');
  }, [startTime, elapsedTime, task]);

  const startTimer = useCallback(() => {
    setStartTime(new Date());
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { // Cleanup on unmount
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, []);
  
  const handleToggleTimer = () => {
    if (timerRunning) {
        stopTimer();
    } else {
        startTimer();
    }
  };
  
  const handleDeleteEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const timeEntryGroups = timeEntries.reduce<TimeEntryGroup[]>((acc, entry) => {
    const day = entry.startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let group = acc.find(g => g.day === day);
    if (!group) {
        group = { day: 'Today', total: 0, items: [] };
        if (entry.startTime.getDate() !== new Date().getDate()) {
            group.day = day;
        }
        acc.push(group);
    }
    group.items.push(entry);
    group.total += entry.duration;
    return acc;
  }, []);

  const weekTotal = timeEntries.reduce((acc, entry) => acc + entry.duration, 0);
    
    return (
        <div className="space-y-6">
            <Card className="shadow-md">
                <CardContent className="p-2">
                    <div className="flex flex-wrap items-center gap-4 p-2">
                        <Input 
                            placeholder="What are you working on?" 
                            className="flex-1 min-w-[200px] border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                        />
                        <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Project
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <span className="font-semibold text-lg font-mono">{formatDuration(elapsedTime)}</span>
                        <Button 
                            className={cn('text-white', timerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600')}
                            onClick={handleToggleTimer}
                        >
                            {timerRunning ? 'STOP' : 'START'}
                        </Button>
                         <Button variant="ghost" size="icon">
                            <ListTodoIcon className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-6 space-y-6">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">This week</span>
                    <span className="text-muted-foreground">Week total: <span className="font-semibold text-foreground">{formatDuration(weekTotal)}</span></span>
                </div>

                {timeEntryGroups.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No time entries yet. Start the timer to log your work.</p>
                    </div>
                )}

                {timeEntryGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                            <span className="font-semibold">{group.day}</span>
                            <span>Total: <span className="font-semibold text-foreground">{formatDuration(group.total)}</span></span>
                        </div>
                        <div className="space-y-1">
                            {group.items.map((item, itemIndex) => (
                                <Card key={item.id} className="shadow-sm">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <span>{item.task}</span>
                                                {item.project && <span className={`ml-2 font-semibold ${item.projectColor}`}>• {item.project}</span>}
                                            </div>
                                            <div className="hidden sm:flex items-center gap-2">
                                                {item.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <DollarSign className={`h-4 w-4 ${item.billable ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                                            </Button>
                                            <span className="hidden lg:inline-block text-sm text-muted-foreground w-48 text-center">{formatTimeRange(item.startTime, item.endTime)}</span>
                                            <span className="font-bold w-20 text-right">{formatDuration(item.duration)}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <div className="relative group">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-card border rounded-md shadow-lg z-10 hidden group-hover:block">
                                                    <Button variant="ghost" className="w-full justify-start text-sm text-red-500 hover:text-red-500" onClick={() => handleDeleteEntry(item.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function DashboardClient() {
  const { activeProfile, activeSubjectName, setActiveSubjectName } = useData();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState('subjects');
  
  useEffect(() => {
    const validTabs = ['subjects', 'timesheet', 'progress', 'tools'];
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
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="subjects">My Subjects</TabsTrigger>
              <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
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

            <TabsContent value="timesheet">
              <IntegratedTimeSheet />
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
                              <PomodoroTimer />
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

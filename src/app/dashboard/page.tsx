'use client';

import { useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LectureTracker from "@/components/lecture-tracker";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/live-clock';
import { ProgressSummary } from '@/components/progress-summary';
import { getIconComponent } from '@/lib/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Feather, Timer } from 'lucide-react';

export default function DashboardPage() {
  const { activeProfile, activeSubjectName, setActiveSubjectName } = useData();

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
            <h1 className="font-headline text-4xl md:text-5xl font-bold">Loading Profile...</h1>
            <p className="mt-2 text-lg text-foreground/80">Please wait or select a profile.</p>
         </div>
       </div>
    )
  }

  const hasMoreThanFourSubjects = activeProfile.subjects.length > 4;

  return (
    <div className="flex w-full flex-col items-center bg-background text-foreground pb-12">
      <TooltipProvider delayDuration={100}>
        <div className="w-full max-w-5xl flex-1 px-4 pt-8">
          {activeProfile.subjects.length > 0 ? (
            <Tabs defaultValue="subjects" className="w-full">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Feather className="h-8 w-8 text-primary" />
                        <div>
                          <CardTitle>Notes Writer</CardTitle>
                          <CardDescription>A space to jot down your thoughts and ideas.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">This feature is coming soon.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Timer className="h-8 w-8 text-primary" />
                        <div>
                          <CardTitle>Pomodoro Timer</CardTitle>
                          <CardDescription>Stay focused with the Pomodoro technique.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">This feature is coming soon.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <h2 className="text-2xl font-headline">No Subjects Yet!</h2>
              <p className="text-muted-foreground">Get started by adding your first subject from the customization menu.</p>
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

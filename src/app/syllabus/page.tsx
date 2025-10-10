
'use client';

import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useData } from '@/contexts/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/lib/icons';
import { LoadingSpinner } from '@/components/loading-spinner';
import { CheckSquare } from 'lucide-react';
import LiveClock from '@/components/live-clock';
import MiniCountdown from '@/components/mini-countdown';
import SyllabusChapterItem from '@/components/syllabus-chapter-item';

export default function SyllabusChecklistPage() {
  const { activeProfile, activeSubjectName, setActiveSubjectName } = useData();

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
  
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-muted/40 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                {activeProfile.subjects.length > 0 ? (
                <Tabs value={activeSubjectName ?? ''} onValueChange={setActiveSubjectName} className="w-full">
                    <div className="flex items-start justify-between gap-4">
                        <ScrollArea className="whitespace-nowrap rounded-md pb-2.5">
                            <TabsList className="p-1.5 sm:p-1 h-auto sm:h-10">
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
                        <div className="hidden sm:flex items-center gap-2">
                            <MiniCountdown />
                            <LiveClock />
                        </div>
                    </div>

                    {activeProfile.subjects.map((subject) => (
                    <TabsContent key={subject.name} value={subject.name} className="mt-6">
                       <div className="space-y-4">
                        {subject.chapters.map((chapter, index) => (
                          <SyllabusChapterItem 
                            key={`${subject.name}-${chapter.name}-${index}`}
                            chapter={chapter}
                            subject={subject}
                          />
                        ))}
                      </div>
                    </TabsContent>
                    ))}
                    {(!activeSubjectName || !activeProfile.subjects.some(s => s.name === activeSubjectName)) && (
                        <div className="text-center py-12 flex flex-col items-center gap-4 mt-6">
                        <h2 className="text-2xl font-headline">Select a Subject</h2>
                        <p className="text-muted-foreground">Choose a subject from the tabs above to view its details.</p>
                        </div>
                    )}
                </Tabs>
                ) : (
                <Card className="w-full max-w-2xl mx-auto text-center">
                    <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CheckSquare className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4 text-3xl font-bold">Syllabus Checklist</CardTitle>
                    <CardDescription className="text-lg">
                        Get started by adding subjects in the customization panel.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Once you have subjects, you can manage your syllabus here.</p>
                    </CardContent>
                </Card>
                )}
            </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

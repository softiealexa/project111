
"use client";

import { useMemo, useState, useEffect } from 'react';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Card } from "@/components/ui/card";
import type { Subject } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { SyllabusEditDialog } from './syllabus-edit-dialog';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface SyllabusChapterItemProps {
  chapter: { name: string }; // Simplified chapter prop
  subject: Subject;
}

interface Topic {
  name: string;
  completed: boolean;
}

export default function SyllabusChapterItem({ chapter, subject }: SyllabusChapterItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  const storageKey = `syllabus_${subject.name}_${chapter.name}`;

  // Load topics from localStorage when the component mounts or chapter changes
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const { topics: savedTopics } = JSON.parse(savedState);
        setTopics(savedTopics || []);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error("Failed to load syllabus topics:", error);
      setTopics([]);
    }
  }, [storageKey, isEditDialogOpen]); // Re-fetch when dialog closes

  const handleToggleTopic = (topicName: string) => {
    const newTopics = topics.map(topic =>
      topic.name === topicName ? { ...topic, completed: !topic.completed } : topic
    );
    setTopics(newTopics);
    // Save updated topics to localStorage
    try {
        const savedState = localStorage.getItem(storageKey);
        const currentState = savedState ? JSON.parse(savedState) : {};
        const stateToSave = JSON.stringify({ ...currentState, topics: newTopics });
        localStorage.setItem(storageKey, stateToSave);
    } catch (error) {
        console.error("Failed to save syllabus topics:", error);
    }
  };

  const completedCount = useMemo(() => topics.filter(t => t.completed).length, [topics]);
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;
  
  const progressColorClass = useMemo(() => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [progress]);
  
  return (
    <Card className="overflow-hidden border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <AccordionPrimitive.Root type="single" collapsible>
        <AccordionPrimitive.Item value={chapter.name} className="border-b-0">
          <AccordionPrimitive.Header className="flex w-full items-center">
            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between gap-4 p-4 text-left hover:no-underline [&[data-state=open]>svg.accordion-chevron]:rotate-180">
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-headline text-lg font-medium text-foreground">
                  {chapter.name}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-4 w-full sm:w-[260px]">
                 <div className="flex w-full items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium tabular-nums whitespace-nowrap w-12 text-center">{completedCount}/{topics.length}</span>
                    <Progress value={progress} indicatorClassName={progressColorClass} className="flex-1" />
                    <span className="font-bold tabular-nums text-foreground whitespace-nowrap w-12 text-right">{Math.round(progress)}%</span>
                </div>
                <ChevronDown className="accordion-chevron h-4 w-4 shrink-0 transition-transform duration-200 hidden sm:block" />
              </div>
            </AccordionPrimitive.Trigger>
            <div className="pr-4 py-2">
                <SyllabusEditDialog 
                  chapterName={chapter.name}
                  subjectName={subject.name}
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                  </Button>
                </SyllabusEditDialog>
            </div>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="p-4 pt-0">
               <div className="rounded-md border p-4">
                  {topics.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                          {topics.map((topic, index) => (
                              <div key={index} className="flex items-center gap-3">
                                  <Checkbox
                                      id={`topic-${chapter.name}-${index}`}
                                      checked={topic.completed}
                                      onCheckedChange={() => handleToggleTopic(topic.name)}
                                  />
                                  <Label
                                      htmlFor={`topic-${chapter.name}-${index}`}
                                      className={`flex-1 cursor-pointer ${topic.completed ? 'line-through text-muted-foreground' : ''}`}
                                  >
                                      {topic.name}
                                  </Label>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex h-24 items-center justify-center">
                          <p className="text-sm text-muted-foreground">No topics defined. Click the Edit button to add a syllabus.</p>
                      </div>
                  )}
                </div>
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      </AccordionPrimitive.Root>
    </Card>
  );
}

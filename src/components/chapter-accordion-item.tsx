"use client";

import { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Chapter } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface ChapterAccordionItemProps {
  chapter: Chapter;
  subjectName: string;
  index: number;
}

const TASKS = ["Lecture", "DPP", "Module", "Class Qs"];

export default function ChapterAccordionItem({ chapter, subjectName, index }: ChapterAccordionItemProps) {
  const { subjects, updateSubjects } = useAuth();
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(chapter.checkedState || {});
  
  const totalTasks = chapter.lectureCount * TASKS.length;
  const completedTasks = Object.values(checkedState).filter(Boolean).length;
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newCheckedState = { ...checkedState, [id]: checked };
    setCheckedState(newCheckedState);

    const newSubjects = subjects.map(subject => {
      if (subject.name === subjectName) {
        const newChapters = subject.chapters.map(c => {
          if (c.name === chapter.name) {
            return { ...c, checkedState: newCheckedState };
          }
          return c;
        });
        return { ...subject, chapters: newChapters };
      }
      return subject;
    });
    updateSubjects(newSubjects);
  };
  
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = progress === 100;

  return (
    <Card className="overflow-hidden border-border bg-card/50 transition-all hover:border-primary/50">
      <AccordionItem value={`item-${index}`} className="border-b-0">
        <AccordionTrigger className="p-4 hover:no-underline">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               {isCompleted ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <div className="h-6 w-6 p-0.5"><Circle className="h-5 w-5 text-muted-foreground"/></div>}
              <div className="text-left">
                <h3 className="font-headline text-lg font-medium text-foreground">
                  {chapter.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {chapter.lectureCount} lectures
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground w-20 text-right">{completedTasks} / {totalTasks}</span>
                <Progress value={progress} className="w-32" />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="border-t border-border bg-background/50 p-4">
            <div className="space-y-4">
              {Array.from({ length: chapter.lectureCount }, (_, i) => i + 1).map((lectureNum) => (
                <div key={lectureNum} className="grid grid-cols-2 md:grid-cols-5 items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                   <p className="font-medium text-foreground col-span-2 md:col-span-1">Lecture {lectureNum}</p>
                  {TASKS.map((task) => {
                    const id = `${subjectName}-${chapter.name}-L${lectureNum}-${task}`;
                    return (
                        <div key={task} className="flex items-center space-x-2">
                            <Checkbox id={id} checked={!!checkedState[id]} onCheckedChange={(checked) => handleCheckboxChange(id, !!checked)} />
                            <Label htmlFor={id} className="text-sm font-normal text-muted-foreground cursor-pointer">
                                {task}
                            </Label>
                        </div>
                    );
                    })}
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

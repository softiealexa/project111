
"use client";

import { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Chapter, Subject, TaskStatus } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { GripVertical, ChevronDown, CheckCircle, Pencil, CalendarClock } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { LectureRow } from './lecture-row';
import { format, isBefore, isWithinInterval, startOfToday, addDays, endOfDay } from 'date-fns';

interface ChapterAccordionItemProps {
  chapter: Chapter;
  subject: Subject;
  index: number;
  id: string;
}

export default function ChapterAccordionItem({ chapter, subject, index, id }: ChapterAccordionItemProps) {
  const { activeProfile, updateSubjects } = useData();
  const [checkedState, setCheckedState] = useState<Record<string, TaskStatus>>(chapter.checkedState || {});
  
  const [tasksToComplete, setTasksToComplete] = useState<string[]>([]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  const tasks = subject.tasks || [];
  const totalTasks = chapter.lectureCount * tasks.length;
  const completedTasks = Object.values(checkedState).filter(status => status === 'checked').length;
  
  const handleCheckboxChange = (checkboxId: string, status: TaskStatus) => {
    const newCheckedState: Record<string, TaskStatus> = { ...checkedState };
    if (status === 'unchecked') {
      delete newCheckedState[checkboxId];
    } else {
      newCheckedState[checkboxId] = status;
    }
    setCheckedState(newCheckedState);
    
    if (!activeProfile) return;

    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === subject.name) {
        const newChapters = s.chapters.map((c, i) => {
          if (i === index) {
            return { ...c, checkedState: newCheckedState };
          }
          return c;
        });
        return { ...s, chapters: newChapters };
      }
      return s;
    });
    updateSubjects(newSubjects);
  };

  const handleMarkSelectedComplete = () => {
    if (tasksToComplete.length === 0) return;

    const newCheckedState: Record<string, TaskStatus> = { ...checkedState };
    for (let i = 1; i <= chapter.lectureCount; i++) {
        tasksToComplete.forEach(task => {
            const checkboxId = `${subject.name}-${chapter.name}-Lecture-${i}-${task}`;
            newCheckedState[checkboxId] = 'checked';
        });
    }
    setCheckedState(newCheckedState);

    if (!activeProfile) return;
    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === subject.name) {
        const newChapters = s.chapters.map((c, i) => {
          if (i === index) {
            return { ...c, checkedState: newCheckedState };
          }
          return c;
        });
        return { ...s, chapters: newChapters };
      }
      return s;
    });
    updateSubjects(newSubjects);
    setTasksToComplete([]);
  };
  
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = progress === 100;

  const progressColorClass = useMemo(() => {
    if (progress < 25) return 'bg-progress-beginner'; // Red
    if (progress <= 75) return 'bg-progress-intermediate'; // Yellow
    return 'bg-progress-advanced'; // Green
  }, [progress]);

  const deadlineStatus = useMemo(() => {
    if (!chapter.deadline) return 'none';
    const today = startOfToday();
    const deadlineDate = new Date(chapter.deadline);
    if (isBefore(endOfDay(deadlineDate), today)) return 'overdue';
    if (isWithinInterval(deadlineDate, { start: today, end: addDays(today, 7) })) return 'approaching';
    return 'normal';
  }, [chapter.deadline]);

  const deadlineColorClass = {
    overdue: 'text-red-500 dark:text-red-400',
    approaching: 'text-amber-600 dark:text-amber-400',
    normal: 'text-muted-foreground',
    none: 'text-muted-foreground'
  }[deadlineStatus];


  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("relative", isDragging && "shadow-2xl shadow-primary/20")}>
       <Card className={cn(
          "overflow-hidden border bg-card transition-all",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
          isDragging && "border-primary/50"
      )}>
        <AccordionItem value={`item-${index}`} className="border-b-0">
          <AccordionPrimitive.Header className="flex w-full items-center hover:bg-primary/5">
            <button {...listeners} aria-label="Drag to reorder chapter" className="cursor-grab pl-4 pr-2 py-4 text-muted-foreground hover:text-foreground touch-none">
              <GripVertical className="h-5 w-5" />
            </button>
            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between gap-4 py-4 pr-4 text-left hover:no-underline [&[data-state=open]>svg.accordion-chevron]:rotate-180">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-headline text-lg font-medium text-foreground">
                  {chapter.name}
                </h3>
                <div className="flex items-center gap-x-3 gap-y-1 text-sm flex-wrap">
                  <p className={cn("text-muted-foreground", isCompleted && "text-primary/80")}>
                    {chapter.lectureCount} lectures
                  </p>
                  {chapter.deadline && (
                    <div className={cn("flex items-center gap-1.5", deadlineColorClass)}>
                      <CalendarClock className="h-4 w-4" />
                      <span>{format(new Date(chapter.deadline), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 sm:w-[260px]">
                 <div className="flex w-full items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium tabular-nums whitespace-nowrap w-12 text-center">{completedTasks}/{totalTasks}</span>
                    <Progress value={progress} indicatorClassName={progressColorClass} className="flex-1" />
                    <span className="font-bold tabular-nums text-foreground whitespace-nowrap w-12 text-right">{Math.round(progress)}%</span>
                </div>
                <ChevronDown className="accordion-chevron h-4 w-4 shrink-0 transition-transform duration-200" />
              </div>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className="p-0">
            <div className="border-t border-border bg-background/50 p-4 space-y-4">
              <div className="space-y-2">
                {Array.from({ length: chapter.lectureCount }, (_, i) => i + 1).map((lectureNum) => (
                   <LectureRow
                    key={lectureNum}
                    lectureNum={lectureNum}
                    chapter={chapter}
                    subject={subject}
                    checkedState={checkedState}
                    onCheckboxChange={handleCheckboxChange}
                  />
                ))}
              </div>
              
                <AlertDialog onOpenChange={() => setTasksToComplete([])}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" disabled={isCompleted}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark All as Complete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Set Status</AlertDialogTitle>
                      <AlertDialogDescription>
                        Select tasks to mark as complete for all lectures in this chapter.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                      {tasks.map(task => (
                        <div key={task} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`complete-${task}`}
                            checked={'unchecked'} // This checkbox is for selection, not status
                            onCheckedChange={(checked) => {
                              const isNowChecked = checked === 'checked'; // The component itself doesn't cycle, so we check the new state
                              setTasksToComplete(prev =>
                                isNowChecked ? [...prev, task] : prev.filter(t => t !== task)
                              );
                            }}
                          />
                          <Label htmlFor={`complete-${task}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                            {task}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleMarkSelectedComplete} disabled={tasksToComplete.length === 0}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

            </div>
          </AccordionContent>
        </AccordionItem>
      </Card>
    </div>
  );
}

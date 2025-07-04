
"use client";

import { useState } from 'react';
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Chapter } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, GripVertical, ChevronDown, StickyNote } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';


interface ChapterAccordionItemProps {
  chapter: Chapter;
  subjectName: string;
  index: number;
  id: string;
}

export default function ChapterAccordionItem({ chapter, subjectName, index, id }: ChapterAccordionItemProps) {
  const { activeProfile, updateSubjects } = useData();
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(chapter.checkedState || {});
  const [editingNote, setEditingNote] = useState<number | null>(null);
  
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
  
  const tasks = activeProfile?.tasks || [];
  const totalTasks = chapter.lectureCount * tasks.length;
  const completedTasks = Object.values(checkedState).filter(Boolean).length;
  
  const handleCheckboxChange = (checkboxId: string, checked: boolean) => {
    const newCheckedState = { ...checkedState, [checkboxId]: checked };
    setCheckedState(newCheckedState);
    
    if (!activeProfile) return;

    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === subjectName) {
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
  
  const handleNoteChange = (lectureNum: number, newNote: string) => {
    if (!activeProfile) return;

    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === subjectName) {
        const newChapters = s.chapters.map((c, i) => {
          if (i === index) {
            const lectureKey = `L${lectureNum}`;
            const newNotes = { ...(c.notes || {}), [lectureKey]: newNote };
            return { ...c, notes: newNotes };
          }
          return c;
        });
        return { ...s, chapters: newChapters };
      }
      return s;
    });
    updateSubjects(newSubjects);
  };

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = progress === 100;

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "shadow-2xl shadow-primary/20")}>
       <Card className={cn(
          "overflow-hidden border bg-card transition-all group",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
          isCompleted && "bg-primary/10 border-primary/30",
          isDragging && "border-primary/50"
      )}>
        <AccordionItem value={`item-${index}`} className="border-b-0">
          <AccordionPrimitive.Header className="group-hover:bg-primary/5">
            <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-4 p-4 text-left hover:no-underline [&[data-state=open]>svg.accordion-chevron]:rotate-180">
              <div className="flex min-w-0 flex-1 items-center gap-2" {...attributes}>
                 <div {...listeners} className="cursor-grab p-2 -ml-2 text-muted-foreground hover:text-foreground touch-none">
                    <GripVertical className="h-5 w-5" />
                 </div>
                 {isCompleted ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <div className="h-6 w-6 p-0.5"><Circle className="h-5 w-5 text-muted-foreground"/></div>}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-headline text-lg font-medium text-foreground">
                    {chapter.name}
                  </h3>
                  <p className={cn("text-sm text-muted-foreground", isCompleted && "text-primary/80")}>
                    {chapter.lectureCount} lectures
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                  <span className="hidden w-20 text-right text-sm font-medium text-muted-foreground sm:inline-block">{completedTasks} / {totalTasks}</span>
                  <Progress value={progress} className="hidden w-32 sm:inline-block" />
                  <ChevronDown className="accordion-chevron h-4 w-4 shrink-0 transition-transform duration-200" />
              </div>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className="p-0">
            <div className="border-t border-border bg-background/50 p-4">
              <div className="space-y-2">
                {Array.from({ length: chapter.lectureCount }, (_, i) => i + 1).map((lectureNum) => (
                  <div key={lectureNum}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <p className="font-medium text-foreground mr-auto pr-4">Lecture {lectureNum}</p>
                      {tasks.map((task) => {
                        const checkboxId = `${subjectName}-${chapter.name}-L${lectureNum}-${task}`;
                        return (
                            <div key={task} className="flex items-center space-x-2">
                                <Checkbox id={checkboxId} checked={!!checkedState[checkboxId]} onCheckedChange={(checked) => handleCheckboxChange(checkboxId, !!checked)} />
                                <Label htmlFor={checkboxId} className="text-sm font-normal text-muted-foreground cursor-pointer">
                                    {task}
                                </Label>
                            </div>
                        );
                      })}
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70 hover:text-primary" onClick={() => setEditingNote(editingNote === lectureNum ? null : lectureNum)}>
                              <StickyNote className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Notes</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {editingNote === lectureNum && (
                      <div className="px-3 pb-2 -mt-1 animate-in fade-in-50">
                          <Textarea 
                              autoFocus
                              placeholder={`Notes for Lecture ${lectureNum}...`}
                              defaultValue={chapter.notes?.[`L${lectureNum}`] || ''}
                              onBlur={(e) => {
                                handleNoteChange(lectureNum, e.target.value);
                                setEditingNote(null);
                              }}
                              className="min-h-[60px] text-sm"
                          />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Card>
    </div>
  );
}

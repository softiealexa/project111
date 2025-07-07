
"use client";

import { useState, useMemo } from 'react';
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Chapter, Subject } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { GripVertical, ChevronDown } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


interface ChapterAccordionItemProps {
  chapter: Chapter;
  subject: Subject;
  index: number;
  id: string;
}

export default function ChapterAccordionItem({ chapter, subject, index, id }: ChapterAccordionItemProps) {
  const { activeProfile, updateSubjects } = useData();
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(chapter.checkedState || {});
  
  const [editingLecture, setEditingLecture] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');

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
  const completedTasks = Object.values(checkedState).filter(Boolean).length;
  
  const handleCheckboxChange = (checkboxId: string, checked: boolean) => {
    const newCheckedState = { ...checkedState, [checkboxId]: checked };
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
  
  const handleNoteChange = (lectureNum: number, newNote: string) => {
    if (!activeProfile) return;

    const newSubjects = activeProfile.subjects.map(s => {
      if (s.name === subject.name) {
        const newChapters = s.chapters.map((c, i) => {
          if (i === index) {
            const lectureKey = `L${lectureNum}`;
            const currentNotes = c.notes || {};
            if (currentNotes[lectureKey] !== newNote) {
              const newNotes = { ...currentNotes, [lectureKey]: newNote };
              return { ...c, notes: newNotes };
            }
          }
          return c;
        });
        return { ...s, chapters: newChapters };
      }
      return s;
    });
    updateSubjects(newSubjects);
  };

  const handleNoteBlur = () => {
    if (editingLecture !== null) {
      handleNoteChange(editingLecture, noteContent);
      setEditingLecture(null);
    }
  };

  const handleNoteClick = (lectureNum: number) => {
    setEditingLecture(lectureNum);
    setNoteContent(chapter.notes?.[`L${lectureNum}`] || '');
  };

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = progress === 100;

  const progressColorClass = useMemo(() => {
    if (progress < 25) return 'bg-progress-beginner'; // Red
    if (progress <= 75) return 'bg-progress-intermediate'; // Yellow
    return 'bg-progress-advanced'; // Green
  }, [progress]);


  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("relative", isDragging && "shadow-2xl shadow-primary/20")}>
       <Card className={cn(
          "overflow-hidden border bg-card transition-all group",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
          isDragging && "border-primary/50"
      )}>
        <AccordionItem value={`item-${index}`} className="border-b-0">
          <AccordionPrimitive.Header className="group-hover:bg-primary/5">
            <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-4 p-4 text-left hover:no-underline [&[data-state=open]>svg.accordion-chevron]:rotate-180">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                 <button {...listeners} aria-label="Drag to reorder chapter" className="cursor-grab p-2 -ml-2 text-muted-foreground hover:text-foreground touch-none">
                    <GripVertical className="h-5 w-5" />
                 </button>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-headline text-lg font-medium text-foreground">
                    {chapter.name}
                  </h3>
                  <p className={cn("text-sm text-muted-foreground", isCompleted && "text-primary/80")}>
                    {chapter.lectureCount} lectures
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:w-2/5">
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
            <div className="border-t border-border bg-background/50 p-4">
              <div className="space-y-2">
                {Array.from({ length: chapter.lectureCount }, (_, i) => i + 1).map((lectureNum) => (
                   <div key={lectureNum}>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 transition-colors hover:bg-muted/50">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                    onClick={() => handleNoteClick(lectureNum)}
                                    className="font-medium text-foreground mr-auto pr-4 text-left transition-colors hover:text-primary focus:outline-none focus:text-primary rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    Lecture {lectureNum}
                                </button>
                              </TooltipTrigger>
                              {chapter.notes?.[`L${lectureNum}`] && (
                                <TooltipContent>
                                  <p className="max-w-xs whitespace-pre-wrap break-words">{chapter.notes[`L${lectureNum}`]}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            
                            <div className="flex items-center gap-x-4">
                                {tasks.map((task) => {
                                const checkboxId = `${subject.name}-${chapter.name}-L${lectureNum}-${task}`;
                                return (
                                    <div key={task} className="flex items-center space-x-2">
                                        <Checkbox id={checkboxId} checked={!!checkedState[checkboxId]} onCheckedChange={(checked) => handleCheckboxChange(checkboxId, !!checked)} />
                                        <Label htmlFor={checkboxId} className="text-sm font-normal text-muted-foreground cursor-pointer">
                                            {task}
                                        </Label>
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                        {editingLecture === lectureNum && (
                           <div className="px-3 pb-3">
                             <Textarea
                               autoFocus
                               value={noteContent}
                               onChange={(e) => setNoteContent(e.target.value)}
                               onBlur={handleNoteBlur}
                               placeholder="Type your notes here... they save automatically when you click away."
                               className="min-h-[72px] text-base focus-visible:ring-1 focus-visible:ring-primary"
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

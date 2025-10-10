
"use client";

import { useMemo } from 'react';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Card } from "@/components/ui/card";
import type { Chapter, Subject } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface SyllabusChapterItemProps {
  chapter: Chapter;
  subject: Subject;
}

export default function SyllabusChapterItem({ chapter, subject }: SyllabusChapterItemProps) {
  const tasks = subject.tasks || [];
  const totalTasks = chapter.lectureCount * tasks.length;
  const completedTasks = Object.values(chapter.checkedState || {}).filter(item => item.status === 'checked' || item.status === 'checked-red').length;
  
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const progressColorClass = useMemo(() => {
    if (progress < 25) return 'bg-progress-beginner';
    if (progress <= 75) return 'bg-progress-intermediate';
    return 'bg-progress-advanced';
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
                    <span className="font-medium tabular-nums whitespace-nowrap w-12 text-center">{completedTasks}/{totalTasks}</span>
                    <Progress value={progress} indicatorClassName={progressColorClass} className="flex-1" />
                    <span className="font-bold tabular-nums text-foreground whitespace-nowrap w-12 text-right">{Math.round(progress)}%</span>
                </div>
                <ChevronDown className="accordion-chevron h-4 w-4 shrink-0 transition-transform duration-200 hidden sm:block" />
              </div>
            </AccordionPrimitive.Trigger>
            <div className="pr-4 py-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="p-4 pt-0">
                {/* Content will go here in the future */}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      </AccordionPrimitive.Root>
    </Card>
  );
}

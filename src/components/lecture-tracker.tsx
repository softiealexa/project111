'use client';

import { useMemo } from 'react';
import type { Subject } from "@/lib/types";
import { Accordion } from "@/components/ui/accordion";
import ChapterAccordionItem from "./chapter-accordion-item";
import { useData } from '@/contexts/data-context';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface LectureTrackerProps {
  subject: Subject;
}

export default function LectureTracker({ subject }: LectureTrackerProps) {
  const { activeProfile, updateSubjects } = useData();
  
  const chapterIds = useMemo(() => subject.chapters.map((c, i) => `${subject.name}-${c.name}-${i}`), [subject.chapters, subject.name]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id && activeProfile) {
      const oldIndex = chapterIds.indexOf(active.id as string);
      const newIndex = chapterIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedChapters = arrayMove(subject.chapters, oldIndex, newIndex);
        const newSubjects = activeProfile.subjects.map(s => {
          if (s.name === subject.name) {
            return { ...s, chapters: reorderedChapters };
          }
          return s;
        });
        updateSubjects(newSubjects);
      }
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {subject.chapters.map((chapter, index) => (
              <ChapterAccordionItem 
                key={`${subject.name}-${chapter.name}-${index}`} 
                id={`${subject.name}-${chapter.name}-${index}`}
                chapter={chapter} 
                subjectName={subject.name} 
                index={index}
              />
            ))}
          </Accordion>
        </SortableContext>
      </DndContext>
    </div>
  );
}

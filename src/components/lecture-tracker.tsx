'use client';

import { useMemo } from 'react';
import type { Subject, Chapter } from "@/lib/types";
import { Accordion } from "@/components/ui/accordion";
import ChapterAccordionItem from "./chapter-accordion-item";
import { AddChapterDialog } from "./add-chapter-dialog";
import { useAuth } from '@/contexts/auth-context';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface LectureTrackerProps {
  subject: Subject;
  onAddChapter: (newChapter: Chapter) => void;
}

export default function LectureTracker({ subject, onAddChapter }: LectureTrackerProps) {
  const { subjects, updateSubjects } = useAuth();
  
  const chapterIds = useMemo(() => subject.chapters.map((c, i) => `${subject.name}-${c.name}-${i}`), [subject.chapters, subject.name]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapterIds.indexOf(active.id as string);
      const newIndex = chapterIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedChapters = arrayMove(subject.chapters, oldIndex, newIndex);
        const newSubjects = subjects.map(s => {
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
                index={index} />
            ))}
          </Accordion>
        </SortableContext>
      </DndContext>
      <div className="mt-4 flex justify-center">
        <AddChapterDialog onAddChapter={onAddChapter} />
      </div>
    </div>
  );
}

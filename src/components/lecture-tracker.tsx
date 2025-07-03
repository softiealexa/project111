'use client';

import type { Subject, Chapter } from "@/lib/types";
import { Accordion } from "@/components/ui/accordion";
import ChapterAccordionItem from "./chapter-accordion-item";
import { AddChapterDialog } from "./add-chapter-dialog";

interface LectureTrackerProps {
  subject: Subject;
  onAddChapter: (newChapter: Chapter) => void;
}

export default function LectureTracker({ subject, onAddChapter }: LectureTrackerProps) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <AddChapterDialog onAddChapter={onAddChapter} />
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {subject.chapters.map((chapter, index) => (
          <ChapterAccordionItem key={`${subject.name}-${chapter.name}-${index}`} chapter={chapter} index={index} />
        ))}
      </Accordion>
    </div>
  );
}

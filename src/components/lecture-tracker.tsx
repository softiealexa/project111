import type { Subject } from "@/lib/types";
import { Accordion } from "@/components/ui/accordion";
import ChapterAccordionItem from "./chapter-accordion-item";

interface LectureTrackerProps {
  subject: Subject;
}

export default function LectureTracker({ subject }: LectureTrackerProps) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {subject.chapters.map((chapter, index) => (
        <ChapterAccordionItem key={`${subject.name}-${chapter.name}`} chapter={chapter} index={index} />
      ))}
    </Accordion>
  );
}

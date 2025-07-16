
"use client";

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Pencil } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import type { Chapter, Subject } from '@/lib/types';
import { RenameDialog } from './rename-dialog';

const LectureNotesDialog = dynamic(() => import('./lecture-notes-dialog').then(mod => mod.LectureNotesDialog), {
  loading: () => <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled><Pencil className="h-4 w-4" /></Button>
});

interface LectureRowProps {
  lectureNum: number;
  chapter: Chapter;
  subject: Subject;
  checkedState: Record<string, boolean>;
  onCheckboxChange: (checkboxId: string, checked: boolean) => void;
}

export function LectureRow({ lectureNum, chapter, subject, checkedState, onCheckboxChange }: LectureRowProps) {
    const { activeProfile, updateSubjects } = useData();

    const lectureKey = `L${lectureNum}`;
    const customLectureName = useMemo(() => chapter.lectureNames?.[lectureKey], [chapter.lectureNames, lectureKey]);
    const note = useMemo(() => chapter.notes?.[lectureKey] || '', [chapter.notes, lectureKey]);

    const handleDetailsSave = (newNote: string, newLectureName: string) => {
        if (!activeProfile) return;

        const trimmedNote = newNote.trim();
        const trimmedLectureName = newLectureName.trim();
        
        const noteChanged = trimmedNote !== (chapter.notes?.[lectureKey] || '');
        const nameChanged = trimmedLectureName !== (chapter.lectureNames?.[lectureKey] || '');

        if (!noteChanged && !nameChanged) return;

        const newSubjects = activeProfile.subjects.map(s => {
          if (s.name === subject.name) {
            const newChapters = s.chapters.map(c => {
              if (c.name === chapter.name) {
                const newNotes = { ...(c.notes || {}) };
                if (trimmedNote) {
                    newNotes[lectureKey] = trimmedNote;
                } else {
                    delete newNotes[lectureKey];
                }

                const newLectureNames = { ...(c.lectureNames || {}) };
                if (trimmedLectureName) {
                    newLectureNames[lectureKey] = trimmedLectureName;
                } else {
                    delete newLectureNames[lectureKey];
                }

                return { ...c, notes: newNotes, lectureNames: newLectureNames };
              }
              return c;
            });
            return { ...s, chapters: newChapters };
          }
          return s;
        });
        updateSubjects(newSubjects);
    };

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 mr-auto pr-4">
                <Suspense>
                    <LectureNotesDialog
                        lectureNum={lectureNum}
                        currentNote={note}
                        currentLectureName={customLectureName || ''}
                        onSave={handleDetailsSave}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-medium text-foreground no-underline hover:underline focus-visible:ring-offset-background"
                                >
                                    L-{lectureNum}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit name and notes</p>
                                {note && <p className="mt-2 pt-2 border-t max-w-xs whitespace-pre-wrap break-words">{note}</p>}
                            </TooltipContent>
                        </Tooltip>
                    </LectureNotesDialog>
                </Suspense>

                 {customLectureName && (
                    <span className="text-sm text-muted-foreground truncate max-w-40">{customLectureName}</span>
                 )}
            </div>
            
            <div className="flex items-center gap-x-4">
                {subject.tasks.map((task) => {
                    const checkboxId = `${subject.name}-${chapter.name}-L${lectureNum}-${task}`;
                    return (
                        <div key={task} className="flex items-center space-x-2">
                            <Checkbox 
                                id={checkboxId} 
                                checked={!!checkedState[checkboxId]} 
                                onCheckedChange={(checked) => onCheckboxChange(checkboxId, !!checked)} 
                            />
                            <Label htmlFor={checkboxId} className="text-sm font-normal text-muted-foreground cursor-pointer">
                                {task}
                            </Label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

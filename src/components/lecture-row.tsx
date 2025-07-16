
"use client";

import { Suspense, useState, useMemo } from 'react';
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

    const handleNoteSave = (newNote: string) => {
        if (!activeProfile) return;
        
        const trimmedNote = newNote.trim();
        const originalNote = chapter.notes?.[`L${lectureNum}`] || '';

        if (trimmedNote === originalNote) return;

        const newSubjects = activeProfile.subjects.map(s => {
          if (s.name === subject.name) {
            const newChapters = s.chapters.map(c => {
              if (c.name === chapter.name) {
                const newNotes = { ...(c.notes || {}) };
                if (trimmedNote) {
                    newNotes[`L${lectureNum}`] = trimmedNote;
                } else {
                    delete newNotes[`L${lectureNum}`];
                }
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

    const handleLectureRename = (newName: string) => {
        if (!activeProfile) return;

        const lectureKey = `L${lectureNum}`;
        const trimmedName = newName.trim();
        const originalName = chapter.lectureNames?.[lectureKey] || '';
        
        if (trimmedName === originalName) return;

        const newSubjects = activeProfile.subjects.map(s => {
          if (s.name === subject.name) {
            const newChapters = s.chapters.map(c => {
              if (c.name === chapter.name) {
                const newLectureNames = { ...(c.lectureNames || {}) };
                if (trimmedName) {
                    newLectureNames[lectureKey] = trimmedName;
                } else {
                    delete newLectureNames[lectureKey];
                }
                return { ...c, lectureNames: newLectureNames };
              }
              return c;
            });
            return { ...s, chapters: newChapters };
          }
          return s;
        });
        updateSubjects(newSubjects);
    };

    const lectureKey = `L${lectureNum}`;
    const customLectureName = useMemo(() => chapter.lectureNames?.[lectureKey], [chapter.lectureNames, lectureKey]);

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-3 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 mr-auto pr-4">
                <Suspense>
                    <LectureNotesDialog
                        lectureNum={lectureNum}
                        currentNote={chapter.notes?.[lectureKey] || ''}
                        onSave={handleNoteSave}
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
                            {chapter.notes?.[lectureKey] && (
                                <TooltipContent>
                                <p className="max-w-xs whitespace-pre-wrap break-words">{chapter.notes[lectureKey]}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </LectureNotesDialog>
                </Suspense>

                <RenameDialog
                    itemType="Lecture Name"
                    currentName={customLectureName || ''}
                    onRename={handleLectureRename}
                    existingNames={[]}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="group/lecture-btn flex items-center gap-1.5 text-left text-sm text-muted-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                <span className="truncate max-w-40">{customLectureName || 'Set Lecture Name'}</span>
                                <Pencil className="h-3 w-3 opacity-0 group-hover/lecture-btn:opacity-100 transition-opacity" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to rename this lecture</p>
                        </TooltipContent>
                    </Tooltip>
                </RenameDialog>
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

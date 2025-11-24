
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Save, X, GripVertical, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useData } from '@/contexts/data-context';
import type { JeeSubject, JeeChapter } from '@/lib/types';
import { LoadingSpinner } from '@/components/loading-spinner';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function SortableChapterRow({
  chapter,
  onToggleTask,
  onDeleteChapter,
  onUpdateTasks,
}: {
  chapter: JeeChapter;
  onToggleTask: (chapterId: string, taskName: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onUpdateTasks: (chapterId: string, newTasks: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editableTasks, setEditableTasks] = useState(Object.keys(chapter.tasks).join(' | '));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const handleSaveTasks = () => {
    const newTasks = editableTasks.split('|').map(t => t.trim()).filter(Boolean);
    onUpdateTasks(chapter.id, newTasks);
    setIsEditing(false);
  };
  
  const chapterTasks = Object.keys(chapter.tasks);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b dark:border-gray-700 last:border-b-0 transition-shadow",
        isDragging && "shadow-lg bg-card"
      )}
    >
      <div className="flex items-center mb-2 sm:mb-0">
        <button {...listeners} {...attributes} aria-label="Drag to reorder chapter" className="cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="font-medium text-gray-700 dark:text-gray-300">{chapter.name}</div>
      </div>
      <div className="flex items-center gap-4 pl-8 sm:pl-0">
          <div className="flex items-center gap-3">
              {chapterTasks.map(task => (
                  <div key={task} className="flex items-center">
                      <Checkbox
                          id={`${chapter.id}-${task}`}
                          checked={chapter.tasks[task]}
                          onCheckedChange={() => onToggleTask(chapter.id, task)}
                      />
                      <label htmlFor={`${chapter.id}-${task}`} className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          {task}
                      </label>
                  </div>
              ))}
          </div>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
               <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                    <Edit className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Chapter: {chapter.name}</DialogTitle>
                    <DialogDescription>
                        Update the task list for this chapter. Use a "|" to separate tasks.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-2 py-2">
                    <Label htmlFor="tasks-input">Tasks</Label>
                    <Input
                        id="tasks-input"
                        value={editableTasks}
                        onChange={e => setEditableTasks(e.target.value)}
                        placeholder="Task 1 | Task 2"
                    />
                </div>
                <DialogFooter className="justify-between">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete Chapter</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the chapter "{chapter.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                onDeleteChapter(chapter.id);
                                setIsEditing(false);
                            }}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveTasks}>Save Tasks</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}

function SortableSubjectCard({ subject, children }: { subject: JeeSubject, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };
    
    const childrenArray = React.Children.toArray(children);

    return (
        <div ref={setNodeRef} style={style} className={cn(isDragging && "shadow-2xl")}>
             <Card className="transition-all hover:shadow-lg hover:border-primary/20">
                <Accordion type="single" collapsible>
                    <AccordionItem value={subject.id} className="border-b-0">
                        <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                             <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-2">
                                     <div {...listeners} {...attributes} aria-label={`Drag to reorder subject ${subject.name}`} className="cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                                </div>
                                {childrenArray[0]}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0 p-4">
                            {childrenArray[1]}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
        </div>
    )
}


export default function JeeSyllabusPage() {
  const { activeProfile, setJeeSyllabus, loading } = useData();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterNames, setNewChapterNames] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  const subjects = useMemo(() => {
    return activeProfile?.jeeSyllabus || [];
  }, [activeProfile?.jeeSyllabus]);


  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubject: JeeSubject = {
      id: crypto.randomUUID(),
      name: newSubjectName.trim(),
      chapters: [],
      tasks: ['Notes', 'Lecture', 'PYQs'], // This field is deprecated but kept for compatibility
    };
    setJeeSyllabus([...subjects, newSubject]);
    setNewSubjectName('');
    toast({ title: "Subject Added", description: `"${newSubject.name}" has been added.`});
  };

  const handleAddChapter = (subjectId: string) => {
    const chapterNamesInput = newChapterNames[subjectId]?.trim();
    if (!chapterNamesInput) return;

    const chapterNames = chapterNamesInput.split(',').map(name => name.trim()).filter(name => name);

    if (chapterNames.length === 0) return;

    const newSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        const newChapters = chapterNames.map((name): JeeChapter => ({
          id: crypto.randomUUID(),
          name,
          tasks: { 'Notes': false, 'Lecture': false, 'PYQs': false }, // Default tasks for new chapter
        }));
        return { ...subject, chapters: [...subject.chapters, ...newChapters] };
      }
      return subject;
    });
    setJeeSyllabus(newSubjects);
    setNewChapterNames(prev => ({...prev, [subjectId]: ''}));
    
    if (chapterNames.length > 1) {
        toast({ title: "Chapters Added", description: `${chapterNames.length} chapters have been added.`});
    } else {
        toast({ title: "Chapter Added", description: `"${chapterNames[0]}" has been added.`});
    }
  };

  const handleToggleTask = (subjectId: string, chapterId: string, taskName: string) => {
    const newSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        const newChapters = subject.chapters.map(chapter => {
          if (chapter.id === chapterId) {
            const newTasks = { ...chapter.tasks, [taskName]: !chapter.tasks[taskName] };
            return { ...chapter, tasks: newTasks };
          }
          return chapter;
        });
        return { ...subject, chapters: newChapters };
      }
      return subject;
    });
    setJeeSyllabus(newSubjects);
  };
  
  const handleUpdateChapterTasks = (subjectId: string, chapterId: string, newTasks: string[]) => {
      const newSubjects = subjects.map(subject => {
          if (subject.id === subjectId) {
              const newChapters = subject.chapters.map(chapter => {
                  if (chapter.id === chapterId) {
                      const newTasksState: Record<string, boolean> = {};
                      newTasks.forEach(taskName => {
                          newTasksState[taskName] = chapter.tasks[taskName] || false;
                      });
                      return { ...chapter, tasks: newTasksState };
                  }
                  return chapter;
              });
              return { ...subject, chapters: newChapters };
          }
          return subject;
      });
      setJeeSyllabus(newSubjects);
  };

  const handleDeleteChapter = (subjectId: string, chapterId: string) => {
      const newSubjects = subjects.map(subject => {
          if(subject.id === subjectId) {
              return {...subject, chapters: subject.chapters.filter(c => c.id !== chapterId)};
          }
          return subject;
      });
      setJeeSyllabus(newSubjects);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleChapterDragEnd = (event: DragEndEvent, subjectId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const oldIndex = subject.chapters.findIndex(c => c.id === active.id);
    const newIndex = subject.chapters.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedChapters = arrayMove(subject.chapters, oldIndex, newIndex);
      const newSubjects = subjects.map(s => 
        s.id === subjectId ? { ...s, chapters: reorderedChapters } : s
      );
      setJeeSyllabus(newSubjects);
    }
  };

  const handleSubjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subjects.findIndex(s => s.id === active.id);
    const newIndex = subjects.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSubjects = arrayMove(subjects, oldIndex, newIndex);
        setJeeSyllabus(reorderedSubjects);
    }
  }

  if (loading || !activeProfile) {
    return (
        <TooltipProvider>
            <Navbar />
            <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
                <LoadingSpinner text="Loading Syllabus..."/>
            </div>
        </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
    <Navbar />
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200">JEE Mains – Syllabus Progress Checker</h2>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubjectDragEnd}>
            <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                    {subjects.map(subject => (
                        <SortableSubjectCard key={subject.id} subject={subject}>
                            <>
                                {/* This section is left empty as task editing is now per-chapter */}
                            </>
                            <>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleChapterDragEnd(e, subject.id)}>
                                    <SortableContext items={subject.chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    {subject.chapters.map((chapter: JeeChapter) => (
                                        <SortableChapterRow
                                            key={chapter.id}
                                            chapter={chapter}
                                            onToggleTask={(chapterId, taskName) => handleToggleTask(subject.id, chapterId, taskName)}
                                            onDeleteChapter={(chapterId) => handleDeleteChapter(subject.id, chapterId)}
                                            onUpdateTasks={(chapterId, newTasks) => handleUpdateChapterTasks(subject.id, chapterId, newTasks)}
                                        />
                                    ))}
                                    </SortableContext>
                                </DndContext>
                                <div className="flex gap-2 mt-4">
                                        <Input
                                            placeholder="Add new chapter(s), separated by commas..."
                                            value={newChapterNames[subject.id] || ''}
                                            onChange={e => setNewChapterNames(prev => ({...prev, [subject.id]: e.target.value}))}
                                            onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.id)}
                                        />
                                        <Button onClick={() => handleAddChapter(subject.id)}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Chapter
                                        </Button>
                                </div>
                            </>
                        </SortableSubjectCard>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mt-6">
            <div className="flex gap-2">
                <Input
                    placeholder="Add new subject..."
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject}>
                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                </Button>
            </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

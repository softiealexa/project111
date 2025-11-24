
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Save, X, GripVertical } from 'lucide-react';
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

function SortableChapterRow({
  chapter,
  subject,
  onToggleTask,
  onDeleteChapter
}: {
  chapter: JeeChapter;
  subject: JeeSubject;
  onToggleTask: (subjectId: string, chapterId: string, taskName: string) => void;
  onDeleteChapter: (subjectId: string, chapterId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b dark:border-gray-700 last:border-b-0 transition-shadow",
        isDragging && "shadow-lg bg-card"
      )}
    >
      <div className="flex items-center">
        <button {...listeners} {...attributes} aria-label="Drag to reorder chapter" className="cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">{chapter.name}</div>
      </div>
      <div className="flex items-center gap-4 pl-8 sm:pl-0">
        <div className="flex items-center gap-3">
          {subject.tasks.map(task => (
            <div key={task} className="flex items-center">
              <Checkbox
                id={`${chapter.id}-${task}`}
                checked={chapter.tasks[task]}
                onCheckedChange={() => onToggleTask(subject.id, chapter.id, task)}
              />
              <label htmlFor={`${chapter.id}-${task}`} className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                {task}
              </label>
            </div>
          ))}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100">
              <Trash2 className="h-4 w-4"/>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete the chapter "{chapter.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteChapter(subject.id, chapter.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <button {...listeners} {...attributes} aria-label={`Drag to reorder subject ${subject.name}`} className="cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground">
                                <GripVertical className="h-5 w-5" />
                            </button>
                            <CardTitle className="text-xl">{subject.name}</CardTitle>
                        </div>
                        {childrenArray[0]} {/* This will render the task editor part */}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 p-6">
                    {childrenArray[1]} {/* This will render the chapters and add chapter part */}
                </CardContent>
            </Card>
        </div>
    )
}


export default function JeeSyllabusPage() {
  const { activeProfile, setJeeSyllabus, loading } = useData();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterNames, setNewChapterNames] = useState<Record<string, string>>({});
  const [editingTasks, setEditingTasks] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const subjects = useMemo(() => {
    return activeProfile?.jeeSyllabus || [];
  }, [activeProfile?.jeeSyllabus]);


  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubject: JeeSubject = {
      id: crypto.randomUUID(),
      name: newSubjectName.trim(),
      tasks: ['Notes', 'Lecture', 'Teacher'],
      chapters: [],
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
        const newChapters = chapterNames.map(name => ({
          id: crypto.randomUUID(),
          name,
          tasks: subject.tasks.reduce((acc, task) => ({ ...acc, [task]: false }), {}),
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

  const handleDeleteChapter = (subjectId: string, chapterId: string) => {
      const newSubjects = subjects.map(subject => {
          if(subject.id === subjectId) {
              return {...subject, chapters: subject.chapters.filter(c => c.id !== chapterId)};
          }
          return subject;
      });
      setJeeSyllabus(newSubjects);
  };

  const handleSaveTasks = (subjectId: string) => {
      const newTasksString = editingTasks[subjectId];
      if (typeof newTasksString !== 'string') return;
      
      const newTasks = newTasksString.split('|').map(t => t.trim()).filter(Boolean);
      
      if (newTasks.length === 0) {
          toast({ title: "Error", description: "You must have at least one task.", variant: "destructive" });
          return;
      }
      
      const newSubjects = subjects.map(subject => {
          if (subject.id === subjectId) {
              const updatedChapters = subject.chapters.map(chapter => {
                  const newChapterTasks: Record<string, boolean> = {};
                  newTasks.forEach(task => {
                      newChapterTasks[task] = chapter.tasks[task] || false;
                  });
                  return {...chapter, tasks: newChapterTasks};
              });
              return { ...subject, tasks: newTasks, chapters: updatedChapters };
          }
          return subject;
      });
      setJeeSyllabus(newSubjects);
      setEditingTasks(prev => {
          const newEditing = {...prev};
          delete newEditing[subjectId];
          return newEditing;
      });
  };

  const handleEditTasks = (subjectId: string, currentTasks: string[]) => {
      setEditingTasks(prev => ({...prev, [subjectId]: currentTasks.join(' | ')}));
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
                                {editingTasks[subject.id] !== undefined ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editingTasks[subject.id]}
                                            onChange={e => setEditingTasks(prev => ({...prev, [subject.id]: e.target.value}))}
                                            className="h-8 text-xs"
                                            placeholder="Task 1 | Task 2"
                                        />
                                        <Button size="icon" className="h-8 w-8" onClick={() => handleSaveTasks(subject.id)}><Save className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTasks(prev => { const n = {...prev}; delete n[subject.id]; return n; })}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <span>{subject.tasks.join(' | ')}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTasks(subject.id, subject.tasks)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
                            <>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleChapterDragEnd(e, subject.id)}>
                                    <SortableContext items={subject.chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    {subject.chapters.map(chapter => (
                                        <SortableChapterRow
                                            key={chapter.id}
                                            chapter={chapter}
                                            subject={subject}
                                            onToggleTask={handleToggleTask}
                                            onDeleteChapter={handleDeleteChapter}
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

    
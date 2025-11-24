

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useData } from '@/contexts/data-context';
import type { JeeSubject, JeeChapter } from '@/lib/types';
import { LoadingSpinner } from '@/components/loading-spinner';

const initialData: JeeSubject[] = [
  {
    id: 'phy',
    name: 'Physics',
    tasks: ['Notes', 'Lecture', 'Teacher'],
    chapters: [
      { id: 'phy-1', name: 'Chapter 1 – Electric Charge & Field', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
      { id: 'phy-2', name: 'Chapter 2 – Electrostatic Potential', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
      { id: 'phy-3', name: 'Chapter 3 – Current Electricity', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
    ],
  },
  {
    id: 'chem',
    name: 'Chemistry',
    tasks: ['Notes', 'Lecture', 'Teacher'],
    chapters: [
      { id: 'chem-1', name: 'Chapter 1 – Mole Concept', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
      { id: 'chem-2', name: 'Chapter 2 – Atomic Structure', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
    ],
  },
  {
    id: 'math',
    name: 'Maths',
    tasks: ['Notes', 'Lecture', 'Teacher'],
    chapters: [
      { id: 'math-1', name: 'Chapter 1 – Sets & Relations', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
      { id: 'math-2', name: 'Chapter 2 – Quadratic Equations', tasks: { 'Notes': false, 'Lecture': false, 'Teacher': false } },
    ],
  },
];

export default function JeeSyllabusPage() {
  const { activeProfile, setJeeSyllabus, loading } = useData();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterNames, setNewChapterNames] = useState<Record<string, string>>({});
  const [editingTasks, setEditingTasks] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const subjects = useMemo(() => {
    if (activeProfile?.jeeSyllabus === undefined || activeProfile?.jeeSyllabus.length === 0) {
      return initialData;
    }
    return activeProfile.jeeSyllabus;
  }, [activeProfile?.jeeSyllabus]);


  useEffect(() => {
    // This effect ensures that if the loaded data is empty, the initial data is set and saved.
    if (!loading && activeProfile && (activeProfile.jeeSyllabus === undefined || activeProfile.jeeSyllabus.length === 0)) {
        setJeeSyllabus(initialData);
    }
  }, [loading, activeProfile, setJeeSyllabus]);


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
    const chapterName = newChapterNames[subjectId]?.trim();
    if (!chapterName) return;

    const newSubjects = subjects.map(subject => {
      if (subject.id === subjectId) {
        const newChapter: JeeChapter = {
          id: crypto.randomUUID(),
          name: chapterName,
          tasks: subject.tasks.reduce((acc, task) => ({ ...acc, [task]: false }), {}),
        };
        return { ...subject, chapters: [...subject.chapters, newChapter] };
      }
      return subject;
    });
    setJeeSyllabus(newSubjects);
    setNewChapterNames(prev => ({...prev, [subjectId]: ''}));
    toast({ title: "Chapter Added", description: `"${chapterName}" has been added.`});
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">JEE Mains – Syllabus Progress Checker</h2>

        {subjects.map(subject => (
          <Card key={subject.id} className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">{subject.name}</CardTitle>
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
              </div>
            </CardHeader>
            <CardContent>
              {subject.chapters.map(chapter => (
                <div key={chapter.id} className="group flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b dark:border-gray-700 last:border-b-0">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">{chapter.name}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {subject.tasks.map(task => (
                            <div key={task} className="flex items-center">
                                <Checkbox
                                id={`${chapter.id}-${task}`}
                                checked={chapter.tasks[task]}
                                onCheckedChange={() => handleToggleTask(subject.id, chapter.id, task)}
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
                                <AlertDialogAction onClick={() => handleDeleteChapter(subject.id, chapter.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
               <div className="flex gap-2 mt-4">
                    <Input
                        placeholder="Add new chapter..."
                        value={newChapterNames[subject.id] || ''}
                        onChange={e => setNewChapterNames(prev => ({...prev, [subject.id]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.id)}
                    />
                    <Button onClick={() => handleAddChapter(subject.id)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Chapter
                    </Button>
               </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-2 mt-8">
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
    </TooltipProvider>
  );
}

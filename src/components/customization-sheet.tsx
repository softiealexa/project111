
'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, GripVertical, Pencil, ChevronsUpDown, Check, LoaderCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getIconComponent } from '@/lib/icons';
import type { Chapter, Subject } from '@/lib/types';

// Lazy load dialogs for better performance
const AddSubjectDialog = dynamic(() => import('./add-subject-dialog').then(mod => mod.AddSubjectDialog));
const RemoveSubjectDialog = dynamic(() => import('./remove-subject-dialog').then(mod => mod.RemoveSubjectDialog));
const AddChapterDialog = dynamic(() => import('./add-chapter-dialog').then(mod => mod.AddChapterDialog));
const RemoveChapterDialog = dynamic(() => import('./remove-chapter-dialog').then(mod => mod.RemoveChapterDialog));
const RenameDialog = dynamic(() => import('./rename-dialog').then(mod => mod.RenameDialog));
const RemoveProfileDialog = dynamic(() => import('./remove-profile-dialog').then(mod => mod.RemoveProfileDialog));
const AddProfileDialog = dynamic(() => import('./add-profile-dialog').then(mod => mod.AddProfileDialog));


function SortableTaskItem({ id, task, onRemove, onRename, existingTaskNames }: { id: string, task: string, onRemove: () => void, onRename: (newName: string) => void, existingTaskNames: string[] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/50", isDragging && "shadow-lg z-10")}>
            <button {...listeners} {...attributes} aria-label="Drag to reorder task" className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </button>
            <span className="flex-1">{task}</span>
            <RenameDialog
                itemType="Task"
                currentName={task}
                onRename={onRename}
                existingNames={existingTaskNames}
            >
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Rename task: ${task}`}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </RenameDialog>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove} aria-label={`Remove task: ${task}`}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

function SortableSubjectItem({ id, subject, onRemove, onRename, existingSubjectNames }: { id: string, subject: Subject, onRemove: () => void, onRename: (newName: string) => void, existingSubjectNames: string[] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = getIconComponent(subject.icon);
    
    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-2 border-b last:border-b-0", isDragging && "shadow-lg z-10 bg-card")}>
            <button {...listeners} {...attributes} aria-label="Drag to reorder subject" className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </button>
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1">{subject.name}</span>
            <RenameDialog
                itemType="Subject"
                currentName={subject.name}
                onRename={onRename}
                existingNames={existingSubjectNames}
            >
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Rename subject: ${subject.name}`}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </RenameDialog>
            <RemoveSubjectDialog subject={subject} onConfirm={onRemove}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Remove subject: ${subject.name}`}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </RemoveSubjectDialog>
        </div>
    );
}


function SortableChapterItem({ id, chapter, lectureCount, onLectureCountChange, onLectureCountBlur, onRemove, onRename, existingChapterNames }: { id: string; chapter: Chapter; lectureCount: string; onLectureCountChange: (value: string) => void; onLectureCountBlur: () => void; onRemove: () => void; onRename: (newName: string) => void; existingChapterNames: string[] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/50", isDragging && "shadow-lg z-10")}>
            <button {...listeners} {...attributes} aria-label="Drag to reorder chapter" className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </button>
            <span className="flex-1">{chapter.name}</span>
            <Input
                type="number"
                min="1"
                max="25"
                className="w-16 h-7 text-center"
                value={lectureCount}
                onChange={(e) => onLectureCountChange(e.target.value)}
                onBlur={onLectureCountBlur}
                aria-label={`Lectures for ${chapter.name}`}
            />
            <RenameDialog
                itemType="Chapter"
                currentName={chapter.name}
                onRename={onRename}
                existingNames={existingChapterNames}
            >
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Rename chapter: ${chapter.name}`}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </RenameDialog>
            <RemoveChapterDialog chapter={chapter} onConfirm={onRemove}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Remove chapter: ${chapter.name}`}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </RemoveChapterDialog>
        </div>
    );
}

export function CustomizationSheet() {
    const { 
      activeProfile, 
      profiles,
      activeSubjectName,
      switchProfile,
      removeProfile,
      renameProfile,
      updateSubjects, 
      addSubject, 
      removeSubject, 
      renameSubject, 
      addChapter, 
      removeChapter, 
      updateChapter, 
      renameChapter, 
      updateTasks, 
      renameTask 
    } = useData();
    const { toast } = useToast();
    
    const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
    const [newTaskName, setNewTaskName] = useState('');
    const [lectureCounts, setLectureCounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (activeProfile) {
            if (activeProfile.subjects.some(s => s.name === activeSubjectName)) {
                setSelectedSubjectName(activeSubjectName);
            } else if (activeProfile.subjects.length > 0) {
                setSelectedSubjectName(activeProfile.subjects[0].name);
            } else {
                setSelectedSubjectName(null);
            }
        }
    }, [activeProfile, activeSubjectName]);


    const selectedSubject = activeProfile?.subjects.find(s => s.name === selectedSubjectName);
    
    useEffect(() => {
        if (selectedSubject) {
            const initialCounts = selectedSubject.chapters.reduce((acc, chap) => {
                acc[chap.name] = String(chap.lectureCount);
                return acc;
            }, {} as Record<string, string>);
            setLectureCounts(initialCounts);
        } else {
            setLectureCounts({});
        }
    }, [selectedSubject]);
    
    const tasks = selectedSubject?.tasks || [];

    const handleAddTask = () => {
        if (!selectedSubject) return;
        const trimmedName = newTaskName.trim();
        if (!trimmedName) {
            toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
            return;
        }
        if (tasks.some(task => task.toLowerCase() === trimmedName.toLowerCase())) {
            toast({ title: "Error", description: "This task already exists.", variant: "destructive" });
            return;
        }
        updateTasks(selectedSubject.name, [...tasks, trimmedName]);
        setNewTaskName('');
    };

    const handleRemoveTask = (taskToRemove: string) => {
        if (!selectedSubject) return;
        updateTasks(selectedSubject.name, tasks.filter(t => t !== taskToRemove));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    function handleTaskDragEnd(event: DragEndEvent) {
        const { active, over } = event;
    
        if (over && active.id !== over.id && selectedSubject) {
          const oldIndex = tasks.indexOf(active.id as string);
          const newIndex = tasks.indexOf(over.id as string);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
            updateTasks(selectedSubject.name, reorderedTasks);
          }
        }
    }

    function handleSubjectDragEnd(event: DragEndEvent) {
        const { active, over } = event;
    
        if (over && active.id !== over.id && activeProfile) {
          const oldIndex = activeProfile.subjects.findIndex(s => s.name === (active.id as string));
          const newIndex = activeProfile.subjects.findIndex(s => s.name === (over.id as string));
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedSubjects = arrayMove(activeProfile.subjects, oldIndex, newIndex);
            updateSubjects(reorderedSubjects);
          }
        }
    }
    
    const handleLectureCountChange = (chapterName: string) => {
        if (!selectedSubject || !updateChapter) return;
        const newCountStr = lectureCounts[chapterName];
        const newCount = parseInt(newCountStr, 10);

        const originalChapter = selectedSubject.chapters.find(c => c.name === chapterName);
        if (!originalChapter) return;

        if (isNaN(newCount) || newCount < 1 || newCount > 25) {
            toast({
                title: "Invalid Input",
                description: "Lectures must be a number between 1 and 25.",
                variant: "destructive",
            });
            // Revert to original value
            setLectureCounts(prev => ({...prev, [chapterName]: String(originalChapter.lectureCount)}));
        } else if (newCount !== originalChapter.lectureCount) {
            updateChapter(selectedSubject.name, chapterName, newCount);
            toast({
                title: "Chapter Updated",
                description: `Lecture count for "${chapterName}" set to ${newCount}.`
            });
        }
    };

    function handleChapterDragEnd(event: DragEndEvent) {
        const { active, over } = event;
    
        if (over && active.id !== over.id && selectedSubject && activeProfile) {
            const oldIndex = selectedSubject.chapters.findIndex(c => c.name === (active.id as string));
            const newIndex = selectedSubject.chapters.findIndex(c => c.name === (over.id as string));
          
            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedChapters = arrayMove(selectedSubject.chapters, oldIndex, newIndex);
                
                const newSubjects = activeProfile.subjects.map(s => 
                    s.name === selectedSubjectName ? { ...s, chapters: reorderedChapters } : s
                );
                updateSubjects(newSubjects);
            }
        }
    }


    if (!activeProfile) {
        return null;
    }

    return (
        <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="pr-6">
                <SheetTitle>Customization</SheetTitle>
                <SheetDescription>Manage profiles, subjects, chapters, and tasks.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-4 space-y-8">
                <Suspense fallback={<div className="space-y-4"><LoaderCircle className="animate-spin" /></div>}>
                    {/* Section: Profiles */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Profile Management</h3>
                         <div className="space-y-2">
                            <Label htmlFor="profile-switcher">Active Profile</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between" id="profile-switcher">
                                        <span className="truncate">{activeProfile.name}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {profiles.map((profile) => (
                                    <DropdownMenuItem key={profile.name} onSelect={() => switchProfile(profile.name)}>
                                        <Check className={`mr-2 h-4 w-4 ${activeProfile.name === profile.name ? 'opacity-100' : 'opacity-0'}`} />
                                        {profile.name}
                                    </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <AddProfileDialog />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                         <div className="grid grid-cols-2 gap-2">
                            <RenameDialog
                                itemType="Profile"
                                currentName={activeProfile.name}
                                onRename={(newName) => renameProfile(activeProfile.name, newName)}
                                existingNames={profiles.map(p => p.name)}
                            >
                                <Button variant="outline" className="w-full">Rename Profile</Button>
                            </RenameDialog>
                            <RemoveProfileDialog 
                                profileName={activeProfile.name} 
                                onConfirm={() => removeProfile(activeProfile.name)}
                            >
                                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">Remove Profile</Button>
                            </RemoveProfileDialog>
                        </div>
                    </div>

                    <Separator />
                    
                    {/* Section: Subjects */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Subject Management</h3>
                        <div className="space-y-2">
                            <AddSubjectDialog 
                                onAddSubject={addSubject}
                                existingSubjects={activeProfile.subjects.map(s => s.name)}
                            >
                                <Button variant="outline" className="w-full justify-center">
                                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                                </Button>
                            </AddSubjectDialog>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubjectDragEnd}>
                                <SortableContext items={activeProfile.subjects.map(s => s.name)} strategy={verticalListSortingStrategy}>
                                    <div className="rounded-md border">
                                        {activeProfile.subjects.length > 0 ? activeProfile.subjects.map(subject => (
                                            <SortableSubjectItem 
                                                key={subject.name} 
                                                id={subject.name} 
                                                subject={subject} 
                                                onRemove={() => removeSubject(subject.name)} 
                                                onRename={(newName) => renameSubject(subject.name, newName)}
                                                existingSubjectNames={activeProfile.subjects.map(s => s.name)}
                                            />
                                        )) : (
                                            <p className="text-sm text-muted-foreground text-center p-4">No subjects yet.</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    <Separator />
                    
                    {/* Section: Edit Subject Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Chapter & Task Management</h3>
                         <div className="space-y-2">
                            <Label htmlFor="subject-select">Select Subject</Label>
                            <Select 
                                value={selectedSubjectName || ""} 
                                onValueChange={(value) => setSelectedSubjectName(value)}
                                disabled={activeProfile.subjects.length === 0}
                            >
                                <SelectTrigger id="subject-select">
                                    <SelectValue placeholder="Select a subject to edit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeProfile.subjects.map(subject => (
                                        <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className={cn("space-y-6", !selectedSubject && "opacity-50 pointer-events-none")}>
                        {/* Sub-section for Chapters */}
                        <div className="space-y-3">
                            <Label>Manage Chapters & Lectures</Label>
                             <AddChapterDialog
                                onAddChapter={(newChapter) => addChapter(selectedSubjectName!, newChapter)}
                                existingChapterNames={selectedSubject?.chapters.map(c => c.name) || []}
                            >
                                <Button variant="outline" className="w-full justify-center" disabled={!selectedSubjectName}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Chapter
                                </Button>
                            </AddChapterDialog>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
                                <SortableContext items={selectedSubject?.chapters.map(c => c.name) || []} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2 rounded-md border p-2 min-h-24">
                                        {selectedSubject && selectedSubject.chapters.length > 0 ? selectedSubject.chapters.map((chapter: Chapter) => (
                                            <SortableChapterItem
                                                key={chapter.name}
                                                id={chapter.name}
                                                chapter={chapter}
                                                lectureCount={lectureCounts[chapter.name] || ''}
                                                onLectureCountChange={(value) => {
                                                    if (/^\d*$/.test(value)) {
                                                        setLectureCounts(prev => ({ ...prev, [chapter.name]: value }));
                                                    }
                                                }}
                                                onLectureCountBlur={() => handleLectureCountChange(chapter.name)}
                                                onRemove={() => removeChapter(selectedSubjectName!, chapter.name)}
                                                onRename={(newName) => renameChapter(selectedSubjectName!, chapter.name, newName)}
                                                existingChapterNames={selectedSubject.chapters.map(c => c.name)}
                                            />
                                        )) : (
                                            <p className="text-sm text-muted-foreground text-center p-4">No chapters in this subject.</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {/* Sub-section for Tasks */}
                        <div className="space-y-3">
                            <Label>Manage Repeatable Tasks</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="new-task" 
                                    placeholder="e.g. Revision" 
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    disabled={!selectedSubjectName}
                                />
                                <Button onClick={handleAddTask} disabled={!selectedSubjectName}>Add</Button>
                            </div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
                                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2 rounded-md border p-2 min-h-24">
                                        {tasks.length > 0 ? tasks.map(task => (
                                        <SortableTaskItem 
                                                key={task} 
                                                id={task} 
                                                task={task} 
                                                onRemove={() => handleRemoveTask(task)}
                                                onRename={(newName) => renameTask(selectedSubjectName!, task, newName)}
                                                existingTaskNames={tasks}
                                            />
                                        )) : (
                                            <p className="text-sm text-muted-foreground text-center p-4">No repeatable tasks.</p>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                </Suspense>
                </div>
            </ScrollArea>
             <SheetFooter className="mt-auto pt-4 border-t">
                <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
            </SheetFooter>
        </SheetContent>
    );
}

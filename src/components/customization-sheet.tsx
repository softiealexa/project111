
'use client';

import { useState } from 'react';
import { useData } from '@/contexts/data-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Trash2, Plus, GripVertical } from 'lucide-react';
import { AddSubjectDialog } from './add-subject-dialog';
import { RemoveSubjectDialog } from './remove-subject-dialog';
import { AddChapterDialog } from './add-chapter-dialog';
import { RemoveChapterDialog } from './remove-chapter-dialog';
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


function SortableTaskItem({ id, task, onRemove }: { id: string, task: string, onRemove: () => void }) {
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
            <div {...listeners} {...attributes} className="cursor-grab touch-none p-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1">{task}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function CustomizationSheet() {
    const {
        activeProfile,
        activeSubjectName,
        addSubject,
        removeSubject,
        addChapter,
        removeChapter,
        updateTasks,
    } = useData();
    const { toast } = useToast();
    const [newTaskName, setNewTaskName] = useState('');

    const activeSubject = activeProfile?.subjects.find(s => s.name === activeSubjectName);

    const handleAddTask = () => {
        if (!activeProfile) return;
        const trimmedName = newTaskName.trim();
        if (!trimmedName) {
            toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
            return;
        }
        if (activeProfile.tasks.includes(trimmedName)) {
            toast({ title: "Error", description: "This task already exists.", variant: "destructive" });
            return;
        }
        updateTasks([...activeProfile.tasks, trimmedName]);
        setNewTaskName('');
    };

    const handleRemoveTask = (taskToRemove: string) => {
        if (!activeProfile) return;
        updateTasks(activeProfile.tasks.filter(t => t !== taskToRemove));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
    
        if (over && active.id !== over.id && activeProfile) {
          const oldIndex = activeProfile.tasks.indexOf(active.id as string);
          const newIndex = activeProfile.tasks.indexOf(over.id as string);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedTasks = arrayMove(activeProfile.tasks, oldIndex, newIndex);
            updateTasks(reorderedTasks);
          }
        }
    }

    if (!activeProfile) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <SlidersHorizontal className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <SlidersHorizontal className="h-5 w-5" />
                    <span className="sr-only">Open Customization</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="pr-6">
                    <SheetTitle>Customization</SheetTitle>
                    <SheetDescription>Manage your subjects, chapters, and tasks for the '{activeProfile.name}' profile.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="py-4 space-y-6">
                        {/* Section for Tasks */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">Manage Tasks</h3>
                             <div className="space-y-2">
                                <Label htmlFor="new-task">Add New Task</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="new-task" 
                                        placeholder="e.g. Revision" 
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    />
                                    <Button onClick={handleAddTask}>Add</Button>
                                </div>
                             </div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={activeProfile.tasks} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {activeProfile.tasks.map(task => (
                                           <SortableTaskItem 
                                                key={task} 
                                                id={task} 
                                                task={task} 
                                                onRemove={() => handleRemoveTask(task)} 
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        <Separator />

                        {/* Section for Subjects */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">Manage Subjects</h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <AddSubjectDialog 
                                    onAddSubject={addSubject}
                                    existingSubjects={activeProfile.subjects.map(s => s.name)}
                                >
                                    <Button variant="outline" className="w-full justify-center">
                                        <Plus className="mr-2 h-4 w-4" /> Add Subject
                                    </Button>
                                </AddSubjectDialog>
                                <RemoveSubjectDialog 
                                    subjects={activeProfile.subjects} 
                                    onConfirm={removeSubject}
                                >
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-center text-destructive hover:text-destructive focus:text-destructive"
                                        disabled={activeProfile.subjects.length === 0}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Subject
                                    </Button>
                                </RemoveSubjectDialog>
                            </div>
                        </div>

                        <Separator />

                        {/* Section for Chapters */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">Manage Chapters</h3>
                            <p className="text-sm text-muted-foreground">
                                {activeSubject ? `Editing chapters for '${activeSubject.name}'.` : "Select a subject from the dashboard to manage its chapters."}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <AddChapterDialog onAddChapter={(newChapter) => addChapter(activeSubjectName!, newChapter)}>
                                    <Button variant="outline" className="w-full justify-center" disabled={!activeSubject}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Chapter
                                    </Button>
                                </AddChapterDialog>
                                <RemoveChapterDialog 
                                    chapters={activeSubject?.chapters || []} 
                                    onConfirm={(chapterName) => removeChapter(activeSubjectName!, chapterName)}
                                >
                                     <Button 
                                        variant="outline" 
                                        className="w-full justify-center text-destructive hover:text-destructive focus:text-destructive"
                                        disabled={!activeSubject || activeSubject.chapters.length === 0}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Chapter
                                    </Button>
                                </RemoveChapterDialog>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                 <SheetFooter className="mt-auto pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

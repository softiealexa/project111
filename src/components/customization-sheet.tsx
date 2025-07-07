
'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, GripVertical, Check } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


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

const themes = [
    { name: 'default', label: 'Default', color: 'hsl(180 90% 45%)' },
    { name: 'zinc', label: 'Zinc', color: 'hsl(240 5.9% 10%)' },
    { name: 'rose', label: 'Rose', color: 'hsl(346.8 77.2% 49.8%)' },
    { name: 'blue', label: 'Blue', color: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'green', label: 'Green', color: 'hsl(142.1 76.2% 36.3%)' },
];

export function CustomizationSheet() {
    const { activeProfile, activeSubjectName, addSubject, removeSubject, addChapter, removeChapter, updateTasks, theme, setTheme } = useData();
    const { toast } = useToast();
    
    const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
    const [newTaskName, setNewTaskName] = useState('');

    useEffect(() => {
        // When the panel opens, sync the selected subject with the active one from the dashboard
        if (activeProfile) {
            setSelectedSubjectName(activeSubjectName);
        }
    }, [activeProfile, activeSubjectName]);

    const selectedSubject = activeProfile?.subjects.find(s => s.name === selectedSubjectName);
    const tasks = selectedSubject?.tasks || [];

    const handleAddTask = () => {
        if (!selectedSubject) return;
        const trimmedName = newTaskName.trim();
        if (!trimmedName) {
            toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
            return;
        }
        if (tasks.includes(trimmedName)) {
            toast({ title: "Error", description: "This task already exists for this subject.", variant: "destructive" });
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

    function handleDragEnd(event: DragEndEvent) {
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

    if (!activeProfile) {
        return null;
    }

    return (
        <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="pr-6">
                <SheetTitle>Customization</SheetTitle>
                <SheetDescription>Manage your subjects, chapters, and tasks for the '{activeProfile.name}' profile.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-4 space-y-6">
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
                                onConfirm={(subjectName) => {
                                    removeSubject(subjectName);
                                    if (selectedSubjectName === subjectName) {
                                        setSelectedSubjectName(null);
                                    }
                                }}
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
                     {/* Section for Theme */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-foreground">Select Theme</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {themes.map((t) => (
                                <Button
                                    key={t.name}
                                    variant="outline"
                                    className={cn("justify-start h-auto py-2", theme === t.name && "border-primary ring-1 ring-primary")}
                                    onClick={() => setTheme(t.name)}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.color }} />
                                        <span>{t.label}</span>
                                    </span>
                                    {theme === t.name && <Check className="ml-auto h-4 w-4" />}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label htmlFor="subject-select" className="font-medium text-foreground">Editing Subject</Label>
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
                    
                    <div className={cn("space-y-6", !selectedSubject && "opacity-50 pointer-events-none")}>
                        {/* Section for Chapters */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">Manage Chapters</h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <AddChapterDialog onAddChapter={(newChapter) => addChapter(selectedSubjectName!, newChapter)}>
                                    <Button variant="outline" className="w-full justify-center" disabled={!selectedSubjectName}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Chapter
                                    </Button>
                                </AddChapterDialog>
                                <RemoveChapterDialog 
                                    chapters={selectedSubject?.chapters || []} 
                                    onConfirm={(chapterName) => removeChapter(selectedSubjectName!, chapterName)}
                                >
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-center text-destructive hover:text-destructive focus:text-destructive"
                                        disabled={!selectedSubjectName || (selectedSubject?.chapters?.length ?? 0) === 0}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Chapter
                                    </Button>
                                </RemoveChapterDialog>
                            </div>
                        </div>

                        <Separator />

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
                                        disabled={!selectedSubjectName}
                                    />
                                    <Button onClick={handleAddTask} disabled={!selectedSubjectName}>Add</Button>
                                </div>
                            </div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {tasks.map(task => (
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
                    </div>

                </div>
            </ScrollArea>
             <SheetFooter className="mt-auto pt-4 border-t">
                <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
            </SheetFooter>
        </SheetContent>
    );
}

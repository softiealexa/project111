
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
import { Trash2, Plus, GripVertical, Check, Pencil, Edit } from 'lucide-react';
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
import { getIconComponent } from '@/lib/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
            <div {...listeners} {...attributes} className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>
            <span className="flex-1">{task}</span>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Rename feature coming soon</p></TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

const themes = [
    { name: 'default', label: 'Teal', color: 'hsl(180 90% 45%)' },
    { name: 'zinc', label: 'Zinc', color: 'hsl(240 5.2% 95.1%)' },
    { name: 'rose', label: 'Rose', color: 'hsl(346.8 77.2% 49.8%)' },
    { name: 'blue', label: 'Blue', color: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'green', label: 'Green', color: 'hsl(142.1 76.2% 36.3%)' },
    { name: 'violet', label: 'Violet', color: 'hsl(255 92% 76%)' },
    { name: 'lavender', label: 'Lavender', color: 'hsl(267 84% 92%)' },
];

export function CustomizationSheet() {
    const { activeProfile, activeSubjectName, addSubject, removeSubject, addChapter, removeChapter, updateTasks, theme, setTheme } = useData();
    const { toast } = useToast();
    
    const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
    const [newTaskName, setNewTaskName] = useState('');

    useEffect(() => {
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
                <SheetDescription>Manage subjects, themes, and more for the '{activeProfile.name}' profile.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-4 space-y-8">

                    {/* Section: General */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">General</h3>
                        <div className='px-2 space-y-4'>
                            <div className="space-y-2">
                                <Label>Theme</Label>
                                <div className="grid grid-cols-5 gap-3">
                                    {themes.map((t) => (
                                       <Tooltip key={t.name}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setTheme(t.name)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all",
                                                        theme === t.name ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-muted"
                                                    )}
                                                    aria-label={`Select ${t.label} theme`}
                                                >
                                                    <span className="h-6 w-6 rounded-full border" style={{ backgroundColor: t.color }} />
                                                    {theme === t.name && (
                                                        <Check className="h-4 w-4 absolute text-primary-foreground mix-blend-difference" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Section: Subjects */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Manage Profile</h3>
                        <div className="space-y-2">
                            <AddSubjectDialog 
                                onAddSubject={addSubject}
                                existingSubjects={activeProfile.subjects.map(s => s.name)}
                            >
                                <Button variant="outline" className="w-full justify-center">
                                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                                </Button>
                            </AddSubjectDialog>
                            <div className="rounded-md border">
                                {activeProfile.subjects.length > 0 ? activeProfile.subjects.map(subject => {
                                    const Icon = getIconComponent(subject.icon);
                                    return (
                                        <div key={subject.name} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                                            <div className="cursor-not-allowed p-1 text-muted-foreground/50"><GripVertical className="h-5 w-5" /></div>
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <span className="flex-1">{subject.name}</span>
                                            <RemoveSubjectDialog subjects={[subject]} onConfirm={() => removeSubject(subject.name)}>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </RemoveSubjectDialog>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-sm text-muted-foreground text-center p-4">No subjects yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />
                    
                    {/* Section: Edit Subject Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Edit Subject Details</h3>
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
                        <div className="space-y-2">
                            <Label>Manage Chapters</Label>
                             <div className="flex gap-2">
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
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2 rounded-md border p-2 min-h-24">
                                        {tasks.length > 0 ? tasks.map(task => (
                                        <SortableTaskItem 
                                                key={task} 
                                                id={task} 
                                                task={task} 
                                                onRemove={() => handleRemoveTask(task)} 
                                            />
                                        )) : (
                                            <p className="text-sm text-muted-foreground text-center p-4">No repeatable tasks.</p>
                                        )}
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

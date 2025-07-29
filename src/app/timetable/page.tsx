
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/data-context';
import type { TimetableTask, TimetableTaskStatus } from '@/lib/types';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, setHours, setMinutes, startOfToday, addMinutes, differenceInMinutes } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GripVertical, Play, Pause, Check, Trash2, Plus, Settings, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import Navbar from '@/components/navbar';

const TOTAL_MINUTES = 24 * 60;

// --- Helper Functions ---
const formatTime = (date: Date | number) => format(new Date(date), 'HH:mm');

const getMinutesFromStartOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  const start = startOfToday();
  return differenceInMinutes(date, start);
};

// --- AddTaskDialog Component ---
function AddTaskDialog({ open, onOpenChange, onAddTask }: { open: boolean, onOpenChange: (open: boolean) => void, onAddTask: (title: string, startTime: string, duration: number) => void }) {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState(60);
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!title.trim()) {
            setError('Task title is required.');
            return;
        }
        onAddTask(title.trim(), startTime, duration);
        onOpenChange(false);
    };

    useEffect(() => {
        if (!open) {
            setTitle('');
            setStartTime('09:00');
            setDuration(60);
            setError('');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Enter the details for your new task.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Physics Lecture" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start-time">Planned Start Time</Label>
                            <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input id="duration" type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10) || 0)} min="1" />
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Add Task</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- SettingsDialog Component ---
function SettingsDialog({ open, onOpenChange, settings, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, settings: { slotInterval: number }, onSave: (newInterval: number) => void }) {
    const [interval, setInterval] = useState(settings.slotInterval);

    useEffect(() => {
        setInterval(settings.slotInterval);
    }, [settings.slotInterval, open]);
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Timetable Settings</DialogTitle>
                    <DialogDescription>Customize the appearance of your timetable.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="interval">Time Slot Interval: {interval} minutes</Label>
                        <p className="text-sm text-muted-foreground">Adjust the granularity of the time grid. A smaller interval provides more detail.</p>
                        <Slider
                            id="interval"
                            min={5}
                            max={60}
                            step={5}
                            value={[interval]}
                            onValueChange={(value) => setInterval(value[0])}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => { onSave(interval); onOpenChange(false); }}>Save Settings</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- TimetableTaskItem Component ---
function TimetableTaskItem({ task, onUpdateTask, onDeleteTask }: { task: TimetableTask, onUpdateTask: (task: TimetableTask, newStatus: TimetableTaskStatus) => void, onDeleteTask: (taskId: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };

    const handleAction = (newStatus: TimetableTaskStatus) => {
        onUpdateTask(task, newStatus);
    };

    const isPending = task.status === 'pending';
    const isInProgress = task.status === 'in-progress';
    const isPaused = task.status === 'paused';
    const isCompleted = task.status === 'completed';

    const cardBg = useMemo(() => {
        if (isCompleted) return 'bg-green-500/10 border-green-500/20';
        if (isInProgress) return 'bg-blue-500/10 border-blue-500/20';
        if (isPaused) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-card';
    }, [isCompleted, isInProgress, isPaused]);

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className={cn("transition-colors", cardBg)}>
                <CardContent className="p-3 flex items-center gap-3">
                    <button {...listeners} className="cursor-grab p-2 text-muted-foreground touch-none">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold truncate", isCompleted && "line-through text-muted-foreground")}>{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                            Plan: {formatTime(task.plannedStart)} for {task.plannedLengthMinutes}m
                        </p>
                    </div>
                    <div className="flex gap-1">
                        {isPending && <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => handleAction('in-progress')}><Play className="h-4 w-4" /></Button>}
                        {isInProgress && <Button size="icon" className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600" onClick={() => handleAction('paused')}><Pause className="h-4 w-4" /></Button>}
                        {isPaused && <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => handleAction('in-progress')}><Play className="h-4 w-4" /></Button>}
                        {(isInProgress || isPaused) && <Button size="icon" className="h-8 w-8" onClick={() => handleAction('completed')}><Check className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- TimetableGrid Component ---
const TimetableGrid = ({ tasks, slotInterval, hourChunk }: { tasks: TimetableTask[], slotInterval: number, hourChunk: { start: number, end: number } }) => {
    const hours = useMemo(() => {
        const h = [];
        for (let i = hourChunk.start; i < hourChunk.end; i++) {
            h.push(i);
        }
        return h;
    }, [hourChunk]);

    const gridTemplateColumns = `4rem repeat(${hours.length * (60 / slotInterval)}, 1fr)`;
    const totalSlots = (hourChunk.end - hourChunk.start) * (60 / slotInterval);

    return (
        <div className="relative bg-background border-t">
            <div className="sticky top-0 bg-background z-10 grid" style={{ gridTemplateColumns }}>
                <div className="border-r border-b"></div>
                {hours.map(hour => (
                    <div key={hour} className="text-center text-xs font-semibold text-muted-foreground py-1 border-b border-r" style={{ gridColumn: `span ${60 / slotInterval}` }}>
                        {String(hour).padStart(2, '0')}:00
                    </div>
                ))}
            </div>
            
            <div className="relative grid min-h-24" style={{ gridTemplateColumns, gridTemplateRows: '1fr' }}>
                <div className="border-r row-start-1" style={{ gridColumn: '1' }}></div>
                {Array.from({ length: totalSlots }).map((_, i) => (
                    <div key={i} className="border-r h-full row-start-1" style={{ gridColumn: `${i + 2}` }} />
                ))}

                {tasks.map(task => {
                    const startMinutes = getMinutesFromStartOfDay(task.plannedStart);
                    const startSlot = (startMinutes / slotInterval) + 2; 
                    const endMinutes = startMinutes + task.actualLengthMinutes;
                    const endSlot = (endMinutes / slotInterval) + 2;
                    
                    if (startMinutes >= hourChunk.end * 60 || endMinutes <= hourChunk.start * 60) {
                        return null; // Task is outside this chunk
                    }

                    const displayStartSlot = Math.max(startSlot, (hourChunk.start * (60 / slotInterval)) + 2);
                    const displayEndSlot = Math.min(endSlot, (hourChunk.end * (60 / slotInterval)) + 2);

                    const bgColor = task.status === 'completed' ? 'bg-green-500/20' : 
                                    task.status === 'in-progress' ? 'bg-blue-500/20' : 
                                    task.status === 'paused' ? 'bg-yellow-500/20' : 'bg-primary/10';

                    return (
                        <Tooltip key={task.id}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("absolute h-full row-start-1 flex items-center p-2 rounded-lg border", bgColor)}
                                    style={{
                                        gridColumn: `${displayStartSlot} / ${displayEndSlot}`,
                                    }}
                                >
                                    <p className="text-xs font-medium truncate text-foreground">{task.title}</p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{task.title}</p>
                                <p>Plan: {formatTime(task.plannedStart)} ({task.plannedLengthMinutes} min)</p>
                                {task.actualStart && <p>Actual: {formatTime(task.actualStart)} ({task.actualLengthMinutes} min)</p>}
                                <p>Status: <span className="capitalize">{task.status}</span></p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};


// --- Main Timetable Page ---
export default function TimetablePage() {
    const { activeProfile, addTimetableTask, updateTimetableTask, deleteTimetableTask, updateTimetableSettings } = useData();
    const { toast } = useToast();
    
    const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [_, setTick] = useState(0); // For forcing re-renders

    const tasks = useMemo(() => activeProfile?.timetableTasks || [], [activeProfile]);
    const settings = useMemo(() => activeProfile?.timetableSettings || { slotInterval: 15 }, [activeProfile]);

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.plannedStart - b.plannedStart);
    }, [tasks]);

    useEffect(() => {
        const timer = setInterval(() => {
            let needsUpdate = false;
            tasks.forEach(task => {
                if (task.status === 'in-progress' && task.actualStart) {
                    needsUpdate = true;
                }
            });
            if(needsUpdate) {
                setTick(t => t + 1); // Trigger re-render to update lengths
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [tasks]);


    const handleAddTask = (title: string, startTime: string, duration: number) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const plannedStart = setMinutes(setHours(startOfToday(), hours), minutes).getTime();
        
        addTimetableTask({
            title,
            plannedStart,
            actualStart: null,
            plannedLengthMinutes: duration,
            actualLengthMinutes: duration,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseDuration: 0,
            status: 'pending',
        });
        toast({ title: "Task Added", description: `"${title}" has been added to your timetable.` });
    };

    const handleUpdateTask = (task: TimetableTask, newStatus: TimetableTaskStatus) => {
        let updatedTask = { ...task, status: newStatus };
        const now = Date.now();

        if (newStatus === 'in-progress') {
            if (task.status === 'pending') {
                updatedTask.actualStart = now;
            } else if (task.status === 'paused' && task.pauseStartTime) {
                updatedTask.accumulatedPauseDuration += now - task.pauseStartTime;
                updatedTask.pauseStartTime = null;
            }
        } else if (newStatus === 'paused' && task.status === 'in-progress') {
            updatedTask.pauseStartTime = now;
        } else if (newStatus === 'completed' && task.actualStart) {
            const durationMs = now - task.actualStart - task.accumulatedPauseDuration;
            updatedTask.actualLengthMinutes = Math.round(durationMs / 60000);
        }
        
        updateTimetableTask(updatedTask);
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTimetableTask(taskId);
        toast({ title: 'Task Deleted', variant: 'destructive' });
    };

    const handleSaveSettings = (newInterval: number) => {
        updateTimetableSettings({ slotInterval: newInterval });
        toast({ title: 'Settings Saved' });
    };

    const processedTasks = useMemo(() => {
        const now = Date.now();
        const adjustedTasks: TimetableTask[] = [];
        let lastEndTime = 0;

        sortedTasks.forEach(task => {
            let currentActualLengthMinutes = task.plannedLengthMinutes;
            if (task.status === 'in-progress' && task.actualStart) {
                const elapsedMs = now - task.actualStart - task.accumulatedPauseDuration;
                currentActualLengthMinutes = Math.max(task.plannedLengthMinutes, Math.round(elapsedMs / 60000));
            } else if (task.status !== 'pending') {
                 currentActualLengthMinutes = task.actualLengthMinutes;
            }

            let currentPlannedStart = task.plannedStart;
            if (task.actualStart) {
                currentPlannedStart = task.actualStart;
            }

            if (currentPlannedStart < lastEndTime) {
                currentPlannedStart = lastEndTime;
            }
            
            lastEndTime = addMinutes(new Date(currentPlannedStart), currentActualLengthMinutes).getTime();

            adjustedTasks.push({ ...task, plannedStart: currentPlannedStart, actualLengthMinutes: currentActualLengthMinutes });
        });
        
        return adjustedTasks;
    }, [sortedTasks, _]);

    return (
        <TooltipProvider>
            <div className="flex flex-col h-screen bg-muted/30">
                <Navbar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="p-4 border-b bg-background flex-shrink-0">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">Daily Timetable</h1>
                                <p className="text-muted-foreground">Plan and track your tasks throughout the day.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setAddTaskDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
                                <Button variant="outline" size="icon" onClick={() => setSettingsDialogOpen(true)}><Settings className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r p-4 overflow-y-auto flex-shrink-0">
                            <h2 className="text-lg font-semibold mb-3">Today's Tasks</h2>
                            {sortedTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {sortedTasks.map(task => (
                                        <TimetableTaskItem
                                            key={task.id}
                                            task={task}
                                            onUpdateTask={handleUpdateTask}
                                            onDeleteTask={handleDeleteTask}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-10">No tasks scheduled.</div>
                            )}
                        </aside>

                        <div className="flex-1 overflow-auto">
                            <div className="min-w-[1200px]">
                                <TimetableGrid tasks={processedTasks} slotInterval={settings.slotInterval} hourChunk={{ start: 0, end: 8 }} />
                                <TimetableGrid tasks={processedTasks} slotInterval={settings.slotInterval} hourChunk={{ start: 8, end: 16 }} />
                                <TimetableGrid tasks={processedTasks} slotInterval={settings.slotInterval} hourChunk={{ start: 16, end: 24 }} />
                            </div>
                        </div>
                    </div>
                </main>
                <AddTaskDialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen} onAddTask={handleAddTask} />
                <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} settings={settings} onSave={handleSaveSettings} />
            </div>
        </TooltipProvider>
    );
}



"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, addDays, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Edit, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';

import { useData } from "@/contexts/data-context";
import type { SmartTodo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Use the same logical date functions from the context for consistency
const DAY_BOUNDARY_HOUR = 4;
const getLogicalDate = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() - DAY_BOUNDARY_HOUR);
};
const getLogicalDateString = (date?: Date): string => {
  return format(getLogicalDate(date), 'yyyy-MM-dd');
};

export default function SmartTodoList() {
  const { activeProfile, addTodo, updateTodo, deleteTodo } = useData();
  const { toast } = useToast();
  
  const allTasks = useMemo(() => activeProfile?.todos || [], [activeProfile]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(getLogicalDate());
  const [inputText, setInputText] = useState("");
  const [editingTask, setEditingTask] = useState<SmartTodo | null>(null);
  
  useEffect(() => {
    // When date changes, reset editing state
    setEditingTask(null);
  }, [selectedDate]);

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const tasksForSelectedDay = useMemo(() => {
    return allTasks
      .filter(task => task.forDate === selectedDateString)
      .sort((a, b) => {
        // Pending tasks first, then sort by creation time
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;
        return b.createdAt - a.createdAt;
      });
  }, [allTasks, selectedDateString]);

  const handleAddTask = () => {
    const text = inputText.trim();
    if (!text) {
      toast({
        title: "Error",
        description: "Task cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (editingTask) {
        updateTodo({ ...editingTask, text });
        toast({ title: 'Task Updated', description: `"${text}" has been updated.` });
        setEditingTask(null);
    } else {
        addTodo(text, selectedDateString);
        toast({ title: 'Task Added', description: `"${text}" has been added for ${format(selectedDate, 'PPP')}.` });
    }
    setInputText("");
  };

  const handleToggleTask = (task: SmartTodo) => {
    if (task.status === 'pending') {
        updateTodo({ ...task, status: 'completed', completedAt: Date.now() });
    } else {
        updateTodo({ ...task, status: 'pending', completedAt: undefined });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTodo(taskId);
    toast({
        title: 'Task Removed',
        description: `The task has been removed from your list.`,
        variant: "destructive"
    });
  };

  const handleEdit = (task: SmartTodo) => {
    setEditingTask(task);
    setInputText(task.text);
  };
  
  const getRelativeDateString = (date: Date): string => {
    const logicalDate = getLogicalDate(new Date());
    if (format(date, 'yyyy-MM-dd') === format(logicalDate, 'yyyy-MM-dd')) return 'Today';
    if (format(date, 'yyyy-MM-dd') === format(subDays(logicalDate, 1), 'yyyy-MM-dd')) return 'Yesterday';
    if (format(date, 'yyyy-MM-dd') === format(addDays(logicalDate, 1), 'yyyy-MM-dd')) return 'Tomorrow';
    return format(date, 'PPP');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart To-Do List</CardTitle>
        <CardDescription>
          Manage your daily tasks. Incomplete tasks will roll over after 4:00 AM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 space-y-2">
                <Label htmlFor="new-task-input">
                    {editingTask ? 'Edit Task' : 'New Task'}
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="new-task-input"
                        placeholder="Add a new task for your day..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <Button onClick={handleAddTask}>
                        {editingTask ? 'Save' : <Plus className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="flex flex-col space-y-2 sm:max-w-xs">
                <Label>Selected Day</Label>
                <div className="flex items-center gap-2 rounded-md border bg-card p-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => subDays(d,1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(day) => day && setSelectedDate(day)}
                        initialFocus
                        classNames={{
                            root: 'flex justify-center',
                            day_selected: 'bg-primary text-primary-foreground',
                            day_today: 'bg-accent text-accent-foreground',
                        }}
                        components={{
                            Caption: () => (
                                <div className="text-center font-medium flex-1">
                                    {getRelativeDateString(selectedDate)}
                                </div>
                            ),
                            IconLeft: () => null,
                            IconRight: () => null,
                        }}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d,1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">
                Tasks for {getRelativeDateString(selectedDate)}
            </h3>
            {tasksForSelectedDay.length > 0 ? (
                tasksForSelectedDay.map((task) => (
                    <div
                        key={task.id}
                        className="group flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50"
                    >
                        <Checkbox
                            id={`task-${task.id}`}
                            checked={task.status === 'completed' ? 'checked' : 'unchecked'}
                            onCheckedChange={() => handleToggleTask(task)}
                            aria-label={`Mark task as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
                        />
                        <Label
                            htmlFor={`task-${task.id}`}
                            className={cn(
                                "flex-grow cursor-pointer",
                                task.status === 'completed' && "line-through text-muted-foreground"
                            )}
                        >
                            {task.text}
                        </Label>
                        {task.rolledOver && (
                             <span className="text-xs text-amber-600 flex items-center gap-1">
                                <CornerDownLeft className="h-3 w-3" />
                                Rollover
                            </span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(task)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-8">
                    No tasks for this day.
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

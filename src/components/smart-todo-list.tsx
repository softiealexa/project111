
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Edit, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { useData } from "@/contexts/data-context";
import type { SmartTodo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';

export default function SmartTodoList() {
  const { activeProfile, addTodo, updateTodo, deleteTodo } = useData();
  const { toast } = useToast();
  
  const allTasks = useMemo(() => activeProfile?.todos || [], [activeProfile]);
  
  const [selectedDay, setSelectedDay] = useState<Date>(startOfDay(new Date()));
  const [inputText, setInputText] = useState("");
  const [editingTask, setEditingTask] = useState<SmartTodo | null>(null);
  
  useEffect(() => {
    // When date changes, reset editing state
    setEditingTask(null);
    setInputText("");
  }, [selectedDay]);

  const selectedDateString = format(selectedDay, 'yyyy-MM-dd');

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
        toast({ title: 'Task Added', description: `"${text}" has been added for ${format(selectedDay, 'PPP')}.` });
    }
    setInputText("");
  };

  const handleToggleTask = (task: SmartTodo) => {
    if (task.status === 'pending') {
        updateTodo({ ...task, status: 'completed', completedAt: Date.now() });
    } else {
        const updatedTask = { ...task, status: 'pending' as const };
        delete updatedTask.completedAt; // Ensure completedAt is removed
        updateTodo(updatedTask);
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
    // Focus the input field after setting state
    setTimeout(() => {
        document.getElementById('new-task-input')?.focus();
    }, 100);
  };
  
  const getRelativeDateString = (date: Date): string => {
    const today = startOfDay(new Date());
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today';
    if (format(date, 'yyyy-MM-dd') === format(subDays(today, 1), 'yyyy-MM-dd')) return 'Yesterday';
    if (format(date, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd')) return 'Tomorrow';
    return format(date, 'PPP');
  }

  const modifiers = {
    hasTask: (date: Date) => allTasks.some(task => task.forDate === format(date, 'yyyy-MM-dd'))
  };

  const modifiersClassNames = {
    hasTask: 'has-task',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart To-Do List</CardTitle>
        <CardDescription>
          Organize your tasks by day. Incomplete tasks automatically roll over to the next day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="flex flex-wrap items-center justify-between gap-y-2">
              <h3 className="text-xl font-semibold">
                  Tasks for {getRelativeDateString(selectedDay)}
              </h3>
               <div className='flex items-center rounded-md border bg-card'>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(subDays(selectedDay, 1))} className="rounded-r-none h-9 w-9"><ChevronLeft className="h-5 w-5" /></Button>
                    <Button variant="ghost" className="rounded-none border-x h-9" onClick={() => setSelectedDay(startOfDay(new Date()))}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(addDays(selectedDay, 1))} className="rounded-l-none h-9 w-9"><ChevronRight className="h-5 w-5" /></Button>
                </div>
         </div>
          <div className="flex flex-wrap gap-2">
              <Input
                  id="new-task-input"
                  placeholder="Add a new task..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="flex-1 min-w-[200px]"
              />
              <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !selectedDay && "text-muted-foreground"
                      )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDay ? format(selectedDay, "MMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                  <style>{`.has-task:not([aria-selected]):after {
                            content: '';
                            position: absolute;
                            bottom: 6px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 5px;
                            height: 5px;
                            border-radius: 50%;
                            background-color: hsl(var(--primary));
                        }`}</style>
                  <Calendar
                      mode="single"
                      selected={selectedDay}
                      onSelect={(day) => day && setSelectedDay(day)}
                      initialFocus
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                  />
                  </PopoverContent>
              </Popover>
              <Button onClick={handleAddTask}>
                  {editingTask ? null : <Plus className="h-4 w-4 md:mr-2" />}
                  <span className="hidden md:inline">{editingTask ? 'Save Task' : 'Add Task'}</span>
              </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3 h-[300px] overflow-y-auto pr-2">
              {tasksForSelectedDay.length > 0 ? (
                  tasksForSelectedDay.map((task) => (
                      <div
                          key={task.id}
                          className="group flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50"
                      >
                          <CheckboxPrimitive.Root
                              id={`task-${task.id}`}
                              checked={task.status === 'completed'}
                              onCheckedChange={() => handleToggleTask(task)}
                              className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              aria-label={`Mark task as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
                          >
                            <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
                                <Check className="h-4 w-4" />
                            </CheckboxPrimitive.Indicator>
                          </CheckboxPrimitive.Root>
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
                  <p className="text-center text-muted-foreground pt-12">
                      No tasks for this day.
                  </p>
              )}
          </div>
      </CardContent>
    </Card>
  );
}

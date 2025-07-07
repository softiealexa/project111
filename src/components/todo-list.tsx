
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Priority = "High" | "Medium" | "Low";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  dueDate: Date | undefined;
  priority: Priority;
};

const priorityVariant: Record<Priority, "destructive" | "secondary" | "outline"> = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Prepare for Physics test', completed: false, dueDate: new Date(), priority: 'High' },
    { id: '2', text: 'Finish Maths homework', completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'Medium' },
    { id: '3', text: 'Read Chemistry chapter 5', completed: true, dueDate: undefined, priority: 'Low' },
  ]);
  const [inputText, setInputText] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>("Medium");
  const { toast } = useToast();

  const handleAddTask = () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Task cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
      completed: false,
      dueDate,
      priority,
    };

    setTasks([newTask, ...tasks]);
    setInputText("");
    setDueDate(undefined);
    setPriority("Medium");
    toast({
        title: 'Task Added',
        description: `"${newTask.text}" has been added to your list.`,
    });
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
        title: 'Task Removed',
        description: `The task has been removed from your list.`,
        variant: "destructive"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
        <CardDescription>
          Organize your tasks, set deadlines, and track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-grow"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTask} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
            {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50">
                    <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        aria-label="Mark task as complete"
                    />
                    <Label
                        htmlFor={`task-${task.id}`}
                        className={cn("flex-grow cursor-pointer", task.completed && "line-through text-muted-foreground")}
                    >
                        {task.text}
                    </Label>
                    {task.dueDate && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                            {format(task.dueDate, "MMM d")}
                        </span>
                    )}
                    <Badge variant={priorityVariant[task.priority]} className="text-xs">{task.priority}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )) : (
                <p className="text-center text-muted-foreground py-4">Your to-do list is empty. Add a task to get started!</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

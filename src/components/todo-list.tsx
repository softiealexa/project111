
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, GripVertical } from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useData } from "@/contexts/data-context";
import type { Todo, Priority } from "@/lib/types";
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


const priorityVariant: Record<Priority, "destructive" | "secondary" | "outline"> = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

function SortableTaskItem({ 
  task, 
  toggleTaskCompletion, 
  deleteTask 
}: { 
  task: Todo, 
  toggleTaskCompletion: (id: string) => void, 
  deleteTask: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50",
        isDragging && "shadow-lg z-10 bg-card ring-1 ring-primary"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab touch-none p-1 -ml-1 text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed ? 'checked' : 'unchecked'}
        onCheckedChange={() => toggleTaskCompletion(task.id)}
        aria-label={`Mark task as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <Label
        htmlFor={`task-${task.id}`}
        className={cn("flex-grow cursor-pointer", task.completed && "line-through text-muted-foreground")}
      >
        {task.text}
      </Label>
      {dueDate && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {format(dueDate, "MMM d")}
        </span>
      )}
      <Badge variant={priorityVariant[task.priority]} className="text-xs">{task.priority}</Badge>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task.id)} aria-label={`Delete task: ${task.text}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function TodoList() {
  const { activeProfile, addTodo, updateTodo, deleteTodo: deleteTodoFromContext, setTodos } = useData();
  const { toast } = useToast();
  
  const tasks = activeProfile?.todos || [];

  const [inputText, setInputText] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>("Medium");


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setTodos(arrayMove(tasks, oldIndex, newIndex));
      }
    }
  };

  const handleAddTask = () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Task cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    addTodo(inputText.trim(), dueDate, priority);

    setInputText("");
    setDueDate(undefined);
    setPriority("Medium");
    toast({
        title: 'Task Added',
        description: `"${inputText.trim()}" has been added to your list.`,
    });
  };

  const toggleTaskCompletion = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        updateTodo({ ...task, completed: !task.completed });
    }
  };

  const deleteTask = (id: string) => {
    deleteTodoFromContext(id);
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    toggleTaskCompletion={toggleTaskCompletion}
                    deleteTask={deleteTask}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Your to-do list is empty. Add a task to get started!
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

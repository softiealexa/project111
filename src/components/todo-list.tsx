
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
  
  const tasks: Todo[] = []; // This component is now deprecated, return empty array.

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
    // This logic is deprecated
  };

  const handleAddTask = () => {
    // This logic is deprecated
  };

  const toggleTaskCompletion = (id: string) => {
    // This logic is deprecated
  };

  const deleteTask = (id: string) => {
    // This logic is deprecated
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legacy To-Do List</CardTitle>
        <CardDescription>
          This component has been replaced by the new Smart To-Do List. Please use the new tool.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-4">
          This feature is no longer active.
        </p>
      </CardContent>
    </Card>
  );
}

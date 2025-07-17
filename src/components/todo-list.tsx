
"use client";

import { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
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
import type { SimpleTodo, Priority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, isToday, startOfToday } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const priorityColors: Record<Priority, string> = {
  High: 'bg-red-500/10 text-red-500 border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const deadlineColors = {
    overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
    approaching: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    default: '',
};

function SortableTodoItem({ todo, onToggle, onDelete }: { todo: SimpleTodo; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void; }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const deadlineStatus = useMemo(() => {
    if (!todo.deadline || todo.completed) return 'default';
    const deadlineDate = new Date(todo.deadline);
    const today = startOfToday();
    if (isBefore(deadlineDate, today)) return 'overdue';
    if (isToday(deadlineDate)) return 'approaching';
    return 'default';
  }, [todo.deadline, todo.completed]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("group flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50", isDragging && "shadow-lg bg-card")}>
      <span {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground p-1">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 4.625C5.5 4.34886 5.27614 4.125 5 4.125C4.72386 4.125 4.5 4.34886 4.5 4.625V10.375C4.5 10.6511 4.72386 10.875 5 10.875C5.27614 10.875 5.5 10.6511 5.5 10.375V4.625ZM10.5 4.625C10.5 4.34886 10.2761 4.125 10 4.125C9.72386 4.125 9.5 4.34886 9.5 4.625V10.375C9.5 10.6511 9.72386 10.875 10 10.875C10.2761 10.875 10.5 10.6511 10.5 10.375V4.625Z" fill="currentColor"></path></svg>
      </span>
      <Checkbox
        id={`task-${todo.id}`}
        checked={todo.completed ? 'checked' : 'unchecked'}
        onCheckedChange={(status) => onToggle(todo.id, status === 'checked' || status === 'checked-red')}
        aria-label={`Mark task as ${todo.completed ? 'incomplete' : 'complete'}`}
        className="h-5 w-5 rounded-full"
      />
      <Label htmlFor={`task-${todo.id}`} className={cn("flex-grow cursor-pointer", todo.completed && "line-through text-muted-foreground")}>
        {todo.text}
      </Label>
      
      <div className="flex items-center gap-3 ml-auto">
        {todo.deadline && (
            <Badge variant="outline" className={cn("text-xs", deadlineColors[deadlineStatus])}>{format(new Date(todo.deadline), 'MMM dd')}</Badge>
        )}
        {todo.priority && (
            <Badge variant="outline" className={cn("text-xs", priorityColors[todo.priority])}>{todo.priority}</Badge>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(todo.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SimpleTodoList() {
  const { activeProfile, addSimpleTodo, updateSimpleTodo, deleteSimpleTodo, setSimpleTodos } = useData();
  const { toast } = useToast();

  const allTasks = useMemo(() => activeProfile?.simpleTodos || [], [activeProfile]);
  
  const [inputText, setInputText] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>('Medium');

  const sortedTasks = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return b.createdAt - a.createdAt;
    });
  }, [allTasks]);

  const handleAddTask = () => {
    const text = inputText.trim();
    if (!text) {
      toast({ title: "Error", description: "Task cannot be empty.", variant: "destructive" });
      return;
    }
    
    addSimpleTodo(text, priority, deadline?.getTime());
    
    setInputText("");
    setDeadline(undefined);
    setPriority('Medium');
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      updateSimpleTodo({ ...task, completed });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteSimpleTodo(taskId);
    toast({ title: 'Task Removed', variant: "destructive" });
  };

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
      const oldIndex = allTasks.findIndex(task => task.id === active.id);
      const newIndex = allTasks.findIndex(task => task.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setSimpleTodos(arrayMove(allTasks, oldIndex, newIndex));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simple To-Do List</CardTitle>
        <CardDescription>
          A straightforward list for your tasks. Drag to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input
            id="simple-task-input"
            placeholder="Add a new task..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 min-w-[200px]"
          />
          <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[120px] justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "MMM d") : <span>Deadline</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    disabled={{ before: new Date() }}
                />
            </PopoverContent>
          </Popover>
          <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
            <SelectTrigger className="w-[120px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add</span>
          </Button>
        </div>

        <div className="space-y-2 h-[350px] overflow-y-auto pr-2 border-t pt-4">
          {sortedTasks.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {sortedTasks.map(task => (
                  <SortableTodoItem
                    key={task.id}
                    todo={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-center text-muted-foreground pt-12">
              No tasks yet. Add one above!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


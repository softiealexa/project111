
"use client";

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
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
import type { SimpleTodo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function SortableTodoItem({ todo, onToggle, onEdit, onDelete }: { todo: SimpleTodo; onToggle: (id: string, completed: boolean) => void; onEdit: (task: SimpleTodo) => void; onDelete: (id: string) => void; }) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("group flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50", isDragging && "shadow-lg bg-card")}>
      <span {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground p-1">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 4.625C5.5 4.34886 5.27614 4.125 5 4.125C4.72386 4.125 4.5 4.34886 4.5 4.625V10.375C4.5 10.6511 4.72386 10.875 5 10.875C5.27614 10.875 5.5 10.6511 5.5 10.375V4.625ZM10.5 4.625C10.5 4.34886 10.2761 4.125 10 4.125C9.72386 4.125 9.5 4.34886 9.5 4.625V10.375C9.5 10.6511 9.72386 10.875 10 10.875C10.2761 10.875 10.5 10.6511 10.5 10.375V4.625Z" fill="currentColor"></path></svg>
      </span>
      <Checkbox
        id={`task-${todo.id}`}
        checked={todo.completed ? 'checked' : 'unchecked'}
        onCheckedChange={(status) => onToggle(todo.id, status === 'checked')}
        aria-label={`Mark task as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <Label htmlFor={`task-${todo.id}`} className={cn("flex-grow cursor-pointer", todo.completed && "line-through text-muted-foreground")}>
        {todo.text}
      </Label>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(todo)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(todo.id)}>
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
  const [editingTask, setEditingTask] = useState<SimpleTodo | null>(null);

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

    if (editingTask) {
      updateSimpleTodo({ ...editingTask, text });
      toast({ title: 'Task Updated', description: `"${text}" has been updated.` });
      setEditingTask(null);
    } else {
      addSimpleTodo(text);
      toast({ title: 'Task Added', description: `"${text}" has been added.` });
    }
    setInputText("");
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

  const handleEdit = (task: SimpleTodo) => {
    setEditingTask(task);
    setInputText(task.text);
    document.getElementById('simple-task-input')?.focus();
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
        <div className="flex gap-2">
          <Input
            id="simple-task-input"
            placeholder="Add a new task..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1"
          />
          <Button onClick={handleAddTask}>
            {editingTask ? 'Save' : <Plus className="h-4 w-4 md:mr-2" />}
            <span className="hidden md:inline">{editingTask ? 'Save Task' : 'Add Task'}</span>
          </Button>
        </div>

        <div className="space-y-2 h-[350px] overflow-y-auto pr-2">
          {sortedTasks.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {sortedTasks.map(task => (
                  <SortableTodoItem
                    key={task.id}
                    todo={task}
                    onToggle={handleToggleTask}
                    onEdit={handleEdit}
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

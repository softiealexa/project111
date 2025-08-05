
"use client";

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import type { ExamCountdown } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, Calendar as CalendarIcon, Target } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
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
import { cn } from '@/lib/utils';

function CountdownDisplay({ date }: { date: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const targetDate = new Date(date);
  const totalDays = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const minutes = differenceInMinutes(targetDate, now) % 60;
  const seconds = differenceInSeconds(targetDate, now) % 60;

  if (now > targetDate) {
    return <div className="text-center"><p className="text-lg font-semibold text-muted-foreground">Event has passed</p></div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div>
        <p className="text-3xl font-bold">{totalDays}</p>
        <p className="text-xs text-muted-foreground">Days</p>
      </div>
      <div>
        <p className="text-3xl font-bold">{hours}</p>
        <p className="text-xs text-muted-foreground">Hours</p>
      </div>
      <div>
        <p className="text-3xl font-bold">{minutes}</p>
        <p className="text-xs text-muted-foreground">Minutes</p>
      </div>
      <div>
        <p className="text-3xl font-bold">{seconds}</p>
        <p className="text-xs text-muted-foreground">Seconds</p>
      </div>
    </div>
  );
}

function SortableCountdownItem({ countdown, onEdit, onDelete }: { countdown: ExamCountdown, onEdit: (countdown: ExamCountdown) => void, onDelete: (countdown: ExamCountdown) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: countdown.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className={cn("transition-colors hover:border-primary/50", isDragging && "shadow-lg z-10 bg-card ring-1 ring-primary")}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                    <button {...listeners} aria-label="Drag to reorder countdown" className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{countdown.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{format(new Date(countdown.date), 'PPP')}</p>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(countdown)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(countdown)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <CountdownDisplay date={countdown.date} />
                </CardContent>
            </Card>
        </div>
    );
}


export default function ExamCountdown() {
  const { activeProfile, addExamCountdown, updateExamCountdown, deleteExamCountdown, setExamCountdowns } = useData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<ExamCountdown | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [error, setError] = useState('');

  const countdowns = activeProfile?.examCountdowns || [];

  const handleOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      setIsEditing(null);
      setTitle('');
      setDate(undefined);
      setError('');
    }
  }

  const handleSave = () => {
    if (!title.trim() || !date) {
      setError('Title and date are required.');
      return;
    }

    if (isEditing) {
      updateExamCountdown({ ...isEditing, title, date: date.getTime() });
    } else {
      addExamCountdown(title, date);
    }

    handleOpenChange(false);
  };

  const handleOpenDialog = (countdown: ExamCountdown | null = null) => {
    if (countdown) {
      setIsEditing(countdown);
      setTitle(countdown.title);
      setDate(new Date(countdown.date));
    } else {
      setIsEditing(null);
      setTitle('');
      setDate(undefined);
    }
    setError('');
    setDialogOpen(true);
  };

  const handleDelete = (countdown: ExamCountdown) => {
    deleteExamCountdown(countdown.id);
    toast({
      title: 'Countdown Deleted',
      description: `"${countdown.title}" has been deleted.`,
      variant: 'destructive',
    });
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
      const oldIndex = countdowns.findIndex((cd) => cd.id === active.id);
      const newIndex = countdowns.findIndex((cd) => cd.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setExamCountdowns(arrayMove(countdowns, oldIndex, newIndex));
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Exam Countdown</CardTitle>
            <CardDescription>
              Keep track of your upcoming deadlines.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Countdown
          </Button>
        </CardHeader>
        <CardContent>
          {countdowns.length > 0 ? (
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={countdowns.map(cd => cd.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countdowns.map((countdown) => (
                    <SortableCountdownItem
                      key={countdown.id}
                      countdown={countdown}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-center">
              <Target className="h-10 w-10 text-muted-foreground mb-4"/>
              <h3 className="text-lg font-medium text-muted-foreground">No countdowns yet</h3>
              <p className="text-sm text-muted-foreground">Click "Add Countdown" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Countdown' : 'Add New Countdown'}</DialogTitle>
            <DialogDescription>
              Enter a title and select a date for your event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="countdown-title">Title</Label>
              <Input
                id="countdown-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Final Physics Exam"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="countdown-date">Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="countdown-date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={{ before: new Date() }}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Countdown</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

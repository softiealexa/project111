
"use client";

import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { useData } from '@/contexts/data-context';

export default function StudyPlanner() {
  const { activeProfile, updatePlannerNote } = useData();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [currentNote, setCurrentNote] = useState('');
  const { toast } = useToast();

  const notes = useMemo(() => activeProfile?.plannerNotes || {}, [activeProfile?.plannerNotes]);

  const currentWeek = useMemo(() => {
    const today = new Date();
    // Assuming week starts on Sunday for this calculation, can be adjusted.
    return {
      from: startOfWeek(today), 
      to: endOfWeek(today),
    };
  }, []);

  useEffect(() => {
    if (selectedDay) {
      const dateKey = format(selectedDay, 'yyyy-MM-dd');
      setCurrentNote(notes[dateKey] || '');
    } else {
      setCurrentNote('');
    }
  }, [selectedDay, notes]);

  const handleSaveNote = () => {
    if (!selectedDay) {
      toast({
        title: 'No day selected',
        description: 'Please select a day to save a note.',
        variant: 'destructive',
      });
      return;
    }
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const trimmedNote = currentNote.trim();

    // Only update if the note has actually changed
    if ((notes[dateKey] || '') === trimmedNote) {
      return;
    }

    updatePlannerNote(dateKey, trimmedNote);
    toast({
      title: 'Note Saved',
      description: `Your note for ${format(selectedDay, 'PPP')} has been updated.`,
    });
  };
  
  // Custom modifiers for react-day-picker
  const modifiers = {
    currentWeek: (date: Date) => isWithinInterval(date, currentWeek),
    hasNote: (date: Date) => !!notes[format(date, 'yyyy-MM-dd')],
  };

  const modifiersClassNames = {
    currentWeek: 'current-week',
    hasNote: 'has-note',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini Study Planner</CardTitle>
        <CardDescription>Plan your month, week by week. Notes are saved automatically.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
             <style>{`
                .current-week:not([aria-selected]) { 
                    background-color: hsl(var(--primary) / 0.1);
                    color: hsl(var(--foreground));
                }
                .rdp-day_today:not([aria-selected]) {
                    border-color: hsl(var(--primary));
                }
                .has-note:not([aria-selected]):after {
                    content: '';
                    position: absolute;
                    bottom: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background-color: hsl(var(--primary));
                }
            `}</style>
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border p-0"
            classNames={{
                month: 'space-y-4 p-3',
                caption_label: 'text-base font-medium',
                head_row: "w-full flex",
                row: "w-full flex mt-2",
            }}
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planner-note" className="flex items-center gap-2">
              Notes for <Badge variant="secondary">{selectedDay ? format(selectedDay, 'PPP') : '...'}</Badge>
            </Label>
            <Textarea
              id="planner-note"
              placeholder={selectedDay ? "Add your study goals for the day..." : "Select a day to add notes."}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="min-h-[190px] text-base"
              disabled={!selectedDay}
            />
          </div>
          <Button onClick={handleSaveNote} disabled={!selectedDay}>Save Note</Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "./ui/label";

interface LectureNotesDialogProps {
  lectureNum: number;
  currentNote: string;
  onSave: (note: string) => void;
  children: React.ReactNode;
}

export function LectureNotesDialog({ lectureNum, currentNote, onSave, children }: LectureNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    if (open) {
      setNote(currentNote);
    }
  }, [open, currentNote]);

  const handleSave = () => {
    onSave(note);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Notes for Lecture {lectureNum}</DialogTitle>
          <DialogDescription>
            Your notes will be saved when you click the save button.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="lecture-notes" className="sr-only">Lecture Notes</Label>
          <Textarea
            id="lecture-notes"
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Type your notes here..."
            className="min-h-[250px] text-base"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Notes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

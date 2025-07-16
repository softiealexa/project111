
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
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";

interface LectureDetailsDialogProps {
  lectureNum: number;
  currentNote: string;
  currentLectureName: string;
  onSave: (note: string, lectureName: string) => void;
  children: React.ReactNode;
}

export function LectureNotesDialog({ lectureNum, currentNote, currentLectureName, onSave, children }: LectureDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(currentNote);
  const [lectureName, setLectureName] = useState(currentLectureName);

  useEffect(() => {
    if (open) {
      setNote(currentNote);
      setLectureName(currentLectureName);
    }
  }, [open, currentNote, currentLectureName]);

  const handleSave = () => {
    onSave(note, lectureName);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
          {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
            <DialogTitle className="sr-only">Edit Lecture Details</DialogTitle>
            <DialogDescription className="sr-only">
              Add or edit the custom name and notes for this lecture.
            </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="grid gap-2">
            <Label htmlFor="lecture-name">Lecture Name (Optional)</Label>
            <Input
              id="lecture-name"
              value={lectureName}
              onChange={(e) => setLectureName(e.target.value)}
              placeholder={`Custom name for Lecture-${lectureNum}`}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lecture-notes">Lecture Notes</Label>
            <Textarea
              id="lecture-notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type your notes here..."
              className="min-h-[150px] text-base"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

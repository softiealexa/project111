"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import type { Chapter } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AddChapterDialogProps {
  onAddChapter: (newChapter: Chapter) => void;
}

export function AddChapterDialog({ onAddChapter }: AddChapterDialogProps) {
  const [open, setOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [lectureCount, setLectureCount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const lectures = parseInt(lectureCount, 10);
    if (!chapterName.trim()) {
        setError("Chapter name is required.");
        return;
    }
    if (isNaN(lectures) || lectures < 1 || lectures > 25) {
        setError("Please enter a valid number of lectures (between 1 and 25).");
        return;
    }

    onAddChapter({ name: chapterName, lectureCount: lectures });
    setChapterName("");
    setLectureCount("");
    setError("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add Chapter</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Chapter</DialogTitle>
          <DialogDescription>
            Enter the details for the new chapter. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Chapter Name
            </Label>
            <Input
              id="name"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="e.g. Conic Sections"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lectures">
              Lectures
            </Label>
            <Input
              id="lectures"
              type="number"
              value={lectureCount}
              onChange={(e) => setLectureCount(e.target.value)}
              placeholder="1-25"
              min="1"
              max="25"
            />
          </div>
          {error && <p className="pt-2 text-sm text-center text-destructive">{error}</p>}
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Save Chapter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { FolderPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AddSubjectDialogProps {
  onAddSubject: (subjectName: string) => void;
  existingSubjects: string[];
}

export function AddSubjectDialog({ onAddSubject, existingSubjects }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmedName = subjectName.trim();
    if (!trimmedName) {
      setError("Subject name is required.");
      return;
    }
    if (existingSubjects.some(s => s.toLowerCase() === trimmedName.toLowerCase())) {
        setError("A subject with this name already exists in this profile.");
        return;
    }

    onAddSubject(trimmedName);
    setSubjectName("");
    setError("");
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setSubjectName("");
        setError("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
       <Tooltip>
        <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                <FolderPlus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add Subject</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Enter a name for the new subject. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Subject Name
            </Label>
            <Input
              id="name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Biology"
            />
          </div>
          {error && <p className="col-span-4 text-sm text-destructive text-center pt-2">{error}</p>}
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Save Subject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

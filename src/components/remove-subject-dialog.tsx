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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@/lib/types";
import { FolderMinus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RemoveSubjectDialogProps {
  subjects: Subject[];
  onConfirm: (subjectName: string) => void;
}

export function RemoveSubjectDialog({ subjects, onConfirm }: RemoveSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const selectedSubject = subjects.find(c => c.name === selectedSubjectName);

  const handleRemove = () => {
    if (selectedSubject && confirmationText === selectedSubject.name) {
      onConfirm(selectedSubject.name);
      toast({
        title: "Subject Removed",
        description: `"${selectedSubject.name}" has been successfully removed.`,
      });
      setOpen(false);
      setSelectedSubjectName("");
      setConfirmationText("");
    } else {
      toast({
        title: "Error",
        description: "The subject name you entered does not match.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setSelectedSubjectName("");
        setConfirmationText("");
    }
  }

  const handleSelectChange = (value: string) => {
      setSelectedSubjectName(value);
      setConfirmationText("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/90 hover:text-destructive-foreground">
                    <FolderMinus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
            <p>Remove Subject</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove a Subject</DialogTitle>
          <DialogDescription>
            Select a subject to remove. This action cannot be undone and will remove all its chapters.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <div className="grid gap-2">
                <Label htmlFor="subject-select">Subject</Label>
                <Select value={selectedSubjectName} onValueChange={handleSelectChange}>
                    <SelectTrigger id="subject-select">
                        <SelectValue placeholder="Select a subject to remove" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map(subject => (
                            <SelectItem key={subject.name} value={subject.name}>
                                {subject.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedSubject && (
                <div className="grid gap-2 pt-4">
                    <Label htmlFor="confirmation">
                        To confirm, type <span className="font-bold text-foreground">{selectedSubject.name}</span> below.
                    </Label>
                    <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Type subject name to confirm"
                        autoComplete="off"
                    />
                </div>
            )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleRemove}
            disabled={!selectedSubject || confirmationText !== selectedSubject.name}
            variant="destructive"
          >
            Remove Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

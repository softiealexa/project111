
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
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@/lib/types";

interface RemoveSubjectDialogProps {
  subject: Subject;
  onConfirm: () => void;
  children: React.ReactNode;
}

export function RemoveSubjectDialog({ subject, onConfirm, children }: RemoveSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirmationText === subject.name) {
      onConfirm();
      toast({
        title: "Subject Removed",
        description: `"${subject.name}" has been successfully removed.`,
      });
      setOpen(false);
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
        setConfirmationText("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Subject: {subject.name}</DialogTitle>
          <DialogDescription>
            This action cannot be undone and will remove the subject and all its chapters.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <div className="grid gap-2 pt-2">
                <Label htmlFor="confirmation">
                    To confirm, type <span className="font-bold text-foreground">{subject.name}</span> below.
                </Label>
                <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type subject name to confirm"
                    autoComplete="off"
                />
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleRemove}
            disabled={confirmationText !== subject.name}
            variant="destructive"
          >
            Remove Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

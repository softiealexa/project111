
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
import type { Chapter } from "@/lib/types";

interface RemoveChapterDialogProps {
  chapter: Chapter;
  onConfirm: () => void;
  children: React.ReactNode;
}

export function RemoveChapterDialog({ chapter, onConfirm, children }: RemoveChapterDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirmationText === chapter.name) {
      onConfirm();
      toast({
        title: "Chapter Removed",
        description: `"${chapter.name}" has been successfully removed.`,
      });
      setOpen(false);
      setConfirmationText("");
    } else {
      toast({
        title: "Error",
        description: "The chapter name you entered does not match.",
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
          <DialogTitle>Remove Chapter: {chapter.name}</DialogTitle>
          <DialogDescription>
            This action will remove the chapter and all its associated progress. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <div className="grid gap-2 pt-2">
                <Label htmlFor="confirmation">
                    To confirm, type <span className="font-bold text-foreground">{chapter.name}</span> below.
                </Label>
                <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type chapter name to confirm"
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
            disabled={confirmationText !== chapter.name}
            variant="destructive"
          >
            Remove Chapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

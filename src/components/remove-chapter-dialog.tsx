"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the chapter 
            <span className="font-bold text-foreground"> {chapter.name}</span> and all its associated progress.
            <br /><br />
            To confirm, please type the chapter name below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-2">
            <Label htmlFor="confirmation" className="sr-only">
              Chapter Name
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={chapter.name}
              autoComplete="off"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={confirmationText !== chapter.name}
          >
            Remove Chapter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

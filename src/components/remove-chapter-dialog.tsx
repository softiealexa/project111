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
import type { Chapter } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RemoveChapterDialogProps {
  chapters: Chapter[];
  onConfirm: (chapterName: string) => void;
}

export function RemoveChapterDialog({ chapters, onConfirm }: RemoveChapterDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedChapterName, setSelectedChapterName] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const selectedChapter = chapters.find(c => c.name === selectedChapterName);

  const handleRemove = () => {
    if (selectedChapter && confirmationText === selectedChapter.name) {
      onConfirm(selectedChapter.name);
      toast({
        title: "Chapter Removed",
        description: `"${selectedChapter.name}" has been successfully removed.`,
      });
      setOpen(false);
      setSelectedChapterName("");
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
        setSelectedChapterName("");
        setConfirmationText("");
    }
  }

  const handleSelectChange = (value: string) => {
      setSelectedChapterName(value);
      setConfirmationText("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/90 hover:text-destructive-foreground">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
            <p>Remove Chapter</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove a Chapter</DialogTitle>
          <DialogDescription>
            Select a chapter to remove. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <div className="grid gap-2">
                <Label htmlFor="chapter-select">Chapter</Label>
                <Select value={selectedChapterName} onValueChange={handleSelectChange}>
                    <SelectTrigger id="chapter-select">
                        <SelectValue placeholder="Select a chapter to remove" />
                    </SelectTrigger>
                    <SelectContent>
                        {chapters.map(chapter => (
                            <SelectItem key={chapter.name} value={chapter.name}>
                                {chapter.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedChapter && (
                <div className="grid gap-2 pt-4">
                    <Label htmlFor="confirmation">
                        To confirm, type <span className="font-bold text-foreground">{selectedChapter.name}</span> below.
                    </Label>
                    <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Type chapter name to confirm"
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
            disabled={!selectedChapter || confirmationText !== selectedChapter.name}
            variant="destructive"
          >
            Remove Chapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

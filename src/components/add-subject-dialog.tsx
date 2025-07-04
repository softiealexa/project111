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
import { iconMap, iconNames } from "@/lib/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface AddSubjectDialogProps {
  onAddSubject: (subjectName: string, iconName: string) => void;
  existingSubjects: string[];
  children: React.ReactNode;
}

export function AddSubjectDialog({ onAddSubject, existingSubjects, children }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Book");
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

    onAddSubject(trimmedName, selectedIcon);
    setSubjectName("");
    setSelectedIcon("Book");
    setError("");
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setSubjectName("");
        setSelectedIcon("Book");
        setError("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Enter a name and choose an icon for the new subject.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Subject Name
            </Label>
            <Input
              id="name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Biology"
            />
          </div>
           <div className="grid gap-2">
            <Label>Icon</Label>
            <RadioGroup
                value={selectedIcon}
                onValueChange={setSelectedIcon}
                className="grid grid-cols-4 gap-2 pt-1"
            >
                {iconNames.map((name) => {
                    const IconComponent = iconMap[name];
                    return (
                        <div key={name}>
                            <RadioGroupItem value={name} id={name} className="sr-only" />
                            <Label 
                                htmlFor={name} 
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 rounded-md p-2 border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground cursor-pointer aspect-square",
                                    selectedIcon === name && "border-primary"
                                )}
                            >
                                <IconComponent className="h-6 w-6" />
                                <span className="text-xs font-normal">{name}</span>
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
          </div>
          {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
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

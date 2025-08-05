
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RenameDialogProps {
  itemType: string;
  currentName: string;
  onRename: (newName: string) => void;
  existingNames: string[];
  children: React.ReactNode;
}

export function RenameDialog({ itemType, currentName, onRename, existingNames, children }: RenameDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setNewName("");
    }
  }

  const handleSubmit = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        toast({ title: "Error", description: `${itemType} name cannot be empty.`, variant: "destructive"});
        return;
    }
    if (trimmedName.toLowerCase() !== currentName.toLowerCase() && existingNames.some(name => name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Error", description: `A ${itemType.toLowerCase()} with this name already exists.`, variant: "destructive"});
        return;
    }
    
    onRename(trimmedName);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename {itemType}</DialogTitle>
          <DialogDescription>
            Enter a new name for '{currentName}'.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">
              New {itemType} Name
            </Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

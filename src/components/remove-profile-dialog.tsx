
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

interface RemoveProfileDialogProps {
  profileName: string;
  onConfirm: () => void;
  children: React.ReactNode;
}

export function RemoveProfileDialog({ profileName, onConfirm, children }: RemoveProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirmationText === profileName) {
      onConfirm();
      setOpen(false);
      setConfirmationText("");
    } else {
      toast({
        title: "Error",
        description: "The profile name you entered does not match.",
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
          <DialogTitle>Remove Profile: {profileName}</DialogTitle>
          <DialogDescription>
            This action cannot be undone and will remove the profile and all its associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <div className="grid gap-2 pt-2">
                <Label htmlFor="confirmation">
                    To confirm, type <span className="font-bold text-foreground">{profileName}</span> below.
                </Label>
                <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type profile name to confirm"
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
            disabled={confirmationText !== profileName}
            variant="destructive"
          >
            Remove Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

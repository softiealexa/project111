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
import { useData } from "@/contexts/data-context";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function AddProfileDialog() {
  const { addProfile, profiles } = useData();
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setError("Profile name is required.");
      return;
    }
    if (profiles.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError("A profile with this name already exists.");
        return;
    }

    addProfile(trimmedName);
    setProfileName("");
    setError("");
    setOpen(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setProfileName("");
        setError("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add New Profile</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Profile</DialogTitle>
          <DialogDescription>
            Enter a name for your new course profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Profile Name
            </Label>
            <Input
              id="name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Course-2, JEE Prep"
            />
          </div>
          {error && <p className="col-span-4 text-sm text-destructive text-center pt-2">{error}</p>}
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Save Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

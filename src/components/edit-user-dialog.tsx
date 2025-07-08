
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@/lib/types";
import { LoaderCircle } from "lucide-react";

interface EditUserDialogProps {
  user: AppUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, googleEmail: string) => Promise<void>;
}

export function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const { toast } = useToast();
  const [googleEmail, setGoogleEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setGoogleEmail(user.googleEmail || "");
    }
  }, [user]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setError("");
        setIsLoading(false);
      }, 200);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    const trimmedEmail = googleEmail.trim();

    if (trimmedEmail && !trimmedEmail.toLowerCase().endsWith('@gmail.com')) {
        setError("Please enter a valid Gmail address.");
        return;
    }

    setError("");
    setIsLoading(true);
    try {
        await onSave(user.uid, trimmedEmail);
        toast({
            title: "Success",
            description: `User ${user.username}'s Google email has been updated.`,
        });
        handleOpenChange(false);
    } catch (err: any) {
        toast({
            title: "Update Failed",
            description: err.message || "Could not update the user.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>
            Modify the user's linked Google email address.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="google-email">Google Email (Optional)</Label>
            <Input
              id="google-email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="user@gmail.com"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

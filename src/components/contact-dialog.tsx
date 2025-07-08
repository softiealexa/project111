
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
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback } from "@/lib/feedback";
import { LoaderCircle } from "lucide-react";
import { useData } from "@/contexts/data-context";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = 'Bug Report' | 'Feature Request' | 'Other';

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const { toast } = useToast();
  const { user } = useData();
  const [type, setType] = useState<FeedbackType>("Bug Report");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
        // Reset state on close
        setTimeout(() => {
            setType("Bug Report");
            setMessage("");
            setError("");
            setIsLoading(false);
        }, 200); // Delay to allow animation to finish
    }
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
        setError("Message cannot be empty.");
        return;
    }

    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to submit feedback.",
            variant: "destructive",
        });
        return;
    }

    setError("");
    setIsLoading(true);

    try {
        await submitFeedback({
            type,
            message,
            userId: user.uid,
            userEmail: user.email || 'N/A',
        });

        toast({
            title: "Feedback Sent!",
            description: "Thank you for your message. We appreciate your input.",
        });
        handleOpenChange(false);
    } catch (err: any) {
         toast({
            title: "Submission Failed",
            description: err.message || "Could not send your feedback. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact Developer</DialogTitle>
          <DialogDescription>
            Found a bug or have a great idea? Let us know!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback-type">Type of Feedback</Label>
            <Select value={type} onValueChange={(value: FeedbackType) => setType(value)}>
                <SelectTrigger id="feedback-type">
                    <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Bug Report">Bug Report</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe the issue or your suggestion in detail..."
              className="min-h-[150px] text-base"
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

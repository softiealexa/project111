
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { Topic } from '@/lib/types';

interface SyllabusEditDialogProps {
  subjectName: string;
  chapterName: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopics: Topic[];
  onSave: (topics: Topic[]) => void;
}

export function SyllabusEditDialog({ chapterName, children, open, onOpenChange, initialTopics, onSave }: SyllabusEditDialogProps) {
  const [syllabusText, setSyllabusText] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (open) {
        const initialSyllabus = initialTopics || [];
        setTopics(initialSyllabus);
        const text = initialSyllabus.map(t => t.name).join(', ');
        setSyllabusText(text);
    }
  }, [open, initialTopics]);

  const handleProcessText = () => {
    const newTopics = syllabusText
      .split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0)
      .map(topicName => {
        // Preserve checked state if topic already exists
        const existingTopic = topics.find(t => t.name === topicName);
        return { name: topicName, completed: existingTopic?.completed || false };
      });
    setTopics(newTopics);
  };

  const handleToggleTopic = (topicName: string) => {
    setTopics(currentTopics =>
      currentTopics.map(topic =>
        topic.name === topicName ? { ...topic, completed: !topic.completed } : topic
      )
    );
  };

  const handleSave = () => {
    onSave(topics);
    onOpenChange(false);
  };

  const completedCount = useMemo(() => topics.filter(t => t.completed).length, [topics]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Syllabus for: {chapterName}</DialogTitle>
          <DialogDescription>
            Paste your comma-separated topics below and process them into a checklist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="syllabus-input">Syllabus Topics</Label>
            <Textarea
              id="syllabus-input"
              placeholder="e.g., Topic 1, Another Topic, Final Concept"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="min-h-[100px] text-base"
            />
          </div>
          <Button onClick={handleProcessText}>Process Text</Button>
          
          <Separator />

          <div className="space-y-2">
             <div className="flex justify-between items-center px-1">
                 <Label>Generated Checklist</Label>
                 <span className="text-sm font-medium text-muted-foreground">
                    {completedCount} / {topics.length} Completed
                 </span>
            </div>
            <ScrollArea className="h-60 w-full rounded-md border p-2">
                {topics.length > 0 ? (
                    <div className="space-y-2">
                        {topics.map((topic, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    id={`topic-${index}`}
                                    checked={topic.completed}
                                    onCheckedChange={() => handleToggleTopic(topic.name)}
                                />
                                <Label
                                    htmlFor={`topic-${index}`}
                                    className={`flex-1 cursor-pointer ${topic.completed ? 'line-through text-muted-foreground' : ''}`}
                                >
                                    {topic.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">No topics processed yet.</p>
                    </div>
                )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

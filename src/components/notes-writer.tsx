"use client";

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function NotesWriter() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    // For now, we'll just show a toast to simulate saving.
    if (!title.trim() && !content.trim()) {
        toast({
            title: 'Empty Note',
            description: 'Please add a title or some content to your note.',
            variant: 'destructive',
        });
        return;
    }

    toast({
        title: 'Note Saved (Simulated)',
        description: `Your note "${title || 'Untitled'}" has been saved. Note persistence is not yet implemented.`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="grid gap-2">
            <Label htmlFor="note-title">Title</Label>
            <Input 
                id="note-title"
                placeholder="Your note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
                id="note-content"
                placeholder="Type your notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] text-base"
            />
        </div>
      <Button onClick={handleSave} className="self-start">
        Save Note
      </Button>
    </div>
  );
}

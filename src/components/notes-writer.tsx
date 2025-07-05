"use client";

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { summarizeNote } from '@/ai/flows/summarize-note-flow';
import { Sparkles } from 'lucide-react';

export default function NotesWriter() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
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

  const handleSummarize = async () => {
    if (!content.trim()) {
        toast({
            title: 'Empty Content',
            description: 'Please write some content before summarizing.',
            variant: 'destructive'
        });
        return;
    }
    setIsSummarizing(true);
    setSummary('');
    try {
        const result = await summarizeNote({ title, content });
        setSummary(result.summary);
    } catch (error) {
        console.error("Summarization error:", error);
        toast({
            title: 'Summarization Failed',
            description: 'Could not generate summary. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSummarizing(false);
    }
  };


  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input 
                        id="note-title"
                        placeholder="Your note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSummarizing}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="note-content">Content</Label>
                    <Textarea
                        id="note-content"
                        placeholder="Type your notes here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[96px] text-base"
                        disabled={isSummarizing}
                    />
                </div>
                 {summary && (
                    <div className="grid gap-2">
                        <Label htmlFor="note-summary">AI Summary</Label>
                        <Textarea
                            id="note-summary"
                            value={summary}
                            readOnly
                            className="min-h-[96px] text-base bg-muted/50"
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSummarizing}>
                        Save Note
                    </Button>
                     <Button 
                        onClick={handleSummarize} 
                        variant="outline" 
                        disabled={isSummarizing || !content.trim()}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Saved Notes</CardTitle>
            <CardDescription>Your previously saved notes. This is a visual placeholder.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Note Title 1</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">This is a short preview of the note content. Clicking on it would open the full note for editing.</p></CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Another Note</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">More content here to see how it looks when it wraps over multiple lines of text.</p></CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Quick Idea</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">A very brief note.</p></CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Long Note Title That Needs to Be Truncated</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">This note has a longer title to test how the truncation is working on the card's title element.</p></CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Meeting Notes</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">- Discuss project timeline. - Review quarterly goals. - Assign action items.</p></CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader><CardTitle className="text-lg truncate">Shopping List</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-3">Milk, Bread, Eggs, Cheese, Apples, Bananas.</p></CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

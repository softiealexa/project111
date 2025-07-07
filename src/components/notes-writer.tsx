
"use client";

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import type { Note } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';

export default function NotesWriter() {
  const { activeProfile, addNote, updateNote, deleteNote } = useData();
  const { toast } = useToast();
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const savedNotes = activeProfile?.notes?.sort((a, b) => b.createdAt - a.createdAt) || [];

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      // Keep content if user clicks "New Note" by accident
      // setTitle('');
      // setContent('');
    }
  }, [activeNote]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
        toast({
            title: 'Empty Note',
            description: 'Please add a title or some content to your note.',
            variant: 'destructive',
        });
        return;
    }
    
    if (activeNote) {
        // Update existing note
        const updated = { ...activeNote, title, content };
        updateNote(updated);
        setActiveNote(updated); // Keep the form in "edit" mode
        toast({
            title: 'Note Updated',
            description: `Your note "${title || 'Untitled'}" has been updated.`,
        });
    } else {
        // Add new note
        addNote(title, content);
        toast({
            title: 'Note Saved',
            description: `Your note "${title || 'Untitled'}" has been saved.`,
        });
        // Clear the form for the next note
        setTitle('');
        setContent('');
    }
  };
  
  const handleNewNote = () => {
      setActiveNote(null);
      setTitle('');
      setContent('');
  };
  
  const handleDelete = (noteId: string, noteTitle: string) => {
      deleteNote(noteId);
      toast({
          title: 'Note Deleted',
          description: `"${noteTitle}" was deleted.`,
          variant: 'destructive',
      });
      if (activeNote?.id === noteId) {
          setActiveNote(null);
          setTitle('');
          setContent('');
      }
  };

  const selectNote = (note: Note) => {
      setActiveNote(note);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>{activeNote ? 'Edit Note' : 'Create Note'}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleNewNote} disabled={!activeNote}>
                    <Plus className="mr-2 h-4 w-4" /> New Note
                </Button>
            </div>
        </CardHeader>
        <CardContent>
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
                        className="min-h-[96px] text-base"
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave}>
                        {activeNote ? 'Update Note' : 'Save New Note'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Saved Notes</CardTitle>
            <CardDescription>Your previously saved notes. Click a note to edit.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[300px] pr-4">
                {savedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedNotes.map(note => (
                            <Card key={note.id} className="cursor-pointer hover:border-primary/50 transition-colors relative group" onClick={() => selectNote(note)}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id, note.title || 'Untitled'); }}
                                    aria-label="Delete note"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <CardHeader>
                                    <CardTitle className="text-lg truncate pr-8">{note.title || 'Untitled'}</CardTitle>
                                </CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p></CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground py-10">You have no saved notes yet.</p>
                    </div>
                )}
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

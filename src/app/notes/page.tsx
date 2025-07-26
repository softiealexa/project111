
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from "@/contexts/data-context";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import Navbar from '@/components/navbar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { TooltipProvider } from '@/components/ui/tooltip';

function NoteItem({ note, onSelect, onDelete, isActive }: { note: Note, onSelect: () => void, onDelete: (e: React.MouseEvent) => void, isActive: boolean }) {
    const summary = note.content.substring(0, 100).replace(/#+\s/g, '') + (note.content.length > 100 ? '...' : '');
    
    return (
        <button 
            onClick={onSelect} 
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors group",
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
            )}
        >
            <div className="flex justify-between items-start">
                <h3 className="font-semibold truncate pr-2">{note.title || 'Untitled Note'}</h3>
                <div 
                    onClick={onDelete} 
                    aria-label="Delete note" 
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="h-4 w-4" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{summary}</p>
        </button>
    );
}


export default function NotesPage() {
    const { activeProfile, addNote, updateNote, deleteNote, loading } = useData();
    const { toast } = useToast();

    const allNotes = useMemo(() => {
        if (!activeProfile?.notes) return [];
        return [...activeProfile.notes].sort((a, b) => b.createdAt - a.createdAt);
    }, [activeProfile?.notes]);

    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const activeNote = useMemo(() => allNotes.find(note => note.id === activeNoteId), [allNotes, activeNoteId]);

    const noteIsDirty = useMemo(() => {
        if (!activeNoteId && (title.trim() || content.trim())) return true;
        if (activeNote) {
            return title.trim() !== activeNote.title.trim() || content.trim() !== activeNote.content.trim();
        }
        return false;
    }, [activeNote, activeNoteId, title, content]);

    const handleSave = useCallback(() => {
        if (!noteIsDirty) return;
        if (!title.trim() && !content.trim()) return;

        let noteToSaveId;

        if (activeNote) {
            updateNote({ ...activeNote, title, content });
            noteToSaveId = activeNote.id;
        } else {
            const newNote = addNote(title, content);
            if (newNote) {
                setActiveNoteId(newNote.id);
                noteToSaveId = newNote.id;
            }
        }
        toast({ title: "Note Saved" });
    }, [activeNote, title, content, noteIsDirty, addNote, updateNote, toast]);

    const selectNote = useCallback((noteId: string) => {
        if (noteId === activeNoteId) return;
        if (noteIsDirty) {
            handleSave();
        }
        setActiveNoteId(noteId);
    }, [noteIsDirty, handleSave, activeNoteId]);

    const handleNewNote = useCallback(() => {
        if (noteIsDirty) {
            handleSave();
        }
        setActiveNoteId(null);
        setTitle('');
        setContent('');
    }, [noteIsDirty, handleSave]);

    const handleDelete = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation(); // Prevent selection of the note
        deleteNote(noteId);
        toast({ title: "Note Deleted", variant: "destructive" });
        if (activeNoteId === noteId) {
            setActiveNoteId(null);
            setTitle('');
            setContent('');
        }
    };
    
    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            setContent(activeNote.content);
        } else {
            setTitle('');
            setContent('');
        }
    }, [activeNote]);

    useEffect(() => {
        // When switching profiles, if the current note doesn't exist in the new profile, reset the view
        if (activeProfile && activeNoteId && !allNotes.some(note => note.id === activeNoteId)) {
             handleNewNote();
        } else if (activeProfile && !activeNoteId && allNotes.length > 0) {
            setActiveNoteId(allNotes[0].id);
        }
    }, [activeProfile, activeNoteId, allNotes, handleNewNote]);
    
    if (loading) {
        return <LoadingSpinner containerClassName="min-h-screen" />;
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col h-screen">
                <Navbar />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] overflow-hidden">
                    {/* Notes List Sidebar */}
                    <aside className="border-r flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-bold">All Notes</h2>
                        </div>
                        <div className="p-2">
                            <Button variant="outline" className="w-full" onClick={handleNewNote}>
                                <Plus className="mr-2 h-4 w-4" /> New Note
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {allNotes.length > 0 ? (
                                    allNotes.map(note => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onSelect={() => selectNote(note.id)}
                                            onDelete={(e) => handleDelete(e, note.id)}
                                            isActive={note.id === activeNoteId}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground p-4">No notes yet.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex flex-col overflow-hidden bg-muted/20">
                         <div className="p-2 border-b flex justify-between items-center bg-background">
                             <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSave}
                                placeholder="Untitled Note"
                                className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-2 h-auto flex-1"
                            />
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                             <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onBlur={handleSave}
                                placeholder="Start writing your note here... Supports Markdown, GFM, and LaTeX!"
                                className="w-full h-full p-6 text-base border-none rounded-none resize-none shadow-none focus-visible:ring-0 bg-background font-mono"
                                autoFocus
                            />
                            <ScrollArea className="bg-background border-l">
                                <Card className="m-0 border-none shadow-none rounded-none">
                                    <CardContent className="prose dark:prose-invert max-w-none p-6 text-base">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath, remarkGfm]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {content || '*Note preview will appear here.*'}
                                        </ReactMarkdown>
                                    </CardContent>
                                </Card>
                            </ScrollArea>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}

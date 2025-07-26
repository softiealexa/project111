
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useData } from "@/contexts/data-context";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/navbar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { TooltipProvider } from '@/components/ui/tooltip';

function NoteItem({ note, onSelect, onDelete, isActive }: { note: Note, onSelect: () => void, onDelete: (e: React.MouseEvent) => void, isActive: boolean }) {
    const summary = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
    
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
    const [isEditing, setIsEditing] = useState(true);

    const activeNote = useMemo(() => allNotes.find(note => note.id === activeNoteId), [allNotes, activeNoteId]);

    const noteIsDirty = useMemo(() => {
        if (activeNote) {
            return title.trim() !== activeNote.title.trim() || content.trim() !== activeNote.content.trim();
        }
        // For a new note, it's dirty if there's any text
        return title.trim() !== '' || content.trim() !== '';
    }, [activeNote, title, content]);


    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            setContent(activeNote.content);
            setIsEditing(false); // Start in view mode when selecting a note
        } else if (!loading) {
            // If no active note is selected after loading, set up for a new one
            setActiveNoteId(null);
            setTitle('');
            setContent('');
            setIsEditing(true);
        }
    }, [activeNote, loading]);

    useEffect(() => {
        // When switching profiles, if the current note doesn't exist in the new profile, reset the view
        if (activeProfile && activeNoteId && !allNotes.some(note => note.id === activeNoteId)) {
             handleNewNote();
        }
    }, [activeProfile, activeNoteId, allNotes]);

    const handleSave = () => {
        if (!title.trim() && !content.trim()) return;

        if (activeNote) {
            updateNote({ ...activeNote, title, content });
        } else {
            const newNote = addNote(title, content);
            if (newNote) {
                setActiveNoteId(newNote.id);
            }
        }
        setIsEditing(false); // Switch to view mode after saving
        toast({ title: "Note Saved" });
    };

    const selectNote = (noteId: string) => {
        if (noteIsDirty) {
            handleSave();
        }
        setActiveNoteId(noteId);
    };

    const handleNewNote = () => {
        if (noteIsDirty) {
            handleSave();
        }
        setActiveNoteId(null);
        setTitle('');
        setContent('');
        setIsEditing(true);
    };

    const handleDelete = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation(); // Prevent selection of the note
        deleteNote(noteId);
        toast({ title: "Note Deleted", variant: "destructive" });
        if (activeNoteId === noteId) {
            handleNewNote();
        }
    };
    
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
                    <main className="flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Note Title"
                                        className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                                    />
                                ) : (
                                    <h1 className="text-2xl font-bold truncate">{title || 'Untitled Note'}</h1>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <Button onClick={handleSave}>Save</Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isEditing ? (
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing your note here... You can use Markdown and LaTeX for math, like this: $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$"
                                    className="w-full h-full p-6 text-base border-none rounded-none resize-none shadow-none focus-visible:ring-0"
                                    autoFocus
                                />
                            ) : (
                                <Card className="m-4 border-none shadow-none">
                                    <CardContent className="prose dark:prose-invert max-w-none p-2 text-base">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {content || '*Note is empty. Click "Edit" to add content.*'}
                                        </ReactMarkdown>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}

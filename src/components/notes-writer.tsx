
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import type { Note } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LoadingSpinner } from './loading-spinner';

function SortableNoteItem({ note, selectNote, handleDelete }: { note: Note, selectNote: (note: Note) => void, handleDelete: (id: string, title: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
        <Card className={cn("transition-colors relative group hover:border-primary/50", isDragging && "shadow-lg z-10 bg-card ring-1 ring-primary")}>
            <div className="flex items-center">
                <button {...listeners} aria-label="Drag to reorder note" className="cursor-grab touch-none p-3 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex-1 py-3 pr-10 min-w-0 cursor-pointer" onClick={() => selectNote(note)}>
                    <CardTitle className="text-lg truncate">{note.title || 'Untitled'}</CardTitle>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 pr-2">{note.content}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 -translate-y-1/2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id, note.title || 'Untitled'); }}
                    aria-label={`Delete note: ${note.title || 'Untitled'}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    </div>
  );
}

export default function NotesWriter() {
  const { activeProfile, addNote, updateNote, deleteNote, setNotes, loading } = useData();
  const { toast } = useToast();
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const savedNotes = useMemo(() => activeProfile?.notes || [], [activeProfile?.notes]);

  const noteIsDirty = useMemo(() => {
    if (activeNote) {
        return title.trim() !== activeNote.title.trim() || content.trim() !== activeNote.content.trim();
    }
    return title.trim() !== '' || content.trim() !== '';
  }, [activeNote, title, content]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
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
        const updated = { ...activeNote, title: title.trim(), content: content.trim() };
        updateNote(updated);
        setActiveNote(updated); 
        toast({
            title: 'Note Updated',
            description: `Your note "${title || 'Untitled'}" has been updated.`,
        });
    } else {
        const newNote = addNote(title, content);
        if (newNote) {
            setActiveNote(newNote);
        }
        toast({
            title: 'Note Saved',
            description: `Your new note "${title || 'Untitled'}" has been saved.`,
        });
    }
  };
  
  const handleNewNote = () => {
      if (noteIsDirty) {
          handleSave();
      }
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
      }
  };

  const selectNote = (note: Note) => {
      if (note.id === activeNote?.id) return;
      
      if (noteIsDirty) {
          handleSave();
      }
      setActiveNote(note);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = savedNotes.findIndex((note) => note.id === active.id);
      const newIndex = savedNotes.findIndex((note) => note.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setNotes(arrayMove(savedNotes, oldIndex, newIndex));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner containerClassName="h-96" text="Loading Notes..." />;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>{activeNote ? 'Edit Note' : 'Create Note'}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleNewNote}>
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
                <Button onClick={handleSave} disabled={!noteIsDirty}>
                    {activeNote ? 'Update Note' : 'Save New Note'}
                </Button>
            </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1" className="border-none">
          <Card>
            <AccordionTrigger className="p-6 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex-1 text-left">
                <CardTitle>Saved Notes</CardTitle>
                <CardDescription className="pt-1.5">Your previously saved notes. Click to edit, or drag to reorder.</CardDescription>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
                {savedNotes.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={savedNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {savedNotes.map(note => (
                                    <SortableNoteItem
                                        key={note.id}
                                        note={note}
                                        selectNote={selectNote}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground py-10">You have no saved notes yet.</p>
                    </div>
                )}
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

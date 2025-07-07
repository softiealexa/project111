
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import type { Note } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
      <Card className={cn("transition-colors relative group hover:border-primary/50", isDragging && "shadow-lg z-10")}>
        <div className="flex items-center">
            <button {...listeners} aria-label="Drag to reorder note" className="cursor-grab touch-none p-4 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 py-3 pr-10 min-w-0 cursor-pointer" onClick={() => selectNote(note)}>
                <CardTitle className="text-lg truncate">{note.title || 'Untitled'}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 pr-2">{note.content}</p>
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
  const { activeProfile, addNote, updateNote, deleteNote, setNotes } = useData();
  const { toast } = useToast();
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cardOrder, setCardOrder] = useState(['create', 'saved']);
  
  const savedNotes = activeProfile?.notes || [];

  const noteIsDirty = useMemo(() => {
    if (activeNote) {
        return title !== activeNote.title || content !== activeNote.content;
    }
    return title.trim() !== '' || content.trim() !== '';
  }, [activeNote, title, content]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      // When there's no active note, clear the form for a new one.
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
        // Update existing note
        const updated = { ...activeNote, title, content };
        updateNote(updated);
        // We call setActiveNote to update the component's state with the saved version,
        // which also sets noteIsDirty to false.
        setActiveNote(updated); 
        toast({
            title: 'Note Updated',
            description: `Your note "${title || 'Untitled'}" has been updated.`,
        });
    } else {
        // Add new note
        const newNote = addNote(title, content);
        if (newNote) {
            setActiveNote(newNote);
        }
    }
  };
  
  const handleNewNote = () => {
      if (noteIsDirty) {
          handleSave();
      }
      setActiveNote(null);
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
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Check if we are dragging a card
    const isCardDrag = cardOrder.includes(active.id as string);

    if (isCardDrag) {
      if (cardOrder.includes(over.id as string) && active.id !== over.id) {
        setCardOrder((items) => {
          const oldIndex = items.indexOf(active.id as string);
          const newIndex = items.indexOf(over.id as string);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    } else { // It's a note drag
      if (active.id !== over.id) {
        const oldIndex = savedNotes.findIndex((note) => note.id === active.id);
        const newIndex = savedNotes.findIndex((note) => note.id === over.id);
        if (setNotes && oldIndex !== -1 && newIndex !== -1) {
          setNotes(arrayMove(savedNotes, oldIndex, newIndex));
        }
      }
    }
  };
  
  const sections: Record<string, (listeners: any) => JSX.Element> = {
    create: (dragListeners) => (
      <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button {...dragListeners} aria-label="Drag to reorder section" className="cursor-grab touch-none p-1 -ml-2 text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <CardTitle>{activeNote ? 'Edit Note' : 'Create Note'}</CardTitle>
                </div>
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
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={!noteIsDirty}>
                        {activeNote ? 'Update Note' : 'Save New Note'}
                    </Button>
                    {activeNote && (
                         <Button variant="destructive" onClick={() => handleDelete(activeNote.id, activeNote.title || 'Untitled')}>
                            Delete Note
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>
    ),
    saved: (dragListeners) => (
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                 <button {...dragListeners} aria-label="Drag to reorder section" className="cursor-grab touch-none p-1 -ml-2 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </button>
                <div>
                    <CardTitle>Saved Notes</CardTitle>
                    <CardDescription>Your previously saved notes. Click to edit, or drag to reorder.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[400px] pr-4">
                {savedNotes.length > 0 ? (
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
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground py-10">You have no saved notes yet.</p>
                    </div>
                )}
            </ScrollArea>
        </CardContent>
      </Card>
    ),
  };

  return (
     <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
        <div className="grid gap-6">
          {cardOrder.map(id => {
            const {
              attributes,
              listeners,
              setNodeRef,
              transform,
              transition,
              isDragging,
            } = useSortable({ id });

            const style = {
              transform: CSS.Transform.toString(transform),
              transition,
              zIndex: isDragging ? 20 : 'auto',
            };

            return (
              <div key={id} ref={setNodeRef} style={style} {...attributes}>
                {sections[id](listeners)}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

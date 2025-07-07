
"use client";

import { useState } from 'react';
import { useData } from '@/contexts/data-context';
import type { ImportantLink } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link as LinkIcon, Pencil, Trash2, GripVertical } from 'lucide-react';
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


function SortableLinkItem({ link, onEdit, onDelete }: { link: ImportantLink, onEdit: (link: ImportantLink) => void, onDelete: (link: ImportantLink) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50", isDragging && "shadow-lg z-10 bg-card ring-1 ring-primary")}>
        <button {...listeners} aria-label="Drag to reorder link" className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-shrink-0">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline truncate block">
                {link.title}
            </a>
            <p className="text-sm text-muted-foreground truncate">{link.url}</p>
        </div>
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(link)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(link)}>
                <Trash2 className="h-4 w-4" />
                 <span className="sr-only">Delete</span>
            </Button>
        </div>
    </div>
  );
}


export default function ImportantLinks() {
  const { activeProfile, addLink, updateLink, deleteLink, setLinks } = useData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<ImportantLink | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const links = activeProfile?.importantLinks || [];

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      // Reset state when the dialog closes. No timeout needed.
      setIsEditing(null);
      setTitle('');
      setUrl('');
      setError('');
    }
  }

  const handleSave = () => {
    if (!title.trim() || !url.trim()) {
      setError('Both title and URL are required.');
      return;
    }
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    if (isEditing) {
      updateLink({ ...isEditing, title, url });
      toast({ title: 'Link Updated', description: `"${title}" has been updated.` });
    } else {
      addLink(title, url);
      toast({ title: 'Link Added', description: `"${title}" has been added.` });
    }

    handleOpenChange(false); // Close dialog and trigger cleanup
  };

  const handleOpenDialog = (link: ImportantLink | null = null) => {
    if (link) {
      setIsEditing(link);
      setTitle(link.title);
      setUrl(link.url);
    } else {
      setIsEditing(null);
      setTitle('');
      setUrl('');
    }
    setError('');
    setDialogOpen(true);
  };

  const handleDelete = (link: ImportantLink) => {
    deleteLink(link.id);
    toast({
      title: 'Link Deleted',
      description: `"${link.title}" has been deleted.`,
      variant: 'destructive',
    });
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
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setLinks(arrayMove(links, oldIndex, newIndex));
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Important Links</CardTitle>
            <CardDescription>
              Keep your essential resources in one place. Drag to reorder.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length > 0 ? (
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {links.map((link) => (
                    <SortableLinkItem 
                      key={link.id} 
                      link={link} 
                      onEdit={handleOpenDialog} 
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-center">
              <h3 className="text-lg font-medium text-muted-foreground">No links yet</h3>
              <p className="text-sm text-muted-foreground">Click "Add Link" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            <DialogDescription>
              Enter a title and a valid URL for your resource.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Physics Formula Sheet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/formulas"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

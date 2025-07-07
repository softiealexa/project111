
"use client";

import { useState } from 'react';
import { useData } from '@/contexts/data-context';
import type { ImportantLink } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link, Pencil, Trash2 } from 'lucide-react';

export default function ImportantLinks() {
  const { activeProfile, addLink, updateLink, deleteLink } = useData();
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

    handleCloseDialog();
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
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Add a small delay to allow the dialog to close before resetting state
    setTimeout(() => {
        setIsEditing(null);
        setTitle('');
        setUrl('');
        setError('');
    }, 150);
  };

  const handleDelete = (link: ImportantLink) => {
    deleteLink(link.id);
    toast({
      title: 'Link Deleted',
      description: `"${link.title}" has been deleted.`,
      variant: 'destructive',
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Important Links</CardTitle>
            <CardDescription>
              Keep your essential resources in one place.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-4 rounded-md border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex-shrink-0">
                    <Link className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline truncate block">
                      {link.title}
                    </a>
                    <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(link)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(link)}>
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-center">
              <h3 className="text-lg font-medium text-muted-foreground">No links yet</h3>
              <p className="text-sm text-muted-foreground">Click "Add Link" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onPointerDownOutside={handleCloseDialog} onEscapeKeyDown={handleCloseDialog}>
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
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

const colors = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const { toast } = useToast();
  const { activeProfile, addProject, updateProject } = useData();

  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState('');

  const isEditing = project !== null;
  const existingProjectNames = activeProfile?.projects?.map(p => p.name) || [];

  useEffect(() => {
    if (open) {
      if (isEditing) {
        setName(project.name);
        setColor(project.color);
      } else {
        // Reset for new project
        setName('');
        setColor(colors[0]);
        setError('');
      }
    }
  }, [open, project, isEditing]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name cannot be empty.');
      return;
    }
    
    // Check for uniqueness
    const isNameTaken = existingProjectNames.some(
      existingName => existingName.toLowerCase() === trimmedName.toLowerCase() && (!isEditing || existingName.toLowerCase() !== project.name.toLowerCase())
    );

    if (isNameTaken) {
      setError('A project with this name already exists.');
      return;
    }

    setError('');

    if (isEditing) {
      updateProject && updateProject({ ...project, name: trimmedName, color });
      toast({ title: 'Project Updated', description: `"${trimmedName}" has been updated.` });
    } else {
      addProject && addProject(trimmedName, color);
      toast({ title: 'Project Added', description: `"${trimmedName}" has been added.` });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for your project.' : 'Enter a name and choose a color for your new project.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Campaign"
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    color === c ? 'border-primary ring-2 ring-offset-2 ring-primary' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && <Check className="h-5 w-5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Project'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

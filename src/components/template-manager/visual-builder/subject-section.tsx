'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChapterList } from './chapter-list';
import { cn } from '@/lib/utils';
import { getIconComponent, iconNames } from '@/lib/icons';
import { GripVertical, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import type { TemplateSubject, TemplateChapter } from '@/lib/types';

interface SubjectSectionProps {
  subject: TemplateSubject;
  subjectIndex: number;
  onUpdate: (updates: Partial<TemplateSubject>) => void;
  onRemove: () => void;
  onAddChapter: () => void;
  onUpdateChapter: (chapterIndex: number, updates: Partial<TemplateChapter>) => void;
  onRemoveChapter: (chapterIndex: number) => void;
  onReorderChapters: (activeId: string, overId: string) => void;
  onAddTopic: (chapterIndex: number, topicName: string) => void;
  onRemoveTopic: (chapterIndex: number, topicIndex: number) => void;
  existingSubjectNames: string[];
}

export function SubjectSection({
  subject,
  subjectIndex,
  onUpdate,
  onRemove,
  onAddChapter,
  onUpdateChapter,
  onRemoveChapter,
  onReorderChapters,
  onAddTopic,
  onRemoveTopic,
  existingSubjectNames,
}: SubjectSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getIconComponent(subject.icon);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== subject.name) {
      if (existingSubjectNames.includes(trimmed)) {
        return;
      }
      onUpdate({ name: trimmed });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(subject.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('border rounded-lg overflow-hidden', isDragging && 'shadow-lg z-10 opacity-90')}
    >
      <AccordionItem value={subject.name} className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
          <div className="flex items-center gap-3 flex-1">
            <button
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
              aria-label="Drag to reorder subject"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />

            {isEditing ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-left font-medium">{subject.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground mr-2">
                    {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Subject</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove &quot;{subject.name}&quot;? This will delete all{' '}
                          {subject.chapters.length} chapters and cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onRemove();
                            setIsRemoveDialogOpen(false);
                          }}
                        >
                          Remove
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject Icon</Label>
                <Select
                  value={subject.icon}
                  onValueChange={(value) => onUpdate({ icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconNames.map((iconName) => {
                      const IconComponent = getIconComponent(iconName);
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Tasks</Label>
                <div className="text-sm text-muted-foreground py-2">
                  {subject.tasks.length > 0 ? (
                    <span>{subject.tasks.length} task(s) configured</span>
                  ) : (
                    <span>No default tasks</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chapters</Label>
                <Button variant="outline" size="sm" onClick={onAddChapter} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Chapter
                </Button>
              </div>

              <ChapterList
                chapters={subject.chapters}
                onUpdateChapter={onUpdateChapter}
                onRemoveChapter={onRemoveChapter}
                onReorderChapters={onReorderChapters}
                onAddTopic={onAddTopic}
                onRemoveTopic={onRemoveTopic}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

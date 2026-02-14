'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TopicEditor } from './topic-editor';
import { cn } from '@/lib/utils';
import { GripVertical, Pencil, Trash2, ChevronDown, Plus, Check, X } from 'lucide-react';
import type { TemplateChapter } from '@/lib/types';

interface ChapterListProps {
  chapters: TemplateChapter[];
  onUpdateChapter: (chapterIndex: number, updates: Partial<TemplateChapter>) => void;
  onRemoveChapter: (chapterIndex: number) => void;
  onReorderChapters: (activeId: string, overId: string) => void;
  onAddTopic: (chapterIndex: number, topicName: string) => void;
  onRemoveTopic: (chapterIndex: number, topicIndex: number) => void;
}

function SortableChapterItem({
  chapter,
  index,
  onUpdate,
  onRemove,
  onAddTopic,
  onRemoveTopic,
}: {
  chapter: TemplateChapter;
  index: number;
  onUpdate: (updates: Partial<TemplateChapter>) => void;
  onRemove: () => void;
  onAddTopic: (topicName: string) => void;
  onRemoveTopic: (topicIndex: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chapter.name);
  const [lectureCount, setLectureCount] = useState(String(chapter.lectureCount));
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      onUpdate({ name: trimmed });
    }
    const count = parseInt(lectureCount, 10);
    if (!isNaN(count) && count >= 1 && count <= 50) {
      onUpdate({ lectureCount: count });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(chapter.name);
    setLectureCount(String(chapter.lectureCount));
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md border bg-card',
        isDragging && 'shadow-lg z-10 opacity-90'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2 p-3">
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder chapter"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">Lectures:</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={lectureCount}
                  onChange={(e) => setLectureCount(e.target.value)}
                  className="h-8 w-16"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex-1 font-medium truncate">{chapter.name}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{chapter.lectureCount} lectures</span>
                {chapter.syllabus && chapter.syllabus.length > 0 && (
                  <span>• {chapter.syllabus.length} topics</span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                  />
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setIsRemoveDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t">
            <TopicEditor
              topics={chapter.syllabus || []}
              onAddTopic={onAddTopic}
              onRemoveTopic={onRemoveTopic}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{chapter.name}&quot;? This action cannot be undone.
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
  );
}

export function ChapterList({
  chapters,
  onUpdateChapter,
  onRemoveChapter,
  onReorderChapters,
  onAddTopic,
  onRemoveTopic,
}: ChapterListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderChapters(String(active.id), String(over.id));
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
        <p>No chapters added yet.</p>
        <p className="text-sm">Click &quot;Add Chapter&quot; to add chapters to this subject.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters.map((c) => c.name)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {chapters.map((chapter, index) => (
            <SortableChapterItem
              key={chapter.name + index}
              chapter={chapter}
              index={index}
              onUpdate={(updates) => onUpdateChapter(index, updates)}
              onRemove={() => onRemoveChapter(index)}
              onAddTopic={(topicName) => onAddTopic(index, topicName)}
              onRemoveTopic={(topicIndex) => onRemoveTopic(index, topicIndex)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

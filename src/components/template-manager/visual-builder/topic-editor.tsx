'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import type { TemplateTopic } from '@/lib/types';

interface TopicEditorProps {
  topics: TemplateTopic[];
  onAddTopic: (topicName: string) => void;
  onRemoveTopic: (topicIndex: number) => void;
}

export function TopicEditor({ topics, onAddTopic, onRemoveTopic }: TopicEditorProps) {
  const [newTopic, setNewTopic] = useState('');

  const handleAdd = () => {
    const trimmed = newTopic.trim();
    if (trimmed) {
      onAddTopic(trimmed);
      setNewTopic('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium flex-1">Syllabus Topics</Label>
        <span className="text-xs text-muted-foreground">{topics.length} topic(s)</span>
      </div>

      <div className="flex gap-2">
        <Input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a topic..."
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={handleAdd} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <ScrollArea className="max-h-40">
        <div className="space-y-1">
          {topics.length > 0 ? (
            topics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 group hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="truncate">{topic.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => onRemoveTopic(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No topics added. Add topics to define the chapter syllabus.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertCircle, Save, Eye, FileJson } from 'lucide-react';
import { SubjectSection } from './subject-section';
import { TemplatePreview } from './template-preview';
import { cn } from '@/lib/utils';
import type {
  ProfileTemplate,
  TemplateSubject,
  TemplateChapter,
  TemplateTopic,
  TemplateTodo,
  ExamType,
  Priority,
} from '@/lib/types';

interface VisualBuilderProps {
  initialTemplate?: Partial<ProfileTemplate>;
  onSave: (template: ProfileTemplate) => void;
  onCancel: () => void;
}

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'JEE', label: 'JEE (Mains & Advanced)' },
  { value: 'NEET', label: 'NEET' },
  { value: 'BOARDS', label: 'Board Exams' },
  { value: 'CUSTOM', label: 'Custom' },
];

const CLASS_OPTIONS = [
  { value: '', label: 'Both Classes' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export function VisualBuilder({ initialTemplate, onSave, onCancel }: VisualBuilderProps) {
  const [activeTab, setActiveTab] = useState('builder');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [template, setTemplate] = useState<Partial<ProfileTemplate>>({
    name: '',
    description: '',
    examType: 'CUSTOM',
    class: undefined,
    icon: 'Book',
    subjects: [],
    defaultTodos: [],
    ...initialTemplate,
  });

  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('Medium');

  const validateTemplate = useCallback((): boolean => {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.examType) {
      errors.push('Exam type is required');
    }

    if (!template.subjects || template.subjects.length === 0) {
      errors.push('At least one subject is required');
    } else {
      template.subjects.forEach((subject, sIdx) => {
        if (!subject.name.trim()) {
          errors.push(`Subject ${sIdx + 1}: Name is required`);
        }
        if (!subject.chapters || subject.chapters.length === 0) {
          errors.push(`Subject ${subject.name || sIdx + 1}: At least one chapter is required`);
        }
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [template]);

  const handleSave = useCallback(() => {
    if (validateTemplate()) {
      onSave(template as ProfileTemplate);
    }
  }, [template, validateTemplate, onSave]);

  const updateTemplateField = useCallback(<K extends keyof ProfileTemplate>(
    field: K,
    value: ProfileTemplate[K]
  ) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddSubject = useCallback(() => {
    const newSubject: TemplateSubject = {
      name: `Subject ${(template.subjects?.length || 0) + 1}`,
      icon: 'Book',
      tasks: [],
      chapters: [],
    };
    setTemplate((prev) => ({
      ...prev,
      subjects: [...(prev.subjects || []), newSubject],
    }));
  }, [template.subjects]);

  const handleUpdateSubject = useCallback((index: number, updates: Partial<TemplateSubject>) => {
    setTemplate((prev) => ({
      ...prev,
      subjects: prev.subjects?.map((s, i) => (i === index ? { ...s, ...updates } : s)) || [],
    }));
  }, []);

  const handleRemoveSubject = useCallback((index: number) => {
    setTemplate((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const handleReorderSubjects = useCallback((activeId: string, overId: string) => {
    setTemplate((prev) => {
      const oldIndex = prev.subjects?.findIndex((s) => s.name === activeId) ?? -1;
      const newIndex = prev.subjects?.findIndex((s) => s.name === overId) ?? -1;
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newSubjects = [...(prev.subjects || [])];
      const [moved] = newSubjects.splice(oldIndex, 1);
      newSubjects.splice(newIndex, 0, moved);
      return { ...prev, subjects: newSubjects };
    });
  }, []);

  const handleAddChapter = useCallback((subjectIndex: number) => {
    const newChapter: TemplateChapter = {
      name: `Chapter ${(template.subjects?.[subjectIndex].chapters.length || 0) + 1}`,
      lectureCount: 5,
      syllabus: [],
    };
    setTemplate((prev) => ({
      ...prev,
      subjects: prev.subjects?.map((s, i) =>
        i === subjectIndex ? { ...s, chapters: [...s.chapters, newChapter] } : s
      ) || [],
    }));
  }, [template.subjects]);

  const handleUpdateChapter = useCallback(
    (subjectIndex: number, chapterIndex: number, updates: Partial<TemplateChapter>) => {
      setTemplate((prev) => ({
        ...prev,
        subjects: prev.subjects?.map((s, si) =>
          si === subjectIndex
            ? {
                ...s,
                chapters: s.chapters.map((c, ci) => (ci === chapterIndex ? { ...c, ...updates } : c)),
              }
            : s
        ) || [],
      }));
    },
    []
  );

  const handleRemoveChapter = useCallback((subjectIndex: number, chapterIndex: number) => {
    setTemplate((prev) => ({
      ...prev,
      subjects: prev.subjects?.map((s, i) =>
        i === subjectIndex ? { ...s, chapters: s.chapters.filter((_, ci) => ci !== chapterIndex) } : s
      ) || [],
    }));
  }, []);

  const handleReorderChapters = useCallback(
    (subjectIndex: number, activeId: string, overId: string) => {
      setTemplate((prev) => {
        const subject = prev.subjects?.[subjectIndex];
        if (!subject) return prev;

        const oldIndex = subject.chapters.findIndex((c) => c.name === activeId);
        const newIndex = subject.chapters.findIndex((c) => c.name === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const newChapters = [...subject.chapters];
        const [moved] = newChapters.splice(oldIndex, 1);
        newChapters.splice(newIndex, 0, moved);

        return {
          ...prev,
          subjects: prev.subjects?.map((s, i) => (i === subjectIndex ? { ...s, chapters: newChapters } : s)) || [],
        };
      });
    },
    []
  );

  const handleAddTopic = useCallback((subjectIndex: number, chapterIndex: number, topicName: string) => {
    const newTopic: TemplateTopic = { name: topicName, completed: false };
    setTemplate((prev) => ({
      ...prev,
      subjects: prev.subjects?.map((s, si) =>
        si === subjectIndex
          ? {
              ...s,
              chapters: s.chapters.map((c, ci) =>
                ci === chapterIndex ? { ...c, syllabus: [...(c.syllabus || []), newTopic] } : c
              ),
            }
          : s
      ) || [],
    }));
  }, []);

  const handleRemoveTopic = useCallback(
    (subjectIndex: number, chapterIndex: number, topicIndex: number) => {
      setTemplate((prev) => ({
        ...prev,
        subjects: prev.subjects?.map((s, si) =>
          si === subjectIndex
            ? {
                ...s,
                chapters: s.chapters.map((c, ci) =>
                  ci === chapterIndex
                    ? { ...c, syllabus: c.syllabus?.filter((_, ti) => ti !== topicIndex) || [] }
                    : c
                ),
              }
            : s
        ) || [],
      }));
    },
    []
  );

  const handleAddTodo = useCallback(() => {
    const trimmed = newTodo.trim();
    if (!trimmed) return;

    const todo: TemplateTodo = { text: trimmed, priority: newTodoPriority };
    setTemplate((prev) => ({
      ...prev,
      defaultTodos: [...(prev.defaultTodos || []), todo],
    }));
    setNewTodo('');
  }, [newTodo, newTodoPriority]);

  const handleRemoveTodo = useCallback((index: number) => {
    setTemplate((prev) => ({
      ...prev,
      defaultTodos: prev.defaultTodos?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <TabsList>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>

        <TabsContent value="builder" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-6">
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        value={template.name}
                        onChange={(e) => updateTemplateField('name', e.target.value)}
                        placeholder="e.g., JEE Advanced 2025"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-icon">Icon</Label>
                      <Select
                        value={template.icon}
                        onValueChange={(value) => updateTemplateField('icon', value)}
                      >
                        <SelectTrigger id="template-icon">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Book',
                            'Zap',
                            'FlaskConical',
                            'Sigma',
                            'Atom',
                            'Brain',
                            'Globe',
                            'Microscope',
                            'Calculator',
                          ].map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={template.description}
                      onChange={(e) => updateTemplateField('description', e.target.value)}
                      placeholder="Brief description of this template..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exam-type">Exam Type *</Label>
                      <Select
                        value={template.examType}
                        onValueChange={(value) => updateTemplateField('examType', value as ExamType)}
                      >
                        <SelectTrigger id="exam-type">
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class-year">Class</Label>
                      <Select
                        value={String(template.class || '')}
                        onValueChange={(value) =>
                          updateTemplateField('class', value ? parseInt(value) : undefined)
                        }
                      >
                        <SelectTrigger id="class-year">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Subjects</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddSubject} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Button>
                </CardHeader>
                <CardContent>
                  {template.subjects && template.subjects.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (over && active.id !== over.id) {
                          handleReorderSubjects(String(active.id), String(over.id));
                        }
                      }}
                    >
                      <SortableContext
                        items={template.subjects.map((s) => s.name)}
                        strategy={verticalListSortingStrategy}
                      >
                        <Accordion type="multiple" className="space-y-2">
                          {template.subjects.map((subject, subjectIndex) => (
                            <SubjectSection
                              key={subject.name + subjectIndex}
                              subject={subject}
                              subjectIndex={subjectIndex}
                            onUpdate={(updates: Partial<TemplateSubject>) => handleUpdateSubject(subjectIndex, updates)}
                            onRemove={() => handleRemoveSubject(subjectIndex)}
                            onAddChapter={() => handleAddChapter(subjectIndex)}
                            onUpdateChapter={(chapterIndex: number, updates: Partial<TemplateChapter>) =>
                              handleUpdateChapter(subjectIndex, chapterIndex, updates)
                            }
                            onRemoveChapter={(chapterIndex: number) => handleRemoveChapter(subjectIndex, chapterIndex)}
                            onReorderChapters={(activeId: string, overId: string) =>
                              handleReorderChapters(subjectIndex, activeId, overId)
                            }
                            onAddTopic={(chapterIndex: number, topicName: string) =>
                              handleAddTopic(subjectIndex, chapterIndex, topicName)
                            }
                            onRemoveTopic={(chapterIndex: number, topicIndex: number) =>
                              handleRemoveTopic(subjectIndex, chapterIndex, topicIndex)
                            }
                              existingSubjectNames={template.subjects
                                ?.filter((_, i) => i !== subjectIndex)
                                .map((s) => s.name) || []}
                            />
                          ))}
                        </Accordion>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No subjects added yet.</p>
                      <p className="text-sm">Click &quot;Add Subject&quot; to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Todos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      placeholder="Add a default todo..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                      className="flex-1"
                    />
                    <Select value={newTodoPriority} onValueChange={(v) => setNewTodoPriority(v as Priority)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddTodo}>Add</Button>
                  </div>

                  <div className="space-y-2">
                    {template.defaultTodos?.map((todo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <span>{todo.text}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              todo.priority === 'High'
                                ? 'destructive'
                                : todo.priority === 'Medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {todo.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTodo(index)}
                            className="text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!template.defaultTodos || template.defaultTodos.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No default todos added.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="flex justify-end gap-2 pb-4">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4">
              <TemplatePreview template={template as ProfileTemplate} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

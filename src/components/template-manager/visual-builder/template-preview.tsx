'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getIconComponent } from '@/lib/icons';
import { BookOpen, GraduationCap, Calendar, CheckCircle2, ListTodo } from 'lucide-react';
import type { ProfileTemplate } from '@/lib/types';

interface TemplatePreviewProps {
  template: ProfileTemplate;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const Icon = getIconComponent(template.icon);

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      JEE: 'JEE (Mains & Advanced)',
      NEET: 'NEET',
      BOARDS: 'Board Exams',
      CUSTOM: 'Custom',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalChapters = template.subjects?.reduce((acc, subject) => acc + subject.chapters.length, 0) || 0;
  const totalTopics =
    template.subjects?.reduce(
      (acc, subject) =>
        acc + subject.chapters.reduce((cAcc, chapter) => cAcc + (chapter.syllabus?.length || 0), 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{template.name || 'Untitled Template'}</CardTitle>
              <CardDescription className="mt-1">
                {template.description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {getExamTypeLabel(template.examType)}
            </Badge>
            {template.class && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Class {template.class}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {template.subjects?.length || 0} Subject(s)
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {totalChapters} Chapter(s)
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              {totalTopics} Topic(s)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {template.subjects && template.subjects.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subjects</h3>
          {template.subjects.map((subject, sIndex) => {
            const SubjectIcon = getIconComponent(subject.icon);
            return (
              <Card key={sIndex}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <SubjectIcon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="multiple" className="w-full">
                    {subject.chapters.map((chapter, cIndex) => (
                      <AccordionItem key={cIndex} value={`${sIndex}-${cIndex}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 text-left">
                            <span className="font-medium">{chapter.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({chapter.lectureCount} lectures)
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {chapter.syllabus && chapter.syllabus.length > 0 ? (
                            <ul className="space-y-1 pl-4">
                              {chapter.syllabus.map((topic, tIndex) => (
                                <li key={tIndex} className="flex items-center gap-2 text-sm">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  <span>{topic.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground pl-4">No topics defined</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {subject.tasks && subject.tasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Default Tasks:</p>
                      <div className="flex flex-wrap gap-2">
                        {subject.tasks.map((task, tIndex) => (
                          <Badge key={tIndex} variant="secondary">
                            {task}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subjects added to this template yet.</p>
          </CardContent>
        </Card>
      )}

      {template.defaultTodos && template.defaultTodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Default Todos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {template.defaultTodos.map((todo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span>{todo.text}</span>
                  <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

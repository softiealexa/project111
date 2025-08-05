
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Link, List, ListOrdered, Quote } from 'lucide-react';
import { TextFormatter } from '@/lib/editor-utils';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setContent: (value: string | ((prev: string) => string)) => void;
}

export function EditorToolbar({ textareaRef, setContent }: EditorToolbarProps) {
  const formatter = new TextFormatter(textareaRef, setContent);

  const toolbarItems = [
    { name: 'Bold', icon: Bold, action: () => formatter.applyFormatting('**') },
    { name: 'Italic', icon: Italic, action: () => formatter.applyFormatting('*') },
    { name: 'Strikethrough', icon: Strikethrough, action: () => formatter.applyFormatting('~~') },
    { name: 'Heading 1', icon: Heading1, action: () => formatter.applyBlockFormatting('# ', 'Heading 1') },
    { name: 'Heading 2', icon: Heading2, action: () => formatter.applyBlockFormatting('## ', 'Heading 2') },
    { name: 'Heading 3', icon: Heading3, action: () => formatter.applyBlockFormatting('### ', 'Heading 3') },
    { name: 'Blockquote', icon: Quote, action: () => formatter.applyBlockFormatting('> ', 'Quote') },
    { name: 'Code', icon: Code, action: () => formatter.applyFormatting('`') },
    { name: 'Bulleted List', icon: List, action: () => formatter.applyListFormatting('*') },
    { name: 'Numbered List', icon: ListOrdered, action: () => formatter.applyListFormatting('1.') },
    { name: 'Link', icon: Link, action: () => formatter.applyFormatting('[', '](url)', 'link text') },
  ];

  return (
    <div className="bg-background border-b px-2 py-1 flex items-center gap-1">
      {toolbarItems.map((item, index) => (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={item.action}
              aria-label={item.name}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

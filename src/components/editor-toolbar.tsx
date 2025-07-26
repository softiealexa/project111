
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Link, List, ListOrdered, Quote } from 'lucide-react';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setContent: (value: string | ((prev: string) => string)) => void;
}

export function EditorToolbar({ textareaRef, setContent }: EditorToolbarProps) {

  const applyFormatting = (prefix: string, suffix: string = prefix, placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = selectedText || placeholder;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const formattedText = `${prefix}${newText}${suffix}`;
    const newContent = `${before}${formattedText}${after}`;

    setContent(newContent);

    // After state update, focus and select the placeholder/original text
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
         textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + newText.length);
      }
    }, 0);
  };
  
  const applyBlockFormatting = (prefix: string, placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = selectedText || placeholder;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const isAtStartOfLine = start === 0 || textarea.value[start - 1] === '\n';
    const linePrefix = isAtStartOfLine ? '' : '\n';
    
    const formattedText = `${linePrefix}${prefix}${newText}`;
    const newContent = `${before}${formattedText}${after}`;

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length + prefix.length, start + linePrefix.length + prefix.length + newText.length);
    }, 0);
  };
  
   const applyListFormatting = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const lines = selectedText.split('\n');
    
    // If no text is selected, just insert a single list item
    if (!selectedText) {
        applyBlockFormatting(`${prefix} `, 'List item');
        return;
    }
    
    const formattedLines = lines.map(line => `${prefix} ${line}`).join('\n');

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newContent = `${before}${formattedLines}${after}`;

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedLines.length);
    }, 0);
  };

  const toolbarItems = [
    { name: 'Bold', icon: Bold, action: () => applyFormatting('**') },
    { name: 'Italic', icon: Italic, action: () => applyFormatting('*') },
    { name: 'Strikethrough', icon: Strikethrough, action: () => applyFormatting('~~') },
    { name: 'Heading 1', icon: Heading1, action: () => applyBlockFormatting('# ', 'Heading 1') },
    { name: 'Heading 2', icon: Heading2, action: () => applyBlockFormatting('## ', 'Heading 2') },
    { name: 'Heading 3', icon: Heading3, action: () => applyBlockFormatting('### ', 'Heading 3') },
    { name: 'Blockquote', icon: Quote, action: () => applyBlockFormatting('> ', 'Quote') },
    { name: 'Code', icon: Code, action: () => applyFormatting('`') },
    { name: 'Bulleted List', icon: List, action: () => applyListFormatting('*') },
    { name: 'Numbered List', icon: ListOrdered, action: () => applyListFormatting('1.') },
    { name: 'Link', icon: Link, action: () => applyFormatting('[', '](url)', 'link text') },
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

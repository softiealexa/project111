
"use client";

import React from 'react';

export class TextFormatter {
  private textareaRef: React.RefObject<HTMLTextAreaElement>;
  private setContent: (value: string | ((prev: string) => string)) => void;

  constructor(
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    setContent: (value: string | ((prev: string) => string)) => void
  ) {
    this.textareaRef = textareaRef;
    this.setContent = setContent;
  }

  applyFormatting(prefix: string, suffix: string = prefix, placeholder: string = "text") {
    const textarea = this.textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = selectedText || placeholder;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const formattedText = `${prefix}${newText}${suffix}`;
    const newContent = `${before}${formattedText}${after}`;

    this.setContent(newContent);

    // After state update, focus and select the placeholder/original text
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + newText.length);
      }
    }, 0);
  }

  applyBlockFormatting(prefix: string, placeholder: string = "text") {
    const textarea = this.textareaRef.current;
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

    this.setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length + prefix.length, start + linePrefix.length + prefix.length + newText.length);
    }, 0);
  }

  applyListFormatting(prefix: string) {
    const textarea = this.textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const lines = selectedText.split('\n');
    
    // If no text is selected, just insert a single list item
    if (!selectedText) {
      this.applyBlockFormatting(`${prefix} `, 'List item');
      return;
    }
    
    const formattedLines = lines.map(line => `${prefix} ${line}`).join('\n');

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newContent = `${before}${formattedLines}${after}`;

    this.setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedLines.length);
    }, 0);
  }
}

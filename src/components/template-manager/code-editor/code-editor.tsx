'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, Download, Upload, FileJson, Globe } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { validateTemplateJSON, autoFixJSON, formatTemplateJSON } from '@/lib/template-validator';
import type { TemplateJSON, ExamType, TemplateValidationResult } from '@/lib/types';
import { ErrorPanel } from './error-panel';
import { FormatButton, ValidationStatus } from './format-button';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: TemplateValidationResult) => void;
  sampleTemplates?: Record<string, TemplateJSON>;
  className?: string;
}

const SAMPLE_EXAM_TYPES: ExamType[] = ['JEE', 'NEET', 'BOARDS', 'CUSTOM'];

export function CodeEditor({
  value,
  onChange,
  onValidationChange,
  sampleTemplates,
  className,
}: CodeEditorProps) {
  const [validationResult, setValidationResult] = useState<TemplateValidationResult>({
    isValid: true,
    errors: [],
  });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentLine, setCurrentLine] = useState<number>();

  const validate = useCallback((jsonString: string) => {
    const result = validateTemplateJSON(jsonString);
    setValidationResult(result);
    onValidationChange?.(result);
    return result;
  }, [onValidationChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validate(newValue);
    setLineCount(newValue.split('\n').length);
  }, [onChange, validate]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      validate(formatted);
      setLineCount(formatted.split('\n').length);
    } catch {
      // Invalid JSON, can't format
    }
  }, [value, onChange, validate]);

  const handleAutoFix = useCallback(() => {
    const { fixed, changes } = autoFixJSON(value);
    if (changes.length > 0) {
      onChange(fixed);
      validate(fixed);
      setLineCount(fixed.split('\n').length);
    }
  }, [value, onChange, validate]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed
    }
  }, [value]);

  const handleSampleSelect = useCallback((examType: ExamType) => {
    if (sampleTemplates?.[examType]) {
      const formatted = formatTemplateJSON(sampleTemplates[examType]);
      onChange(formatted);
      validate(formatted);
      setLineCount(formatted.split('\n').length);
    }
  }, [sampleTemplates, onChange, validate]);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onChange(content);
      validate(content);
      setLineCount(content.split('\n').length);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [onChange, validate]);

  const handleUrlImport = useCallback(async () => {
    const url = prompt('Enter JSON URL:');
    if (!url) return;

    try {
      const response = await fetch(url);
      const content = await response.text();
      onChange(content);
      validate(content);
      setLineCount(content.split('\n').length);
    } catch {
      alert('Failed to load from URL');
    }
  }, [onChange, validate]);

  const handleErrorClick = useCallback((line: number) => {
    setCurrentLine(line);
    if (textareaRef.current) {
      const lines = value.split('\n');
      let charIndex = 0;
      for (let i = 0; i < line - 1 && i < lines.length; i++) {
        charIndex += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charIndex, charIndex);
    }
  }, [value]);

  const errorCount = validationResult.errors.filter((e) => e.severity === 'error').length;
  const warningCount = validationResult.errors.filter((e) => e.severity === 'warning').length;

  const previewData = useMemo(() => {
    if (validationResult.isValid && validationResult.data) {
      return validationResult.data;
    }
    return null;
  }, [validationResult]);

  useEffect(() => {
    setLineCount(value.split('\n').length);
    validate(value);
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FormatButton
            onFormat={handleFormat}
            onAutoFix={handleAutoFix}
            hasErrors={errorCount > 0}
            disabled={!value.trim()}
          />

          <div className="h-6 w-px bg-border" />

          <Select onValueChange={(v) => handleSampleSelect(v as ExamType)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Load sample..." />
            </SelectTrigger>
            <SelectContent>
              {SAMPLE_EXAM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type} Template
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ValidationStatus
          isValid={validationResult.isValid}
          errorCount={errorCount}
          warningCount={warningCount}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const blob = new Blob([value], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>

        <Label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <span>
              <Upload className="w-4 h-4" />
              Import File
            </span>
          </Button>
        </Label>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleUrlImport}
          className="gap-2"
        >
          <Globe className="w-4 h-4" />
          From URL
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData}>
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4 space-y-4">
          <div className="relative flex">
            <div className="flex-none w-12 py-3 pr-2 text-right text-xs text-muted-foreground font-mono bg-muted/50 border border-r-0 rounded-l-md select-none">
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'leading-6',
                    currentLine === i + 1 && 'bg-yellow-100 text-yellow-800'
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              placeholder="Paste or type your JSON template here..."
              className="flex-1 min-h-[300px] rounded-l-none font-mono text-sm leading-6 resize-y"
              spellCheck={false}
            />
          </div>

          <ErrorPanel
            errors={validationResult.errors}
            currentLine={currentLine}
            onErrorClick={handleErrorClick}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          {previewData && (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{previewData.name}</h3>
                  <p className="text-sm text-muted-foreground">{previewData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Exam Type:</span>{' '}
                    <span className="font-medium">{previewData.examType}</span>
                  </div>
                  {previewData.class && (
                    <div>
                      <span className="text-muted-foreground">Class:</span>{' '}
                      <span className="font-medium">{previewData.class}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Icon:</span>{' '}
                    <span className="font-medium">{previewData.icon}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subjects:</span>{' '}
                    <span className="font-medium">{previewData.subjects.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Subjects</h4>
                  {previewData.subjects.map((subject, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-muted">
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subject.chapters.length} chapters
                        {subject.tasks?.length > 0 && ` • ${subject.tasks.length} tasks`}
                      </div>
                    </div>
                  ))}
                </div>

                {previewData.defaultTodos && previewData.defaultTodos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Default Todos</h4>
                    <ul className="list-disc list-inside text-sm">
                      {previewData.defaultTodos.map((todo, idx) => (
                        <li key={idx}>
                          {todo.text}
                          <span className="text-muted-foreground"> ({todo.priority})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ErrorPanel, FormatButton, ValidationStatus };

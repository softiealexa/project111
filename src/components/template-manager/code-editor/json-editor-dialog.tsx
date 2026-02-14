'use client';

import { useState, useCallback } from 'react';
import { FileJson, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CodeEditor } from './code-editor';
import { validateTemplateJSON, generateSampleTemplate } from '@/lib/template-validator';
import type { TemplateJSON, ExamType, TemplateValidationResult } from '@/lib/types';

interface JSONEditorDialogProps {
  trigger?: React.ReactNode;
  defaultValue?: string;
  onSave?: (value: string, data: TemplateJSON) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  sampleTemplates?: Record<string, TemplateJSON>;
  className?: string;
}

const DEFAULT_SAMPLES: Record<ExamType, TemplateJSON> = {
  JEE: generateSampleTemplate('JEE'),
  NEET: generateSampleTemplate('NEET'),
  BOARDS: generateSampleTemplate('BOARDS'),
  CUSTOM: generateSampleTemplate('CUSTOM'),
};

const DEFAULT_JSON = JSON.stringify(generateSampleTemplate('CUSTOM'), null, 2);

export function JSONEditorDialog({
  trigger,
  defaultValue = DEFAULT_JSON,
  onSave,
  onCancel,
  title = 'JSON Template Editor',
  description = 'Edit your template configuration in JSON format.',
  sampleTemplates = DEFAULT_SAMPLES,
  className,
}: JSONEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [validationResult, setValidationResult] = useState<TemplateValidationResult>({
    isValid: false,
    errors: [],
  });

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setValue(defaultValue);
      const result = validateTemplateJSON(defaultValue);
      setValidationResult(result);
    }
  }, [defaultValue]);

  const handleSave = useCallback(() => {
    if (validationResult.isValid && validationResult.data) {
      onSave?.(value, validationResult.data);
      setOpen(false);
    }
  }, [value, validationResult, onSave]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    setOpen(false);
  }, [onCancel]);

  const handleValidationChange = useCallback((result: TemplateValidationResult) => {
    setValidationResult(result);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={cn('gap-2', className)}>
            <FileJson className="w-4 h-4" />
            Open JSON Editor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          <CodeEditor
            value={value}
            onChange={setValue}
            onValidationChange={handleValidationChange}
            sampleTemplates={sampleTemplates}
            className="h-full"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validationResult.isValid}
            className="gap-2"
          >
            {validationResult.isValid ? (
              <>
                <span className="w-4 h-4 flex items-center justify-center">✓</span>
                Save Template
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Fix Errors to Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default JSONEditorDialog;

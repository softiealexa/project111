'use client';

import { Wand2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormatButtonProps {
  onFormat: () => void;
  onAutoFix?: () => void;
  hasErrors?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormatButton({
  onFormat,
  onAutoFix,
  hasErrors = false,
  disabled = false,
  className,
}: FormatButtonProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onFormat}
        disabled={disabled}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Format JSON
      </Button>

      {onAutoFix && hasErrors && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAutoFix}
          disabled={disabled}
          className="gap-2"
        >
          <Wand2 className="w-4 h-4" />
          Auto-fix
        </Button>
      )}
    </div>
  );
}

interface ValidationStatusProps {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  className?: string;
}

export function ValidationStatus({
  isValid,
  errorCount,
  warningCount,
  className,
}: ValidationStatusProps) {
  if (isValid && errorCount === 0 && warningCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-green-600',
          className
        )}
      >
        <Check className="w-4 h-4" />
        <span>Valid JSON</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      {errorCount > 0 && (
        <span className="flex items-center gap-1.5 text-destructive">
          <span className="font-medium">{errorCount}</span>
          error{errorCount > 1 ? 's' : ''}
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-1.5 text-yellow-600">
          <span className="font-medium">{warningCount}</span>
          warning{warningCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

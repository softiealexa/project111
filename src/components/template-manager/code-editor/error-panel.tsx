'use client';

import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateValidationError } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ErrorPanelProps {
  errors: TemplateValidationError[];
  currentLine?: number;
  onErrorClick?: (line: number) => void;
  className?: string;
}

export function ErrorPanel({
  errors,
  currentLine,
  onErrorClick,
  className,
}: ErrorPanelProps) {
  if (errors.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-4 text-sm text-muted-foreground border rounded-md bg-muted/50',
          className
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          No errors or warnings
        </span>
      </div>
    );
  }

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return (
    <div className={cn('border rounded-md bg-muted/30', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-destructive">
              <XCircle className="w-4 h-4" />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              {warningCount} warning{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {errors.length} issue{errors.length > 1 ? 's' : ''}
        </span>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="divide-y">
          {errors.map((error, index) => (
            <button
              key={index}
              onClick={() => error.line && onErrorClick?.(error.line)}
              className={cn(
                'w-full flex items-start gap-3 p-3 text-left text-sm hover:bg-muted/50 transition-colors',
                error.line === currentLine && 'bg-muted'
              )}
            >
              {error.severity === 'error' ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {error.line && (
                    <span className="text-xs font-mono text-muted-foreground">
                      Line {error.line}
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium uppercase',
                      error.severity === 'error'
                        ? 'text-destructive'
                        : 'text-yellow-600'
                    )}
                  >
                    {error.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-foreground">{error.message}</p>
                {error.field && error.field !== 'root' && (
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {error.field}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

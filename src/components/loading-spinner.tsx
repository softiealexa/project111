import { Book } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  containerClassName?: string;
  showText?: boolean;
  text?: string;
}

export function LoadingSpinner({
  className,
  containerClassName,
  showText = true,
  text = 'Loading...'
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", containerClassName)}>
      <Book className={cn("h-12 w-12 animate-pulse text-primary", className)} />
      {showText && <p className="text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

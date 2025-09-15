
'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { cn, formatDayWithSuffix } from '@/lib/utils';
import { Maximize, Minimize } from 'lucide-react';

export default function LiveClock() {
  const [date, setDate] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDate(new Date());
    const timerId = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!date) {
    return (
       <div className="hidden sm:flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted px-4 h-[52px] w-[120px] rounded-md">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }
  
  const timeString = format(date, 'h:mm a');
  const dayOfWeekString = format(date, 'eee');
  const monthString = format(date, 'MMM');
  const dayOfMonthString = formatDayWithSuffix(date);
  
  const fullscreenTimeString = format(date, 'h:mm:ss a');
  const fullscreenDateString = format(date, 'EEEE, d MMM, yyyy');


  if (isFullscreen) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 text-center p-4">
        <h1 className="text-8xl md:text-9xl font-bold font-mono tracking-tighter bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
          {fullscreenTimeString}
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground mt-4">
          {fullscreenDateString}
        </p>
         <Button variant="ghost" size="icon" onClick={handleFullscreen} className="absolute top-4 right-4">
            <Minimize className="h-6 w-6" />
            <span className="sr-only">Exit Fullscreen</span>
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div
        onClick={handleFullscreen}
        className="hidden sm:flex flex-col items-center justify-center text-center bg-muted rounded-md px-4 py-1.5 h-auto min-h-[52px] w-[130px] text-foreground cursor-pointer"
      >
        <span className="text-lg font-semibold text-foreground">{timeString}</span>
        <div className="text-xs text-foreground leading-tight">
            <span>{dayOfWeekString}</span>
            <span className="mx-1.5">|</span>
            <span>{dayOfMonthString}</span>
            <span className="mx-1.5">|</span>
            <span>{monthString}</span>
        </div>
      </div>
    </div>
  );
}

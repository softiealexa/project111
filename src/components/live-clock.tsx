'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function LiveClock() {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
    const timerId = setInterval(() => {
      setDate(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (!date) {
    return (
       <div className="hidden sm:flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted px-4 h-[52px] w-[120px] rounded-md">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  const timeString = format(date, 'h:mm a');
  const dateString = format(date, 'eee MMMM do');

  return (
    <div className="hidden sm:flex flex-col items-center justify-center text-center bg-muted rounded-md px-4 py-1.5 h-[52px] w-[120px]">
      <span className="text-lg font-semibold text-foreground">{timeString}</span>
      <span className="text-xs text-muted-foreground">{dateString}</span>
    </div>
  );
}

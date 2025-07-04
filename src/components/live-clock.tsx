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
      <div className="hidden sm:flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted px-4 h-10 w-[140px] rounded-md">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  const formattedString = format(date, 'HH:mm eee dd-MM');

  return (
    <div className="hidden sm:flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted px-4 h-10 rounded-md whitespace-nowrap">
      <span>{formattedString}</span>
    </div>
  );
}

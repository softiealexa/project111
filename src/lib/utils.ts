import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDayWithSuffix(date: Date): string {
    const day = format(date, 'd');
    const dayNum = parseInt(day, 10);

    if (dayNum >= 11 && dayNum <= 13) {
        return `${day}th`;
    }

    switch (dayNum % 10) {
        case 1: return `${day}st`;
        case 2: return `${day}nd`;
        case 3: return `${day}rd`;
        default: return `${day}th`;
    }
}

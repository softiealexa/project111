
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

function CountdownTimer({ date }: { date: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const targetDate = new Date(date);
  const totalDays = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const minutes = differenceInMinutes(targetDate, now) % 60;
  const seconds = differenceInSeconds(targetDate, now) % 60;

  if (now > targetDate) {
    return <span className="text-sm font-semibold text-muted-foreground">Ended</span>;
  }
  
  if (totalDays > 0) {
    return <span className="text-lg font-semibold">{totalDays}<span className="text-sm">d</span> {hours}<span className="text-sm">h</span></span>;
  }

  return (
    <span className="font-semibold tabular-nums text-lg">
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

export default function MiniCountdown() {
    const { activeProfile, setPinnedCountdownId } = useData();
    const router = useRouter();

    const { countdowns, pinnedCountdownId } = useMemo(() => ({
        countdowns: activeProfile?.examCountdowns || [],
        pinnedCountdownId: activeProfile?.pinnedCountdownId || null,
    }), [activeProfile]);

    // Fix: Move the side-effect (setting a default) into useEffect
    useEffect(() => {
        if (!pinnedCountdownId && countdowns.length > 0) {
            setPinnedCountdownId(countdowns[0].id);
        }
    }, [pinnedCountdownId, countdowns, setPinnedCountdownId]);

    const pinnedCountdown = useMemo(() => {
        if (!pinnedCountdownId) return null;
        return countdowns.find(c => c.id === pinnedCountdownId) || null;
    }, [pinnedCountdownId, countdowns]);

    const handleGoToTool = () => {
        router.push('/dashboard?tab=tools');
        // This is a slight hack to ensure the tools tab is active and then set the tool.
        // A more robust solution might involve a global state manager for the active tool.
        setTimeout(() => {
            const toolsTab = document.querySelector('[role="tab"][value="tools"]');
            if (toolsTab) (toolsTab as HTMLElement).click();
            const countdownTool = document.querySelector('[role="tab"][value="countdown"]');
            if (countdownTool) (countdownTool as HTMLElement).click();
        }, 100);
    }

  return (
    <div className="relative group flex flex-col items-center justify-center text-center bg-muted rounded-md px-4 py-1.5 h-auto min-h-[52px] w-[104px] text-foreground">
        {pinnedCountdown ? (
            <>
                <CountdownTimer date={pinnedCountdown.date} />
                <p className="text-xs text-foreground leading-tight truncate w-full">{pinnedCountdown.title}</p>
            </>
        ) : (
            <div className="text-center">
                 <p className="text-xs text-muted-foreground">No countdowns set.</p>
            </div>
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Pin Countdown</DropdownMenuLabel>
                {countdowns.length > 0 ? countdowns.map(c => (
                    <DropdownMenuItem key={c.id} onSelect={() => setPinnedCountdownId(c.id)} disabled={c.id === pinnedCountdownId}>
                        {c.title}
                    </DropdownMenuItem>
                )) : (
                     <DropdownMenuItem disabled>No countdowns available</DropdownMenuItem>
                )}
                 <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleGoToTool}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Manage Countdowns</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

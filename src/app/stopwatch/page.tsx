
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/data-context';
import type { StopwatchSession, StopwatchDaySummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, History, BarChart2, CalendarDays, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { format, formatDuration, intervalToDuration, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, subDays, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';
import Navbar from '@/components/navbar';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TooltipProvider } from '@/components/ui/tooltip';

const formatStopwatchTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

function LiveDigitalClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set the initial time on the client
        setTime(new Date()); 
        
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Render a placeholder on the server and initial client render
    if (!time) {
        return <div className="text-xl font-semibold font-mono">--:--:-- --</div>;
    }

    return <div className="text-xl font-semibold font-mono">{format(time, 'p')}</div>;
}


export default function StopwatchPage() {
  const {
    stopwatchState,
    startStopwatch,
    stopStopwatch,
    resetStopwatch,
    getSummaryForDate,
    getSessionsForDate,
    getAllSummaries,
  } = useData();

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (stopwatchState.isRunning) {
      timer = setInterval(() => {
        setTicker(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stopwatchState.isRunning]);

  const currentDaySummary = useMemo(() => getSummaryForDate(startOfDay(new Date())), [getSummaryForDate, stopwatchState.lastUpdate]);
  const selectedDaySummary = useMemo(() => getSummaryForDate(selectedDate), [getSummaryForDate, selectedDate, stopwatchState.lastUpdate]);
  const selectedDaySessions = useMemo(() => getSessionsForDate(selectedDate), [getSessionsForDate, selectedDate, stopwatchState.lastUpdate]);

  const elapsedTime = useMemo(() => {
    if (!stopwatchState.isRunning || !stopwatchState.startTime) return 0;
    return Math.floor((Date.now() - stopwatchState.startTime) / 1000);
  }, [stopwatchState.isRunning, stopwatchState.startTime, ticker]);

  const totalStudyTimeToday = (currentDaySummary?.totalStudyTime || 0) + (stopwatchState.currentSessionType === 'study' ? elapsedTime : 0);

  const modifiers = {
    hasData: (date: Date) => !!getSummaryForDate(date),
  };
  const modifiersClassNames = {
    hasData: 'has-data',
  };

  const allSummaries = getAllSummaries();

  const weeklyReport = useMemo(() => {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start, end });
      return weekDays.map(day => {
          const summary = allSummaries[format(day, 'yyyy-MM-dd')];
          return {
              name: format(day, 'EEE'),
              study: (summary?.totalStudyTime || 0) / 3600, // in hours
              break: (summary?.totalBreakTime || 0) / 3600, // in hours
          }
      });
  }, [selectedDate, allSummaries]);

  const monthlyReport = useMemo(() => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const monthDays = eachDayOfInterval({ start, end });
      return monthDays.map(day => {
          const summary = allSummaries[format(day, 'yyyy-MM-dd')];
          return {
              name: format(day, 'd'),
              study: (summary?.totalStudyTime || 0) / 3600, // in hours
          }
      });
  }, [selectedDate, allSummaries]);

  const chartConfig = {
      study: { label: "Study", color: "hsl(var(--primary))" },
      break: { label: "Break", color: "hsl(var(--muted-foreground))" },
  };


  return (
    <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-muted/40">
            <Navbar />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Card className="overflow-hidden">
                        <div className="bg-card grid grid-cols-1 md:grid-cols-3">
                            <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
                                <CardDescription>Current Time</CardDescription>
                                <LiveDigitalClock />
                            </div>
                            <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
                                <CardDescription>
                                    {stopwatchState.currentSessionType === 'study' ? 'Studying' : 'On Break'}
                                </CardDescription>
                                <div className="text-5xl font-bold font-mono tracking-tighter">
                                    {formatStopwatchTime(elapsedTime)}
                                </div>
                            </div>
                            <div className="p-6 flex flex-col items-center justify-center bg-primary/5">
                                <CardDescription>Total Study Time Today</CardDescription>
                                <div className="text-3xl font-bold font-mono tracking-tighter">
                                    {formatStopwatchTime(totalStudyTimeToday)}
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center items-center gap-4">
                                {stopwatchState.isRunning ? (
                                    <Button size="lg" className="w-40" onClick={stopStopwatch}>
                                        <Pause className="mr-2 h-5 w-5" />
                                        {stopwatchState.currentSessionType === 'study' ? 'Take Break' : 'End Break'}
                                    </Button>
                                ) : (
                                    <Button size="lg" className="w-40" onClick={startStopwatch}>
                                        <Play className="mr-2 h-5 w-5" />
                                        Start Studying
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={resetStopwatch}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Day
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Daily Log</CardTitle>
                                        <CardDescription>Breakdown of your activity for the selected day.</CardDescription>
                                    </div>
                                    <div className='flex items-center rounded-md border bg-card text-sm flex-shrink-0'>
                                        <Button variant="ghost" onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="rounded-r-none h-9"><ChevronLeft className="mr-1 h-4 w-4"/> Prev</Button>
                                        <Button variant="ghost" onClick={() => setSelectedDate(new Date())} className="rounded-none border-x h-9">Today</Button>
                                        <Button variant="ghost" onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="rounded-l-none h-9">Next <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                                        <div className="rounded-lg border p-3">
                                            <p className="text-sm text-muted-foreground">Total Study</p>
                                            <p className="text-2xl font-bold font-mono">{formatStopwatchTime(selectedDaySummary?.totalStudyTime || 0)}</p>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-sm text-muted-foreground">Total Break</p>
                                            <p className="text-2xl font-bold font-mono">{formatStopwatchTime(selectedDaySummary?.totalBreakTime || 0)}</p>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-sm text-muted-foreground">Study Sessions</p>
                                            <p className="text-2xl font-bold">{selectedDaySummary?.sessionCount || 0}</p>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-sm text-muted-foreground">Longest Streak</p>
                                            <p className="text-2xl font-bold font-mono">{formatStopwatchTime(selectedDaySummary?.longestStreak || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {selectedDaySessions.length > 0 ? selectedDaySessions.map(session => (
                                            <div key={session.id} className={cn("flex items-center gap-4 p-3 rounded-md border", session.type === 'study' ? 'bg-primary/5 border-primary/20' : 'bg-muted/50')}>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
                                                    {session.type === 'study' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold capitalize">{session.type} Session</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(session.startTime), 'p')} - {format(new Date(session.endTime), 'p')}
                                                    </p>
                                                </div>
                                                <p className="font-mono font-semibold">{formatStopwatchTime(session.duration)}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center py-10 text-muted-foreground">No sessions recorded for this day.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Weekly Report</CardTitle>
                                    <CardDescription>Study vs. break hours for the week of {format(startOfWeek(selectedDate, {weekStartsOn: 1}), 'MMM d')}.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-64">
                                        <BarChart data={weeklyReport} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis unit="h" />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="study" fill="hsl(var(--primary))" radius={4} />
                                            <Bar dataKey="break" fill="hsl(var(--muted-foreground))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly Report</CardTitle>
                                    <CardDescription>Total study hours for each day in {format(selectedDate, 'MMMM yyyy')}.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-64">
                                        <BarChart data={monthlyReport} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis unit="h" />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="study" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 flex justify-center">
                            <style>{`.has-data:not([aria-selected]) { 
                                font-weight: bold;
                                background-color: hsl(var(--primary) / 0.1);
                            }`}</style>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(day) => day && setSelectedDate(day)}
                                className="rounded-md border bg-card"
                                modifiers={modifiers}
                                modifiersClassNames={modifiersClassNames}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </TooltipProvider>
  );
}

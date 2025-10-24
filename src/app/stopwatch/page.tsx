
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useData } from '@/contexts/data-context';
import type { StopwatchSession, StopwatchDaySummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, History, BarChart2, CalendarDays, ChevronLeft, ChevronRight, Moon, Sun, Plus, Maximize, Minimize, Target, BarChart, Package } from 'lucide-react';
import { format, formatDuration, intervalToDuration, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, subDays, addDays, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, Label, Cell } from 'recharts';
import Navbar from '@/components/navbar';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getIconComponent } from '@/lib/icons';


const formatStopwatchTime = (seconds: number, showMs = false) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds * 1000) % 1000);

  const parts = [
    h > 0 ? h.toString().padStart(2, '0') : null,
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].filter(Boolean);

  let timeStr = parts.join(':');
  
  if (showMs) {
    timeStr += `.${ms.toString().padStart(3, '0')}`;
  }

  return timeStr;
};

const parseDurationToSeconds = (hours: string, minutes: string): number => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    return h * 3600 + m * 60;
};


function LiveDigitalClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date()); 
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) {
        return <div className="text-xl font-semibold font-mono">--:--:-- --</div>;
    }

    return <div className="text-xl font-semibold font-mono">{format(time, 'p')}</div>;
}


const ManualEntryDialog = ({ onSave }: { onSave: (duration: number, type: 'study' | 'break', subject: string | null) => void }) => {
    const { activeProfile } = useData();
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [type, setType] = useState<'study' | 'break'>('study');
    const [subject, setSubject] = useState<string | null>(null);

    const handleSave = () => {
        const durationInSeconds = parseDurationToSeconds(hours, minutes);
        if (durationInSeconds > 0) {
            onSave(durationInSeconds, type, type === 'study' ? subject : null);
            setOpen(false);
            setHours('');
            setMinutes('');
        }
    };

     useEffect(() => {
        if (!open) {
            setSubject(null);
            setType('study');
        }
    }, [open]);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/> Manual Entry</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Manual Time Entry</DialogTitle>
                    <DialogDescription>Log a session that you forgot to time.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
                        <Input placeholder="Minutes" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                    </div>
                     <Select value={type} onValueChange={(v: 'study' | 'break') => setType(v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="study">Study Session</SelectItem>
                            <SelectItem value="break">Break</SelectItem>
                        </SelectContent>
                    </Select>
                    {type === 'study' && activeProfile?.subjects && activeProfile.subjects.length > 0 && (
                        <Select value={subject || ''} onValueChange={(v) => setSubject(v === 'no-subject' ? null : v)}>
                            <SelectTrigger><SelectValue placeholder="Select a subject (optional)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-subject">No Subject</SelectItem>
                                {activeProfile.subjects.map(s => (
                                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Entry</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const GoalDialog = ({ currentGoal, onSave }: { currentGoal: number, onSave: (newGoal: number) => void }) => {
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState(Math.floor(currentGoal / 3600).toString());

    useEffect(() => {
        setHours(Math.floor(currentGoal / 3600).toString());
    }, [currentGoal, open]);

    const handleSave = () => {
        const goalInSeconds = parseDurationToSeconds(hours, '0');
        onSave(goalInSeconds);
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Target className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Set Daily Study Goal</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <label htmlFor="goal-hours" className="text-sm font-medium">Goal (in hours)</label>
                    <Input id="goal-hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Set Goal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
    addStopwatchLap,
    activeProfile,
    setStopwatchStudyGoal,
    addManualStopwatchSession,
  } = useData();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [ticker, setTicker] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(startOfDay(new Date()));
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (stopwatchState.isRunning) {
      timer = setInterval(() => {
        setTicker(prev => prev + 1);
      }, 50); // Update more frequently for smoother ms display
    }
    return () => clearInterval(timer);
  }, [stopwatchState.isRunning]);

  const currentDaySummary = useMemo(() => getSummaryForDate(startOfDay(new Date())), [getSummaryForDate, stopwatchState.lastUpdate]);
  const selectedDaySummary = useMemo(() => selectedDate ? getSummaryForDate(selectedDate) : null, [getSummaryForDate, selectedDate, stopwatchState.lastUpdate]);
  const selectedDaySessions = useMemo(() => selectedDate ? getSessionsForDate(selectedDate) : [], [getSessionsForDate, selectedDate, stopwatchState.lastUpdate]);
  const dailyGoal = useMemo(() => activeProfile?.stopwatchStudyGoal || 0, [activeProfile]);

  const elapsedTime = useMemo(() => {
    if (!stopwatchState.isRunning || !stopwatchState.startTime) return 0;
    return (Date.now() - stopwatchState.startTime) / 1000;
  }, [stopwatchState.isRunning, stopwatchState.startTime, ticker]);

  const totalStudyTimeToday = (currentDaySummary?.totalStudyTime || 0) + (stopwatchState.currentSessionType === 'study' ? elapsedTime : 0);
  const goalProgress = dailyGoal > 0 ? (totalStudyTimeToday / dailyGoal) * 100 : 0;

  const currentSessionLaps = useMemo(() => {
    if (!stopwatchState.currentSessionId) return [];
    const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const todaySessions = activeProfile?.stopwatchSessions?.[todayKey] || [];
    const currentSession = todaySessions.find(s => s.id === stopwatchState.currentSessionId);
    return currentSession?.laps || [];
  }, [stopwatchState.currentSessionId, stopwatchState.lastUpdate, activeProfile?.stopwatchSessions]);


  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
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

  const allSummaries = getAllSummaries();
  
  const weeklyReport = useMemo(() => {
      const start = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start, end });
      return weekDays.map(day => {
          const summary = allSummaries[format(day, 'yyyy-MM-dd')];
          return {
              name: format(day, 'EEE'),
              study: (summary?.totalStudyTime || 0) / 3600,
              break: (summary?.totalBreakTime || 0) / 3600,
          }
      });
  }, [selectedDate, allSummaries]);

  const weeklySubjectBreakdown = useMemo(() => {
      if (!selectedDate) return [];

      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start, end });
      const subjectTime: Record<string, number> = {};

      weekDays.forEach(day => {
          const sessions = getSessionsForDate(day);
          sessions.forEach(session => {
              if (session.type === 'study' && session.subject) {
                  if (!subjectTime[session.subject]) subjectTime[session.subject] = 0;
                  subjectTime[session.subject] += session.duration;
              }
          });
      });
      
      const colors = ["hsl(180, 80%, 55%)", "hsl(221, 83%, 65%)", "hsl(262, 85%, 68%)", "hsl(24, 96%, 63%)", "hsl(142, 76%, 46%)"];
      
      return Object.entries(subjectTime).map(([subject, time], index) => ({
          name: subject,
          time: time / 3600,
          fill: colors[index % colors.length]
      })).sort((a,b) => b.time - a.time);

  }, [selectedDate, activeProfile, stopwatchState.lastUpdate]);

  const monthlyReport = useMemo(() => {
      const start = startOfMonth(selectedDate || new Date());
      const end = endOfMonth(selectedDate || new Date());
      const monthDays = eachDayOfInterval({ start, end });
      return monthDays.map(day => {
          const summary = allSummaries[format(day, 'yyyy-MM-dd')];
          return { name: format(day, 'd'), study: (summary?.totalStudyTime || 0) / 3600 }
      });
  }, [selectedDate, allSummaries]);

  const chartConfig = {
      study: { label: "Study", color: "hsl(var(--primary))" },
      break: { label: "Break", color: "hsl(var(--muted-foreground))" },
  };
  
  const subjectChartConfig = weeklySubjectBreakdown.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.fill };
      return acc;
  }, {} as any);

  return (
    <TooltipProvider>
        <div ref={containerRef} className={cn("flex flex-col min-h-screen", isFullscreen ? "bg-background fixed inset-0 z-50" : "bg-muted/40")}>
            {isFullscreen ? (
                <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
                    <h2 className="text-3xl md:text-4xl text-muted-foreground mb-8 capitalize">{stopwatchState.currentSessionType} Session</h2>
                    <div className="font-mono text-8xl md:text-9xl font-bold tracking-tighter bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
                        {formatStopwatchTime(elapsedTime)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleFullscreen} className="absolute top-4 right-4">
                        <Minimize className="h-6 w-6" />
                        <span className="sr-only">Exit Fullscreen</span>
                    </Button>
                </div>
            ) : (
            <>
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
                                        {formatStopwatchTime(elapsedTime, true)}
                                    </div>
                                </div>
                                 <div className="p-6 flex flex-col items-center justify-center bg-primary/5">
                                    <div className="flex items-center gap-2">
                                        <CardDescription>Total Study Time Today</CardDescription>
                                        <GoalDialog currentGoal={dailyGoal} onSave={setStopwatchStudyGoal} />
                                    </div>
                                    <div className="text-3xl font-bold font-mono tracking-tighter">
                                        {formatStopwatchTime(totalStudyTimeToday)}
                                    </div>
                                    {dailyGoal > 0 && (
                                        <div className="w-full max-w-[200px] mt-2">
                                            <Progress value={goalProgress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1 text-center">{Math.round(goalProgress)}% of {formatStopwatchTime(dailyGoal)} goal</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-6 text-center">
                                <div className="flex justify-center items-center gap-4 flex-wrap">
                                    {stopwatchState.isRunning ? (
                                        <Button size="lg" className="w-40 transform transition-transform duration-200 hover:scale-105" onClick={stopStopwatch}>
                                            <Pause className="mr-2 h-5 w-5" />
                                            {stopwatchState.currentSessionType === 'study' ? 'Take Break' : 'End Break'}
                                        </Button>
                                    ) : (
                                        <>
                                            <Button size="lg" className="w-40 transform transition-transform duration-200 hover:scale-105" onClick={() => startStopwatch(selectedSubject)}>
                                                <Play className="mr-2 h-5 w-5" />
                                                Start Studying
                                            </Button>
                                            {activeProfile?.subjects && activeProfile.subjects.length > 0 && (
                                                <Select value={selectedSubject || ''} onValueChange={(v) => setSelectedSubject(v === 'no-subject' ? null : v)}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select a subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="no-subject">No Subject</SelectItem>
                                                        {activeProfile.subjects.map(s => (
                                                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </>
                                    )}
                                    {stopwatchState.isRunning && stopwatchState.currentSessionType === 'study' && (
                                        <Button size="lg" variant="outline" onClick={addStopwatchLap}>Lap</Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="outline">
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset Day
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete all stopwatch data for today and cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={resetStopwatch}>Confirm</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button size="icon" variant="ghost" onClick={handleFullscreen} className="ml-4"><Maximize className="h-5 w-5"/></Button>
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
                                        <div className="flex items-center gap-2">
                                            <ManualEntryDialog onSave={addManualStopwatchSession} />
                                            <div className='flex items-center rounded-md border bg-card text-sm flex-shrink-0'>
                                                <Button variant="ghost" onClick={() => setSelectedDate(subDays(selectedDate || new Date(), 1))} className="rounded-r-none h-9"><ChevronLeft className="mr-1 h-4 w-4"/> Prev</Button>
                                                <Button variant="ghost" onClick={() => setSelectedDate(new Date())} className="rounded-none border-x h-9">Today</Button>
                                                <Button variant="ghost" onClick={() => setSelectedDate(addDays(selectedDate || new Date(), 1))} className="rounded-l-none h-9">Next <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                            </div>
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
                                            {selectedDaySessions.map(session => {
                                                const Icon = session.subject ? getIconComponent(activeProfile?.subjects.find(s=>s.name === session.subject)?.icon) : Package;
                                                return (
                                                    <div key={session.id} className={cn("flex items-center gap-4 p-3 rounded-md border", session.type === 'study' ? 'bg-primary/5 border-primary/20' : 'bg-muted/50')}>
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
                                                            {session.type === 'study' ? <Icon className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold capitalize">{session.type} Session {session.manual && '(Manual)'}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(session.startTime), 'p')} - {format(new Date(session.endTime), 'p')}
                                                                {session.subject && <span className="font-medium text-primary/80"> • {session.subject}</span>}
                                                            </p>
                                                        </div>
                                                        <p className="font-mono font-semibold">{formatStopwatchTime(session.duration)}</p>
                                                    </div>
                                                )
                                            })}
                                            {selectedDate && isSameDay(selectedDate, new Date()) && currentSessionLaps.length > 0 && (
                                                 <div className="p-3 rounded-md border bg-muted/50">
                                                    <p className="font-semibold text-sm mb-2">Current Session Laps</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {currentSessionLaps.map((lap, i) => (
                                                            <div key={i} className="text-xs flex justify-between bg-background p-1.5 rounded">
                                                                <span className="text-muted-foreground">Lap {i + 1}:</span>
                                                                <span className="font-mono font-medium">{formatStopwatchTime(lap)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                 </div>
                                            )}
                                            {selectedDaySessions.length === 0 && (
                                                <div className="text-center py-10 text-muted-foreground">No sessions recorded for this day.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Weekly Report</CardTitle>
                                        <CardDescription>Study vs. break hours for the week of {format(startOfWeek(selectedDate || new Date(), {weekStartsOn: 1}), 'MMM d')}.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-64">
                                            <RechartsBarChart data={weeklyReport} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                                <YAxis unit="h" />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="study" fill="hsl(var(--primary))" radius={4} />
                                                <Bar dataKey="break" fill="hsl(var(--muted-foreground))" radius={4} />
                                            </RechartsBarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Weekly Subject Breakdown</CardTitle>
                                        <CardDescription>Time spent per subject for the week of {format(startOfWeek(selectedDate || new Date(), {weekStartsOn: 1}), 'MMM d')}.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {weeklySubjectBreakdown.length > 0 ? (
                                            <ChartContainer config={subjectChartConfig} className="h-64">
                                                <RechartsBarChart data={weeklySubjectBreakdown} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                    <CartesianGrid horizontal={false} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} className="text-xs truncate"/>
                                                    <ChartTooltip 
                                                        cursor={{fill: 'hsl(var(--muted))'}}
                                                        content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)} hours`} />} 
                                                    />
                                                    <Bar dataKey="time" radius={4}>
                                                        {weeklySubjectBreakdown.map((entry, index) => (
                                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </RechartsBarChart>
                                            </ChartContainer>
                                        ) : (
                                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                                No subject-specific study time recorded this week.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Report</CardTitle>
                                        <CardDescription>Total study hours for each day in {selectedDate ? format(selectedDate, 'MMMM yyyy') : ''}.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-64">
                                            <RechartsBarChart data={monthlyReport} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                                                <YAxis unit="h" />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="study" fill="hsl(var(--primary))" radius={4} />
                                            </RechartsBarChart>
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
                                    modifiers={{ hasData: (date: Date) => !!getAllSummaries()[format(date, 'yyyy-MM-dd')] }}
                                    modifiersClassNames={{ hasData: 'has-data' }}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </>
            )}
        </div>
    </TooltipProvider>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Clock,
  Calendar,
  BarChart3,
  ListTodo,
  FileText,
  DollarSign,
  Coffee,
  LayoutGrid,
  BarChart2,
  Activity,
  Briefcase,
  Users,
  Play,
  MoreVertical,
  Tag,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/data-context';
import type { TimeEntry } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeEntryGroup {
    day: string;
    total: number; // in seconds
    items: TimeEntry[];
}

const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatDurationShort = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (h > 0) {
        return `${h.toString()}:${m.toString().padStart(2, '0')}`;
    }
    return `0:${m.toString().padStart(2, '0')}`;
};

const formatTimeRange = (start: number, end: number | null) => {
    const formatOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const startTimeStr = new Date(start).toLocaleTimeString([], formatOpts).replace(' ', '');
    const endTimeStr = end ? new Date(end).toLocaleTimeString([], formatOpts).replace(' ', '') : 'Now';
    return `${startTimeStr} - ${endTimeStr}`;
}

const parseTimeToSeconds = (time: string): number => {
    if (!time) return 0;
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 3600 + minutes * 60;
};

const formatSecondsToTime = (seconds: number): string => {
    if (seconds === 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const PlaceholderContent = ({ title }: { title: string }) => (
    <Card className="m-4 sm:m-6">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                <p className="text-lg font-medium text-muted-foreground">This feature is not yet implemented.</p>
                <p className="text-sm text-muted-foreground">Check back for future updates!</p>
            </div>
        </CardContent>
    </Card>
);

const TimesheetView = () => {
  type TimeRange = 'Day' | 'Week';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('Week');

  const [timesheetData, setTimesheetData] = useState([
    { project: 'Project Y', color: 'bg-blue-500', times: { '2024-02-11': 28800 } },
    { project: 'Project X', color: 'bg-pink-500', times: { '2024-02-12': 14400, '2024-02-13': 14400 } },
    { project: 'Office', color: 'bg-orange-500', times: { '2024-02-13': 9000, '2024-02-14': 21600 } },
    { project: 'Break', color: 'bg-gray-500', times: { '2024-02-11': 1800, '2024-02-12': 1800, '2024-02-13': 1800, '2024-02-14': 1800 } },
  ]);

  const daysToDisplay = useMemo(() => {
    if (timeRange === 'Day') {
        return [currentDate];
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate, timeRange]);

  const handleTimeChange = (projectIndex: number, day: Date, value: string) => {
    const newTimesheetData = [...timesheetData];
    const dayKey = format(day, 'yyyy-MM-dd');
    const seconds = parseTimeToSeconds(value);
    newTimesheetData[projectIndex].times[dayKey] = seconds;
    setTimesheetData(newTimesheetData);
  };
  
  const dailyTotals = useMemo(() => {
    return daysToDisplay.map(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        return timesheetData.reduce((total, row) => total + (row.times[dayKey] || 0), 0);
    })
  }, [daysToDisplay, timesheetData]);

  const projectTotals = useMemo(() => {
    const relevantDayKeys = daysToDisplay.map(d => format(d, 'yyyy-MM-dd'));
    return timesheetData.map(row => {
        return relevantDayKeys.reduce((total, dayKey) => total + (row.times[dayKey] || 0), 0)
    });
  }, [timesheetData, daysToDisplay]);

  const grandTotal = useMemo(() => dailyTotals.reduce((total, dayTotal) => total + dayTotal, 0), [dailyTotals]);
  
  const goToNext = () => {
    switch(timeRange) {
        case 'Day': 
            setCurrentDate(addDays(currentDate, 1)); 
            break;
        case 'Week': 
            setCurrentDate(addDays(currentDate, 7)); 
            break;
    }
  };
  const goToPrev = () => {
     switch(timeRange) {
        case 'Day': 
            setCurrentDate(subDays(currentDate, 1)); 
            break;
        case 'Week': 
            setCurrentDate(subDays(currentDate, 7)); 
            break;
    }
  };
  
  const gridTemplateColumns = timeRange === 'Day' 
    ? 'grid-cols-[200px_1fr_100px]'
    : 'grid-cols-[200px_repeat(7,1fr)_100px]';

  const minWidth = timeRange === 'Day' ? 'min-w-[400px]' : 'min-w-[900px]';

  return (
    <div className="p-4 sm:p-6 bg-muted/30 flex-1">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <h1 className="text-2xl font-semibold">Timesheet</h1>
            <div className="flex items-center gap-2">
                <Select defaultValue="teammates">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="teammates">Teammates</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Week">Week</SelectItem>
                    </SelectContent>
                </Select>
                <div className='flex items-center rounded-md border bg-card'>
                    <Button variant="ghost" size="icon" onClick={goToPrev} className="rounded-r-none"><ChevronLeft className="h-5 w-5" /></Button>
                    <Button variant="ghost" className="rounded-none border-x" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={goToNext} className="rounded-l-none"><ChevronRight className="h-5 w-5" /></Button>
                </div>
            </div>
        </div>

        <div className="bg-card border rounded-lg overflow-x-auto">
            <div className={cn("grid", gridTemplateColumns, minWidth)}>
                {/* Header */}
                <div className="p-3 font-semibold text-muted-foreground border-b border-r">Projects</div>
                {daysToDisplay.map(day => (
                    <div key={day.toISOString()} className="p-3 font-semibold text-muted-foreground border-b text-center">
                        {format(day, 'EEE, MMM d')}
                    </div>
                ))}
                <div className="p-3 font-semibold text-muted-foreground border-b border-l text-right">Total</div>

                {/* Body */}
                {timesheetData.map((row, projectIndex) => (
                    <React.Fragment key={projectIndex}>
                        <div className="p-3 border-b border-r flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", row.color)}></span>
                            <span className="font-medium">{row.project}</span>
                        </div>
                        {daysToDisplay.map((day, dayIndex) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            return (
                                <div key={dayIndex} className={cn("p-2 border-b", (day.getDay() === 6 || day.getDay() === 0) && "bg-muted/50")}>
                                    <Input 
                                        className="text-center border-none focus-visible:ring-1 focus-visible:ring-primary"
                                        value={formatSecondsToTime(row.times[dayKey] || 0)}
                                        onChange={(e) => handleTimeChange(projectIndex, day, e.target.value)}
                                        placeholder="00:00"
                                    />
                                </div>
                            )
                        })}
                        <div className="p-3 border-b border-l font-semibold text-right text-muted-foreground">
                            {formatSecondsToTime(projectTotals[projectIndex]) || '00:00'}
                        </div>
                    </React.Fragment>
                ))}

                 {/* Select Project Row */}
                <React.Fragment>
                    <div className="p-3 border-b border-r flex items-center">
                        <Button variant="link" className="p-0 h-auto">
                            <Plus className="h-4 w-4 mr-2"/> Select project
                        </Button>
                    </div>
                    {daysToDisplay.map((day, dayIndex) => (
                        <div key={dayIndex} className={cn("p-2 border-b", (day.getDay() === 6 || day.getDay() === 0) && "bg-muted/50")}>
                            <Input className="text-center border-none" disabled placeholder="00:00" />
                        </div>
                    ))}
                    <div className="p-3 border-b border-l font-semibold text-right text-muted-foreground">00:00</div>
                </React.Fragment>


                {/* Footer */}
                <div className="p-3 border-r bg-muted/50 font-bold">Total</div>
                {dailyTotals.map((total, index) => (
                    <div key={index} className="p-3 bg-muted/50 font-bold text-center">
                       {formatSecondsToTime(total) || '00:00'}
                    </div>
                ))}
                 <div className="p-3 border-l bg-muted/50 font-bold text-right">
                    {formatSecondsToTime(grandTotal) || '00:00'}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add new row</Button>
            <Button variant="outline"><Copy className="mr-2 h-4 w-4" /> Copy last week</Button>
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as template</Button>
        </div>
    </div>
  )
}

export default function ClockifyPage() {
  const { activeProfile, addTimeEntry, deleteTimeEntry } = useData();
  const [activeMenu, setActiveMenu] = useState('Time Tracker');
  const [task, setTask] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const timeEntries = activeProfile?.timeEntries || [];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setTimerRunning(false);
    if (startTime && elapsedTime > 0 && addTimeEntry) {
        addTimeEntry({
            task: task || 'Unspecified Task',
            project: 'Office',
            projectColor: 'text-blue-500',
            tags: [],
            billable: true,
            startTime: startTime,
            endTime: Date.now(),
            duration: Math.round(elapsedTime),
        });
    }
    setElapsedTime(0);
    setTask('');
    setStartTime(null);
  }, [startTime, elapsedTime, task, addTimeEntry]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
    const now = Date.now();
    setStartTime(now);
    setTimerRunning(true);
    setElapsedTime(0);
    
    timerRef.current = setInterval(() => {
        const currentElapsed = Math.round((Date.now() - now) / 1000);
        setElapsedTime(currentElapsed);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { 
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, []);
  
  const handleToggleTimer = () => {
    if (timerRunning) {
        stopTimer();
    } else {
        startTimer();
    }
  };
  
  const handleDeleteEntry = (id: string) => {
    if (deleteTimeEntry) {
      deleteTimeEntry(id);
    }
  };
  
  const handleResumeEntry = (entryToResume: TimeEntry) => {
    if (timerRunning) {
      // Allow seamless switching by stopping the current timer first
      stopTimer();
    }
    setTask(entryToResume.task);
    // Use a small timeout to ensure state update completes before starting new timer
    setTimeout(() => {
      startTimer();
    }, 100);
  };
  
  const timeEntryGroups = timeEntries.reduce<TimeEntryGroup[]>((acc, entry) => {
    const day = new Date(entry.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let group = acc.find(g => g.day === day);
    if (!group) {
        group = { day: 'Today', total: 0, items: [] };
        if (new Date(entry.startTime).toDateString() !== new Date().toDateString()) {
             group.day = day;
        }
        acc.push(group);
    }
    group.items.push(entry);
    group.total += entry.duration;
    return acc;
  }, []);

  const weekTotal = timeEntries.reduce((acc, entry) => acc + entry.duration, 0);

  const renderContent = () => {
    switch (activeMenu) {
      case 'Time Tracker':
        return (
          <div className="flex-1 p-4 sm:p-6 bg-muted/30">
              <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Under Development</AlertTitle>
                  <AlertDescription>
                      This page is currently under development. It contains more bugs than features.
                  </AlertDescription>
              </Alert>
              <div className="shadow-sm border bg-card">
                  <div className="flex flex-wrap items-center gap-4 p-2">
                      <Input 
                          placeholder="What are you working on?" 
                          className="flex-1 min-w-[200px] border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                      />
                      <Button variant="outline" className="text-primary hover:text-primary hover:bg-primary/10">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Project
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="icon">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <span className="font-semibold text-lg font-mono ml-auto">{formatDuration(elapsedTime)}</span>
                      <Button 
                          className="w-24"
                          onClick={handleToggleTimer}
                      >
                          {timerRunning ? 'STOP' : 'START'}
                      </Button>
                       <Button variant="ghost" size="icon">
                          <ListTodo className="h-5 w-5 text-muted-foreground" />
                      </Button>
                  </div>
              </div>
              <div className="mt-6 space-y-6">
                  <div className="flex justify-between items-center text-sm px-4">
                      <span className="font-semibold">This Week</span>
                      <span className="text-muted-foreground">Week total: <span className="font-semibold text-foreground">{formatDuration(weekTotal)}</span></span>
                  </div>

                  {timeEntryGroups.length === 0 && (
                      <div className="text-center text-muted-foreground py-10">
                          <p>No time entries yet. Start the timer to log your work.</p>
                      </div>
                  )}

                  {timeEntryGroups.map((group, groupIndex) => (
                      <div key={groupIndex}>
                          <div className="flex justify-between items-center text-sm bg-muted/60 p-2 px-4 border-y">
                              <span className="font-semibold">{group.day}</span>
                              <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatDurationShort(group.total)}</span></span>
                          </div>
                          <div className="space-y-px bg-card">
                              {group.items.map((item) => (
                                  <div key={item.id} className="p-3 border-b last:border-b-0 shadow-sm hover:bg-muted/50">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1">
                                              <span>{item.task}</span>
                                              {item.project && <span className={cn('ml-2 font-semibold', item.projectColor)}>• {item.project}</span>}
                                          </div>
                                          <div className="hidden sm:flex items-center gap-2">
                                              {item.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <DollarSign className={`h-4 w-4 ${item.billable ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                          </Button>
                                          <span className="hidden lg:inline-block text-sm text-muted-foreground w-40 text-center">{formatTimeRange(item.startTime, item.endTime)}</span>
                                          <span className="font-bold w-20 text-right">{formatDurationShort(item.duration)}</span>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResumeEntry(item)}>
                                              <Play className="h-4 w-4" />
                                          </Button>
                                          <div className="relative group">
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                  <MoreVertical className="h-4 w-4" />
                                              </Button>
                                              <div className="absolute right-0 top-full mt-1 w-32 bg-card border rounded-md shadow-lg z-10 hidden group-hover:block">
                                                  <Button variant="ghost" className="w-full justify-start text-sm text-red-500 hover:text-red-500" onClick={() => handleDeleteEntry(item.id)}>
                                                      <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        );
      case 'Timesheet':
        return <TimesheetView />;
      default:
        return <PlaceholderContent title={activeMenu} />;
    }
  };

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 px-2">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                    </Button>
                    <h2 className="text-lg font-semibold text-foreground">Clockify</h2>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Dashboard">
                          <Link href="/dashboard">
                            <LayoutGrid />
                            <span>Dashboard</span>
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Time Tracker')} isActive={activeMenu === 'Time Tracker'} tooltip="Time Tracker">
                            <Clock />
                            <span>Time Tracker</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Calendar')} isActive={activeMenu === 'Calendar'} tooltip="Calendar">
                            <Calendar />
                            <span>Calendar</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Timesheet')} isActive={activeMenu === 'Timesheet'} tooltip="Timesheet">
                            <ListTodo />
                            <span>Timesheet</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Kiosk')} disabled tooltip="Kiosk">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                            <span>Kiosk</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Reports')} isActive={activeMenu === 'Reports'} tooltip="Reports">
                            <BarChart2 />
                            <span>Reports</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Projects')} isActive={activeMenu === 'Projects'} tooltip="Projects">
                            <Briefcase />
                            <span>Projects</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Expenses')} isActive={activeMenu === 'Expenses'} tooltip="Expenses">
                            <FileText />
                            <span>Expenses</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Invoices')} disabled tooltip="Invoices">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                           <span>Invoices</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Team')} isActive={activeMenu === 'Team'} tooltip="Team">
                            <Users />
                            <span>Team</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Time Off')} isActive={activeMenu === 'Time Off'} tooltip="Time Off">
                            <Coffee />
                            <span>Time Off</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Schedule')} isActive={activeMenu === 'Schedule'} tooltip="Schedule">
                            <BarChart3 />
                            <span>Schedule</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold">{activeMenu}</h1>
                </div>
            </header>
            <main className="flex-1 bg-muted/30 flex flex-col">
                {renderContent()}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

    

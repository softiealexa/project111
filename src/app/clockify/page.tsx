
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TimeEntry {
    id: string;
    task: string;
    project: string;
    projectColor: string;
    tags: string[];
    billable: boolean;
    startTime: Date;
    endTime: Date | null;
    duration: number; // in seconds
}

interface TimeEntryGroup {
    day: string;
    total: number; // in seconds
    items: TimeEntry[];
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatDurationShort = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h.toString()}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString()}:${s.toString().padStart(2, '0')}`;
};

const formatTimeRange = (start: Date, end: Date | null) => {
    const formatOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const startTimeStr = start.toLocaleTimeString([], formatOpts).replace(' ', '');
    const endTimeStr = end ? end.toLocaleTimeString([], formatOpts).replace(' ', '') : 'Now';
    return `${startTimeStr} - ${endTimeStr}`;
}

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

export default function ClockifyPage() {
  const [activeMenu, setActiveMenu] = useState('Time Tracker');
  const [task, setTask] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setTimerRunning(false);
    if (startTime && elapsedTime > 0) {
        const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            task: task || 'Unspecified Task',
            project: 'ACME',
            projectColor: 'text-blue-500',
            tags: [],
            billable: true,
            startTime: startTime,
            endTime: new Date(),
            duration: Math.round(elapsedTime),
        };
        setTimeEntries(prev => [newEntry, ...prev]);
    }
    setElapsedTime(0);
    setTask('');
  }, [startTime, elapsedTime, task]);

  const startTimer = useCallback(() => {
    setStartTime(new Date());
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { // Cleanup on unmount
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
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const timeEntryGroups = timeEntries.reduce<TimeEntryGroup[]>((acc, entry) => {
    const day = entry.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let group = acc.find(g => g.day === day);
    if (!group) {
        group = { day: 'Today', total: 0, items: [] };
        if (entry.startTime.toDateString() !== new Date().toDateString()) {
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
    if (activeMenu === 'Time Tracker') {
      return (
        <div className="flex-1 p-4 sm:p-6 bg-muted/30">
            <div className="shadow-sm border bg-card">
                <div className="flex flex-wrap items-center gap-4 p-2">
                    <Input 
                        placeholder="What are you working on?" 
                        className="flex-1 min-w-[200px] border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                    />
                    <Button variant="outline" className="text-primary hover:text-primary hover:bg-primary/10">
                        <Plus className="mr-2 h-4 w-4" />
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
                    <span className="font-semibold">Jul 1 - Jul 7</span>
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
                            {group.items.map((item, itemIndex) => (
                                <div key={item.id} className="p-3 border-b shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <span>{item.task}</span>
                                            {item.project && <span className={`ml-2 font-semibold ${item.projectColor}`}>• {item.project}</span>}
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2">
                                            {item.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <DollarSign className={`h-4 w-4 ${item.billable ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                        </Button>
                                        <span className="hidden lg:inline-block text-sm text-muted-foreground w-40 text-center">{formatTimeRange(item.startTime, item.endTime)}</span>
                                        <span className="font-bold w-20 text-right">{formatDurationShort(item.duration)}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
    }
    return <PlaceholderContent title={activeMenu} />;
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
            <main className="flex-1 bg-muted/30">
                {renderContent()}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

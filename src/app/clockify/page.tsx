
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
  Pencil,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/data-context';
import type { TimeEntry, Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectDialog } from '@/components/project-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
             <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Feature Not Implemented</AlertTitle>
                <AlertDescription>
                    This section is currently a placeholder. Check back for future updates!
                </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg bg-muted/50">
                <p className="text-lg font-medium text-muted-foreground">Coming Soon</p>
            </div>
        </CardContent>
    </Card>
);

const ProjectDetailsView = ({ project, onBack }: { project: Project, onBack: () => void }) => {
    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold flex items-center gap-3">
                    <span 
                        className="h-5 w-5 rounded-full block" 
                        style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Time Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PlaceholderContent title="Time Tracker Records"/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Timesheet Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PlaceholderContent title="Timesheet Records"/>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const ProjectsView = () => {
    const { activeProfile, deleteProject } = useData();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const projects = useMemo(() => activeProfile?.projects || [], [activeProfile]);
    
    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        return projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, searchTerm]);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingProject(null);
        setDialogOpen(true);
    };

    if (selectedProject) {
        return <ProjectDetailsView project={selectedProject} onBack={() => setSelectedProject(null)} />
    }

    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search projects..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Project
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <span 
                                                className="h-4 w-4 rounded-full block" 
                                                style={{ backgroundColor: project.color }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <button 
                                                className="font-medium hover:underline"
                                                onClick={() => setSelectedProject(project)}
                                            >
                                                {project.name}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the project "{project.name}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteProject && deleteProject(project.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No projects found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ProjectDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                project={editingProject} 
            />
        </div>
    );
};


const TimesheetView = () => {
  type TimeRange = 'Day' | 'Week';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('Week');

  const [timesheetData, setTimesheetData] = useState([
    { project: 'Project Y', color: 'bg-blue-500', times: { '2024-07-14': 28800 } },
    { project: 'Project X', color: 'bg-pink-500', times: { '2024-07-15': 14400, '2024-07-16': 14400 } },
    { project: 'Office', color: 'bg-orange-500', times: { '2024-07-16': 9000, '2024-07-17': 21600 } },
    { project: 'Break', color: 'bg-gray-500', times: { '2024-07-14': 1800, '2024-07-15': 1800, '2024-07-16': 1800, '2024-07-17': 1800 } },
  ]);

  const daysToDisplay = useMemo(() => {
    if (timeRange === 'Day') {
        return [currentDate];
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, projectIndex: number, day: Date) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    
    e.preventDefault();
    
    const dayKey = format(day, 'yyyy-MM-dd');
    const currentValue = timesheetData[projectIndex].times[dayKey] || 0;
    const fiveMinutes = 5 * 60;
    let newValue;
    
    if (e.key === 'ArrowUp') {
        newValue = currentValue + fiveMinutes;
    } else {
        newValue = Math.max(0, currentValue - fiveMinutes);
    }
    
    const newTimesheetData = [...timesheetData];
    newTimesheetData[projectIndex].times[dayKey] = newValue;
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
    const increment = timeRange === 'Day' ? 1 : 7;
    setCurrentDate(addDays(currentDate, increment));
  };
  const goToPrev = () => {
    const decrement = timeRange === 'Day' ? 1 : 7;
    setCurrentDate(subDays(currentDate, decrement));
  };
  
  const gridTemplateColumns = timeRange === 'Day' 
    ? 'grid-cols-[200px_1fr_100px]'
    : 'grid-cols-[200px_repeat(7,1fr)_100px]';

  const minWidth = timeRange === 'Day' ? 'min-w-[400px]' : 'min-w-[900px]';
  const todayString = format(new Date(), 'yyyy-MM-dd');

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
                    <div key={day.toISOString()} className="p-3 font-semibold text-muted-foreground border-b text-center flex flex-col items-center">
                        <span className="text-xs">{format(day, 'EEE, MMM')}</span>
                        <span className={cn("text-lg font-bold text-foreground", format(day, 'yyyy-MM-dd') === todayString && "text-primary")}>
                            {format(day, 'd')}
                        </span>
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
                                        onKeyDown={(e) => handleKeyDown(e, projectIndex, day)}
                                        placeholder="h:mm"
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
                            <Input className="text-center border-none" disabled placeholder="h:mm" />
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
            projectColor: '#3f51b5',
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
                                              {item.project && <span className={'ml-2 font-semibold'} style={{color: item.projectColor}}>• {item.project}</span>}
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
      case 'Projects':
        return <ProjectsView />;
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

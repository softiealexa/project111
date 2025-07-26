
'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Briefcase,
  Play,
  MoreVertical,
  Tag,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  Pencil,
  X,
  Hourglass,
  Users,
  Sun,
  UserCheck,
  Plane,
  CalendarDays,
  User as UserIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/data-context';
import type { TimeEntry, Project, TimeOffPolicy, TimeOffRequest, Shift, TeamMember } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, startOfMonth, endOfMonth, getDaysInMonth, addMonths, subMonths, isSameDay, isToday as isTodayDateFns, isWithinInterval, subWeeks, startOfISOWeek, endOfISOWeek, endOfToday, startOfToday, addWeeks, setHours, setMinutes, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectDialog } from '@/components/project-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateRange } from "react-day-picker";
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

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
    if (parts.length === 1 && !isNaN(parseInt(parts[0], 10))) {
        return (parseInt(parts[0], 10) || 0) * 3600;
    }
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

const PlaceholderContent = ({ title, icon: Icon, children }: { title: string, icon?: React.ElementType, children?: React.ReactNode }) => (
    <div className="p-4 sm:p-6 bg-muted/30 flex-1">
        <Card className="m-4 sm:m-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
                    {title}
                </CardTitle>
                 <CardDescription>
                    This feature is currently under development.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Feature Not Implemented</AlertTitle>
                    <AlertDescription>
                        This section is a visual placeholder. Check back for future updates!
                    </AlertDescription>
                </Alert>
                <div className="p-4 border-2 border-dashed rounded-lg bg-muted/50">
                   {children}
                </div>
            </CardContent>
        </Card>
    </div>
);

const ReportsView = () => {
    const { activeProfile } = useData();
    const [dateRange, setDateRange] = useState('this-week');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    
    const { timeEntries, projects } = useMemo(() => ({
        timeEntries: activeProfile?.timeEntries || [],
        projects: activeProfile?.projects || [],
    }), [activeProfile]);
    
    const dateFilter = useMemo(() => {
        const today = new Date();
        switch (dateRange) {
            case 'this-week':
                return { start: startOfISOWeek(today), end: endOfToday() };
            case 'last-week':
                const lastWeekStart = startOfISOWeek(subWeeks(today, 1));
                const lastWeekEnd = endOfISOWeek(subWeeks(today, 1));
                return { start: lastWeekStart, end: lastWeekEnd };
            case 'this-month':
                return { start: startOfMonth(today), end: endOfToday() };
            case 'last-month':
                const lastMonthStart = startOfMonth(subMonths(today, 1));
                const lastMonthEnd = endOfMonth(subMonths(today, 1));
                return { start: lastMonthStart, end: lastMonthEnd };
            default:
                return { start: startOfISOWeek(today), end: endOfToday() };
        }
    }, [dateRange]);

    const filteredEntries = useMemo(() => {
        return timeEntries.filter(entry => {
            const entryDate = new Date(entry.startTime);
            const inDateRange = isWithinInterval(entryDate, dateFilter);
            const inProject = selectedProjects.length === 0 || (entry.projectId && selectedProjects.includes(entry.projectId));
            return inDateRange && inProject;
        });
    }, [timeEntries, dateFilter, selectedProjects]);
    
    const { totalTime, projectBreakdown } = useMemo(() => {
        const breakdown: Record<string, number> = {};
        
        filteredEntries.forEach(entry => {
            const projectId = entry.projectId || 'no-project';
            if (!breakdown[projectId]) {
                breakdown[projectId] = 0;
            }
            breakdown[projectId] += entry.duration;
        });
        
        const total = Object.values(breakdown).reduce((sum, time) => sum + time, 0);

        const projectBreakdown = Object.entries(breakdown)
            .map(([projectId, time]) => {
                const project = projects.find(p => p.id === projectId);
                return {
                    name: project?.name || 'No Project',
                    color: project?.color || '#cccccc',
                    time,
                    timeFormatted: formatDuration(time),
                }
            })
            .sort((a,b) => b.time - a.time);

        return { totalTime: total, projectBreakdown };
    }, [filteredEntries, projects]);

    const chartConfig = projectBreakdown.reduce((acc, p) => ({ ...acc, [p.name]: { label: p.name, color: p.color } }), {});

    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="last-week">Last Week</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="last-month">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start">
                                <Briefcase className="mr-2 h-4 w-4" />
                                {selectedProjects.length === 0 ? 'All Projects' : `${selectedProjects.length} selected`}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Filter projects..." />
                                <CommandEmpty>No projects found.</CommandEmpty>
                                <CommandGroup>
                                    {projects.map(project => (
                                        <CommandItem
                                            key={project.id}
                                            value={project.name}
                                            onSelect={() => {
                                                setSelectedProjects(prev =>
                                                    prev.includes(project.id)
                                                        ? prev.filter(id => id !== project.id)
                                                        : [...prev, project.id]
                                                );
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", selectedProjects.includes(project.id) ? "opacity-100" : "opacity-0")} />
                                            <span className="h-2 w-2 rounded-full mr-2" style={{backgroundColor: project.color}}></span>
                                            {project.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {selectedProjects.length > 0 && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem onSelect={() => setSelectedProjects([])} className="justify-center text-center">
                                                Clear filters
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Hourglass className="h-5 w-5 text-muted-foreground" /> Total Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatDuration(totalTime)}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListTodo className="h-5 w-5 text-muted-foreground" /> Time Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{filteredEntries.length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Breakdown</CardTitle>
                    <CardDescription>Total time spent per project in the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {projectBreakdown.length > 0 ? (
                        <ChartContainer config={chartConfig} className="mx-auto aspect-video max-h-[300px]">
                            <ResponsiveContainer>
                                <BarChart data={projectBreakdown} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} className="text-xs truncate" />
                                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                    <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                                        {projectBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                        <LabelList dataKey="timeFormatted" position="right" offset={8} className="fill-foreground" fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            No data for this period.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead className="text-right">Duration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEntries.length > 0 ? (
                                filteredEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{format(new Date(entry.startTime), 'PPP')}</TableCell>
                                        <TableCell>{entry.task}</TableCell>
                                        <TableCell>
                                            {entry.projectId ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full" style={{backgroundColor: projects.find(p => p.id === entry.projectId)?.color}}></span>
                                                    {projects.find(p => p.id === entry.projectId)?.name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">No Project</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatDuration(entry.duration)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No time entries found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};


const CalendarView = () => {
    const { activeProfile } = useData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());

    const timeEntries = useMemo(() => activeProfile?.timeEntries || [], [activeProfile]);
    const projects = useMemo(() => activeProfile?.projects || [], [activeProfile]);

    const { monthDays, entriesByDay } = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        const entries: Record<string, TimeEntry[]> = {};
        for (const entry of timeEntries) {
            const dayKey = format(new Date(entry.startTime), 'yyyy-MM-dd');
            if (!entries[dayKey]) {
                entries[dayKey] = [];
            }
            entries[dayKey].push(entry);
        }
        return { monthDays: days, entriesByDay: entries };
    }, [currentMonth, timeEntries]);

    const selectedDayEntries = useMemo(() => {
        const dayKey = format(selectedDay, 'yyyy-MM-dd');
        return entriesByDay[dayKey] || [];
    }, [selectedDay, entriesByDay]);

    const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => {
        setCurrentMonth(new Date());
        setSelectedDay(new Date());
    };

    const firstDayOfMonth = startOfMonth(currentMonth);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const emptyDays = Array.from({ length: startingDayOfWeek });


    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1 flex flex-col lg:flex-row gap-6">
            <div className="lg:w-3/5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={goToToday}>Today</Button>
                            <div className='flex items-center rounded-md border bg-card'>
                                <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="rounded-r-none"><ChevronLeft className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-l-none"><ChevronRight className="h-5 w-5" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm border-b pb-2 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                        </div>
                         <div className="grid grid-cols-7 gap-1">
                            {emptyDays.map((_, i) => <div key={`empty-${i}`}></div>)}
                            {monthDays.map(day => {
                                const dayKey = format(day, 'yyyy-MM-dd');
                                const hasEntries = entriesByDay[dayKey]?.length > 0;
                                return (
                                    <button 
                                        key={day.toISOString()} 
                                        onClick={() => setSelectedDay(day)}
                                        className={cn(
                                            "h-16 w-full rounded-md p-1 flex flex-col items-start justify-start text-sm transition-colors relative",
                                            isSameDay(day, selectedDay) ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                                            isTodayDateFns(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                        )}
                                    >
                                        <span className={cn("font-semibold", isSameDay(day, selectedDay) && "text-primary-foreground")}>{format(day, 'd')}</span>
                                        {hasEntries && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary/80 group-hover:bg-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:w-2/5">
                 <Card>
                    <CardHeader>
                        <CardTitle>Entries for {format(selectedDay, 'PPP')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDayEntries.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayEntries.map(entry => {
                                    const project = projects.find(p => p.id === entry.projectId);
                                    return (
                                        <div key={entry.id} className="p-3 border rounded-md bg-muted/50">
                                            <p className="font-medium">{entry.task}</p>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                {project ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full" style={{backgroundColor: project.color}}></span>
                                                        {project.name}
                                                    </span>
                                                ) : <span>No Project</span>}
                                                <span className="font-semibold">{formatDurationShort(entry.duration)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                No entries for this day.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ProjectDetailsView = ({ project, onBack }: { project: Project, onBack: () => void }) => {
    return (
        <PlaceholderContent title="Project Details View">
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
            <div className="text-center text-muted-foreground py-10">
                Project-specific reports and details will be shown here.
            </div>
        </PlaceholderContent>
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
  const { activeProfile, updateTimesheetEntry } = useData();
  type TimeRange = 'Day' | 'Week';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('Week');

  const projects = useMemo(() => activeProfile?.projects || [], [activeProfile]);
  const timesheetData = useMemo(() => activeProfile?.timesheetData || {}, [activeProfile]);
  
  const daysToDisplay = useMemo(() => {
    if (timeRange === 'Day') {
        return [currentDate];
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate, timeRange]);

  const handleTimeChange = (projectId: string, day: Date, value: string) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const seconds = parseTimeToSeconds(value);
    if (updateTimesheetEntry) {
        updateTimesheetEntry(projectId, dayKey, seconds);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, projectId: string, day: Date) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    
    e.preventDefault();
    
    const dayKey = format(day, 'yyyy-MM-dd');
    const currentValue = timesheetData[projectId]?.[dayKey] || 0;
    const fiveMinutes = 5 * 60;
    let newValue;
    
    if (e.key === 'ArrowUp') {
        newValue = currentValue + fiveMinutes;
    } else {
        newValue = Math.max(0, currentValue - fiveMinutes);
    }
    
    if (updateTimesheetEntry) {
        updateTimesheetEntry(projectId, dayKey, newValue);
    }
  };

  const dailyTotals = useMemo(() => {
    return daysToDisplay.map(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        return projects.reduce((total, project) => total + (timesheetData[project.id]?.[dayKey] || 0), 0);
    })
  }, [daysToDisplay, timesheetData, projects]);

  const projectTotals = useMemo(() => {
    const relevantDayKeys = daysToDisplay.map(d => format(d, 'yyyy-MM-dd'));
    return projects.map(project => {
        return relevantDayKeys.reduce((total, dayKey) => total + (timesheetData[project.id]?.[dayKey] || 0), 0)
    });
  }, [timesheetData, daysToDisplay, projects]);

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
                {projects.map((project, projectIndex) => (
                    <React.Fragment key={project.id}>
                        <div className="p-3 border-b border-r flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full")} style={{backgroundColor: project.color}}></span>
                            <span className="font-medium">{project.name}</span>
                        </div>
                        {daysToDisplay.map((day, dayIndex) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            return (
                                <div key={dayIndex} className={cn("p-2 border-b", (day.getDay() === 6 || day.getDay() === 0) && "bg-muted/50")}>
                                    <Input 
                                        className="text-center border-none focus-visible:ring-1 focus-visible:ring-primary"
                                        value={formatSecondsToTime(timesheetData[project.id]?.[dayKey] || 0)}
                                        onChange={(e) => handleTimeChange(project.id, day, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, project.id, day)}
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
                <div className="p-3 border-b border-r flex items-center col-span-full">
                    <p className="text-sm text-muted-foreground">Manage projects in the 'Projects' tab.</p>
                </div>

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
    </div>
  )
}

const RequestTimeOffDialog = ({ policies, onOpenChange, open }: { policies: TimeOffPolicy[], open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { addTimeOffRequest } = useData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [policyId, setPolicyId] = useState<string | undefined>(policies[0]?.id);

    const handleSubmit = () => {
        if (dateRange?.from && policyId) {
            addTimeOffRequest && addTimeOffRequest({
                policyId,
                from: dateRange.from.getTime(),
                to: (dateRange.to || dateRange.from).getTime(),
                status: 'approved', // Simplified for now
                userName: 'Current User'
            });
            onOpenChange(false);
            setDateRange(undefined);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Time Off</DialogTitle>
                    <DialogDescription>Select dates and the policy for your request.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Policy</Label>
                        <Select value={policyId} onValueChange={setPolicyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a policy" />
                            </SelectTrigger>
                            <SelectContent>
                                {policies.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Dates</Label>
                        <CalendarComponent
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            className="rounded-md border"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!dateRange || !policyId}>Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TimeOffView = () => {
    const { activeProfile } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);

    const { policies = [], requests = [] } = useMemo(() => ({
        policies: activeProfile?.timeOffPolicies,
        requests: activeProfile?.timeOffRequests
    }), [activeProfile]);
    
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        return eachDayOfInterval({start, end: endOfWeek(start)});
    }, [currentDate]);

    const absencesThisWeek = useMemo(() => {
        const absences: Record<string, { userName: string, policy: TimeOffPolicy }[]> = {};
        requests.forEach(req => {
            const policy = policies.find(p => p.id === req.policyId);
            if (!policy) return;

            const dates = eachDayOfInterval({ start: new Date(req.from), end: new Date(req.to) });
            dates.forEach(date => {
                const dayKey = format(date, 'yyyy-MM-dd');
                if (!absences[dayKey]) absences[dayKey] = [];
                absences[dayKey].push({ userName: req.userName, policy });
            })
        });
        return absences;
    }, [requests, policies]);

    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                 <h1 className="text-2xl font-semibold">Time Off</h1>
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                    <DialogTrigger asChild>
                         <Button>Request Time Off</Button>
                    </DialogTrigger>
                    {policies.length > 0 && 
                        <RequestTimeOffDialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen} policies={policies} />
                    }
                </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                    <Card key={policy.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{policy.name}</CardTitle>
                            {policy.name.toLowerCase().includes('vacation') && <Plane className="h-4 w-4 text-muted-foreground" />}
                            {policy.name.toLowerCase().includes('sick') && <UserCheck className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{policy.allowance} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle>Team Absences</CardTitle>
                        <div className='flex items-center rounded-md border bg-card'>
                            <Button variant="ghost" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="rounded-r-none h-9"><ChevronLeft className="mr-2 h-4 w-4"/> Prev</Button>
                            <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="rounded-none border-x h-9">This Week</Button>
                            <Button variant="ghost" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="rounded-l-none h-9">Next <ChevronRight className="ml-2 h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-7 border-t border-l">
                         {weekDays.map(day => (
                            <div key={day.toString()} className="p-2 border-b border-r min-h-[120px]">
                                <p className="font-semibold text-sm">{format(day, 'EEE')}</p>
                                <p className="text-muted-foreground text-xs">{format(day, 'd MMM')}</p>
                                <div className="mt-2 space-y-1">
                                    {(absencesThisWeek[format(day, 'yyyy-MM-dd')] || []).map((absence, i) => (
                                         <div key={i} className="flex items-center gap-2 p-1.5 rounded text-xs" style={{backgroundColor: `${absence.policy.color}20`, color: absence.policy.color}}>
                                            <UserIcon className="h-3 w-3" />
                                            <span className="font-medium">{absence.userName}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length > 0 ? requests.map(req => {
                                const policy = policies.find(p => p.id === req.policyId);
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{backgroundColor: policy?.color}}></span>
                                                {policy?.name || 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{format(new Date(req.from), 'PP')} - {format(new Date(req.to), 'PP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'approved' ? "default" : "secondary"} className={cn(req.status === 'approved' && "bg-green-500/80")}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No requests yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
};

const ScheduleView = () => {
    const { activeProfile, addShift, updateShift, deleteShift, addTeamMember, updateTeamMember, deleteTeamMember } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

    const team = useMemo(() => activeProfile?.team || [], [activeProfile]);
    const shifts = useMemo(() => activeProfile?.shifts || [], [activeProfile]);
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        return eachDayOfInterval({start, end: endOfWeek(start)});
    }, [currentDate]);

    const shiftsByDay: Record<string, Shift[]> = useMemo(() => {
        const result: Record<string, Shift[]> = {};
        shifts.forEach(shift => {
            const dayKey = format(new Date(shift.startTime), 'yyyy-MM-dd');
            if (!result[dayKey]) result[dayKey] = [];
            result[dayKey].push(shift);
        })
        return result;
    }, [shifts]);

    const handleOpenShiftDialog = (shift: Shift | null, date?: Date, memberId?: string) => {
        setEditingShift(shift);
        setSelectedDate(date || null);
        setSelectedMemberId(memberId || null);
        setIsShiftDialogOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 bg-muted/30 flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">Schedule</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsTeamDialogOpen(true)}>Manage Team</Button>
                    <Button onClick={() => handleOpenShiftDialog(null)}>Add Shift</Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                     <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle>This Week</CardTitle>
                        <div className='flex items-center rounded-md border bg-card'>
                            <Button variant="ghost" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="rounded-r-none h-9"><ChevronLeft className="mr-2 h-4 w-4"/> Prev</Button>
                            <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="rounded-none border-x h-9">Today</Button>
                            <Button variant="ghost" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="rounded-l-none h-9">Next <ChevronRight className="ml-2 h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <div className="grid min-w-[900px]" style={{gridTemplateColumns: '150px repeat(7, 1fr)'}}>
                        <div className="p-2 font-semibold border-b border-r bg-muted/50">Team</div>
                         {weekDays.map(day => (
                            <div key={day.toString()} className="p-2 font-semibold border-b border-r bg-muted/50 text-center">
                                <p>{format(day, 'EEE')}</p>
                                <p className="text-muted-foreground text-sm">{format(day, 'd')}</p>
                            </div>
                        ))}
                        {team.map(member => (
                            <React.Fragment key={member.id}>
                                <div className="p-2 font-semibold border-b border-r flex items-center justify-center bg-muted/50">{member.name}</div>
                                {weekDays.map(day => {
                                    const dayKey = format(day, 'yyyy-MM-dd');
                                    const dayShifts = (shiftsByDay[dayKey] || []).filter(s => s.memberId === member.id);
                                    return (
                                        <div key={day.toString()} className="p-1 border-b border-r min-h-[80px] space-y-1 relative group">
                                            {dayShifts.map(shift => (
                                                <button key={shift.id} onClick={() => handleOpenShiftDialog(shift)} className="w-full text-left bg-primary/80 text-primary-foreground rounded p-1.5 text-xs">
                                                    <p className="font-semibold">{format(new Date(shift.startTime), 'p')} - {format(new Date(shift.endTime), 'p')}</p>
                                                    <p className="opacity-80 truncate">{shift.role}</p>
                                                </button>
                                            ))}
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleOpenShiftDialog(null, day, member.id)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <ShiftDialog 
                open={isShiftDialogOpen} 
                onOpenChange={setIsShiftDialogOpen}
                shift={editingShift}
                date={selectedDate}
                memberId={selectedMemberId}
                team={team}
                addShift={addShift}
                updateShift={updateShift}
                deleteShift={deleteShift}
            />

            <ManageTeamDialog
                open={isTeamDialogOpen}
                onOpenChange={setIsTeamDialogOpen}
                team={team}
                addMember={addTeamMember}
                updateMember={updateTeamMember}
                deleteMember={deleteTeamMember}
            />
        </div>
    )
};

const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const ShiftDialog = ({ open, onOpenChange, shift, date, memberId, team, addShift, updateShift, deleteShift }: { open: boolean; onOpenChange: (open: boolean) => void; shift: Shift | null; date: Date | null, memberId: string | null, team: TeamMember[], addShift: any, updateShift: any, deleteShift: any }) => {
    const [localMemberId, setLocalMemberId] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [role, setRole] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open) {
            if (shift) {
                setLocalMemberId(shift.memberId);
                setStartTime(format(new Date(shift.startTime), 'HH:mm'));
                setEndTime(format(new Date(shift.endTime), 'HH:mm'));
                setRole(shift.role || '');
                setNote(shift.note || '');
            } else {
                setLocalMemberId(memberId || '');
                setRole('Support');
                setNote('');
            }
        }
    }, [open, shift, memberId]);

    const handleSave = () => {
        if (!localMemberId) return;

        const shiftDate = shift ? new Date(shift.startTime) : date;
        if (!shiftDate) return;

        const parsedStartTime = parse(startTime, 'HH:mm', shiftDate);
        const parsedEndTime = parse(endTime, 'HH:mm', shiftDate);

        if (shift) {
            updateShift({ ...shift, memberId: localMemberId, startTime: parsedStartTime.getTime(), endTime: parsedEndTime.getTime(), role, note });
        } else {
            addShift({ memberId: localMemberId, startTime: parsedStartTime.getTime(), endTime: parsedEndTime.getTime(), role, note });
        }
        onOpenChange(false);
    };

    const handleDelete = () => {
        if(shift) deleteShift(shift.id);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{shift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Team Member</Label>
                        <Select value={localMemberId} onValueChange={setLocalMemberId}>
                            <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                            <SelectContent>{team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start Time</Label>
                            <Select value={startTime} onValueChange={setStartTime}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>End Time</Label>
                             <Select value={endTime} onValueChange={setEndTime}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Support" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Note (optional)</Label>
                        <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."/>
                    </div>
                </div>
                <DialogFooter className="justify-between">
                    <div>{shift && <Button variant="destructive" onClick={handleDelete}>Delete</Button>}</div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ManageTeamDialog = ({ open, onOpenChange, team, addMember, updateMember, deleteMember }: { open: boolean; onOpenChange: (open: boolean) => void; team: TeamMember[]; addMember: (name: string) => void; updateMember: (member: TeamMember) => void; deleteMember: (id: string) => void; }) => {
    const [newMemberName, setNewMemberName] = useState('');
    
    const handleAdd = () => {
        if(newMemberName.trim()) {
            addMember(newMemberName.trim());
            setNewMemberName('');
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="New member name..." onKeyDown={e => e.key === 'Enter' && handleAdd()}/>
                        <Button onClick={handleAdd}>Add</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {team.map(member => (
                            <div key={member.id} className="flex items-center gap-2 p-2 border rounded-md">
                                <Input value={member.name} onChange={(e) => updateMember({...member, name: e.target.value})} className="border-none"/>
                                <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ClockifyPage() {
  const { activeProfile, addTimeEntry, deleteTimeEntry, updateTimeEntry, loading } = useData();
  const [activeMenu, setActiveMenu] = useState('Time Tracker');
  const [task, setTask] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const timeEntries = useMemo(() => activeProfile?.timeEntries || [], [activeProfile]);
  const projects = useMemo(() => activeProfile?.projects || [], [activeProfile]);
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  
  const stopTimer = useCallback((isSwitching = false) => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setTimerRunning(false);
    
    if (activeTimerId && updateTimeEntry) {
      const entry = timeEntries.find(e => e.id === activeTimerId);
      if(entry) {
        const duration = Math.round((Date.now() - entry.startTime) / 1000);
        updateTimeEntry({ ...entry, endTime: Date.now(), duration });
      }
    }
    
    if (!isSwitching) {
      setTask('');
      setSelectedProjectId(null);
      setActiveTimerId(null);
    }
    setElapsedTime(0);
  }, [activeTimerId, timeEntries, updateTimeEntry]);

  const startTimer = useCallback(() => {
    if (timerRunning) {
        stopTimer(true);
    }
    const newEntry = addTimeEntry && addTimeEntry({
        task: task || 'Unspecified Task',
        projectId: selectedProjectId,
        tags: [],
        billable: true,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
    });
    
    if (newEntry) {
        setActiveTimerId(newEntry.id);
        setTimerRunning(true);
        setElapsedTime(0);
        
        timerRef.current = setInterval(() => {
            const currentElapsed = Math.round((Date.now() - newEntry.startTime) / 1000);
            setElapsedTime(currentElapsed);
        }, 1000);
    }
  }, [timerRunning, stopTimer, addTimeEntry, task, selectedProjectId]);

  useEffect(() => {
    if (loading) return; // Don't run effect if data is still loading
    
    const runningEntry = timeEntries.find(e => e.endTime === null);
    if(runningEntry && !timerRunning) { // Prevent re-running if timer is already set
      setActiveTimerId(runningEntry.id);
      setTask(runningEntry.task);
      setSelectedProjectId(runningEntry.projectId);
      setTimerRunning(true);
      
      const start = runningEntry.startTime;
      setElapsedTime(Math.round((Date.now() - start) / 1000));
      
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - start) / 1000));
      }, 1000);
    }

    return () => { 
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, [timeEntries, loading, timerRunning]); 
  
  const handleToggleTimer = () => {
    if (timerRunning) {
        stopTimer();
    } else {
        startTimer();
    }
  };
  
  const handleDeleteEntry = (id: string) => {
    if (deleteTimeEntry) {
      if (id === activeTimerId) {
        stopTimer();
      }
      deleteTimeEntry(id);
    }
  };
  
  const handleResumeEntry = (entryToResume: TimeEntry) => {
    if (timerRunning) {
      stopTimer(true); // Stop current timer but indicate we are switching
    }

    // Set task and project first
    setTask(entryToResume.task);
    setSelectedProjectId(entryToResume.projectId);

    // Use a timeout to ensure state has been updated before starting timer
    setTimeout(() => {
        startTimer();
    }, 100);
  };
  
  const timeEntryGroups = timeEntries.reduce<TimeEntryGroup[]>((acc, entry) => {
    const day = new Date(entry.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let group = acc.find(g => g.day === day);
    if (!group) {
        const entryDate = new Date(entry.startTime);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let dayLabel = day;
        if(entryDate.toDateString() === today.toDateString()) {
            dayLabel = 'Today';
        } else if (entryDate.toDateString() === yesterday.toDateString()) {
            dayLabel = 'Yesterday';
        }

        group = { day: dayLabel, total: 0, items: [] };
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
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("text-primary hover:text-primary hover:bg-primary/10", !selectedProject && "text-foreground")}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                {selectedProject?.name || 'Project'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Select project..." />
                                <CommandEmpty>No project found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem value="no-project" onSelect={() => setSelectedProjectId(null)}>
                                         <X className="mr-2 h-4 w-4 text-destructive" /> No Project
                                    </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                {projects.map((project) => (
                                    <CommandItem
                                        key={project.id}
                                        value={project.name}
                                        onSelect={() => {
                                            setSelectedProjectId(project.id);
                                            // Manually close popover,shadcn bug
                                            document.body.click();
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selectedProjectId === project.id ? "opacity-100" : "opacity-0")} />
                                        <span className="h-2 w-2 rounded-full mr-2" style={{backgroundColor: project.color}}></span>
                                        {project.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                      </Popover>

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
                              {group.items.map((item) => {
                                  const itemProject = projects.find(p => p.id === item.projectId);
                                  return (
                                  <div key={item.id} className="p-3 border-b last:border-b-0 shadow-sm hover:bg-muted/50">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1">
                                              <span>{item.task}</span>
                                              {itemProject && <span className={'ml-2 font-semibold'} style={{color: itemProject.color}}>• {itemProject.name}</span>}
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
                              )})}
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
      case 'Calendar':
        return <CalendarView />;
      case 'Reports':
        return <ReportsView />;
      case 'Time Off':
        return <TimeOffView />;
      case 'Schedule':
        return <ScheduleView />;
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
                        <SidebarMenuButton asChild tooltip="Back to Dashboard">
                          <Link href="/dashboard">
                            <LayoutGrid />
                            <span>Back to Dashboard</span>
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
                        <SidebarMenuButton onClick={() => setActiveMenu('Timesheet')} isActive={activeMenu === 'Timesheet'} tooltip="Timesheet">
                            <ListTodo />
                            <span>Timesheet</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Projects')} isActive={activeMenu === 'Projects'} tooltip="Projects">
                            <Briefcase />
                            <span>Projects</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Calendar')} isActive={activeMenu === 'Calendar'} tooltip="Calendar">
                            <Calendar />
                            <span>Calendar</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Reports')} isActive={activeMenu === 'Reports'} tooltip="Reports">
                            <BarChart2 />
                            <span>Reports</span>
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

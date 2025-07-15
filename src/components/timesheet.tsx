
"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconComponent } from '@/lib/icons';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Lightbulb } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type TimeEntry = {
    subject: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
};

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const parseTime = (time: string): number => {
    if (!time || !/^\d{2}:\d{2}:\d{2}$/.test(time)) return 0;
    const parts = time.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

export default function TimeSheet() {
    const { activeProfile, updateTimesheet, addTimesheetSubject, removeTimesheetSubject } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const trackedSubjects = useMemo(() => activeProfile?.timesheet?.subjects || [], [activeProfile]);
    const timeEntries = useMemo(() => activeProfile?.timesheet?.entries || [], [activeProfile]);
    const availableSubjects = useMemo(() => activeProfile?.subjects.map(s => s.name) || [], [activeProfile]);

    const handleTimeChange = (subjectName: string, date: Date, newTime: string) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        updateTimesheet(subjectName, dateKey, newTime);
    };

    const handleAddSubject = (subjectName: string) => {
        addTimesheetSubject(subjectName);
    };

    const totals = useMemo(() => {
        const rowTotals: Record<string, number> = {};
        const colTotals: Record<string, number> = {};

        trackedSubjects.forEach(subject => {
            rowTotals[subject] = 0;
        });

        weekDays.forEach(day => {
            colTotals[format(day, 'yyyy-MM-dd')] = 0;
        });
        
        timeEntries.forEach(entry => {
            const timeInSeconds = parseTime(entry.time);
            if (rowTotals[entry.subject] !== undefined) {
                rowTotals[entry.subject] += timeInSeconds;
            }
            if (colTotals[entry.date] !== undefined) {
                colTotals[entry.date] += timeInSeconds;
            }
        });

        const grandTotal = Object.values(rowTotals).reduce((a, b) => a + b, 0);

        return { rowTotals, colTotals, grandTotal };
    }, [timeEntries, trackedSubjects, weekDays]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Timesheet</CardTitle>
                        <CardDescription>Log your study hours for the week.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 7))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="w-32 hidden sm:flex">
                           This week
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Alert className="mb-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Under Development</AlertTitle>
                    <AlertDescription>
                        This timesheet feature is currently being built. Data saving is functional, but more features are coming soon!
                    </AlertDescription>
                </Alert>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Subjects</TableHead>
                                {weekDays.map(day => (
                                    <TableHead key={day.toISOString()} className="text-center">
                                        <div className={isSameDay(day, new Date()) ? 'text-primary' : ''}>
                                            <div>{format(day, 'E')}</div>
                                            <div className="text-xs">{format(day, 'MMM d')}</div>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trackedSubjects.map(subjectName => {
                                const subjectDetails = activeProfile?.subjects.find(s => s.name === subjectName);
                                const Icon = getIconComponent(subjectDetails?.icon);
                                return (
                                    <TableRow key={subjectName}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate">{subjectName}</span>
                                            </div>
                                        </TableCell>
                                        {weekDays.map(day => {
                                            const dateKey = format(day, 'yyyy-MM-dd');
                                            const entry = timeEntries.find(e => e.subject === subjectName && e.date === dateKey);
                                            return (
                                                <TableCell key={day.toISOString()}>
                                                    <Input
                                                        type="text"
                                                        className="w-24 text-center font-mono"
                                                        placeholder="00:00:00"
                                                        value={entry?.time || ''}
                                                        onChange={(e) => handleTimeChange(subjectName, day, e.target.value)}
                                                    />
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="text-right font-mono font-semibold">
                                            {formatTime(totals.rowTotals[subjectName] || 0)}
                                        </TableCell>
                                         <TableCell className="px-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeTimesheetSubject(subjectName)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                             <TableRow>
                                <TableCell colSpan={1} className="font-semibold">
                                    Total
                                </TableCell>
                                {weekDays.map(day => (
                                    <TableCell key={day.toISOString()} className="text-center font-mono font-semibold">
                                        {formatTime(totals.colTotals[format(day, 'yyyy-MM-dd')] || 0)}
                                    </TableCell>
                                ))}
                                <TableCell className="text-right font-mono font-bold text-lg">
                                    {formatTime(totals.grandTotal)}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4">
                    <Select onValueChange={handleAddSubject}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Add subject to timesheet..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSubjects
                                .filter(s => !trackedSubjects.includes(s))
                                .map(subject => (
                                    <SelectItem key={subject} value={subject}>
                                        {subject}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}

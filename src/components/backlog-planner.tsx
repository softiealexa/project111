

"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { PartyPopper, CalendarCheck, Calendar as CalendarIcon, Target, RefreshCcw, Power, PowerOff, Clock } from 'lucide-react';
import { addDays, format, differenceInDays, startOfToday } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Chapter } from '@/lib/types';


type PlannerMode = 'calculateDays' | 'calculatePace';

export default function BacklogPlanner() {
    const { activeProfile } = useData();
    const { toast } = useToast();
    const [backlogLectures, setBacklogLectures] = useState('');
    const [newLecturesPerDay, setNewLecturesPerDay] = useState('3');
    const [studyDaysPerWeek, setStudyDaysPerWeek] = useState('6');
    const [pacePerDay, setPacePerDay] = useState('4');
    const [deadline, setDeadline] = useState<Date | undefined>();
    const [mode, setMode] = useState<PlannerMode>('calculateDays');
    const [newLecturesEnabled, setNewLecturesEnabled] = useState(true);
    const [lectureDuration, setLectureDuration] = useState('');

    const calculateCurrentBacklog = useCallback(() => {
        if (!activeProfile) return 0;

        let incompleteLectureCount = 0;
        activeProfile.subjects.forEach(subject => {
            // Find a task that is explicitly named 'Lecture', case-insensitive
            const lectureTaskName = subject.tasks.find((t: string) => t.toLowerCase() === 'lecture');
            
            // If no 'Lecture' task is defined for this subject, we cannot calculate its backlog.
            if (!lectureTaskName) {
                return;
            }

            subject.chapters.forEach((chapter: Chapter) => {
                for (let i = 1; i <= chapter.lectureCount; i++) {
                    const lectureKey = `Lecture-${i}`;
                    const checkboxId = `${subject.name}-${chapter.name}-${lectureKey}-${lectureTaskName}`;
                    const isCompleted = chapter.checkedState?.[checkboxId]?.status === 'checked' || chapter.checkedState?.[checkboxId]?.status === 'checked-red';
                    
                    if (!isCompleted) {
                        incompleteLectureCount++;
                    }
                }
            });
        });
        return incompleteLectureCount;
    }, [activeProfile]);
    
    useEffect(() => {
        // Set initial backlog on component mount
        setBacklogLectures(String(calculateCurrentBacklog()));
    }, [calculateCurrentBacklog]);


    const handleCalculateClick = () => {
        const calculatedBacklog = calculateCurrentBacklog();
        setBacklogLectures(String(calculatedBacklog));
        toast({
            title: 'Backlog Calculated',
            description: `Found ${calculatedBacklog} incomplete lectures.`,
        });
    };

    const result = useMemo(() => {
        const totalBacklog = parseInt(backlogLectures, 10);
        const newPerDay = newLecturesEnabled ? parseInt(newLecturesPerDay, 10) : 0;
        const workDays = newLecturesEnabled ? parseInt(studyDaysPerWeek, 10) : 7;
        const duration = parseInt(lectureDuration, 10);
        
        let totalStudyMinutes = null;
        if (!isNaN(duration) && duration > 0 && !isNaN(totalBacklog)) {
            totalStudyMinutes = totalBacklog * duration;
        }

        if (isNaN(totalBacklog) || isNaN(newPerDay) || isNaN(workDays) || totalBacklog < 0 || workDays < 1 || workDays > 7) {
            return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Please enter valid numbers in all backlog and workload fields." };
        }
        
        if (totalBacklog === 0) {
            return { days: 0, date: format(new Date(), 'PPP'), requiredPace: null, totalStudyMinutes: 0, message: null };
        }

        if (mode === 'calculateDays') {
            const pace = parseInt(pacePerDay, 10);
            if (isNaN(pace) || pace <= 0) {
                 return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Please enter a valid number for your daily pace." };
            }
            
            if (newLecturesEnabled) {
                const surplusOnWorkDays = pace - newPerDay;
                if (surplusOnWorkDays <= 0 && workDays >= 7) {
                    return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Your daily pace must be higher than new lectures to make progress on work days." };
                }

                const offDays = 7 - workDays;
                const weeklyProgress = (surplusOnWorkDays * workDays) + (pace * offDays);
                if (weeklyProgress <= 0) {
                    return { days: null, requiredPace: null, totalStudyMinutes: null, message: "With this schedule, you won't clear your backlog. Try increasing your pace." };
                }
            }
            
            let finalDays = 0;
            let remainingBacklog = totalBacklog;
            while(remainingBacklog > 0) {
                 finalDays++;
                 if (newLecturesEnabled) {
                     const dayOfWeek = (finalDays - 1) % 7;
                     if(dayOfWeek < workDays) {
                        remainingBacklog -= (pace - newPerDay);
                     } else {
                        remainingBacklog -= pace;
                     }
                 } else {
                     remainingBacklog -= pace;
                 }
            }
            const completionDate = addDays(new Date(), finalDays);
            return { days: finalDays, date: format(completionDate, 'PPP'), requiredPace: null, totalStudyMinutes, message: null };
        }
        
        if (mode === 'calculatePace') {
            if (!deadline) {
                return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Please select a deadline to calculate the required pace." };
            }
            const daysAvailable = differenceInDays(deadline, startOfToday());

            if (daysAvailable <= 0) {
                return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Deadline must be in the future." };
            }

            // This is a complex iterative problem, we can find the pace by testing values.
            // Test paces from `newPerDay` up to a reasonable limit.
            for (let testPace = newPerDay + 0.01; testPace < 100; testPace += 0.01) {
                
                let daysToComplete = 0;
                let remaining = totalBacklog;

                while (remaining > 0) {
                    daysToComplete++;
                    if (newLecturesEnabled) {
                        const dayOfWeek = (daysToComplete - 1) % 7;
                        if (dayOfWeek < workDays) {
                            remaining -= (testPace - newPerDay);
                        } else {
                            remaining -= testPace;
                        }
                    } else {
                        remaining -= testPace;
                    }
                }
                if (daysToComplete <= daysAvailable) {
                     return { days: null, requiredPace: Math.ceil(testPace), totalStudyMinutes, message: null };
                }
            }
            return { days: null, requiredPace: null, totalStudyMinutes: null, message: "Cannot calculate a reasonable pace for this deadline. Try extending it." };
        }

        return { days: null, requiredPace: null, totalStudyMinutes: null, message: "An unexpected error occurred." };

    }, [backlogLectures, newLecturesPerDay, studyDaysPerWeek, pacePerDay, deadline, mode, newLecturesEnabled, lectureDuration]);
    
    const formatStudyTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backlog &amp; Pace Planner</CardTitle>
                <CardDescription>
                    Estimate how long it will take to clear your backlog, or calculate the pace needed to meet a deadline.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs value={mode} onValueChange={(value) => setMode(value as PlannerMode)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calculateDays">Calculate Days</TabsTrigger>
                        <TabsTrigger value="calculatePace">Calculate Pace</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                         <Label htmlFor="backlog-lectures">Current Backlog (Lectures)</Label>
                         <div className="flex items-center gap-2">
                            <Input id="backlog-lectures" type="number" value={backlogLectures} onChange={(e) => setBacklogLectures(e.target.value)} placeholder="e.g., 50" className="flex-1"/>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={handleCalculateClick} className="h-10" aria-label="Calculate backlog from subjects">
                                        <RefreshCcw className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Calculate backlog from my subjects</p>
                                </TooltipContent>
                             </Tooltip>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-lectures">New Lectures per Day</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                id="new-lectures" 
                                type="number" 
                                value={newLecturesPerDay} 
                                onChange={(e) => setNewLecturesPerDay(e.target.value)} 
                                placeholder="e.g., 3" 
                                disabled={!newLecturesEnabled}
                                className="flex-1"
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setNewLecturesEnabled(prev => !prev)}
                                        className="h-10" 
                                        aria-label={newLecturesEnabled ? "Disable new lectures per day" : "Enable new lectures per day"}
                                    >
                                        {newLecturesEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-primary" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{newLecturesEnabled ? 'Disable daily new lectures' : 'Enable daily new lectures'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="study-days">Days/Week with New Lectures</Label>
                        <Input id="study-days" type="number" value={studyDaysPerWeek} onChange={(e) => setStudyDaysPerWeek(e.target.value)} placeholder="e.g., 6" min="1" max="7" disabled={!newLecturesEnabled}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mode === 'calculateDays' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="pace">Total Lectures to Complete per Day (Your Pace)</Label>
                            <Input id="pace" type="number" value={pacePerDay} onChange={(e) => setPacePerDay(e.target.value)} placeholder="e.g., 4" />
                        </div>
                    ) : (
                         <div className="grid gap-2">
                            <Label htmlFor="deadline-picker">Your Deadline</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="deadline-picker"
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !deadline && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {deadline ? format(deadline, "PPP") : <span>Pick a deadline</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={deadline}
                                    onSelect={setDeadline}
                                    initialFocus
                                    disabled={{ before: new Date() }}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="duration">Avg. Lecture Duration (min)</Label>
                        <Input id="duration" type="number" value={lectureDuration} onChange={(e) => setLectureDuration(e.target.value)} placeholder="e.g., 90 (Optional)" />
                    </div>
                </div>

                <div className="pt-4">
                    {result.message ? (
                        <Alert variant="destructive">
                            <AlertTitle>Cannot Calculate</AlertTitle>
                            <AlertDescription>{result.message}</AlertDescription>
                        </Alert>
                    ) : (
                         <Alert>
                            {mode === 'calculateDays' ? (
                                <>
                                    <PartyPopper className="h-4 w-4" />
                                    <AlertTitle className="text-lg">Estimated Completion Time</AlertTitle>
                                    <AlertDescription className="space-y-2 mt-2">
                                        <p className="text-3xl font-bold text-foreground">{result.days} days</p>
                                        {result.date &&
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarCheck className="h-4 w-4"/>
                                                You should be caught up by <span className="font-semibold text-foreground">{result.date}</span>.
                                            </p>
                                        }
                                    </AlertDescription>
                                </>
                            ) : (
                                <>
                                    <Target className="h-4 w-4" />
                                    <AlertTitle className="text-lg">Required Daily Pace</AlertTitle>
                                    <AlertDescription className="space-y-2 mt-2">
                                        <p className="text-3xl font-bold text-foreground">{result.requiredPace} lectures/day</p>
                                        <p className="text-muted-foreground">
                                            Is the pace needed to clear your backlog by the deadline.
                                        </p>
                                    </AlertDescription>
                                </>
                            )}
                            {result.totalStudyMinutes !== null && (
                                <>
                                <div className="my-4 border-t border-border"></div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <p>Estimated Study Time to clear backlog: <span className="font-bold text-foreground">{formatStudyTime(result.totalStudyMinutes)}</span></p>
                                </div>
                                </>
                            )}
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { PartyPopper, CalendarCheck } from 'lucide-react';
import { addDays, format } from 'date-fns';

export default function BacklogPlanner() {
    const [backlogLectures, setBacklogLectures] = useState('50');
    const [newLecturesPerDay, setNewLecturesPerDay] = useState('3');
    const [studyDaysPerWeek, setStudyDaysPerWeek] = useState('6');
    const [pacePerDay, setPacePerDay] = useState('4');

    const result = useMemo(() => {
        const totalBacklog = parseInt(backlogLectures, 10);
        const newPerDay = parseInt(newLecturesPerDay, 10);
        const workDays = parseInt(studyDaysPerWeek, 10);
        const pace = parseInt(pacePerDay, 10);

        if (isNaN(totalBacklog) || isNaN(newPerDay) || isNaN(workDays) || isNaN(pace) || totalBacklog <= 0 || pace <= 0) {
            return { days: null, message: "Please enter valid numbers in all fields." };
        }
        
        const surplusOnWorkDays = pace - newPerDay;
        
        if (surplusOnWorkDays <= 0 && workDays >= 7) {
            return { days: null, message: "Your daily pace must be higher than your new lectures to make progress on work days." };
        }

        let remainingBacklog = totalBacklog;
        let daysPassed = 0;
        const offDays = 7 - workDays;

        // Weekly progress calculation
        const weeklyProgress = (surplusOnWorkDays * workDays) + (pace * offDays);
        if (weeklyProgress <= 0) {
            return { days: null, message: "With this schedule, you won't be able to clear your backlog. Try increasing your pace or reducing new lectures." };
        }
        
        const weeksNeeded = Math.ceil(totalBacklog / weeklyProgress);
        daysPassed = weeksNeeded * 7;
        
        // Refine days: after calculating full weeks, simulate the last week day by day
        remainingBacklog = totalBacklog;
        let finalDays = 0;
        while(remainingBacklog > 0) {
             finalDays++;
             const dayOfWeek = (finalDays - 1) % 7;
             if(dayOfWeek < workDays) { // It's a work day
                remainingBacklog -= surplusOnWorkDays;
             } else { // It's an off day
                remainingBacklog -= pace;
             }
        }
        
        const completionDate = addDays(new Date(), finalDays);

        return {
            days: finalDays,
            date: format(completionDate, 'PPP'),
            message: null
        };

    }, [backlogLectures, newLecturesPerDay, studyDaysPerWeek, pacePerDay]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backlog & Pace Planner</CardTitle>
                <CardDescription>
                    Estimate how long it will take to clear your backlog while keeping up with new lectures.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="backlog-lectures">Current Backlog (Lectures)</Label>
                        <Input id="backlog-lectures" type="number" value={backlogLectures} onChange={(e) => setBacklogLectures(e.target.value)} placeholder="e.g., 50" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-lectures">New Lectures per Day</Label>
                        <Input id="new-lectures" type="number" value={newLecturesPerDay} onChange={(e) => setNewLecturesPerDay(e.target.value)} placeholder="e.g., 3" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="study-days">Days/Week with New Lectures</Label>
                        <Input id="study-days" type="number" value={studyDaysPerWeek} onChange={(e) => setStudyDaysPerWeek(e.target.value)} placeholder="e.g., 6" min="1" max="7"/>
                    </div>
                    <div className="grid gap-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor="pace">Total Lectures to Complete per Day (Your Pace)</Label>
                        <Input id="pace" type="number" value={pacePerDay} onChange={(e) => setPacePerDay(e.target.value)} placeholder="e.g., 4" />
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
                             <PartyPopper className="h-4 w-4" />
                            <AlertTitle className="text-lg">Estimated Completion Time</AlertTitle>
                            <AlertDescription className="space-y-2 mt-2">
                                <p className="text-3xl font-bold text-foreground">{result.days} days</p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                    <CalendarCheck className="h-4 w-4"/>
                                    You should be caught up by <span className="font-semibold text-foreground">{result.date}</span>.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

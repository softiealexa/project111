
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { format, differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function AgeCalculator() {
    const [dob, setDob] = useState<Date | undefined>();
    const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
    const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);

    const handleCalculate = () => {
        if (dob && targetDate) {
            if (dob > targetDate) {
                setAge(null);
                return;
            }

            const years = differenceInYears(targetDate, dob);
            const pastDob = addYears(dob, years);
            const months = differenceInMonths(targetDate, pastDob);
            const pastDobAndMonths = addMonths(pastDob, months);
            const days = differenceInDays(targetDate, pastDobAndMonths);
            
            setAge({ years, months, days });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Age Calculator</CardTitle>
                <CardDescription>Calculate age based on a date of birth and a target date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Date of Birth</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dob && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dob}
                                    onSelect={setDob}
                                    captionLayout="dropdown-buttons"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Age at the Date of</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !targetDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={targetDate}
                                    onSelect={setTargetDate}
                                    captionLayout="dropdown-buttons"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear() + 100}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <Button onClick={handleCalculate} disabled={!dob || !targetDate} className="w-full">
                    Calculate Age
                </Button>

                {age !== null && dob && targetDate && dob <= targetDate && (
                    <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>Calculated Age</AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-3xl font-bold">{age.years}</p>
                                    <p className="text-xs text-muted-foreground">Years</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{age.months}</p>
                                    <p className="text-xs text-muted-foreground">Months</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{age.days}</p>
                                    <p className="text-xs text-muted-foreground">Days</p>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {dob && targetDate && dob > targetDate && (
                    <Alert variant="destructive">
                        <AlertTitle>Invalid Dates</AlertTitle>
                        <AlertDescription>
                            Date of birth cannot be after the target date.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

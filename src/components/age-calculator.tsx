
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { 
    differenceInYears, 
    differenceInMonths, 
    differenceInDays, 
    addYears, 
    addMonths,
    differenceInWeeks,
    differenceInHours,
    differenceInMinutes,
    differenceInSeconds
} from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';

const years = Array.from({ length: 151 }, (_, i) => new Date().getFullYear() - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
const days = Array.from({ length: 31 }, (_, i) => i + 1);

interface CustomDatePickerProps {
  date: { day: number; month: number; year: number };
  setDate: (date: { day: number; month: number; year: number }) => void;
  fromYear?: number;
  toYear?: number;
}

function CustomDatePicker({ date, setDate, fromYear = 1900, toYear = new Date().getFullYear() }: CustomDatePickerProps) {
  const yearOptions = Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i);

  const handleDayChange = (value: string) => {
    setDate({ ...date, day: parseInt(value, 10) });
  };
  const handleMonthChange = (value: string) => {
    setDate({ ...date, month: parseInt(value, 10) });
  };
  const handleYearChange = (value: string) => {
    setDate({ ...date, year: parseInt(value, 10) });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={String(date.day)} onValueChange={handleDayChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
            <ScrollArea className="h-60">
                {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
            </ScrollArea>
        </SelectContent>
      </Select>
      <Select value={String(date.month)} onValueChange={handleMonthChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
            <ScrollArea className="h-60">
                {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
            </ScrollArea>
        </SelectContent>
      </Select>
      <Select value={String(date.year)} onValueChange={handleYearChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-60">
            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}

interface AgeDetails {
    years: number;
    months: number;
    days: number;
    totalMonths: number;
    totalWeeks: number;
    totalDays: number;
    totalHours: number;
    totalMinutes: number;
    totalSeconds: number;
}

export default function AgeCalculator() {
    const today = new Date();
    const [dob, setDob] = useState({ day: 1, month: 0, year: 2000 });
    const [targetDate, setTargetDate] = useState({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() });
    const [age, setAge] = useState<AgeDetails | null>(null);

    const handleCalculate = () => {
        const dobDate = new Date(dob.year, dob.month, dob.day);
        const targetDateObj = new Date(targetDate.year, targetDate.month, targetDate.day);

        if (dobDate > targetDateObj) {
            setAge(null);
            return;
        }

        const years = differenceInYears(targetDateObj, dobDate);
        const pastDob = addYears(dobDate, years);
        const months = differenceInMonths(targetDateObj, pastDob);
        const pastDobAndMonths = addMonths(pastDob, months);
        const days = differenceInDays(targetDateObj, pastDobAndMonths);
        
        const totalMonths = differenceInMonths(targetDateObj, dobDate);
        const totalWeeks = differenceInWeeks(targetDateObj, dobDate);
        const totalDays = differenceInDays(targetDateObj, dobDate);
        const totalHours = differenceInHours(targetDateObj, dobDate);
        const totalMinutes = differenceInMinutes(targetDateObj, dobDate);
        const totalSeconds = differenceInSeconds(targetDateObj, dobDate);
        
        setAge({ 
            years, 
            months, 
            days,
            totalMonths,
            totalWeeks,
            totalDays,
            totalHours,
            totalMinutes,
            totalSeconds,
        });
    };
    
    const isValidDate = (d: { day: number; month: number; year: number }) => {
        const date = new Date(d.year, d.month, d.day);
        return date.getFullYear() === d.year && date.getMonth() === d.month && date.getDate() === d.day;
    };

    const isDobValid = useMemo(() => isValidDate(dob), [dob]);
    const isTargetDateValid = useMemo(() => isValidDate(targetDate), [targetDate]);
    const canCalculate = isDobValid && isTargetDateValid;

    const dobDateForComparison = useMemo(() => new Date(dob.year, dob.month, dob.day), [dob]);
    const targetDateForComparison = useMemo(() => new Date(targetDate.year, targetDate.month, targetDate.day), [targetDate]);

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
                        <CustomDatePicker date={dob} setDate={setDob} fromYear={1900} toYear={today.getFullYear()} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Age at the Date of</label>
                         <CustomDatePicker date={targetDate} setDate={setTargetDate} fromYear={1900} toYear={today.getFullYear() + 100}/>
                    </div>
                </div>

                <Button onClick={handleCalculate} disabled={!canCalculate} className="w-full">
                    Calculate Age
                </Button>

                {!canCalculate && (
                     <Alert variant="destructive">
                        <AlertTitle>Invalid Date</AlertTitle>
                        <AlertDescription>
                            One of the selected dates is not valid (e.g., Feb 30). Please correct it.
                        </AlertDescription>
                    </Alert>
                )}

                {canCalculate && age !== null && dobDateForComparison && targetDateForComparison && dobDateForComparison <= targetDateForComparison && (
                    <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>Calculated Age</AlertTitle>
                        <AlertDescription className="space-y-2 mt-4 text-base">
                            <div className="space-y-1">
                               <p><span className="font-bold text-foreground text-lg">{age.years}</span> years <span className="font-bold text-foreground text-lg">{age.months}</span> months <span className="font-bold text-foreground text-lg">{age.days}</span> days</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalMonths.toLocaleString()}</span> months <span className="font-bold text-foreground">{age.days}</span> days</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalWeeks.toLocaleString()}</span> weeks <span className="font-bold text-foreground">{differenceInDays(targetDateForComparison, addYears(addMonths(dobDateForComparison, age.totalMonths), age.days)) % 7}</span> days</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalDays.toLocaleString()}</span> days</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalHours.toLocaleString()}</span> hours</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalMinutes.toLocaleString()}</span> minutes</p>
                               <p className="text-muted-foreground">or <span className="font-bold text-foreground">{age.totalSeconds.toLocaleString()}</span> seconds</p>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {canCalculate && dobDateForComparison > targetDateForComparison && (
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

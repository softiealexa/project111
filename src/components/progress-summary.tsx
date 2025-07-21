

"use client"

import type { Profile, Subject, Chapter, CheckedState } from "@/lib/types";
import { useMemo, useState, useCallback } from "react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip, LabelList, ReferenceLine, LineChart, Line, Label as RechartsLabel } from "recharts";
import { CheckCircle, BookOpen, TrendingUp, Target, Filter, History, Clock, BarChart as BarChartIcon, CalendarDays, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { addDays, format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { getIconComponent } from "@/lib/icons";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const getProgress = (chapters: Chapter[], tasksPerLecture: number) => {
    if (tasksPerLecture === 0) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    chapters.forEach((chapter) => {
      totalTasks += chapter.lectureCount * tasksPerLecture;
      completedTasks += Object.values(chapter.checkedState || {}).filter(item => item.status === 'checked' || item.status === 'checked-red').length;
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

const formatAverageTime = (ms: number) => {
  if (ms === 0) return '00:00.00';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
};

function StatsDashboard({ title, stats, data }: { title: string, stats: { totalChapters: number, totalLectures: number, taskBreakdown: { name: string, completed: number, total: number }[]}, data: any[] }) {
    const barChartConfig: ChartConfig = {};
    const barChartData = data.map(d => {
        barChartConfig[d.chapterName] = { label: d.chapterName, color: d.subjectColor };
        return {
            name: d.chapterName,
            tasks: d.completedTasks,
            fill: d.subjectColor,
        };
    });

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">At a Glance</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-sm font-medium text-muted-foreground">Chapters</p>
                            <p className="text-3xl font-bold">{stats.totalChapters}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="text-sm font-medium text-muted-foreground">Lectures</p>
                            <p className="text-3xl font-bold">{stats.totalLectures}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Task Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.taskBreakdown.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                {stats.taskBreakdown.map(task => (
                                    <div key={task.name}>
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-medium text-muted-foreground">{task.name}</span>
                                            <span className="font-bold">{task.completed} / {task.total}</span>
                                        </div>
                                        <Progress value={task.total > 0 ? (task.completed / task.total) * 100 : 0} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No task data available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
             {data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Chapter Activity</CardTitle>
                        <CardDescription>Tasks completed per chapter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={barChartConfig} className="mx-auto aspect-video max-h-[300px]">
                            <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={10}
                                    width={120}
                                    className="text-xs truncate"
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent 
                                        formatter={(value, name, item) => (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.payload.fill}}></div>
                                                <span className="font-medium text-foreground">{item.payload.name}: {value} tasks</span>
                                            </div>
                                        )}
                                        hideLabel
                                    />} 
                                />
                                <Bar dataKey="tasks" radius={4}>
                                    {barChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
             )}
        </div>
    );
}

function WeeklyProgressDashboard({ profile }: { profile: Profile }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { weekRange, weeklyData, weeklyStats } = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const colors = ["hsl(180, 80%, 55%)", "hsl(221, 83%, 65%)", "hsl(262, 85%, 68%)", "hsl(24, 96%, 63%)", "hsl(142, 76%, 46%)"];
        const subjectColorMap: Record<string, string> = {};
        profile.subjects.forEach((s, i) => subjectColorMap[s.name] = colors[i % colors.length]);

        const chaptersInWeek: Record<string, { subject: Subject, chapter: Chapter, completedTasks: Record<string, CheckedState> }> = {};
        
        profile.subjects.forEach(subject => {
            subject.chapters.forEach(chapter => {
                const checkedState = chapter.checkedState || {};
                Object.entries(checkedState).forEach(([key, value]) => {
                    if (value.completedAt && isWithinInterval(new Date(value.completedAt), { start, end })) {
                        const chapterId = `${subject.name}-${chapter.name}`;
                        if (!chaptersInWeek[chapterId]) {
                            chaptersInWeek[chapterId] = {
                                subject,
                                chapter,
                                completedTasks: {}
                            };
                        }
                        chaptersInWeek[chapterId].completedTasks[key] = value;
                    }
                });
            });
        });

        const data = Object.values(chaptersInWeek).map(({ subject, chapter, completedTasks }) => {
            return {
                subjectName: subject.name,
                subjectIcon: subject.icon,
                subjectColor: subjectColorMap[subject.name] || '#ccc',
                tasks: subject.tasks,
                chapterName: chapter.name,
                chapter,
                completedTasks: Object.keys(completedTasks).length,
                weeklyCompletedTasks: completedTasks,
            };
        });

        const lecturesWorkedOn = new Set();
        const taskStats: Record<string, { completed: number; total: number }> = {};
        const chaptersWorkedOn = new Set();

        const allTasks = new Set<string>();
        profile.subjects.forEach(s => s.tasks.forEach(t => allTasks.add(t)));
        allTasks.forEach(t => { taskStats[t] = { completed: 0, total: 0 }});

        data.forEach(item => {
            chaptersWorkedOn.add(item.chapter.name);

            Object.keys(item.weeklyCompletedTasks).forEach(key => {
                const parts = key.split('-');
                const taskName = parts[parts.length - 1];
                const lectureNum = parts[parts.length - 2];
                
                if (taskStats[taskName]) {
                    taskStats[taskName].completed++;
                }
                
                lecturesWorkedOn.add(`${item.subjectName}-${item.chapter.name}-${lectureNum}`);
            });
        });

        const stats = {
            totalChapters: chaptersWorkedOn.size,
            totalLectures: lecturesWorkedOn.size,
            taskBreakdown: Object.entries(taskStats)
                .map(([name, { completed }]) => ({ name, completed, total: 0 }))
                .filter(item => item.completed > 0)
                .sort((a,b) => a.name.localeCompare(b.name)),
        };
        
        return {
            weekRange: { start, end },
            weeklyData: data,
            weeklyStats: stats,
        };
    }, [currentDate, profile]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="space-y-1">
                     <h3 className="text-xl font-semibold">Weekly Report</h3>
                     <p className="text-muted-foreground">{format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'd, yyyy')}</p>
                 </div>
                 <div className='flex items-center rounded-md border bg-card'>
                    <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="rounded-r-none h-9"><ChevronLeft className="mr-2 h-4 w-4"/> Prev</Button>
                    <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="rounded-none border-x h-9">This Week</Button>
                    <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="rounded-l-none h-9">Next <ChevronRight className="ml-2 h-4 w-4"/></Button>
                </div>
            </div>
            
            {weeklyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-12 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-medium text-muted-foreground">No Activity This Week</h3>
                    <p className="text-sm text-muted-foreground">Complete some tasks to see your progress here.</p>
                </div>
            ) : (
                <>
                    <StatsDashboard title="Weekly Snapshot" stats={weeklyStats} data={weeklyData} />
                    <Accordion type="multiple" className="w-full space-y-4">
                        {weeklyData.map(item => {
                            const Icon = getIconComponent(item.subjectIcon);
                            return (
                                <Card key={`${item.subjectName}-${item.chapter.name}`} className="overflow-hidden">
                                    <div className="p-4 border-b bg-muted/30">
                                        <h4 className="text-lg font-semibold flex items-center gap-2">
                                            <Icon className="h-5 w-5"/>
                                            {item.subjectName}
                                        </h4>
                                    </div>
                                    <AccordionItem value={`${item.subjectName}-${item.chapter.name}`} className="border-b last:border-b-0">
                                        <AccordionTrigger className="px-4 py-3 text-base hover:bg-muted/50 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-medium truncate">{item.chapter.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.completedTasks} tasks completed this week
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                            <div className="space-y-3 rounded-md border p-3">
                                                {Array.from({ length: item.chapter.lectureCount }, (_, i) => i + 1).map((lectureNum) => (
                                                    <div key={lectureNum} className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2 rounded-md bg-background p-2">
                                                        <p className="font-semibold text-sm">Lecture {lectureNum}</p>
                                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                                                            {item.tasks.map((task: string) => {
                                                                const checkboxId = `${item.subjectName}-${item.chapter.name}-Lecture-${lectureNum}-${task}`;
                                                                const isCheckedThisWeek = item.weeklyCompletedTasks[checkboxId] !== undefined;
                                                                return (
                                                                    <div key={task} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                        <CheckCircle className={cn("h-3.5 w-3.5", isCheckedThisWeek ? "text-green-500" : "text-muted-foreground/50")} />
                                                                        <span>{task}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>
                            )
                        })}
                    </Accordion>
                </>
            )}
        </div>
    );
}

export default function ProgressSummary({ profile }: { profile: Profile }) {
  const [chartType, setChartType] = useState("bar");
  const [selectedChapters, setSelectedChapters] = useState<Record<string, string[]>>({});
  const [progressGoal, setProgressGoal] = useState(75);

  const { overallStats, chartData, chartConfig, summaryStats, lineChartData, hasEnoughHistory, questionStats, questionHistoryLineData, questionTimeChartConfig, sessions } = useMemo(() => {
    if (!profile || profile.subjects.length === 0) {
      return { overallStats: { totalChapters: 0, totalLectures: 0, taskBreakdown: [] }, chartData: [], chartConfig: {}, summaryStats: { subjectsCompleted: 0, chaptersCompleted: 0, averageCompletion: 0 }, lineChartData: [], hasEnoughHistory: false, questionStats: { totalSessions: 0, totalQuestions: 0, totalTime: 0, overallAverage: 0 }, questionHistoryLineData: [], questionTimeChartConfig: {}, sessions: [] };
    }
    
    const chartConfig: ChartConfig = {};
    const colors = ["hsl(180, 80%, 55%)", "hsl(221, 83%, 65%)", "hsl(262, 85%, 68%)", "hsl(24, 96%, 63%)", "hsl(142, 76%, 46%)"];

    let totalChaptersCompleted = 0;
    let totalProgressSum = 0;
    let totalChaptersCount = 0;

    const chartData = profile.subjects.map((subject, index) => {
      totalChaptersCount += subject.chapters.length;
      const subjectFilter = selectedChapters[subject.name];
      const chaptersToConsider = subjectFilter === undefined
        ? subject.chapters
        : subject.chapters.filter(c => subjectFilter.includes(c.name));

      const tasksPerLecture = subject.tasks?.length || 0;
      const progress = getProgress(chaptersToConsider, tasksPerLecture);
      
      const subjectChaptersCompleted = subject.chapters.filter(c => getProgress([c], tasksPerLecture) === 100).length;
      totalChaptersCompleted += subjectChaptersCompleted;
      totalProgressSum += getProgress(subject.chapters, tasksPerLecture);

      const color = colors[index % colors.length];

      chartConfig[subject.name] = {
          label: subject.name,
          color: color,
      };
      
      return {
        subject: subject.name,
        progress: progress,
        fill: color,
      };
    });

    const subjectsCompleted = profile.subjects.filter(s => getProgress(s.chapters, s.tasks?.length || 0) === 100).length;
    const averageCompletion = profile.subjects.length > 0 ? Math.round(totalProgressSum / profile.subjects.length) : 0;

    const summaryStats = {
        subjectsCompleted,
        chaptersCompleted: totalChaptersCompleted,
        averageCompletion,
    };
    
    const history = profile.progressHistory || [];
    const enoughHistory = history.length >= 2;
    const lineChartData = history.map(point => ({
        date: format(new Date(`${point.date}T00:00:00`), 'MMM d'),
        progress: point.progress
    })).slice(-30);


    const sessions = profile.questionSessions || [];
    const questionStats = {
        totalSessions: sessions.length,
        totalQuestions: sessions.reduce((acc, s) => acc + s.numQuestions, 0),
        totalTime: sessions.reduce((acc, s) => acc + s.totalTime, 0),
        get overallAverage() {
            return this.totalQuestions > 0 ? this.totalTime / this.totalQuestions : 0;
        },
    };

    const questionHistoryLineData = sessions
        .map(s => ({
            date: s.date,
            averageTime: s.totalTime / s.numQuestions,
        }))
        .sort((a, b) => a.date - b.date)
        .slice(-30)
        .map(s => ({
            date: format(new Date(s.date), 'MMM d'),
            averageTime: s.averageTime / 1000,
        }));
    
    const questionTimeChartConfig: ChartConfig = {
        averageTime: {
            label: "Average Time (s)",
            color: "hsl(var(--primary))",
        },
    };

    const lecturesWorkedOn = new Set();
    const taskStats: Record<string, { completed: number; total: number }> = {};
    const chaptersWorkedOn = new Set();
    
    profile.subjects.forEach(subject => {
        subject.tasks.forEach(task => {
            if (!taskStats[task]) {
                taskStats[task] = { completed: 0, total: 0 };
            }
        });

        subject.chapters.forEach(chapter => {
            let chapterWorkedOn = false;
            const allCheckedStates = chapter.checkedState || {};
            
            Object.values(allCheckedStates).forEach(item => {
              if (item.status === 'checked' || item.status === 'checked-red') {
                  chapterWorkedOn = true;
              }
            });

            if (chapterWorkedOn) {
                chaptersWorkedOn.add(chapter.name);
            }

            Object.keys(allCheckedStates).forEach(key => {
                const parts = key.split('-');
                const taskName = parts[parts.length - 1];
                const lectureNum = parts[parts.length - 2];
                
                if (taskStats[taskName]) {
                    taskStats[taskName].completed++;
                }
                
                lecturesWorkedOn.add(`${subject.name}-${chapter.name}-${lectureNum}`);
            });

            subject.tasks.forEach(task => {
                if (taskStats[task]) {
                    taskStats[task].total += chapter.lectureCount;
                }
            });
        });
    });

    const overallStats = {
        totalChapters: chaptersWorkedOn.size,
        totalLectures: lecturesWorkedOn.size,
        taskBreakdown: Object.entries(taskStats)
            .map(([name, { completed, total }]) => ({ name, completed, total }))
            .sort((a,b) => a.name.localeCompare(b.name)),
    };

    return { overallStats, chartData, chartConfig, summaryStats, lineChartData, hasEnoughHistory, questionStats, questionHistoryLineData, questionTimeChartConfig, sessions };
  }, [profile, selectedChapters]);

  const handleChapterSelect = useCallback((subjectName: string, chapterName: string, checked: boolean) => {
    const allChapterNames = profile.subjects.find(s => s.name === subjectName)?.chapters.map(c => c.name) || [];
    
    setSelectedChapters(prev => {
        const currentSelected = prev[subjectName] ?? allChapterNames;
        
        const newSelected = checked
            ? [...currentSelected, chapterName]
            : currentSelected.filter(c => c !== chapterName);
        
        const newState = { ...prev };
        if (newSelected.length === allChapterNames.length) {
            delete newState[subjectName];
        } else {
            newState[subjectName] = newSelected;
        }
        return newState;
    });
  }, [profile.subjects]);

  const handleSelectAll = useCallback((subjectName: string, checked: boolean) => {
    setSelectedChapters(prev => {
        const newState = { ...prev };
        if (checked) {
            delete newState[subjectName];
        } else {
            newState[subjectName] = [];
        }
        return newState;
    });
  }, []);

  if (profile.subjects.length === 0) {
    return null;
  }

  return (
     <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="overall" className="space-y-6">
            <StatsDashboard title="Lifetime Stats" stats={overallStats} data={[]} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:bg-card/90 transition-colors hover:shadow-primary/10 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subjects Completed</CardTitle>
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summaryStats.subjectsCompleted}/{profile.subjects.length}</div>
                        <p className="text-xs text-muted-foreground">Total subjects marked as 100% complete.</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-card/90 transition-colors hover:shadow-primary/10 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chapters Completed</CardTitle>
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summaryStats.chaptersCompleted}</div>
                        <p className="text-xs text-muted-foreground">Total chapters marked as 100% complete.</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-card/90 transition-colors hover:shadow-primary/10 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{summaryStats.averageCompletion}%</div>
                        <p className="text-xs text-muted-foreground">Average progress across all subjects.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Analysis</CardTitle>
                    <CardDescription>Visualize your progress based on the selected filters.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={chartType} onValueChange={setChartType} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                            <TabsTrigger value="line">Line Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="bar">
                            <ChartContainer config={chartConfig} className="mx-auto aspect-video max-h-[400px]">
                                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="subject" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 8)} />
                                    <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                                    <RechartsTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            labelKey="subject" 
                                            indicator="dot"
                                            formatter={(value) => <span className="font-bold text-foreground">{`${value}% Complete`}</span>}
                                        />}
                                    />
                                    <ReferenceLine y={progressGoal} strokeDasharray="3 3" stroke="hsl(var(--primary))">
                                    <RechartsLabel value={`Goal: ${progressGoal}%`} position="insideTopRight" fill="hsl(var(--primary))" fontSize={12} dy={-5} dx={-5} />
                                    </ReferenceLine>
                                    <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
                                    <LabelList dataKey="progress" position="top" offset={8} className="fill-foreground" fontSize={12} formatter={(value: number) => `${value}%`} />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </TabsContent>
                        <TabsContent value="pie">
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
                                <PieChart>
                                    <RechartsTooltip content={<ChartTooltipContent hideLabel nameKey="subject" />} />
                                    <Pie data={chartData} dataKey="progress" nameKey="subject" innerRadius={60} strokeWidth={2}>
                                        {chartData.map((entry) => (
                                            <Cell key={`cell-${entry.subject}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Legend content={<ChartLegendContent nameKey="subject" />} />
                                </PieChart>
                            </ChartContainer>
                        </TabsContent>
                        <TabsContent value="line">
                            {!hasEnoughHistory ? (
                                <Alert variant="default" className="my-4">
                                    <TrendingUp className="h-4 w-4" />
                                    <AlertTitle>Not Enough Data</AlertTitle>
                                    <AlertDescription>
                                        Keep tracking your progress for a couple of days to see your historical data here.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <ChartContainer config={{ progress: { label: "Progress", color: "hsl(var(--primary))" } }} className="mx-auto aspect-video max-h-[400px]">
                                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                                        <RechartsTooltip
                                            content={<ChartTooltipContent 
                                                indicator="dot"
                                                formatter={(value, name, item) => (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-foreground text-sm">{item.payload.date}</span>
                                                        <span className="text-muted-foreground">{`Progress: ${value}%`}</span>
                                                    </div>
                                                )}
                                                hideLabel
                                            />}
                                        />
                                        <Line type="monotone" dataKey="progress" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                                    </LineChart>
                                </ChartContainer>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <Separator />
                <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="filters" className="border-none">
                        <AccordionTrigger className="px-6 py-4 font-medium text-base hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            <div className="flex items-center gap-3">
                                <Filter className="h-5 w-5" />
                                <span>Filters & Goal Setting</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                                <div>
                                    <h3 className="text-base font-medium text-foreground mb-2">Filter by Chapter</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Include or exclude specific chapters from the charts above.
                                    </p>
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {profile.subjects.map(subject => {
                                        if (subject.chapters.length === 0) return null;
                                        
                                        const allChaptersSelected = selectedChapters[subject.name] === undefined;
                                        
                                        return (
                                            <AccordionItem value={subject.name} key={subject.name} className="border rounded-md data-[state=open]:shadow-sm">
                                                <AccordionTrigger className="px-4 py-2 hover:no-underline text-sm">
                                                    {subject.name}
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 px-4 pb-4">
                                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                                                        <div className="flex items-center space-x-3 p-1 rounded-md transition-colors hover:bg-muted/50">
                                                            <Checkbox 
                                                                id={`${subject.name}-select-all`}
                                                                checked={allChaptersSelected || selectedChapters[subject.name]?.length === subject.chapters.length ? 'checked' : 'unchecked'}
                                                                onCheckedChange={(checked) => handleSelectAll(subject.name, checked === 'checked')}
                                                            />
                                                            <Label htmlFor={`${subject.name}-select-all`} className="font-semibold text-sm cursor-pointer flex-1">
                                                                Select All
                                                            </Label>
                                                        </div>
                                                        <Separator className="my-1"/>
                                                        {subject.chapters.map(chapter => (
                                                            <div key={chapter.name} className="flex items-center space-x-3 p-1 rounded-md transition-colors hover:bg-muted/50">
                                                                <Checkbox 
                                                                    id={`${subject.name}-${chapter.name}`}
                                                                    checked={allChaptersSelected || (selectedChapters[subject.name]?.includes(chapter.name) ?? false) ? 'checked' : 'unchecked'}
                                                                    onCheckedChange={(checked) => handleChapterSelect(subject.name, chapter.name, checked === 'checked')}
                                                                />
                                                                <Label htmlFor={`${subject.name}-${chapter.name}`} className="font-normal text-sm cursor-pointer flex-1">
                                                                    {chapter.name}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                        })}
                                    </Accordion>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-base font-medium text-foreground">Set Progress Goal</h3>
                                    <div className="grid gap-2">
                                        <Label htmlFor="goal-input" className="flex items-center gap-2 text-muted-foreground">
                                        <Target className="h-4 w-4" /> Goal Percentage
                                        </Label>
                                        <div className="relative">
                                        <Input
                                            id="goal-input"
                                            type="number"
                                            value={progressGoal}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (!isNaN(val) && val >= 0 && val <= 100) {
                                                    setProgressGoal(val);
                                                } else if (e.target.value === "") {
                                                    setProgressGoal(0);
                                                }
                                            }}
                                            min="0"
                                            max="100"
                                            className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Question Timer Statistics</CardTitle>
                    <CardDescription>An overview of your question attempt performance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sessions.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
                                        <History className="h-5 w-5 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{questionStats.totalSessions}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
                                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{questionStats.totalQuestions}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Overall Avg. Time</CardTitle>
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{formatAverageTime(questionStats.overallAverage)}</div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <h4 className="text-base font-medium mb-4">Average Time per Session (seconds)</h4>
                                {questionHistoryLineData.length >= 2 ? (
                                    <ChartContainer config={questionTimeChartConfig} className="mx-auto aspect-video max-h-[250px]">
                                        <LineChart data={questionHistoryLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis 
                                                tickFormatter={(value) => `${value.toFixed(1)}s`}
                                                domain={['dataMin - 1', 'dataMax + 1']}
                                            />
                                            <RechartsTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent 
                                                    indicator="dot"
                                                    formatter={(value, name, item) => (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-foreground text-sm">{item.payload.date}</span>
                                                            <span className="text-muted-foreground">{`Avg Time: ${Number(value).toFixed(2)}s`}</span>
                                                        </div>
                                                    )}
                                                    hideLabel
                                                />}
                                            />
                                            <Line type="monotone" dataKey="averageTime" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ChartContainer>
                                ) : (
                                    <Alert variant="default">
                                        <TrendingUp className="h-4 w-4" />
                                        <AlertTitle>Not Enough Session Data</AlertTitle>
                                        <AlertDescription>
                                            Complete at least two sessions to see your trend chart.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </>
                    ) : (
                        <Alert>
                            <BarChartIcon className="h-4 w-4" />
                            <AlertTitle>No Data Yet</AlertTitle>
                            <AlertDescription>
                            You haven't completed any Question Timer sessions. Go to the "Tools" tab to start one!
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="weekly">
            <WeeklyProgressDashboard profile={profile} />
        </TabsContent>
    </Tabs>
  );
}

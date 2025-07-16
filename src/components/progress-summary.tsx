
"use client"

import type { Profile, Subject, Chapter, TaskStatus } from "@/lib/types";
import { useMemo, useState, useCallback } from "react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, LabelList, ReferenceLine, LineChart, Line, Label as RechartsLabel } from "recharts";
import { CheckCircle, BookOpen, TrendingUp, Target, Filter, History, Clock, BarChart as BarChartIcon } from "lucide-react";
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
import { format } from "date-fns";

const getProgress = (chapters: Chapter[], tasksPerLecture: number) => {
    if (tasksPerLecture === 0) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    chapters.forEach((chapter) => {
      totalTasks += chapter.lectureCount * tasksPerLecture;
      completedTasks += Object.values(chapter.checkedState || {}).filter(status => status === 'checked').length;
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

export default function ProgressSummary({ profile }: { profile: Profile }) {
  const [chartType, setChartType] = useState("bar");
  const [selectedChapters, setSelectedChapters] = useState<Record<string, string[]>>({});
  const [progressGoal, setProgressGoal] = useState(75);

  const { chartData, chartConfig, summaryStats, lineChartData, hasEnoughHistory, questionStats, questionHistoryLineData, questionTimeChartConfig, sessions } = useMemo(() => {
    if (!profile || profile.subjects.length === 0) {
      return { chartData: [], chartConfig: {}, summaryStats: { subjectsCompleted: 0, chaptersCompleted: 0, averageCompletion: 0 }, lineChartData: [], hasEnoughHistory: false, questionStats: { totalSessions: 0, totalQuestions: 0, totalTime: 0, overallAverage: 0 }, questionHistoryLineData: [], questionTimeChartConfig: {}, sessions: [] };
    }
    
    const config: ChartConfig = {};
    const colors = ["hsl(180, 80%, 55%)", "hsl(221, 83%, 65%)", "hsl(262, 85%, 68%)", "hsl(24, 96%, 63%)", "hsl(142, 76%, 46%)"];

    let totalChaptersCompleted = 0;
    let totalProgressSum = 0;
    let totalChaptersCount = 0;

    const data = profile.subjects.map((subject, index) => {
      totalChaptersCount += subject.chapters.length;
      const subjectFilter = selectedChapters[subject.name];
      const chaptersToConsider = subjectFilter === undefined
        ? subject.chapters
        : subject.chapters.filter(c => subjectFilter.includes(c.name));

      const tasksPerLecture = subject.tasks?.length || 0;
      const progress = getProgress(chaptersToConsider, tasksPerLecture);
      
      const subjectChaptersCompleted = subject.chapters.filter(c => getProgress([c], tasksPerLecture) === 100).length;
      totalChaptersCompleted += subjectChaptersCompleted;
      totalProgressSum += getProgress(subject.chapters, tasksPerLecture); // Use full progress for average

      const color = colors[index % colors.length];

      config[subject.name] = {
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

    const stats = {
        subjectsCompleted,
        chaptersCompleted: totalChaptersCompleted,
        averageCompletion,
    };
    
    const history = profile.progressHistory || [];
    const enoughHistory = history.length >= 2;
    const lineData = history.map(point => ({
        // Date is 'YYYY-MM-DD', needs to be parsed correctly. Add T00:00:00 to avoid timezone issues.
        date: format(new Date(`${point.date}T00:00:00`), 'MMM d'),
        progress: point.progress
    })).slice(-30); // Show last 30 days max


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
        .sort((a, b) => a.date - b.date) // Sort by date ascending
        .slice(-30) // show last 30 sessions
        .map(s => ({
            date: format(new Date(s.date), 'MMM d'),
            averageTime: s.averageTime / 1000, // convert ms to seconds
        }));
    
    const questionTimeChartConfig: ChartConfig = {
        averageTime: {
            label: "Average Time (s)",
            color: "hsl(var(--primary))",
        },
    };


    return { chartData: data, chartConfig: config, summaryStats: stats, lineChartData: lineData, hasEnoughHistory: enoughHistory, questionStats, questionHistoryLineData, questionTimeChartConfig, sessions };
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
    <div className="space-y-6">
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
                                <Tooltip
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
                                <Tooltip content={<ChartTooltipContent hideLabel nameKey="subject" />} />
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
                                    <Tooltip
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
                                        <Tooltip
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
    </div>
  );
}

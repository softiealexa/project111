"use client"

import type { Profile } from "@/lib/types";
import { useMemo, useState, useCallback } from "react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ProgressSummary({ profile }: { profile: Profile }) {
  const [chartType, setChartType] = useState("bar");
  const [selectedChapters, setSelectedChapters] = useState<Record<string, string[]>>({});

  const { chartData, chartConfig } = useMemo(() => {
    if (!profile || profile.subjects.length === 0) {
      return { chartData: [], chartConfig: {} };
    }
    const config: ChartConfig = {};
    const baseHue = 180;
    const hueStep = profile.subjects.length > 1 ? 45 : 0;

    const data = profile.subjects.map((subject, index) => {
      let totalTasks = 0;
      let completedTasks = 0;
      const tasksPerLecture = subject.tasks?.length || 0;

      const subjectFilter = selectedChapters[subject.name];
      const chaptersToConsider = subjectFilter === undefined
        ? subject.chapters
        : subject.chapters.filter(c => subjectFilter.includes(c.name));

      chaptersToConsider.forEach((chapter) => {
        totalTasks += chapter.lectureCount * tasksPerLecture;
        completedTasks += Object.values(chapter.checkedState || {}).filter(Boolean).length;
      });

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const color = `hsl(${baseHue + (index * hueStep)}, 70%, 50%)`;

      config[subject.name] = {
          label: subject.name,
          color: color,
      }
      
      return {
        subject: subject.name,
        progress: progress,
        fill: color,
      };
    });

    return { chartData: data, chartConfig: config };
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

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-none">
          <AccordionPrimitive.Header className="flex">
              <div className="flex flex-1 items-center justify-between p-6">
                <AccordionPrimitive.Trigger className="flex items-center gap-4 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex-1">
                        <CardTitle>Progress Overview</CardTitle>
                        <CardDescription className="pt-1.5">
                          Your completion percentage for each subject.
                        </CardDescription>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
                <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-[150px] ml-4">
                        <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </AccordionPrimitive.Header>
          <AccordionContent>
            <CardContent className="pt-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[350px]"
                >
                {chartType === 'bar' ? (
                  <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="subject"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 8)}
                    />
                    <YAxis
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                      width={35}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent 
                        labelKey="subject" 
                        indicator="dot"
                        formatter={(value, name) => (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-foreground">{`${value}% Complete`}</span>
                            </div>
                        )}
                       />}
                    />
                    <Bar dataKey="progress" radius={8}>
                      {chartData.map((entry) => (
                        <Cell key={entry.subject} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="subject" />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="progress"
                      nameKey="subject"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.subject} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="subject" />}
                      className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                )}
              </ChartContainer>
            </CardContent>

            <Separator className="my-4" />
            <div className="px-6 pb-6">
                <h3 className="text-base font-medium text-foreground">Filter by Chapter</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Select chapters to see their combined progress in the chart above.
                </p>
                <Accordion type="multiple" className="w-full space-y-2">
                    {profile.subjects.map(subject => {
                       if (subject.chapters.length === 0) return null;
                       
                       const allChaptersSelected = selectedChapters[subject.name] === undefined;
                       
                       return (
                        <AccordionItem value={subject.name} key={subject.name} className="border-border border rounded-md data-[state=open]:shadow-md">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex-1 text-left font-medium">{subject.name}</div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 px-4 pb-4">
                                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-2">
                                    <div className="flex items-center space-x-3 p-1 rounded-md transition-colors hover:bg-muted/50">
                                        <Checkbox 
                                            id={`${subject.name}-select-all`}
                                            checked={allChaptersSelected || selectedChapters[subject.name]?.length === subject.chapters.length}
                                            onCheckedChange={(checked) => handleSelectAll(subject.name, !!checked)}
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
                                                checked={allChaptersSelected || (selectedChapters[subject.name]?.includes(chapter.name) ?? false)}
                                                onCheckedChange={(checked) => handleChapterSelect(subject.name, chapter.name, !!checked)}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

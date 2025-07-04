"use client"

import type { Profile } from "@/lib/types";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
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
} from "@/components/ui/chart";

export function ProgressSummary({ profile }: { profile: Profile }) {
  const [chartType, setChartType] = useState("bar");

  const chartData = useMemo(() => {
    return profile.subjects.map((subject) => {
      let totalTasks = 0;
      let completedTasks = 0;
      const tasksPerLecture = subject.tasks?.length || 0;

      subject.chapters.forEach((chapter) => {
        totalTasks += chapter.lectureCount * tasksPerLecture;
        completedTasks += Object.values(chapter.checkedState || {}).filter(Boolean).length;
      });

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        subject: subject.name,
        progress: progress,
        fill: "hsl(var(--primary))", // Use the primary theme color for the bars
      };
    });
  }, [profile]);

  if (chartData.length === 0) {
    return null; // Don't render anything if there are no subjects
  }

  const chartConfig = {
    progress: {
      label: "Progress",
      color: "hsl(var(--primary))",
    },
  };

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
                        <SelectItem value="pie" disabled>Pie Chart</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </AccordionPrimitive.Header>
          <AccordionContent>
            <CardContent className="pt-0">
              {chartType === 'bar' && (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

"use client"

import type { Profile } from "@/lib/types";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TASKS_PER_LECTURE = 4; // Lecture, DPP, Module, Class Qs

export function ProgressSummary({ profile }: { profile: Profile }) {
  const chartData = useMemo(() => {
    return profile.subjects.map((subject) => {
      let totalTasks = 0;
      let completedTasks = 0;

      subject.chapters.forEach((chapter) => {
        totalTasks += chapter.lectureCount * TASKS_PER_LECTURE;
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
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
        <CardDescription>
          Your completion percentage for each subject.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

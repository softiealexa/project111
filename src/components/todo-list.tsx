
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TodoList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legacy To-Do List</CardTitle>
        <CardDescription>
          This component has been replaced by the new Smart To-Do List. Please use the new tool.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-4">
          This feature is no longer active.
        </p>
      </CardContent>
    </Card>
  );
}

    
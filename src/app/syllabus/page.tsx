
'use client';

import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CheckSquare } from 'lucide-react';

export default function SyllabusChecklistPage() {
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-muted/40 p-4">
          <Card className="w-full max-w-2xl text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="mt-4 text-3xl font-bold">Syllabus Checklist</CardTitle>
              <CardDescription className="text-lg">
                This is the new Syllabus Checklist page. Content and features will be added here.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">Stay tuned for updates!</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}

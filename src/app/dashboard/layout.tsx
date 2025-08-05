
'use client';

import Navbar from '@/components/navbar';
import ProgressDownloadDialog from '@/components/progress-download-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider delayDuration={100}>
        <div className="flex flex-col min-h-screen">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:px-4 focus:py-2 focus:top-2 focus:left-2 bg-background text-foreground border rounded-md"
            >
                Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="flex-1 flex">
                {children}
            </main>
            <Suspense>
              <ProgressDownloadDialog />
            </Suspense>
        </div>
    </TooltipProvider>
  );
}

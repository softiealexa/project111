import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/data-context';
import { cn } from '@/lib/utils';
import { ThemeScript } from '@/components/theme-script';

const fontBody = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body'
});

const fontHeadline = Space_Grotesk({
    subsets: ['latin'],
    weight: ['500', '700'],
    display: 'swap',
    variable: '--font-headline'
});

export const metadata: Metadata = {
  title: 'TrackAcademic | Your Personal Study Planner & Progress Tracker',
  description: 'The simplest way to track your academic progress, chapter by chapter. Stay organized with a Pomodoro timer, notes writer, and customizable subject tracking. Conquer your courses with TrackAcademic.',
  keywords: ['academic tracker', 'study planner', 'progress tracker', 'student tools', 'pomodoro timer', 'notes app', 'course management', 'lecture tracker'],
  icons: {
    icon: "data:image/svg+xml,&lt;svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3d5ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'&gt;&lt;path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'/&gt;&lt;/svg&gt;",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(fontBody.variable, fontHeadline.variable)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-body antialiased">
        <DataProvider>
          {children}
          <Toaster />
        </DataProvider>
        <Analytics />
      </body>
    </html>
  );
}

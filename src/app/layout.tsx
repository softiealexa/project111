import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
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

const APP_NAME = "TrackAcademic";
const APP_DESCRIPTION = "The simplest way to track your academic progress, chapter by chapter. Stay organized with a Pomodoro timer, notes writer, and customizable subject tracking. Conquer your courses with TrackAcademic.";
const APP_URL = "https://trackacademic.app"; // Replace with your actual domain

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | Your Personal Study Planner & Progress Tracker`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: ['academic tracker', 'study planner', 'progress tracker', 'student tools', 'pomodoro timer', 'notes app', 'course management', 'lecture tracker', 'jee prep', 'neet prep'],
  authors: [{ name: "TrackAcademic Team" }],
  creator: "TrackAcademic Team",
  publisher: "TrackAcademic Team",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    url: APP_URL,
    title: `${APP_NAME} | Your Personal Study Planner & Progress Tracker`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [{
      url: `${APP_URL}/og-image.png`, // Replace with your actual OG image URL
      width: 1200,
      height: 630,
      alt: "TrackAcademic Dashboard Preview",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} | Your Personal Study Planner & Progress Tracker`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.png`], // Replace with your actual OG image URL
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <SpeedInsights />
      </body>
    </html>
  );
}

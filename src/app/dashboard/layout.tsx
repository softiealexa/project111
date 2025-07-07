'use client';

import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider delayDuration={100}>
      <Navbar />
      <main>{children}</main>
    </TooltipProvider>
  );
}

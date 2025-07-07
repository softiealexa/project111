'use client';

import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import OnboardingTour from '@/components/onboarding-tour';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider delayDuration={100}>
      <Navbar />
      <main>{children}</main>
      <OnboardingTour />
    </TooltipProvider>
  );
}

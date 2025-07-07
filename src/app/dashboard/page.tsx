
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import DashboardClient from './dashboard-client';

// This is a wrapper component that uses Suspense to handle the client-side rendering
// of the main dashboard content, which uses the useSearchParams hook.
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner containerClassName="h-screen w-full" text="Loading dashboard..." />} >
      <DashboardClient />
    </Suspense>
  );
}

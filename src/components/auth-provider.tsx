
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { LoadingSpinner } from './loading-spinner';
import { UpdateAccountForm } from './auth/update-account-form';

/**
 * This provider is responsible for handling the initial auth state and routing.
 * It checks if the user is authenticated and if their account needs to be updated (legacy users).
 * It shows a loading screen during this check.
 * It also handles protecting routes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useData();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isLegacyUser = user?.email?.endsWith('@trackademic.local') ?? false;

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is complete
    }

    if (user && isAuthPage) {
      router.replace('/dashboard');
    }

    if (!user && !isAuthPage && pathname !== '/') {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, pathname, router]);


  // Show a global loading spinner during the initial auth check.
  if (loading) {
    return <LoadingSpinner containerClassName="min-h-screen" />;
  }

  // If the user is authenticated but has a legacy account, force them to update.
  if (user && isLegacyUser && !isAuthPage) {
    return <UpdateAccountForm />;
  }

  // If the user is authenticated on an auth page, show a loader while redirecting.
  if (user && isAuthPage) {
    return <LoadingSpinner containerClassName="min-h-screen" text="Redirecting..." />;
  }
  
  // Otherwise, render the requested page content.
  return <>{children}</>;
}

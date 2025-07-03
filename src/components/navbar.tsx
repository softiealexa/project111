'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpenCheck className="h-7 w-7" />
            <span className="font-headline text-2xl font-bold">Trackademic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.username}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {pathname !== '/login' && (
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
                {pathname !== '/register' && (
                    <Button asChild size="sm">
                        <Link href="/register">Sign Up</Link>
                    </Button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-8 flex items-center gap-3">
        <Book className="h-12 w-12 text-primary" />
        <h1 className="font-headline text-5xl font-bold">TrackAcademic</h1>
      </div>
      <p className="max-w-xl text-lg text-muted-foreground">
        The simplest way to track your academic progress, chapter by chapter. Stay organized, stay motivated, and conquer your courses.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Login to Your Account</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/register">Create an Account</Link>
        </Button>
      </div>
      <Button asChild variant="link" className="mt-6 text-muted-foreground">
        <Link href="/dashboard">
          Continue without an account <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

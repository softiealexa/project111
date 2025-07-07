
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Book, ArrowRight, BarChart3, Timer, Settings, Cloud } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LandingPage() {
  const { user, loading } = useData();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <LoadingSpinner containerClassName="min-h-screen" text="Loading..." />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold">TrackAcademic</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-20">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
             <h1 className="font-headline text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                Master Your Studies, <br className="hidden sm:inline" />
                One Chapter at a Time.
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
               TrackAcademic is your all-in-one planner to organize subjects, track progress with visual feedback, and stay focused with built-in productivity tools.
            </p>
          </div>
          <div className="mx-auto flex flex-col sm:flex-row gap-4">
             <Button asChild size="lg">
                <Link href="/register">Get Started For Free</Link>
            </Button>
             <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Try the Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted/40">
          <div className="container space-y-8 py-12 md:py-20">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                From detailed progress tracking to integrated study tools, TrackAcademic is designed to help you stay on top of your coursework.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem]">
                <Card className="text-left bg-card">
                    <CardHeader>
                        <BarChart3 className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Visual Progress Tracking</CardTitle>
                        <CardDescription>
                            Instantly see how far you've come with color-coded progress bars and detailed overview charts for every subject.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="text-left bg-card">
                    <CardHeader>
                        <Timer className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Integrated Study Tools</CardTitle>
                        <CardDescription>
                        Stay focused with a built-in Pomodoro timer and keep your thoughts organized with a simple, effective notes writer.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="text-left bg-card">
                    <CardHeader>
                        <Settings className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Fully Customizable</CardTitle>
                        <CardDescription>
                            Tailor the app to your curriculum. Create custom subjects, define chapters, and set your own repeatable tasks for each lecture.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="text-left bg-card">
                    <CardHeader>
                        <Cloud className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Sync & Portability</CardTitle>
                        <CardDescription>
                            Create an account to sync progress to the cloud, or use guest mode and export your data anytime. Your data is yours.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="container py-12 md:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Ready to Take Control?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Stop guessing and start tracking. Sign up for free and build the study habits that lead to success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
         <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <Book className="h-6 w-6 text-primary" />
                <p className="text-center text-sm leading-loose md:text-left">
                    Built for focused learners. &copy; {currentYear} TrackAcademic.
                </p>
            </div>
         </div>
      </footer>
    </div>
  );
}

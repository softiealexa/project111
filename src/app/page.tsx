
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Book, ArrowRight, BarChart3, Timer, Settings, ListTodo, TrendingUp, CheckCircle, ShieldCheck, Component, Clock } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { user, loading } = useData();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const images = [
    { src: '/og-image.png', alt: 'TrackAcademic Dashboard', hint: 'dashboard study' },
    { src: '/planner-view.png', alt: 'Study Planner View', hint: 'planner calendar' },
    { src: '/progress-chart.png', alt: 'Progress Analytics Chart', hint: 'charts analytics' },
    { src: '/question.png', alt: 'Question Timer in Action', hint: 'timer quiz' },
    { src: '/todo-list.png', alt: 'To-Do List with tasks', hint: 'checklist tasks' }
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
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
        <section className="relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 blur-[100px]"></div>
            </div>
            <div className="container grid lg:grid-cols-2 gap-12 items-center py-12 md:py-24">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                    <h1 className="font-headline text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                        Master Your Studies, <br />
                        <span className="text-primary">One Chapter at a Time.</span>
                    </h1>
                    <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
                       TrackAcademic is your all-in-one planner to organize subjects, track progress with visual feedback, and stay focused with built-in productivity tools.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg">
                            <Link href="/register">Get Started For Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/dashboard?tab=subjects">Try the Demo</Link>
                        </Button>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="relative w-[600px] h-[400px]">
                        {images.map((image, index) => (
                            <Image
                                key={image.src + index}
                                src={image.src}
                                alt={image.alt}
                                width={600}
                                height={400}
                                className={cn(
                                    "absolute inset-0 rounded-xl shadow-2xl shadow-primary/10 border transition-opacity duration-1000 ease-in-out object-cover",
                                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                                )}
                                data-ai-hint={image.hint}
                                priority={index === 0}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full bg-muted/40 py-12 md:py-24">
            <div className="container">
                <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
                    Get Organized in 3 Easy Steps
                  </h2>
                  <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Go from scattered notes to a streamlined study plan in minutes.
                  </p>
                </div>
                <div className="mx-auto grid justify-center gap-8 sm:grid-cols-1 md:grid-cols-3 md:max-w-6xl">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 border-2 border-primary/20">
                            <Settings className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold font-headline">1. Customize</h3>
                        <p className="text-muted-foreground">Add your subjects, define your chapters, and set up your repeatable tasks for each lecture.</p>
                    </div>
                     <div className="flex flex-col items-center text-center gap-2">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 border-2 border-primary/20">
                            <ListTodo className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold font-headline">2. Track</h3>
                        <p className="text-muted-foreground">Log your daily progress. Check off tasks for each lecture to see your completion status update instantly.</p>
                    </div>
                     <div className="flex flex-col items-center text-center gap-2">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 border-2 border-primary/20">
                            <TrendingUp className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold font-headline">3. Visualize</h3>
                        <p className="text-muted-foreground">Monitor your growth with visual charts and progress bars. Know exactly where you stand in every subject.</p>
                    </div>
                </div>
            </div>
        </section>


        {/* Features Section */}
        <section id="features" className="w-full">
          <div className="container space-y-8 py-12 md:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                From detailed progress tracking to integrated study tools, TrackAcademic is designed to help you stay on top of your coursework.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem]">
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <BarChart3 className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Visual Progress Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Instantly see how far you've come with color-coded progress bars and detailed overview charts for every subject.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <Timer className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Integrated Study Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Stay focused with a built-in Pomodoro timer and keep your thoughts organized with a simple, effective notes writer.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <Settings className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Fully Customizable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Tailor the app to your curriculum. Create custom subjects, define chapters, and set your own repeatable tasks for each lecture.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <CheckCircle className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Cloud Sync & Portability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Create an account to sync progress to the cloud, or use guest mode and export your data anytime. Your data is yours.
                        </p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

        {/* What's New Section */}
        <section id="updates" className="w-full bg-muted/40">
          <div className="container space-y-8 py-12 md:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
                Recent Updates & New Features
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                TrackAcademic is always evolving. Here's a look at the powerful new tools and enhancements recently added to help you study smarter.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem]">
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <Clock className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Clockify Time Tracker</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Go beyond academic tracking with a full-featured time tracker. Log time against projects, create detailed timesheets, and get a clear picture of where your hours are going.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <ListTodo className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Backlog & Pace Planner</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Feeling behind? The new planner helps you calculate how long it will take to clear your backlog or determine the daily pace needed to meet a deadline.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <ShieldCheck className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>Enhanced Admin Panel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            A completely new admin experience. Admins can now manage all registered users, view, and update the status of all user feedback directly within the app.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                        <Component className="mb-3 h-8 w-8 text-primary" />
                        <CardTitle>New Utility Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Added an Exam Countdown to keep an eye on important dates and a comprehensive Unit Converter for all your scientific calculation needs.
                        </p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="container py-12 md:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
              Ready to Take Control?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Stop guessing and start tracking. Sign up for free and build the study habits that lead to success.
            </p>
            <Button asChild size="lg" className="mt-4">
                <Link href="/register">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
         <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <Link href="/" className="flex items-center gap-2">
                    <Book className="h-6 w-6 text-primary" />
                    <span className="font-headline text-lg font-bold">TrackAcademic</span>
                </Link>
            </div>
             <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built for focused learners. &copy; {currentYear} TrackAcademic.
            </p>
         </div>
      </footer>
    </div>
  );
}

    
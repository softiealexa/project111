'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Book, ArrowRight, BarChart3, Timer, Settings, ListTodo, TrendingUp, CheckCircle, ShieldCheck, Component, Clock, FileText, CheckSquare, Coins, User, Palette, Database, LogIn, UserPlus, Target, Calendar, Users, DollarSign } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';

interface LandingPageClientProps {
  imageUrls: string[];
}

const features = [
  {
    icon: BarChart3,
    title: "Dashboard",
    description: "Your central hub with tab-based navigation. Overview of all subjects, quick stats, progress charts, and access to all tools."
  },
  {
    icon: CheckSquare,
    title: "Syllabus Tracker",
    description: "Track progress subject-by-subject with chapter-wise checklists. Mark topics as unchecked, checked, or needs review. Set deadlines."
  },
  {
    icon: Target,
    title: "JEE Syllabus",
    description: "Specialized tracker for JEE exam preparation with Physics, Chemistry, and Math subjects. Chapter-wise task management."
  },
  {
    icon: FileText,
    title: "Notes",
    description: "Full-featured markdown notes with live preview. Supports KaTeX for math formulas, GFM, and keyboard shortcuts."
  },
  {
    icon: Timer,
    title: "Stopwatch",
    description: "Advanced study timer with session tracking. Subject-wise time logging, daily goals with progress, weekly/monthly reports, and lap timer."
  },
  {
    icon: Clock,
    title: "Clockify Clone",
    description: "Professional time tracking with timer, calendar view, timesheet management, project tracking, team scheduling, and time-off requests."
  },
  {
    icon: Coins,
    title: "Expense Splitter",
    description: "Split expenses with friends. Multiple groups, equal/individual split modes, balance calculation, and settlement planning."
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Complete account management. Profile settings, theme customization (7 themes + light/dark mode), keyboard shortcuts, and data export/import."
  },
  {
    icon: Palette,
    title: "Theme Customization",
    description: "Choose from 7 beautiful themes: Teal, Zinc, Rose, Blue, Green, Violet, Lavender. Toggle between light and dark mode."
  },
  {
    icon: Database,
    title: "Cloud Sync & Backup",
    description: "All data synced to Firebase cloud. Export your data as JSON for backup or import to restore. Access from any device."
  },
  {
    icon: UserPlus,
    title: "Authentication",
    description: "Secure email/password authentication with Firebase. Link your Google account for future login options."
  },
  {
    icon: ShieldCheck,
    title: "Admin Panel",
    description: "Admin users can manage all registered users, view feedback submissions, and track user activity."
  }
];

const howItWorks = [
  {
    icon: Settings,
    title: "1. Customize",
    description: "Add your subjects, define chapters, create custom tasks, and personalize the app with your preferred theme."
  },
  {
    icon: ListTodo,
    title: "2. Track",
    description: "Log your daily progress. Use the stopwatch to time study sessions, add expenses, and check off completed tasks."
  },
  {
    icon: TrendingUp,
    title: "3. Visualize",
    description: "Monitor your growth with detailed charts. View weekly/monthly reports and know exactly where you stand."
  }
];

export default function LandingPageClient({ imageUrls }: LandingPageClientProps) {
  const { user, loading } = useData();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const images = useMemo(() => {
    if (!imageUrls || imageUrls.length === 0) {
      return [{ src: '/og-image.png', alt: 'StudyTracker Dashboard', hint: 'dashboard study' }];
    }
    return imageUrls.map(url => ({
      src: url,
      alt: `StudyTracker Feature - ${url.split('/').pop()?.split('.')[0] || 'view'}`,
      hint: 'dashboard interface'
    }));
  }, [imageUrls]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

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
            <span className="font-headline text-xl font-bold">StudyTracker</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login"><LogIn className="mr-1 h-4 w-4" /> Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register"><UserPlus className="mr-1 h-4 w-4" /> Get Started</Link>
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
                       StudyTracker is your all-in-one study management platform. Track progress, manage subjects, time your study sessions, split expenses with friends, and take beautiful markdown notes - all in one place.
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
                    <div className="relative w-full max-w-[600px] aspect-[3/2]">
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
                    {howItWorks.map((item) => (
                        <div key={item.title} className="flex flex-col items-center text-center gap-2">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 border-2 border-primary/20">
                                <item.icon className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold font-headline">{item.title}</h3>
                            <p className="text-muted-foreground max-w-xs">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* All Features Section */}
        <section id="features" className="w-full">
          <div className="container space-y-8 py-12 md:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
                All Features
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Everything you need to manage your studies effectively. From progress tracking to time management and expense splitting.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:max-w-6xl">
                {features.map((feature) => (
                    <Card key={feature.title} className="text-left bg-card hover:bg-card/95 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
                        <CardHeader>
                            <feature.icon className="mb-3 h-8 w-8 text-primary" />
                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        </section>

        {/* Core Features Highlight */}
        <section id="highlights" className="w-full bg-muted/40">
          <div className="container space-y-8 py-12 md:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl">
                Why Choose StudyTracker?
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Built by students, for students. Every feature is designed with your success in mind.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-8 md:max-w-4xl">
                <Card className="bg-gradient-to-r from-primary/10 to-transparent border-none shadow-none">
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div>
                                <h3 className="text-2xl font-bold mb-3">Study Timer with Goals</h3>
                                <p className="text-muted-foreground">
                                    Use the built-in stopwatch to track study sessions. Set daily study goals and watch your progress with beautiful charts. Track time spent on each subject separately.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Timer className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">Stopwatch</p>
                                    <p className="text-xs text-muted-foreground">Track sessions</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">Daily Goals</p>
                                    <p className="text-xs text-muted-foreground">Stay motivated</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">Reports</p>
                                    <p className="text-xs text-muted-foreground">Weekly/monthly</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">Calendar</p>
                                    <p className="text-xs text-muted-foreground">View history</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500/10 to-transparent border-none shadow-none">
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div className="md:order-2">
                                <h3 className="text-2xl font-bold mb-3">Split Expenses with Friends</h3>
                                <p className="text-muted-foreground">
                                    Going on a trip or sharing hostel expenses? Create groups, add friends, and track who owes whom. Supports equal split and individual item modes. Get settlement suggestions instantly.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:order-1">
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="font-semibold">Groups</p>
                                    <p className="text-xs text-muted-foreground">Multiple groups</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="font-semibold">Smart Split</p>
                                    <p className="text-xs text-muted-foreground">Equal & individual</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Coins className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="font-semibold">Balances</p>
                                    <p className="text-xs text-muted-foreground">Track who owes</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="font-semibold">Settle Up</p>
                                    <p className="text-xs text-muted-foreground">Clear debts</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-violet-500/10 to-transparent border-none shadow-none">
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div>
                                <h3 className="text-2xl font-bold mb-3">Beautiful Markdown Notes</h3>
                                <p className="text-muted-foreground">
                                    Take notes with full markdown support. Write math equations using KaTeX, format with GFM, and see live preview. Keyboard shortcuts make formatting a breeze.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <FileText className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                                    <p className="font-semibold">Markdown</p>
                                    <p className="text-xs text-muted-foreground">Full support</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Component className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                                    <p className="font-semibold">KaTeX</p>
                                    <p className="text-xs text-muted-foreground">Math formulas</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <FileText className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                                    <p className="font-semibold">Live Preview</p>
                                    <p className="text-xs text-muted-foreground">See changes</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Settings className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                                    <p className="font-semibold">Shortcuts</p>
                                    <p className="text-xs text-muted-foreground">Ctrl+B, I, K</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-500/10 to-transparent border-none shadow-none">
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div className="md:order-2">
                                <h3 className="text-2xl font-bold mb-3">Professional Time Tracking</h3>
                                <p className="text-muted-foreground">
                                    Clockify-style time tracking for your projects. Track time entries, manage timesheets, create projects with colors, schedule team shifts, and manage time-off requests.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:order-1">
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Timer className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                    <p className="font-semibold">Timer</p>
                                    <p className="text-xs text-muted-foreground">Start/stop tracking</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                    <p className="font-semibold">Calendar</p>
                                    <p className="text-xs text-muted-foreground">Visual entries</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <ListTodo className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                    <p className="font-semibold">Timesheet</p>
                                    <p className="text-xs text-muted-foreground">Weekly grid</p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border text-center">
                                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                    <p className="font-semibold">Team</p>
                                    <p className="text-xs text-muted-foreground">Shifts & time off</p>
                                </div>
                            </div>
                        </div>
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
                <Link href="/register">Get Started Now - It's Free</Link>
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
                    <span className="font-headline text-lg font-bold">StudyTracker</span>
                </Link>
            </div>
             <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                 Built for focused learners. &copy; {currentYear} StudyTracker.
             </p>
         </div>
      </footer>
    </div>
  );
}

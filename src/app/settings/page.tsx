
'use client';

import React, { useState, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, User, Palette, Shield, Download, Upload, MessageSquarePlus, Moon, Sun, Check, LogOut, ArrowLeft, Database, Keyboard, Mail, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { linkGoogleEmail } from '@/lib/auth';
import Navbar from '@/components/navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/loading-spinner';

const ContactDialog = dynamic(() => import('@/components/contact-dialog').then(mod => mod.ContactDialog));
const KeyboardShortcuts = dynamic(() => import('@/components/keyboard-shortcuts').then(mod => mod.KeyboardShortcuts));

// Profile Tab Component
const ProfileTab = ({ onContactClick }: { onContactClick: () => void }) => {
    const { user, userDoc, refreshUserDoc } = useData();
    const { toast } = useToast();
    const [googleEmail, setGoogleEmail] = useState('');
    const [isLinkingEmail, setIsLinkingEmail] = useState(false);

    const handleLinkGoogleEmail = async () => {
        if (!googleEmail.trim()) {
            toast({ title: 'Error', description: 'Email address cannot be empty.', variant: 'destructive' });
            return;
        }
        setIsLinkingEmail(true);
        const { error } = await linkGoogleEmail(googleEmail.trim());
        if (error) {
            toast({ title: 'Error', description: error, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Google email linked successfully.' });
            await refreshUserDoc();
            setGoogleEmail('');
        }
        setIsLinkingEmail(false);
    };

    if (!user || !userDoc) return <LoadingSpinner containerClassName="p-6" />;

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">User Profile</CardTitle>
                <CardDescription>Manage your profile and account settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <Label className="font-medium">Username</Label>
                    </div>
                    <p className="font-medium text-foreground">{userDoc.username}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <Label className="font-medium">Login Email</Label>
                    </div>
                    <p className="text-foreground">{user.email}</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <Label className="font-medium">Google Account</Label>
                        </div>
                        {userDoc.googleEmail ? (
                            <p className="text-foreground">{userDoc.googleEmail}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not linked</p>
                        )}
                    </div>
                    {!userDoc.googleEmail && (
                        <div className="pt-3 space-y-2">
                            <p className="text-sm text-muted-foreground">Link your Google account to prepare for future sign-in options. Must be a @gmail.com address.</p>
                            <div className="flex gap-2">
                                <Input 
                                    id="google-email" 
                                    placeholder="your-email@gmail.com" 
                                    value={googleEmail} 
                                    onChange={(e) => setGoogleEmail(e.target.value)} 
                                    disabled={isLinkingEmail}
                                    className="bg-background"
                                />
                                <Button onClick={handleLinkGoogleEmail} disabled={isLinkingEmail} size="sm">
                                    {isLinkingEmail && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Link
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="rounded-lg border border-border/50 bg-background/50 p-4 space-y-2">
                    <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <Label className="font-medium">Password</Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">
                        To change your password, please{' '}
                        <Button variant="link" className="p-0 h-auto text-sm text-primary" onClick={onContactClick}>
                            contact the developer
                        </Button>
                        {' '}for a manual reset.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Appearance Tab Component
const themes = [
    { name: 'default', label: 'Teal', color: 'hsl(180 90% 45%)' },
    { name: 'zinc', label: 'Zinc', color: 'hsl(240 5.2% 95.1%)' },
    { name: 'rose', label: 'Rose', color: 'hsl(346.8 77.2% 49.8%)' },
    { name: 'blue', label: 'Blue', color: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'green', label: 'Green', color: 'hsl(142.1 76.2% 36.3%)' },
    { name: 'violet', label: 'Violet', color: 'hsl(255 92% 76%)' },
    { name: 'lavender', label: 'Lavender', color: 'hsl(267 84% 92%)' },
];

const AppearanceTab = () => {
    const { theme, setTheme, mode, setMode, isThemeHydrated } = useData();

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {!isThemeHydrated ? (
                  <>
                    <div className="rounded-xl border border-border/50 bg-background/50 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                                <Palette className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <Label className="font-medium text-base">Color Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred accent color</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-3 pl-12">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-12 rounded-xl" />
                          ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/50 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                                <Sun className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <Label className="font-medium text-base">Appearance Mode</Label>
                                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pl-12">
                            <Skeleton className="h-12 flex-1 rounded-xl" />
                            <Skeleton className="h-12 flex-1 rounded-xl" />
                        </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-border/50 bg-background/50 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Label className="font-medium text-base">Color Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred accent color</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 pl-12">
                            {themes.map((t) => (
                               <Tooltip key={t.name}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setTheme(t.name)}
                                            className={cn(
                                                "relative h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 hover:scale-105",
                                                theme === t.name 
                                                    ? "border-primary shadow-lg shadow-primary/20" 
                                                    : "border-transparent hover:border-border"
                                            )}
                                            style={{ backgroundColor: t.color }}
                                            aria-label={`Select ${t.label} theme`}
                                        >
                                            {theme === t.name && (
                                                <Check className="h-5 w-5 text-white drop-shadow-md" strokeWidth={3} />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>{t.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                    
                    <div className="rounded-xl border border-border/50 bg-background/50 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                {mode === 'light' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <Label className="font-medium text-base">Appearance Mode</Label>
                                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pl-12">
                            <button
                                onClick={() => setMode('light')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200",
                                    mode === 'light'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border bg-background hover:border-muted-foreground/30"
                                )}
                            >
                                <Sun className="h-5 w-5" />
                                <span className="font-medium">Light</span>
                            </button>
                            <button
                                onClick={() => setMode('dark')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200",
                                    mode === 'dark'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border bg-background hover:border-muted-foreground/30"
                                )}
                            >
                                <Moon className="h-5 w-5" />
                                <span className="font-medium">Dark</span>
                            </button>
                        </div>
                    </div>
                  </>
                )}
            </CardContent>
        </Card>
    );
};


// Account Tab
const AccountTab = ({ onContactOpenChange, onShortcutsOpenChange }: { onContactOpenChange: (open: boolean) => void, onShortcutsOpenChange: (open: boolean) => void }) => {
    const { signOutUser } = useData();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };
    
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Account Management</CardTitle>
                <CardDescription>Manage your account settings and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <Keyboard className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h4 className="font-medium">Keyboard Shortcuts</h4>
                            <p className="text-sm text-muted-foreground">View and learn the available shortcuts.</p>
                        </div>
                    </div>
                    <Button onClick={() => onShortcutsOpenChange(true)} size="sm">
                        Show Shortcuts
                    </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h4 className="font-medium">Contact Developer</h4>
                            <p className="text-sm text-muted-foreground">Report a bug or request a new feature.</p>
                        </div>
                    </div>
                    <Button onClick={() => onContactOpenChange(true)} size="sm">
                        Open Form
                    </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h4 className="font-medium">Logout</h4>
                            <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleSignOut} size="sm">
                        Logout
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Data Tab
const DataTab = () => {
    const { exportData, importData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importData(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Data Management</CardTitle>
                <CardDescription>Export your data or import it to another account. This can be used as a backup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                />
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h4 className="font-medium">Import Data</h4>
                            <p className="text-sm text-muted-foreground">Load data from a previously exported file.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleImportClick} size="sm">
                        Import
                    </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h4 className="font-medium">Export Data</h4>
                            <p className="text-sm text-muted-foreground">Save all your profile data to a JSON file.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={exportData} size="sm">
                        Export
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Page Component
export default function SettingsPage() {
  const { user, loading } = useData();
  const router = useRouter();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }
  
  return (
    <TooltipProvider>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account, appearance, and data settings.</p>
            </div>
             <Button asChild variant="secondary" className="rounded-lg">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4" /> Account
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Database className="h-4 w-4" /> Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab onContactClick={() => setIsContactOpen(true)} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="account">
            <AccountTab 
                onContactOpenChange={setIsContactOpen} 
                onShortcutsOpenChange={setIsShortcutsOpen} 
            />
          </TabsContent>
          <TabsContent value="data">
            <DataTab />
          </TabsContent>
        </Tabs>
      </main>
      <Suspense>
        {isContactOpen && (
          <ContactDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
        )}
        {isShortcutsOpen && (
          <KeyboardShortcuts open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
        )}
      </Suspense>
    </TooltipProvider>
  );
}

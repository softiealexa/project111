
'use client';

import React, { useState, useRef } from 'react';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, User, Palette, Shield, Download, Upload, MessageSquarePlus, Moon, Sun, Check, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactDialog } from '@/components/contact-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { updateUsername, sendPasswordReset } from '@/lib/auth';
import Navbar from '@/components/navbar';

// Profile Tab Component
const ProfileTab = () => {
    const { user, userDoc, refreshUserDoc } = useData();
    const { toast } = useToast();
    const [newUsername, setNewUsername] = useState(user?.displayName || '');
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    const handleUpdateUsername = async () => {
        if (!newUsername.trim() || newUsername.trim() === user?.displayName) return;
        setIsUpdatingUsername(true);
        const { error } = await updateUsername(newUsername.trim());
        if (error) {
            toast({ title: 'Error', description: error, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Username updated successfully.' });
            await refreshUserDoc();
        }
        setIsUpdatingUsername(false);
    };

    const handlePasswordReset = async () => {
        setIsSendingReset(true);
        const { error } = await sendPasswordReset();
        if (error) {
            toast({ title: 'Error', description: error, variant: 'destructive' });
        } else {
            toast({ title: 'Email Sent', description: 'A password reset link has been sent to your registered email.' });
        }
        setIsSendingReset(false);
    };

    if (!user || !userDoc) return <LoaderCircle className="h-8 w-8 animate-spin text-primary" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>This is how others will see you on the site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex gap-2">
                        <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                        <Button onClick={handleUpdateUsername} disabled={isUpdatingUsername || !newUsername.trim() || newUsername.trim() === user.displayName}>
                            {isUpdatingUsername && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Update
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userDoc.email} disabled />
                    <p className="text-xs text-muted-foreground">Your email is used for login and password resets only.</p>
                </div>

                <Separator />

                <div className="space-y-2">
                    <h3 className="text-base font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">To change your password, we'll send a secure link to your email address.</p>
                    <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingReset}>
                        {isSendingReset && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Send Password Reset Email
                    </Button>
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
    const { theme, setTheme, mode, setMode } = useData();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Select a color theme for the application.</p>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-3 pt-2">
                        {themes.map((t) => (
                           <Tooltip key={t.name}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setTheme(t.name)}
                                        className={cn(
                                            "relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all",
                                            theme === t.name ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-muted"
                                        )}
                                        aria-label={`Select ${t.label} theme`}
                                    >
                                        <span className="h-6 w-6 rounded-full border" style={{ backgroundColor: t.color }} />
                                        {theme === t.name && (
                                            <Check className="h-4 w-4 absolute text-primary-foreground mix-blend-difference" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label>Mode</Label>
                    <p className="text-sm text-muted-foreground">Choose between light and dark mode.</p>
                    <div className="flex gap-4 pt-2">
                        <Button variant={mode === 'light' ? 'default' : 'outline'} onClick={() => setMode('light')} className="flex-1">
                            <Sun className="mr-2 h-5 w-5" /> Light
                        </Button>
                        <Button variant={mode === 'dark' ? 'default' : 'outline'} onClick={() => setMode('dark')} className="flex-1">
                            <Moon className="mr-2 h-5 w-5" /> Dark
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


// Account and Data Tabs
const AccountAndDataTab = () => {
    const { signOutUser, exportData, importData } = useData();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isContactOpen, setIsContactOpen] = useState(false);

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };

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
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Management</CardTitle>
                        <CardDescription>Manage your account settings and data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                           <div>
                                <h4 className="font-medium">Contact Developer</h4>
                                <p className="text-sm text-muted-foreground">Report a bug or request a new feature.</p>
                           </div>
                           <Button onClick={() => setIsContactOpen(true)}>
                               <MessageSquarePlus className="mr-2" /> Open Form
                           </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                           <div>
                                <h4 className="font-medium">Logout</h4>
                                <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
                           </div>
                           <Button variant="outline" onClick={handleSignOut}>
                               <LogOut className="mr-2" /> Logout
                           </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>Export your data or import it to another account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                        <div className="flex items-center justify-between rounded-lg border p-4">
                           <div>
                                <h4 className="font-medium">Import Data</h4>
                                <p className="text-sm text-muted-foreground">Load data from a previously exported file.</p>
                           </div>
                           <Button variant="outline" onClick={handleImportClick}>
                                <Upload className="mr-2" /> Import
                           </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                           <div>
                                <h4 className="font-medium">Export Data</h4>
                                <p className="text-sm text-muted-foreground">Save all your profile data to a JSON file.</p>
                           </div>
                           <Button variant="outline" onClick={exportData}>
                                <Download className="mr-2" /> Export
                           </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <ContactDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
        </>
    );
};

// Main Page Component
export default function SettingsPage() {
  const { user, loading } = useData();
  const router = useRouter();

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
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
            <p className="text-muted-foreground">Manage your account, appearance, and data settings.</p>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="gap-2"><User /> Profile</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2"><Palette /> Appearance</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><Shield /> Account & Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="account">
            <AccountAndDataTab />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

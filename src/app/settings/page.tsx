
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { linkGoogleEmail } from '@/lib/auth';
import Navbar from '@/components/navbar';

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

    if (!user || !userDoc) return <LoaderCircle className="h-8 w-8 animate-spin text-primary" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>Manage your public information and account settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Label className="font-semibold">Username</Label>
                        <p className="text-muted-foreground">{userDoc.username}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Usernames cannot be changed after registration.</p>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                     <div className="flex items-center justify-between">
                        <Label className="font-semibold">Google Account</Label>
                         {userDoc.googleEmail ? (
                            <p className="text-muted-foreground">{userDoc.googleEmail}</p>
                         ) : (
                            <p className="text-sm text-muted-foreground">Not linked</p>
                         )}
                    </div>
                    {!userDoc.googleEmail && (
                        <div className="pt-2 space-y-2">
                            <p className="text-sm text-muted-foreground">Link your Google account to prepare for future sign-in options. Must be a @gmail.com address.</p>
                             <div className="flex gap-2">
                                <Input 
                                    id="google-email" 
                                    placeholder="your-email@gmail.com" 
                                    value={googleEmail} 
                                    onChange={(e) => setGoogleEmail(e.target.value)} 
                                    disabled={isLinkingEmail}
                                />
                                <Button onClick={handleLinkGoogleEmail} disabled={isLinkingEmail} size="sm">
                                    {isLinkingEmail && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Link
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2 rounded-lg border p-4">
                    <Label className="font-semibold">Password</Label>
                     <p className="text-sm text-muted-foreground">
                        To change your password, please{' '}
                        <Button variant="link" className="p-0 h-auto text-sm" onClick={onContactClick}>
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
const AccountAndDataTab = ({ onContactOpenChange }: { onContactOpenChange: (open: boolean) => void }) => {
    const { signOutUser, exportData, importData } = useData();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        <Button onClick={() => onContactOpenChange(true)}>
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
    );
};

// Main Page Component
export default function SettingsPage() {
  const { user, loading } = useData();
  const router = useRouter();
  const [isContactOpen, setIsContactOpen] = useState(false);

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
            <ProfileTab onContactClick={() => setIsContactOpen(true)} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="account">
            <AccountAndDataTab onContactOpenChange={setIsContactOpen} />
          </TabsContent>
        </Tabs>
      </main>
      <ContactDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
    </TooltipProvider>
  );
}

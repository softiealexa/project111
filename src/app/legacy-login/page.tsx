
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Book, Eye, EyeOff, ArrowLeft, AlertTriangle, Download, Upload, Trash2 } from 'lucide-react';
import { legacyLogin } from '@/lib/auth';
import { useData } from '@/contexts/data-context';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LegacyLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, exportData } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // User is already logged in
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    if (!password.trim()) {
      toast({ title: 'Error', description: 'Please enter your password.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { error } = await legacyLogin(email, password);

    if (error) {
      toast({ title: 'Login Failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully.' });
    }

    setIsLoading(false);
  };

  const handleExport = () => {
    exportData();
    toast({ title: 'Data Exported', description: 'Your data has been downloaded as JSON.' });
  };

  if (authLoading) {
    return <LoadingSpinner containerClassName="min-h-screen" text="Loading..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex w-fit items-center gap-2 text-foreground transition-colors hover:text-primary">
            <Book className="h-8 w-8 text-primary" />
            <span className="font-headline text-3xl font-bold">StudyTracker</span>
          </Link>
          <CardTitle className="text-2xl">Legacy Login</CardTitle>
          <CardDescription>
            Login with your old account to export your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Important Migration Notice</p>
                <p className="mt-1">
                  This login method will be disabled soon due to security issues. 
                  Please export your data below and create a new account.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Steps to Migrate:</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Login with your old credentials below</li>
              <li>Click "Export My Data" to download your data</li>
              <li>Go to regular Login/Register page</li>
              <li>Create a new account with your Gmail</li>
              <li>Import your data (available in Settings)</li>
            </ol>
          </div>

          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Old Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="username@trackademic.local"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Use your old email format: <code className="bg-muted px-1 rounded">username@trackademic.local</code>
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login to Export Data'}
            </Button>
          </form>

          {user && (
            <div className="grid gap-2">
              <Button variant="outline" onClick={handleExport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export My Data
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                After exporting, please create a new account and import this data.
              </p>
            </div>
          )}

          <div className="text-center">
            <Button asChild variant="link">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Regular Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

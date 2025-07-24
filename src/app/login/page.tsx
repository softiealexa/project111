
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Book } from 'lucide-react';
import { signInWithUsername } from '@/lib/auth';
import { useData } from '@/contexts/data-context';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signInWithUsername(username, password);

    if (error) {
      console.log('Login failed:', error);
      const errorMessage = typeof error === 'string' ? error : 'An unexpected error occurred during login.';
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Logged in successfully.',
      });
      // The redirect will be handled by the useEffect hook watching the user state change
    }

    setIsLoading(false);
  };

  if (authLoading || user) {
    return (
      <LoadingSpinner containerClassName="min-h-screen" text="Loading..." />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 flex w-fit items-center gap-2 text-foreground transition-colors hover:text-primary">
                <Book className="h-8 w-8 text-primary" />
                 <span className="font-headline text-3xl font-bold">StudyTracker</span>
            </Link>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your username and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Book, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendPasswordReset } from '@/lib/auth';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast({ title: 'Error', description: 'Please enter a valid Gmail address.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { error, success } = await sendPasswordReset(email);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else if (success) {
      setIsSubmitted(true);
      toast({ title: 'Check your email', description: 'Password reset instructions have been sent.' });
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We&apos;ve sent password reset instructions to <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Back to Login</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            No worries, we&apos;ll send you reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Enter the Gmail address you used to create your account.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Button>
          </form>
          
          <div className="mt-4">
            <Button asChild variant="link" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

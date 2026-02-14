
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Book, Eye, EyeOff, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { register, registerWithGoogle, checkUsernameAvailability } from '@/lib/auth';
import { useData } from '@/contexts/data-context';
import { LoadingSpinner } from '@/components/loading-spinner';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useData();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameStatus('idle');
        setUsernameError('');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameStatus('unavailable');
        setUsernameError('Username can only contain letters, numbers, and underscores');
        return;
      }

      setUsernameStatus('checking');
      const { available, error } = await checkUsernameAvailability(username);
      
      if (error) {
        setUsernameStatus('idle');
        setUsernameError('');
      } else if (available) {
        setUsernameStatus('available');
        setUsernameError('');
      } else {
        setUsernameStatus('unavailable');
        setUsernameError('Username is already taken');
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const passwordStrength = useMemo((): PasswordStrength => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (confirmPassword.length === 0) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast({ title: 'Error', description: 'Please enter a valid Gmail address.', variant: 'destructive' });
      return;
    }

    if (usernameStatus === 'unavailable' || usernameError) {
      toast({ title: 'Error', description: usernameError || 'Please choose a valid username.', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { error } = await register(email, username, password);

    if (error) {
      toast({ title: 'Registration Failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Account created successfully. Logging you in...' });
    }

    setIsLoading(false);
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    const { error } = await registerWithGoogle();
    
    if (error) {
      toast({ title: 'Registration Failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Account created with Google!' });
    }
    setIsGoogleLoading(false);
  };

  if (authLoading || user) {
    return <LoadingSpinner containerClassName="min-h-screen" text="Loading..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex w-fit items-center gap-2 text-foreground transition-colors hover:text-primary">
            <Book className="h-8 w-8 text-primary" />
            <span className="font-headline text-3xl font-bold">StudyTracker</span>
          </Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your details below to get started.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">Please use your Gmail address.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                  className={usernameStatus === 'available' ? 'pr-10 border-green-500' : usernameStatus === 'unavailable' ? 'pr-10 border-red-500' : 'pr-10'}
                  autoComplete="username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                  {usernameStatus === 'unavailable' && <X className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
              <p className="text-xs text-muted-foreground">At least 3 characters. Letters, numbers, and underscores only.</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                  className="pr-10"
                  autoComplete="new-password"
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
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Password strength: {passwordStrength.label}</p>
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                  className={`pr-10 ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500' : 'border-red-500') : ''}`}
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  </div>
                )}
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isGoogleLoading || usernameStatus === 'unavailable' || usernameStatus === 'checking'}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Old User?</p>
                <p className="mt-1">
                  If you created an account before the migration,{' '}
                  <Link href="/legacy-login" className="underline font-medium hover:text-amber-900">
                    click here to migrate
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline font-medium">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

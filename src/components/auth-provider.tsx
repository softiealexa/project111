
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { LoadingSpinner } from './loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';


/**
 * A dedicated component shown only to legacy users who need to update their account.
 * This is now nested within the AuthProvider to avoid import/export issues.
 */
function UpdateLegacyAccountForm() {
    const { user } = useData();
    const { toast } = useToast();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [googleEmail, setGoogleEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (password !== confirmPassword) {
            toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
            return;
        }
        if (password.length < 6) {
             toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
            return;
        }
        if (!googleEmail.toLowerCase().endsWith('@gmail.com')) {
            toast({ title: 'Error', description: 'Please enter a valid @gmail.com address.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            // Update password in Firebase Auth
            await updatePassword(user, password);
            
            // Link Google email in Firestore
            await updateDoc(doc(db, 'users', user.uid), { 
                googleEmail: googleEmail
            });

            toast({ title: 'Account Updated', description: 'Your account is now up to date. Please log in again.' });
            
            // Force re-authentication by signing out. The router push is a fallback.
            await auth.signOut();
            router.push('/login');

        } catch (error: any) {
            console.error(error);
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    
    return (
         <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Update Your Account</CardTitle>
                    <CardDescription>
                        To improve security, please set a new password and link your Google account. You will only need to do this once.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="google-email">Google Email</Label>
                            <Input id="google-email" type="email" placeholder="your.email@gmail.com" required value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} disabled={loading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Updating...' : 'Update and Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}


/**
 * This provider is responsible for handling the initial auth state and routing.
 * It checks if the user is authenticated and if their account needs to be updated (legacy users).
 * It shows a loading screen during this check.
 * It also handles protecting routes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useData();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isLegacyUser = user?.email?.endsWith('@trackademic.local') ?? false;

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is complete
    }

    if (user && !isLegacyUser && isAuthPage) {
      router.replace('/dashboard');
    }

    if (!user && !isAuthPage && pathname !== '/') {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, isLegacyUser, pathname, router]);


  // Show a global loading spinner during the initial auth check.
  if (loading) {
    return <LoadingSpinner containerClassName="min-h-screen" />;
  }

  // If the user is authenticated but has a legacy account, force them to update.
  if (user && isLegacyUser && !isAuthPage) {
    return <UpdateLegacyAccountForm />;
  }

  // If the user is authenticated on an auth page, show a loader while redirecting.
  if (user && !isLegacyUser && isAuthPage) {
    return <LoadingSpinner containerClassName="min-h-screen" text="Redirecting..." />;
  }
  
  // Otherwise, render the requested page content.
  return <>{children}</>;
}

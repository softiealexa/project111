
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users, LoaderCircle } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AdminPage() {
    const { user, userDoc, loading: authLoading } = useData();
    const router = useRouter();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isUserAdmin = useMemo(() => {
        return userDoc?.role === 'admin';
    }, [userDoc]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!isUserAdmin) {
            setLoading(false);
            return;
        }

        const fetchUsers = async () => {
            if (!db) {
                setError("Database connection is not available.");
                setLoading(false);
                return;
            }
            try {
                const usersCol = collection(db, 'users');
                const userSnapshot = await getDocs(usersCol);
                const fetchedUsers = userSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        uid: doc.id,
                        username: data.displayName || data.username,
                        email: data.email,
                        role: data.role,
                    };
                });
                setUsers(fetchedUsers);
            } catch (err: any) {
                 if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
                    setError("Permission Denied: Your Firestore security rules are correctly blocking this request. To grant access, you must update your rules in the Firebase Console to allow admins to read the 'users' collection.");
                } else {
                    setError(`An unexpected error occurred: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, authLoading, router, isUserAdmin]);

    if (authLoading || (isUserAdmin && loading)) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!isUserAdmin) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                         <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                         <CardTitle className="mt-4 text-2xl">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            You do not have permission to view this page. Please contact the administrator if you believe this is an error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Navbar/>
            <main className="max-w-7xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Registered Users
                        </CardTitle>
                        <CardDescription>
                            A list of all users who have registered in the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                             <Alert variant="destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>User ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length > 0 ? users.map((appUser) => (
                                        <TableRow key={appUser.uid}>
                                            <TableCell className="font-medium">{appUser.username}</TableCell>
                                            <TableCell>{appUser.email}</TableCell>
                                            <TableCell>{appUser.role === 'admin' ? 'Admin' : 'User'}</TableCell>
                                            <TableCell className="text-muted-foreground">{appUser.uid}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </TooltipProvider>
    );
}

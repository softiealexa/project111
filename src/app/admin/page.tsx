
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users, LoaderCircle, MessageSquare } from 'lucide-react';
import { collection, getDocs, query, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser, Feedback } from '@/lib/types';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';


interface DisplayFeedback extends Feedback {
    id: string;
    createdAt: Date;
}

export default function AdminPage() {
    const { user, userDoc, loading: authLoading } = useData();
    const router = useRouter();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [feedback, setFeedback] = useState<DisplayFeedback[]>([]);
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

        if (!db) {
            setError("Database connection is not available.");
            setLoading(false);
            return;
        }

        const usersCol = collection(db, 'users');
        const usersUnsubscribe = onSnapshot(usersCol, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    username: data.displayName || data.username,
                    email: data.email,
                    role: data.role,
                };
            });
            setUsers(fetchedUsers);
        }, (err) => {
             setError(`An unexpected error occurred fetching users: ${err.message}`);
             setLoading(false);
        });

        const feedbackCol = collection(db, 'feedback');
        const feedbackQuery = query(feedbackCol, orderBy('createdAt', 'desc'));
        const feedbackUnsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
            const fetchedFeedback = snapshot.docs.map(doc => {
                const data = doc.data() as Feedback;
                const createdAt = data.createdAt as Timestamp;
                return {
                    id: doc.id,
                    ...data,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                };
            });
            setFeedback(fetchedFeedback);
            setLoading(false);
        }, (err: any) => {
             if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
                setError("Permission Denied: Your Firestore security rules are correctly blocking this request. To grant access, you must update your rules in the Firebase Console to allow admins to read the 'users' and 'feedback' collections.");
            } else if (err.code === 'failed-precondition') {
                setError(`Query requires an index. Please check the browser console for a link to create it in Firebase.`);
            } else {
                setError(`An unexpected error occurred: ${err.message}`);
            }
            setLoading(false);
        });

        // Cleanup listeners on component unmount
        return () => {
            usersUnsubscribe();
            feedbackUnsubscribe();
        };

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
                {error ? (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Accordion type="multiple" defaultValue={["item-1", "item-2"]} className="w-full space-y-4">
                        <AccordionItem value="item-1" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <AccordionTrigger className="p-6 text-left hover:no-underline">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users />
                                        Registered Users
                                    </CardTitle>
                                    <CardDescription className="pt-1.5">
                                        A list of all users who have registered in the application.
                                    </CardDescription>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
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
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <AccordionTrigger className="p-6 text-left hover:no-underline">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare />
                                        User Feedback
                                    </CardTitle>
                                    <CardDescription className="pt-1.5">
                                        Messages submitted by users via the contact form.
                                    </CardDescription>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">Date</TableHead>
                                            <TableHead className="w-[150px]">Type</TableHead>
                                            <TableHead>Message</TableHead>
                                            <TableHead className="w-[200px]">From</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feedback.length > 0 ? feedback.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{format(item.createdAt, 'PP p')}</TableCell>
                                                <TableCell>{item.type}</TableCell>
                                                <TableCell className="whitespace-pre-wrap">{item.message}</TableCell>
                                                <TableCell>{item.userEmail}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No feedback messages found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </main>
        </TooltipProvider>
    );
}

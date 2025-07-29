
'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users, LoaderCircle, MessageSquare, ChevronDown, Archive, ChevronLeft, ChevronRight, Pencil, DownloadCloud } from 'lucide-react';
import { collection, query, orderBy, Timestamp, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser, Feedback, FeedbackStatus, CheckedState } from '@/lib/types';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { exportUsersData } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const EditUserDialog = dynamic(() => import('@/components/edit-user-dialog').then(mod => mod.EditUserDialog), {
  loading: () => <Button variant="ghost" size="icon" disabled><Pencil className="h-4 w-4" /></Button>
});


interface DisplayFeedback extends Feedback {
    id: string;
    createdAt: Date;
    status: FeedbackStatus;
}

const statusColors: Record<FeedbackStatus, string> = {
    Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Done: 'bg-green-500/10 text-green-500 border-green-500/20',
    Fixed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

// Reusable component for the feedback table to avoid repetition
const FeedbackTable = ({ feedbackItems, onStatusChange }: { feedbackItems: DisplayFeedback[], onStatusChange: (id: string, newStatus: FeedbackStatus) => void }) => {
    if (feedbackItems.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center text-center text-sm text-muted-foreground">
                No messages in this category.
            </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[200px]">From</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {feedbackItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <Select value={item.status} onValueChange={(newStatus: FeedbackStatus) => onStatusChange(item.id, newStatus)}>
                                <SelectTrigger className={cn("text-xs h-8", statusColors[item.status])}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                    <SelectItem value="Fixed">Fixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className="font-medium">{format(item.createdAt, 'PP')}</TableCell>
                        <TableCell>{item.userEmail}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell className="whitespace-pre-wrap">{item.message}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export default function AdminPage() {
    const { user, userDoc, loading: authLoading } = useData();
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [feedback, setFeedback] = useState<DisplayFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedbackFilter, setFeedbackFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(8);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const isUserAdmin = useMemo(() => {
        return userDoc?.role === 'admin';
    }, [userDoc]);

    const handleFirestoreError = (err: any) => {
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
            setError("Permission Denied. Please ensure you have the correct Firestore security rules in place to allow admin access. Your rules should explicitly grant read/write access to the 'users' and 'feedback' collections for users where `request.auth.uid` has an `admin` role in their user document.");
        } else if (err.code === 'failed-precondition') {
            setError(`Query requires an index. Please check the browser console for a link to create it in Firebase.`);
        } else {
            setError(`An unexpected error occurred: ${err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => {
        // First, handle authentication state changes.
        if (authLoading) return; // Wait until auth state is resolved

        if (!user) {
            router.push('/login');
            return;
        }

        // If the user document is loaded and they are not an admin, stop loading and show access denied.
        if (userDoc && !isUserAdmin) {
            setLoading(false);
            return;
        }

        // Only proceed to fetch data if we have confirmed the user is an admin.
        if (isUserAdmin) {
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
                        googleEmail: data.googleEmail,
                        role: data.role,
                    } as AppUser;
                });

                // Sort users to show admins at the top
                fetchedUsers.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (b.role === 'admin' && a.role !== 'admin') return 1;
                    return (a.username || '').localeCompare(b.username || '');
                });
                
                setUsers(fetchedUsers);
            }, handleFirestoreError);

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
                        status: data.status || 'Pending',
                    };
                });
                setFeedback(fetchedFeedback);
                setLoading(false);
            }, handleFirestoreError);

            return () => {
                usersUnsubscribe();
                feedbackUnsubscribe();
            };
        }
    }, [user, authLoading, router, userDoc, isUserAdmin]);
    
    const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
        if (!db) {
            setError("Database is not connected.");
            return;
        };
        const feedbackRef = doc(db, 'feedback', id);
        try {
            await updateDoc(feedbackRef, { status: newStatus });
        } catch (err: any) {
            setError(`Failed to update status. Check Firestore rules for update permissions. Error: ${err.message}`);
        }
    };
    
    const handleEditUser = (userToEdit: AppUser) => {
        setEditingUser(userToEdit);
        setIsEditUserDialogOpen(true);
    };

    const handleSaveUser = async (userId: string, newGoogleEmail: string) => {
        if (!db) {
            setError("Database is not connected.");
            return;
        }
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { googleEmail: newGoogleEmail });
        } catch (err: any) {
            throw new Error(`Failed to update user. Check Firestore rules. Error: ${err.message}`);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const dataStr = await exportUsersData(selectedUsers);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            link.download = `studytracker_selected_users_${dateStr}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: "Export Successful", description: `${selectedUsers.length} user(s) have been exported.` });
        } catch (error: any) {
            toast({ title: "Export Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const { newMessages, resolvedMessages } = useMemo(() => {
        const filtered = feedbackFilter === 'All'
            ? feedback
            : feedback.filter(item => item.type === feedbackFilter);
        
        const newMessages = filtered.filter(item => item.status === 'Pending' || item.status === 'In Progress');
        const resolvedMessages = filtered.filter(item => item.status === 'Done' || item.status === 'Fixed');

        return { newMessages, resolvedMessages };
    }, [feedback, feedbackFilter]);

    const { paginatedUsers, totalPages } = useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        return {
            paginatedUsers: users.slice(startIndex, endIndex),
            totalPages: Math.ceil(users.length / usersPerPage) || 1,
        };
    }, [users, currentPage, usersPerPage]);

    const handleUsersPerPageChange = (value: string) => {
        setUsersPerPage(Number(value));
        setCurrentPage(1); // Reset to first page
    };

    const handleSelectUser = (userId: string, checkedStatus: boolean | CheckedState) => {
        const isSelected = typeof checkedStatus === 'boolean' ? checkedStatus : checkedStatus.status !== 'unchecked';
        if (isSelected) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };

    const handleSelectAllOnPage = (checkedStatus: boolean | CheckedState) => {
        const isSelected = typeof checkedStatus === 'boolean' ? checkedStatus : checkedStatus.status !== 'unchecked';
        const pageUserIds = paginatedUsers.map(u => u.uid);
        if (isSelected) {
            setSelectedUsers(prev => [...new Set([...prev, ...pageUserIds])]);
        } else {
            setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
        }
    };

    const allOnPageSelected = useMemo(() => {
        return paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.uid));
    }, [paginatedUsers, selectedUsers]);


    if (authLoading || (user && !userDoc)) {
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
    
    if (loading) {
         return (
            <div className="flex h-screen w-full items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Navbar/>
            <main className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <div className="flex items-center gap-2">
                         <Button onClick={handleExport} disabled={isExporting || selectedUsers.length === 0}>
                            {isExporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                            Export Selected ({selectedUsers.length})
                        </Button>
                        <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Feedback Types</SelectItem>
                                <SelectItem value="Bug Report">Bug Report</SelectItem>
                                <SelectItem value="Feature Request">Feature Request</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {error ? (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3"]} className="w-full space-y-4">
                        <AccordionItem value="item-1" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                             <AccordionTrigger className="p-6 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users />
                                        Registered Users
                                    </CardTitle>
                                    <CardDescription className="pt-1.5">
                                        A list of all users who have registered in the application.
                                    </CardDescription>
                                </div>
                                 <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={allOnPageSelected}
                                                    onCheckedChange={handleSelectAllOnPage}
                                                    aria-label="Select all on page"
                                                />
                                            </TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Login Email</TableHead>
                                            <TableHead>Google Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.length > 0 ? paginatedUsers.map((appUser) => (
                                            <TableRow key={appUser.uid} data-state={selectedUsers.includes(appUser.uid) && "selected"}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUsers.includes(appUser.uid)}
                                                        onCheckedChange={(checked) => handleSelectUser(appUser.uid, checked)}
                                                        aria-label={`Select user ${appUser.username}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{appUser.username}</TableCell>
                                                <TableCell className="text-muted-foreground">{appUser.email}</TableCell>
                                                <TableCell>{appUser.googleEmail || 'Not Set'}</TableCell>
                                                <TableCell>{appUser.role === 'admin' ? 'Admin' : 'User'}</TableCell>
                                                <TableCell>
                                                    <EditUserDialog 
                                                        user={appUser}
                                                        open={editingUser?.uid === appUser.uid && isEditUserDialogOpen}
                                                        onOpenChange={(open) => {
                                                          if (open) {
                                                            handleEditUser(appUser);
                                                          } else {
                                                            setEditingUser(null);
                                                            setIsEditUserDialogOpen(false);
                                                          }
                                                        }}
                                                        onSave={handleSaveUser}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    No users found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                 <div className="flex items-center justify-between pt-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Rows per page:</span>
                                        <Select value={String(usersPerPage)} onValueChange={handleUsersPerPageChange}>
                                            <SelectTrigger className="h-8 w-[70px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="8">8</SelectItem>
                                                <SelectItem value="16">16</SelectItem>
                                                <SelectItem value="24">24</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium">
                                        <span>Page {currentPage} of {totalPages}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                <span className="sr-only">Previous page</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage >= totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                                <span className="sr-only">Next page</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                             <AccordionTrigger className="p-6 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare />
                                        New User Feedback
                                    </CardTitle>
                                    <CardDescription className="pt-1.5">
                                        Active messages from users that are pending or in progress.
                                    </CardDescription>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                                <FeedbackTable feedbackItems={newMessages} onStatusChange={handleStatusChange} />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="rounded-lg border bg-card text-card-foreground shadow-sm">
                             <AccordionTrigger className="p-6 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Archive />
                                        Resolved Feedback
                                    </CardTitle>
                                    <CardDescription className="pt-1.5">
                                        Messages that have been marked as done or fixed.
                                    </CardDescription>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-0">
                                <FeedbackTable feedbackItems={resolvedMessages} onStatusChange={handleStatusChange} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </main>
        </TooltipProvider>
    );
}



'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import Link from 'next/link';
import { format } from 'date-fns';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

interface PaidTransaction {
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Timestamp;
    paymentStatus: 'paid';
}

interface UserProfile {
    displayName: string;
    photoURL?: string;
}

function PaidTransactionRow({ notification }: { notification: WithId<PaidTransaction>}) {
    const { firestore } = useFirebase();

    const userDocRef = useMemoFirebase(
        () => (firestore && notification.userId ? doc(firestore, 'users', notification.userId) : null),
        [firestore, notification.userId]
    );
    const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

    const displayName = userProfile?.displayName ?? notification.userEmail;

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={userProfile?.photoURL}/>
                        <AvatarFallback>{displayName?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{isLoading ? <Skeleton className="h-5 w-24" /> : displayName}</p>
                        <p className="text-xs text-muted-foreground">{notification.userEmail}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {notification.message}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {notification.createdAt ? format(notification.createdAt.toDate(), 'PPP p') : 'N/A'}
            </TableCell>
            <TableCell className="md:hidden">
                {notification.createdAt ? format(notification.createdAt.toDate(), 'dd/MM/yy') : 'N/A'}
            </TableCell>
             <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/payments/${notification.id}`}>
                        View
                    </Link>
                </Button>
            </TableCell>
        </TableRow>
    )
}


function AllPaidSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead className="md:hidden">Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function AllPaidPage() {
    const { user, firestore, isUserLoading } = useFirebase();
    const router = useRouter();
    const isAdmin = user?.email === 'admin@noukha.com';
    
    useEffect(() => {
        if (!isUserLoading && !isAdmin) {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, isAdmin, router]);

    const paidQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'admin_notifications'),
            where('paymentStatus', '==', 'paid'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: paidTransactions, isLoading, error } = useCollection<PaidTransaction>(paidQuery);
    
    useEffect(() => {
        if (error) {
            console.error("Firestore Error in AllPaidPage:", error);
        }
    }, [error]);

    if (isUserLoading || (isLoading && !paidTransactions)) {
        return (
            <DashboardLayout>
                <AllPaidSkeleton />
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <div className="mb-4">
                 <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
             <div className="max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <CreditCard /> All Paid Transactions
                        </CardTitle>
                        <CardDescription>A complete log of all successful credit purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paidTransactions && paidTransactions.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No paid transactions found yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead className="md:hidden">Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paidTransactions?.map(item => (
                                        <PaidTransactionRow key={item.id} notification={item} />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
             </div>
        </DashboardLayout>
    );
}

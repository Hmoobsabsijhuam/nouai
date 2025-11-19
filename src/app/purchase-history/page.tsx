
'use client';

import { useMemo } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Coins, History } from 'lucide-react';
import { format } from 'date-fns';

interface PurchaseRecord {
    message: string;
    createdAt: Timestamp;
    credits: number;
    previousBalance: number;
    paymentStatus: 'pending' | 'paid' | 'rejected';
}

function HistorySkeleton() {
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
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Previous Balance</TableHead>
                            <TableHead className="text-right">Credits Added</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function PurchaseHistoryPage() {
    const { user, firestore, isUserLoading } = useFirebase();

    const purchaseHistoryQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'purchase_history'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: purchases, isLoading } = useCollection<PurchaseRecord>(purchaseHistoryQuery);

    if (isUserLoading || (isLoading && !purchases)) {
        return (
            <DashboardLayout>
                <HistorySkeleton />
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
             <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <History /> My Purchase History
                        </CardTitle>
                        <CardDescription>A record of all your credit purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {purchases && purchases.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">You have not made any purchases yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Previous Balance</TableHead>
                                        <TableHead className="text-right">Credits Added</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="hidden md:table-cell">
                                                 {item.createdAt ? format(item.createdAt.toDate(), 'PPP p') : 'N/A'}
                                            </TableCell>
                                             <TableCell className="md:hidden">
                                                 {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yy') : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                Credit Purchase
                                            </TableCell>
                                            <TableCell>
                                                {item.previousBalance ?? 0}
                                            </TableCell>
                                            <TableCell className="text-right font-medium flex items-center justify-end gap-1">
                                                <Coins className="h-4 w-4 text-yellow-500" /> +{item.credits}
                                            </TableCell>
                                        </TableRow>
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
    

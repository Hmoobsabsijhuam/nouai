'use client';

import { useMemo } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Coins, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AdminNotification {
    userId: string;
    message: string;
    createdAt: Timestamp;
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
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                         <div key={i} className="flex justify-between items-center">
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function PurchaseHistoryPage() {
    const { user, firestore, isUserLoading } = useFirebase();

    const purchaseHistoryQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'admin_notifications'),
            where('userId', '==', user.uid),
            where('paymentStatus', '==', 'paid'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: purchases, isLoading } = useCollection<AdminNotification>(purchaseHistoryQuery);
    
    const processedPurchases = useMemo(() => {
        return purchases?.map(p => {
            const creditMatch = p.message.match(/(\d+)\s*credits/);
            const credits = creditMatch ? parseInt(creditMatch[1], 10) : 0;
            return { ...p, credits };
        }) || [];
    }, [purchases]);

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
                           <CreditCard /> Purchase History
                        </CardTitle>
                        <CardDescription>A record of all your credit purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {processedPurchases.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">You have not made any purchases yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Credits</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedPurchases.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="hidden md:table-cell">
                                                 {item.createdAt ? format(item.createdAt.toDate(), 'PPP') : 'N/A'}
                                            </TableCell>
                                             <TableCell className="md:hidden">
                                                 {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yy') : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                Credit Purchase
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

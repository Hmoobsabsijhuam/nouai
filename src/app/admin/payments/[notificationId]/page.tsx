'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, Timestamp, writeBatch, increment } from 'firebase/firestore';
import { useDoc, WithId } from '@/firebase/firestore/use-doc';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Clock, Coins, User, XCircle } from 'lucide-react';
import { format } from 'date-fns';

type PaymentStatus = 'pending' | 'paid' | 'rejected';

interface AdminNotification {
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
    link?: string;
    paymentStatus: PaymentStatus;
}

function PaymentTrackingSkeleton() {
    return (
        <DashboardLayout>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/4" />
                </CardContent>
                <CardFooter className="gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </DashboardLayout>
    )
}

export default function PaymentTrackingPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const notificationId = params.notificationId as string;
    const [isUpdating, setIsUpdating] = useState(false);

    const isAdmin = user?.email === 'admin@noukha.com';

    useEffect(() => {
        if (!isUserLoading && !isAdmin) {
            toast({ title: "Access Denied", variant: "destructive" });
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, isAdmin, router, toast]);

    const notifDocRef = useMemoFirebase(
        () => (firestore && notificationId ? doc(firestore, 'admin_notifications', notificationId) : null),
        [firestore, notificationId]
    );

    const { data: notification, isLoading: isNotifLoading } = useDoc<AdminNotification>(notifDocRef);

    const handleStatusUpdate = async (status: PaymentStatus) => {
        if (!notifDocRef || !firestore || !notification) return;
        setIsUpdating(true);
        try {
            const batch = writeBatch(firestore);

            // Update notification status
            batch.update(notifDocRef, {
                paymentStatus: status,
                read: true,
                updatedAt: serverTimestamp()
            });

            // If rejected, deduct credits from the user
            if (status === 'rejected') {
                const creditAmountMatch = notification.message.match(/purchased (\d+) credits/);
                if (creditAmountMatch && creditAmountMatch[1]) {
                    const creditsToDeduct = parseInt(creditAmountMatch[1], 10);
                    if (!isNaN(creditsToDeduct)) {
                        const userRef = doc(firestore, 'users', notification.userId);
                        batch.update(userRef, {
                            credits: increment(-creditsToDeduct)
                        });
                    }
                }
            }

            await batch.commit();

            toast({ title: "Status Updated", description: `Payment marked as ${status}.` });
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({ title: "Error", description: "Could not update payment status.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    if (isUserLoading || isNotifLoading) {
        return <PaymentTrackingSkeleton />;
    }
    
    if (!notification) {
        return (
             <DashboardLayout>
                <div className="text-center">
                    <p>Notification not found.</p>
                     <Button asChild variant="link">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case 'paid': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
            default: return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        }
    };


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
            <Card>
                <CardHeader>
                    <CardTitle>Payment Transaction Details</CardTitle>
                    <CardDescription>Review and update the status of this credit purchase.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{notification.message}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <Link href={`/profile?userId=${notification.userId}`} className="font-medium text-primary hover:underline">{notification.userEmail}</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{format(notification.createdAt.toDate(), 'PPP p')}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        {getStatusBadge(notification.paymentStatus)}
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <div className="space-x-2">
                        <Button onClick={() => handleStatusUpdate('paid')} disabled={isUpdating || notification.paymentStatus === 'paid'} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                        </Button>
                         <Button onClick={() => handleStatusUpdate('rejected')} disabled={isUpdating || notification.paymentStatus === 'rejected'} variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Mark as Rejected
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </DashboardLayout>
    )
}

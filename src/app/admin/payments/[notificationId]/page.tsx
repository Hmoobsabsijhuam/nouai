
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Clock, User, XCircle, QrCode, X } from 'lucide-react';
import { format } from 'date-fns';

type PaymentStatus = 'pending' | 'paid' | 'rejected';

interface AdminNotification {
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    read: boolean;
    link?: string;
    paymentStatus: PaymentStatus;
}

interface UserProfile {
    displayName: string;
    photoURL?: string;
    email: string;
}

function PaymentTrackingSkeleton() {
    return (
        <DashboardLayout>
            <div className="max-w-md mx-auto">
                <Skeleton className="h-10 w-32 mb-4" />
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col items-center">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-6 w-40 mt-4" />
                            <Skeleton className="h-4 w-32 mt-2" />
                        </div>
                        <div className="border-t border-b py-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-24" />
                                <div className="text-right">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-24" />
                                <div className="text-right">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <Skeleton className="h-4 w-20 mx-auto" />
                            <Skeleton className="h-10 w-48 mx-auto mt-1" />
                        </div>
                         <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

export default function PaymentTrackingPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const notificationId = params.notificationId as string;

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

    const userDocRef = useMemoFirebase(
        () => (firestore && notification ? doc(firestore, 'users', notification.userId) : null),
        [firestore, notification]
    );
    const { data: buyerProfile, isLoading: isBuyerLoading } = useDoc<UserProfile>(userDocRef);

    const creditAmountMatch = notification?.message.match(/(\d+)\s*credits/);
    const creditAmount = creditAmountMatch ? parseInt(creditAmountMatch[1], 10) : 0;
    const userAccountMatch = notification?.message.match(/from account (.+)\./);
    const userBankAccount = userAccountMatch ? userAccountMatch[1] : 'Not provided';

    const isLoading = isUserLoading || isNotifLoading || isBuyerLoading;

    if (isLoading) {
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

    const StatusIcon = {
        paid: <CheckCircle className="h-16 w-16 text-green-500" />,
        rejected: <XCircle className="h-16 w-16 text-red-500" />,
        pending: <Clock className="h-16 w-16 text-yellow-500" />,
    }[notification.paymentStatus];

    const statusText = {
        paid: 'Transfer Successful',
        rejected: 'Transfer Failed',
        pending: 'Transfer Pending',
    }[notification.paymentStatus];

    return (
        <DashboardLayout>
            <div className="max-w-md mx-auto">
                 <Card className="w-full shadow-lg relative">
                    <div className="absolute top-2 right-2">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/dashboard">
                                <X className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                    <CardContent className="p-4 space-y-4 bg-card">
                         <div className="flex flex-col items-center justify-center text-center py-4">
                            {StatusIcon}
                            <h2 className="text-xl font-semibold mt-2">{statusText}</h2>
                            <p className="text-sm text-muted-foreground">
                                {format(notification.createdAt.toDate(), 'dd/MM/yy')} at {format(notification.createdAt.toDate(), 'HH:mm:ss')}
                            </p>
                        </div>
                        
                        <div className="border-t border-b border-border py-4 px-2 space-y-4 text-sm">
                            {/* From Account */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">From Account</span>
                                <div className="flex items-center gap-2 text-right">
                                    <div>
                                        <p className="font-bold">{buyerProfile?.displayName || 'Unknown User'}</p>
                                        <p className="text-xs text-muted-foreground">{buyerProfile?.email}</p>
                                        <p className="font-mono text-xs">{userBankAccount}</p>
                                    </div>
                                    <Avatar>
                                        <AvatarImage src={buyerProfile?.photoURL}/>
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            {/* To Account */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">To Account</span>
                                 <div className="flex items-center gap-2 text-right">
                                     <div>
                                        <p className="font-bold">Nou AI</p>
                                        <p className="text-xs text-muted-foreground">ADMIN</p>
                                    </div>
                                    <Avatar>
                                        <AvatarFallback>N</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="text-3xl font-bold text-primary">{creditAmount.toLocaleString()} CREDITS</p>
                        </div>

                         <div className="border-t pt-4 px-2 space-y-4">
                            {/* QR Code section */}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                                <div className="flex items-center gap-2">
                                     <QrCode className="h-8 w-8 text-primary" />
                                     <div>
                                         <p className="font-semibold text-sm">Transaction Receipt</p>
                                         <p className="text-xs text-muted-foreground">Confirmation</p>
                                     </div>
                                </div>
                                <p className="font-mono text-xs bg-background p-1 rounded-md">ID: {notificationId.substring(0, 8)}</p>
                            </div>
                         </div>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

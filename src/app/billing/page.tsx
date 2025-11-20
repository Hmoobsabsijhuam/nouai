
'use client';

import { useState } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, writeBatch, Firestore } from 'firebase/firestore';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CreditPackage {
  credits: number;
  price: number;
  bestValue?: boolean;
}

const creditPackages: CreditPackage[] = [
  { credits: 100, price: 5 },
  { credits: 500, price: 20, bestValue: true },
  { credits: 1000, price: 35 },
];

export default function BillingPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<{ credits: number }>(userDocRef);

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user || !firestore || !profile) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setPurchasingId(pkg.credits);
    
    try {
        const batch = writeBatch(firestore);
        
        // 1. Create a notification for the admin with a pending status
        const adminNotifCollection = collection(firestore, 'admin_notifications');
        const newNotifDocRef = doc(adminNotifCollection);
        const message = `${user.displayName || user.email} requested a purchase of ${pkg.credits} credits.`;

        batch.set(newNotifDocRef, {
            userId: user.uid,
            userEmail: user.email,
            message: message,
            createdAt: serverTimestamp(),
            read: false,
            paymentStatus: 'pending', // Set status to pending
            link: `/admin/payments/${newNotifDocRef.id}`
        });

        // 2. Create a purchase history record for the user with a pending status
        const userPurchaseHistoryRef = doc(firestore, 'users', user.uid, 'purchase_history', newNotifDocRef.id);
        batch.set(userPurchaseHistoryRef, {
            userId: user.uid,
            message: `Requested ${pkg.credits} credits.`,
            credits: pkg.credits,
            previousBalance: profile.credits ?? 0,
            createdAt: serverTimestamp(),
            paymentStatus: 'pending' // Set status to pending
        });

        await batch.commit();

        toast({
            title: "Purchase Request Sent!",
            description: `Your request for ${pkg.credits} credits is pending admin approval.`,
        });

    } catch (error: any) {
        console.error("Error requesting credit purchase:", error);
        
        const contextualError = new FirestorePermissionError({
            operation: 'write',
            path: 'admin_notifications', 
            requestResourceData: { amount: pkg.credits }
        });
        errorEmitter.emit('permission-error', contextualError);
        
        toast({
            title: "Request Failed",
            description: "Could not send your purchase request. Please try again.",
            variant: "destructive"
        });
    } finally {
      setPurchasingId(null);
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
            <p className="text-muted-foreground">Refill your balance to continue creating with Nou AI.</p>
        </div>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <Skeleton className="h-10 w-24" />
                ) : (
                    <div className="flex items-center gap-2 text-3xl font-bold">
                        <Coins className="h-8 w-8 text-yellow-500" />
                        <span>{profile?.credits ?? 0}</span>
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card key={pkg.credits} className={`flex flex-col ${pkg.bestValue ? 'border-primary border-2 shadow-lg' : ''}`}>
               {pkg.bestValue && <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">BEST VALUE</div>}
              <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <CardTitle className="text-2xl">{pkg.credits} Credits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow text-center">
                <p className="text-4xl font-bold">${pkg.price}</p>
                <p className="text-muted-foreground">One-time purchase</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasingId !== null}
                >
                  {purchasingId === pkg.credits ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {purchasingId === pkg.credits ? 'Processing...' : 'Purchase'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_BANK_ACCOUNT = '123-456-7890'; // Simulated admin bank account

function PaymentPageSkeleton() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <Skeleton className="h-10 w-32 mb-4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-32" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-32" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                         <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    )
}


export function PaymentFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const [credits, setCredits] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const creditsParam = searchParams.get('credits');
    const priceParam = searchParams.get('price');
    if (creditsParam && priceParam) {
      setCredits(parseInt(creditsParam, 10));
      setPrice(parseInt(priceParam, 10));
    } else {
      // If params are missing, redirect back to billing
      router.replace('/billing');
    }
  }, [searchParams, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied!", description: "Bank account number copied to clipboard." });
    }, (err) => {
        toast({ title: "Failed to copy", variant: "destructive" });
    });
  }

  const handleConfirmPayment = async () => {
    if (!user || !firestore || !credits || !price) {
      toast({ title: "Error", description: "Missing required information.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);

    try {
        const batch = writeBatch(firestore);
        
        // 1. Create admin notification
        const adminNotifCollection = collection(firestore, 'admin_notifications');
        const newNotifDocRef = doc(adminNotifCollection);
        const message = `${user.displayName || user.email} requested a purchase of ${credits} credits for $${price}.`;
        
        batch.set(newNotifDocRef, {
            userId: user.uid,
            userEmail: user.email,
            message: message,
            createdAt: serverTimestamp(),
            read: false,
            paymentStatus: 'pending',
            link: `/admin/payments/${newNotifDocRef.id}`
        });

        // 2. Create user's purchase history record
        const userPurchaseHistoryRef = doc(firestore, 'users', user.uid, 'purchase_history', newNotifDocRef.id);
        batch.set(userPurchaseHistoryRef, {
            userId: user.uid,
            message: `Requested ${credits} credits for $${price}.`,
            credits: credits,
            price: price,
            createdAt: serverTimestamp(),
            paymentStatus: 'pending'
        });

        await batch.commit();

        toast({
            title: "Request Submitted!",
            description: `Your purchase request for ${credits} credits is now pending admin verification.`,
        });
        
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error confirming payment:", error);
        toast({
            title: "Submission Failed",
            description: "Could not submit your payment confirmation. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || credits === null || price === null) {
      return <PaymentPageSkeleton />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>
              To finalize your purchase of {credits} credits for ${price}, please transfer the amount to the account below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-medium text-lg">Payment Details</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <span>Amount Due</span>
                    <span className="font-bold text-xl">${price}</span>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <span>Credits to Receive</span>
                    <span className="font-bold text-xl">{credits}</span>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-medium text-lg">Bank Transfer Information</h3>
                <div className="flex items-center justify-between rounded-lg border bg-secondary p-4">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Bank Account Number</span>
                        <span className="font-mono text-lg">{ADMIN_BANK_ACCOUNT}</span>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT)}>
                        <Copy className="h-5 w-5" />
                     </Button>
                </div>
                 <p className="text-xs text-muted-foreground">
                    After you have completed the transfer, click the button below to notify the administrator. Your credits will be added to your account upon verification.
                </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleConfirmPayment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "I have completed the transfer"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

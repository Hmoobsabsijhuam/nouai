
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Banknote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ADMIN_ACCOUNT_NAME = 'Nou AI';

function PaymentPageSkeleton() {
    return (
        <DashboardLayout>
            <div className="max-w-md mx-auto">
                <Skeleton className="h-8 w-48 mb-4" />
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
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
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [userBankAccount, setUserBankAccount] = useState('');

  useEffect(() => {
    const creditsParam = searchParams.get('credits');
    const priceParam = searchParams.get('price');
    if (creditsParam && priceParam) {
      setCredits(parseInt(creditsParam, 10));
      setPrice(parseInt(priceParam, 10));
    } else {
      router.replace('/billing');
    }
  }, [searchParams, router]);

  const handleConfirmPayment = async () => {
    if (!user || !firestore || !credits || !price || !userBankAccount) {
      toast({ title: "Error", description: "Please enter your bank account number.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);

    try {
        const batch = writeBatch(firestore);
        
        // 1. Add credits to the user's document
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { credits: increment(credits) });

        // 2. Create a notification for the admin
        const adminNotifCollection = collection(firestore, 'admin_notifications');
        const newNotifDocRef = doc(adminNotifCollection);
        const message = `${user.displayName || user.email} purchased ${credits} credits for $${price} from account ${userBankAccount}.`;
        
        batch.set(newNotifDocRef, {
            userId: user.uid,
            userEmail: user.email,
            message: message,
            createdAt: serverTimestamp(),
            read: false,
            paymentStatus: 'paid', // Mark as paid immediately
            link: `/admin/payments/${newNotifDocRef.id}`
        });

        // 3. Create a record in the user's purchase history
        const userPurchaseHistoryRef = doc(firestore, 'users', user.uid, 'purchase_history', newNotifDocRef.id);
        batch.set(userPurchaseHistoryRef, {
            userId: user.uid,
            message: `Purchased ${credits} credits for $${price}.`,
            credits: credits,
            price: price,
            userBankAccount: userBankAccount,
            createdAt: serverTimestamp(),
            paymentStatus: 'paid' // Mark as paid immediately
        });

        await batch.commit();

        toast({
            title: "Purchase Successful!",
            description: `${credits} credits have been added to your account.`,
        });
        
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error confirming payment:", error);
        toast({
            title: "Purchase Failed",
            description: "Could not complete your purchase. Please try again.",
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
      <div className="max-w-md mx-auto">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <h1 className="text-2xl font-bold mb-4">Complete your purchase</h1>
        
        <div className="border rounded-lg bg-card shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Amount Due:</span>
                <span className="font-bold text-lg">${price}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-bold text-lg">{credits}</span>
            </div>
            
            <Separator className="my-4" />

            <div className="space-y-4">
                <Button 
                    variant="outline" 
                    className={cn("w-full justify-start text-left h-auto py-3", showBankDetails && "border-primary ring-2 ring-primary")}
                    onClick={() => setShowBankDetails(true)}
                >
                    <Banknote className="mr-4 h-6 w-6" />
                    <div>
                        <p className="font-semibold">Pay with Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">Transfer to the account below.</p>
                    </div>
                </Button>

                {showBankDetails && (
                    <div className="p-3 bg-secondary rounded-md text-sm space-y-4">
                        <p>Please transfer ${price} to the following account and enter your account number below for verification:</p>
                        <div className="font-mono bg-background p-2 rounded">
                            <p><strong>Account Name:</strong> {ADMIN_ACCOUNT_NAME}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-bank-account">Your Bank Account Number</Label>
                          <Input
                              id="user-bank-account"
                              placeholder="Enter your account number"
                              value={userBankAccount}
                              onChange={(e) => setUserBankAccount(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Your credits will be added after confirming the purchase.</p>
                    </div>
                )}
            </div>
        </div>

        <p className="text-xs text-muted-foreground my-4 px-1">
            By clicking "Confirm Purchase", you agree that you have completed the bank transfer from the account provided.
        </p>

        <Button className="w-full" size="lg" onClick={handleConfirmPayment} disabled={isSubmitting || !showBankDetails || !userBankAccount}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Processing..." : "Confirm Purchase & Get Credits"}
        </Button>
      </div>
    </DashboardLayout>
  );
}

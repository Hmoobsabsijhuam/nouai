
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PaymentPageSkeleton() {
    return (
        <DashboardLayout>
            <div className="max-w-md mx-auto">
                <Skeleton className="h-8 w-48 mb-4" />
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-10 w-full" />
                        <div className="flex space-x-4">
                            <Skeleton className="h-10 w-1/2" />
                            <Skeleton className="h-10 w-1/2" />
                        </div>
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
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');

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
    if (!user || !firestore || !credits || !price) return;

    if (!cardNumber || !expiryDate || !cvc || !cardholderName) {
      toast({ title: "Error", description: "Please fill in all card details.", variant: "destructive" });
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
        const message = `${user.displayName || user.email} purchased ${credits} credits for $${price}.`;
        
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
  
  const isFormFilled = cardNumber && expiryDate && cvc && cardholderName;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <h1 className="text-2xl font-bold mb-4">Payment method</h1>
        
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Amount Due:</span>
                    <span className="font-bold text-lg">${price}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Credits to be added:</span>
                    <span className="font-bold text-lg">{credits}</span>
                </div>
                
                <Separator className="my-6" />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="card-number">Card information</Label>
                        <Input id="card-number" placeholder="1234 1234 1234 1234" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                    </div>
                    <div className="flex space-x-4">
                        <div className="space-y-2 w-1/2">
                            <Input placeholder="MM / YY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                        </div>
                        <div className="space-y-2 w-1/2">
                            <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cardholder-name">Cardholder name</Label>
                        <Input id="cardholder-name" placeholder="Full name on card" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" size="lg" onClick={handleConfirmPayment} disabled={isSubmitting || !isFormFilled}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Processing..." : "Confirm Purchase"}
                </Button>
            </CardFooter>
        </Card>

        <p className="text-xs text-muted-foreground my-4 px-1 text-center">
            This is a demo application. Do not use real card details.
        </p>

      </div>
    </DashboardLayout>
  );
}

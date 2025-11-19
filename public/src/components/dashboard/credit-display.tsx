'use client';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';

export function CreditDisplay() {
  const { user, firestore, isUserLoading } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<{ credits: number }>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  if (!user || user.email === 'admin@noukha.com') {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-24 rounded-md" />;
  }

  const credits = profile?.credits ?? 0;

  return (
    <Button variant="ghost" asChild>
        <Link href="/billing" className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{credits}</span>
            <span className="sr-only">Credits</span>
        </Link>
    </Button>
  );
}

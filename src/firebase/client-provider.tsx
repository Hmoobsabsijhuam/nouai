
'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize Firebase on the client side.
      const firebaseServices = initializeFirebase();
      setServices(firebaseServices);
    } catch (e: any) {
        console.error("Firebase initialization failed:", e);
        setError(e.message);
    }
  }, []);

  if (error) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-destructive">Application Error</h1>
            <p className="mt-2 text-muted-foreground">Could not initialize Firebase.</p>
            <pre className="mt-4 rounded-md bg-muted p-4 text-sm text-destructive-foreground">{error}</pre>
        </div>
    );
  }

  if (!services) {
    // Render a loading state while Firebase is initializing.
    return (
        <div className="flex h-screen w-full flex-col">
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                 <Skeleton className="mb-4 h-8 w-64" />
            </main>
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

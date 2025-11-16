'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

function DashboardSkeleton() {
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          Welcome, {user.email}!
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg font-medium text-green-600">
                You are successfully logged in.
              </p>
              <p className="mt-2 text-muted-foreground">
                Your session is secure and managed by Firebase. You can now access all the protected areas of the application.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Your session is persistent. You can close this tab, and you will remain logged in until you explicitly log out.
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="relative h-full min-h-[150px]">
             <Image
                src="https://picsum.photos/seed/1/600/400"
                alt="Abstract art representing security"
                fill
                className="object-cover"
                data-ai-hint="security abstract"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

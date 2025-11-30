'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, ImageIcon, VideoIcon, Mic } from 'lucide-react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';


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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

interface UserNotification {
  message: string;
  createdAt: any; 
  read: boolean;
}

function UserDashboard() {
  const { user: authUser } = useAuth(); 
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const displayName = userProfile?.displayName || authUser?.displayName || authUser?.email;

  const userNotificationsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(
      collection(firestore, 'users', authUser.uid, 'user_notifications'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, authUser]);

  const { data: notifications, isLoading: isNotificationsLoading } = useCollection<UserNotification>(userNotificationsQuery);
  const unreadNotifications = notifications?.filter(n => !n.read) ?? [];

  if (isProfileLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!authUser) {
    return null;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Zoo siab txais tos koj os, {displayName}!
      </h1>
      <div className="grid gap-6">
        <div className="grid auto-rows-max items-start gap-6">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Cov kev tshaj tawm tshiab
                </CardTitle>
                <CardDescription>
                    {unreadNotifications.length > 0 
                    ? `You have ${unreadNotifications.length} unread message(s).`
                    : 'Tsis tau muaj kev tshaj tawm tshiab li.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    {isNotificationsLoading ? (
                        <p>Loading notifications...</p>
                    ) : unreadNotifications.length > 0 ? (
                    unreadNotifications.slice(0, 3).map(notif => (
                        <div key={notif.id} className="border-l-2 border-primary pl-3">
                        <p className="text-sm font-medium">{notif.message}</p>
                        </div>
                    ))
                    ) : (
                    <p className="text-sm text-muted-foreground">Your notification inbox is clear.</p>
                    )}
                </div>
                </CardContent>
            </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-6">
           <Card>
            <CardHeader>
              <CardTitle>Creation Categories</CardTitle>
              <CardDescription>Select a category to start creating.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/generate-image" className="group">
                        <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:bg-muted">
                            <CardHeader className="items-center text-center">
                                <ImageIcon className="h-10 w-10 text-primary mb-2" />
                                <CardTitle className="text-lg">Image Generation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center">Create stunning visuals from text descriptions.</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/text-to-video" className="group">
                         <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:bg-muted">
                            <CardHeader className="items-center text-center">
                                <VideoIcon className="h-10 w-10 text-primary mb-2" />
                                <CardTitle className="text-lg">Text to Video</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center">Bring your ideas to life with AI-powered video creation.</p>
                            </CardContent>
                        </Card>
                    </Link>
                     <Link href="/image-to-video" className="group">
                         <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:bg-muted">
                            <CardHeader className="items-center text-center">
                                <VideoIcon className="h-10 w-10 text-primary mb-2" />
                                <CardTitle className="text-lg">Image to Video</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center">Animate an image with a text prompt.</p>
                            </CardContent>
                        </Card>
                    </Link>
                     <Link href="/text-to-speech" className="group">
                         <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:bg-muted">
                            <CardHeader className="items-center text-center">
                                <Mic className="h-10 w-10 text-primary mb-2" />
                                <CardTitle className="text-lg">Text to Speech</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center">Convert text into natural-sounding audio.</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
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

  const isAdmin = user.email === 'admin@noukha.com';

  return (
    <DashboardLayout>
      {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard />}
    </DashboardLayout>
  );
}

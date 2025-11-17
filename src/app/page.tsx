'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, FileText, Bell, ArrowRight, ImageIcon, VideoIcon } from 'lucide-react';
import Image from 'next/image';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';


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

interface GeneratedImage {
    prompt: string;
    imageUrl: string;
    createdAt: Timestamp;
}

interface GeneratedVideo {
    prompt: string;
    videoUrl: string;
    createdAt: Timestamp;
}

type ActivityItem = 
    | (WithId<GeneratedImage> & { type: 'image' })
    | (WithId<GeneratedVideo> & { type: 'video' });


function UserDashboard() {
  const { user: authUser } = useAuth(); 
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const displayName = userProfile?.displayName || authUser?.displayName || authUser?.email;

  // Fetch recent images
  const imagesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users', authUser.uid, 'generated_images'), orderBy('createdAt', 'desc'), limit(4));
  }, [firestore, authUser]);
  const { data: images, isLoading: isImagesLoading } = useCollection<GeneratedImage>(imagesQuery);

  // Fetch recent videos
  const videosQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users', authUser.uid, 'generated_videos'), orderBy('createdAt', 'desc'), limit(4));
  }, [firestore, authUser]);
  const { data: videos, isLoading: isVideosLoading } = useCollection<GeneratedVideo>(videosQuery);


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

  const activityFeed = useMemo((): ActivityItem[] => {
    const typedImages: ActivityItem[] = images ? images.map(i => ({...i, type: 'image'})) : [];
    const typedVideos: ActivityItem[] = videos ? videos.map(v => ({...v, type: 'video'})) : [];
    
    return [...typedImages, ...typedVideos]
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 4); // Take the most recent 4 items overall
  }, [images, videos]);


  if (isProfileLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!authUser) {
    return null;
  }

  const isLoadingFeed = isImagesLoading || isVideosLoading;

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Zoo siab txais tos koj os, {displayName}!
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main content */}
        <div className="grid auto-rows-max items-start gap-6 lg:col-span-2">
           <Card>
            <CardHeader>
              <CardTitle>Recent Creations</CardTitle>
              <CardDescription>Your latest generated images and videos.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingFeed ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                ) : activityFeed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activityFeed.map(item => (
                            <div key={item.id} className="group relative overflow-hidden rounded-lg">
                                {item.type === 'image' ? (
                                     <Image src={item.imageUrl} alt={item.prompt} width={300} height={300} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                    <video src={item.videoUrl} muted loop playsInline className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-4">
                                    <p className="text-sm font-medium text-white truncate">{item.prompt}</p>
                                    <p className="text-xs text-white/80">{formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                        <div className="flex items-center gap-4 text-muted-foreground">
                             <ImageIcon className="h-8 w-8" />
                             <VideoIcon className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No Creations Yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Generate images or videos to see them here.
                        </p>
                         <Button asChild size="sm" className="mt-4">
                            <Link href="/generate-image">
                                Create an Image
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>
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

        {/* Sidebar */}
        <div className="grid auto-rows-max items-start gap-6 lg:col-span-1">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg font-medium text-green-600">
                Koj twb nkag los tau lawm.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your session is active. You have full access to your dashboard.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                    Explore your account and manage your settings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild className="w-full justify-between">
                    <Link href="/profile">
                        <span>Edit Your Profile</span>
                        <ArrowRight />
                    </Link>
                </Button>
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard />}
      </main>
    </div>
  );
}

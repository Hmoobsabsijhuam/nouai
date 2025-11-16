'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/dashboard/header';
import { Loader2, X, User as UserIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useDoc } from '@/firebase/firestore/use-doc';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
});

function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


export default function ProfilePage() {
  const { user: currentUser, isUserLoading: isAuthLoading, auth, firestore, firebaseApp } = useFirebase();
  const { updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const profileUserId = searchParams.get('userId');
  const isAdmin = currentUser?.email === 'admin@noukha.com';
  const targetUserId = (isAdmin && profileUserId) ? profileUserId : currentUser?.uid;

  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const isOwnProfile = !profileUserId || profileUserId === currentUser?.uid;

  const userDocRef = useMemoFirebase(
    () => (firestore && targetUserId ? doc(firestore, 'users', targetUserId) : null),
    [firestore, targetUserId]
  );
  
  const { data: profileUser, isLoading: isProfileLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace('/login');
    }
    // Admin trying to access non-existent user or user trying to access other's profile
    if (!isAuthLoading && profileUserId && !isAdmin && profileUserId !== currentUser?.uid) {
        toast({ title: "Access Denied", description: "You can only view your own profile.", variant: 'destructive' });
        router.replace('/');
    }
  }, [currentUser, isAuthLoading, router, profileUserId, isAdmin]);

  useEffect(() => {
    if (profileUser) {
      form.reset({
        displayName: profileUser.displayName || '',
        email: profileUser.email || '',
      });
      if (profileUser.photoURL) {
        setPhotoPreview(profileUser.photoURL);
      } else {
        setPhotoPreview(null);
      }
    }
  }, [profileUser, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !targetUserId || !auth?.currentUser || !firebaseApp ) return;
    if (!isOwnProfile && !isAdmin) {
         toast({ title: "Error", description: "You are not authorized to perform this action.", variant: 'destructive' });
         return;
    }

    setLoading(true);
    try {
      let photoURL = profileUser?.photoURL;

      if (photoFile) {
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `profile-pictures/${targetUserId}`);
        const uploadResult = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(uploadResult.ref);
      }
      
      // If admin is editing someone else's profile, they can't update the Auth object directly
      // Only update the user's own auth profile if they are editing themselves
      if (isOwnProfile && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: values.displayName,
          photoURL: photoURL,
        });
      }

      const userDocRef = doc(firestore, 'users', targetUserId);
      await setDoc(userDocRef, {
        displayName: values.displayName,
        photoURL: photoURL,
      }, { merge: true });
      
      if(isOwnProfile && auth.currentUser) {
        await auth.currentUser.reload();
        const freshUser = auth.currentUser;
        if(updateUser) updateUser(freshUser);
      }

      toast({
        title: 'Profile Updated',
        description: 'The profile has been successfully updated.',
      });
      
      setPhotoFile(null);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  
  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !currentUser) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{isOwnProfile ? 'My Profile' : `Editing ${profileUser?.displayName || profileUser?.email}`}</CardTitle>
                        <CardDescription>Manage account settings and profile information.</CardDescription>
                    </div>
                     <Link href="/" passHref>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
             {!profileUser && !isProfileLoading ? (
                 <div className="text-center py-10">
                     <p className="text-muted-foreground">User not found.</p>
                </div>
             ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={photoPreview ?? undefined} alt={profileUser?.displayName ?? ''} />
                          <AvatarFallback>
                            {profileUser?.displayName ? (
                              profileUser.displayName.charAt(0).toUpperCase()
                            ) : profileUser?.email ? (
                               profileUser.email.charAt(0).toUpperCase()
                            ) : (
                              <UserIcon className="h-10 w-10" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="picture">Profile Picture</Label>
                            <Input id="picture" type="file" accept="image/*" onChange={handlePhotoChange} className="file:text-primary file:font-semibold" />
                             <p className="text-xs text-muted-foreground">Recommended: Square image, up to 1MB.</p>
                        </div>
                    </div>
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
             )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

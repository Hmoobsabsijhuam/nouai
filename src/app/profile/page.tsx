'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, Timestamp, deleteDoc, query, collection, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from 'firebase/auth';
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
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Loader2, X, User as UserIcon, CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  dateOfBirth: z.date().optional(),
  status: z.enum(["Single", "Married"]).optional(),
  country: z.string().optional(),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Please enter your current password.' }),
    newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
});


function ProfileSkeleton() {
  return (
    <DashboardLayout>
      <div className="w-full mx-auto">
         <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-4 border-b pb-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
          </div>
          <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-3/4" />
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
      </div>
    </DashboardLayout>
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
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwnProfile = !profileUserId || profileUserId === currentUser?.uid;
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (firestore && targetUserId ? doc(firestore, 'users', targetUserId) : null),
    [firestore, targetUserId]
  );
  
  const { data: profileUser, isLoading: isProfileLoading } = useDoc(userDocRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      dateOfBirth: undefined,
      status: undefined,
      country: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace('/login');
    }
    if (!isAuthLoading && profileUserId && !isAdmin && profileUserId !== currentUser?.uid) {
        toast({ title: "Access Denied", description: "You can only view your own profile.", variant: 'destructive' });
        router.replace('/');
    }
  }, [currentUser, isAuthLoading, router, profileUserId, isAdmin, toast]);

  useEffect(() => {
    if (profileUser) {
      profileForm.reset({
        displayName: profileUser.displayName || '',
        email: profileUser.email || '',
        dateOfBirth: profileUser.dateOfBirth ? (profileUser.dateOfBirth as Timestamp).toDate() : undefined,
        status: profileUser.status || undefined,
        country: profileUser.country || '',
      });
      if (profileUser.photoURL) {
        setPhotoPreview(profileUser.photoURL);
      } else {
        setPhotoPreview(null);
      }
    }
  }, [profileUser, profileForm]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!firestore || !targetUserId || !auth?.currentUser || !firebaseApp ) return;
    if (!isOwnProfile && !isAdmin) {
         toast({ title: "Error", description: "You are not authorized to perform this action.", variant: 'destructive' });
         return;
    }

    setLoading(true);
    try {
      let photoURL = profileUser?.photoURL || null;

      if (photoFile) {
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `profile-pictures/${targetUserId}`);
        const uploadResult = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(uploadResult.ref);
      }
      
      if (isOwnProfile && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: values.displayName,
          photoURL: photoURL,
        });
      }

      const userDocRef = doc(firestore, 'users', targetUserId);
      
      const dataToSave = {
        displayName: values.displayName,
        email: values.email,
        dateOfBirth: values.dateOfBirth,
        status: values.status,
        country: values.country,
        photoURL: photoURL,
      };

      await setDoc(userDocRef, dataToSave, { merge: true });
      
      if(isOwnProfile && auth.currentUser) {
        await auth.currentUser.reload();
        const freshUser = auth.currentUser;
        if(updateUser) {
          updateUser(freshUser);
        }
      }

      toast({
        title: 'Profile Update Lawm',
        description: 'Koj li profile tau update lawm.',
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

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!currentUser || !currentUser.email || !firestore || !auth) {
      toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
      return;
    }
    
    setIsPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, values.newPassword);

      const userNotifCollection = collection(firestore, 'users', currentUser.uid, 'user_notifications');
      await addDoc(userNotifCollection, {
        message: "Your password was successfully changed. If you did not make this change, please contact support immediately.",
        createdAt: serverTimestamp(),
        read: false,
      });

      toast({
        title: 'Password Updated Successfully',
        description: 'Please sign in again with your new password.',
      });

      await signOut(auth);
      router.push('/login');

    } catch (error: any) {
      let description = 'An error occurred while changing your password.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'The current password you entered is incorrect.';
        passwordForm.setError('currentPassword', { type: 'manual', message: description });
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsPasswordSaving(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!currentUser || !firestore) return;
    setIsDeleting(true);

    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await deleteDoc(userDocRef);

      await deleteUser(currentUser);
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: "Error Deleting Account",
        description: error.message || "An error occurred. You may need to sign in again to complete this action.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !currentUser) {
    return <ProfileSkeleton />;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
        </div>
        
         <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
             <Card>
              <CardHeader>
                  <CardTitle>Kuv Li Profile</CardTitle>
                  <CardDescription>Kho koj li details ntawm koj tus profile.</CardDescription>
              </CardHeader>
              <CardContent>
               {!profileUser && !isProfileLoading ? (
                   <div className="text-center py-10">
                       <p className="text-muted-foreground">User not found.</p>
                  </div>
               ) : (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
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
                              <Label htmlFor="picture">Duab Profile</Label>
                              <Input id="picture" type="file" accept="image/*" onChange={handlePhotoChange} className="file:text-primary file:font-semibold" disabled={!isOwnProfile}/>
                               <p className="text-xs text-muted-foreground">Recommended: Duab ua plaub ceg, yam ntau kawg yog 1MB.</p>
                          </div>
                      </div>
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koj Lub Npe</FormLabel>
                          <FormControl>
                            <Input placeholder="Koj Lub Npe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="kojtusemail@example.com" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={profileForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Koj lub hnub yug</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Tso koj lub hnub yug</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puas tau muaj neej</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="xaiv koj li status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Single">Tus Hluas</SelectItem>
                              <SelectItem value="Married">Muaj Neej Lawm</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koj lub teb chaws</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. United States" {...field} value={field.value ?? ''} />
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
          </TabsContent>
          <TabsContent value="account">
             <Card>
              <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="p-4 border rounded-lg">
                     <h3 className="font-medium mb-2">Change Password</h3>
                     {!showPasswordForm ? (
                          <Button variant="outline" onClick={() => setShowPasswordForm(true)}>Change Password</Button>
                     ) : (
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                              <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                               <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                               <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2">
                                  <Button type="submit" disabled={isPasswordSaving}>
                                      {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      {isPasswordSaving ? 'Saving...' : 'Save New Password'}
                                  </Button>
                                   <Button variant="ghost" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                              </div>
                            </form>
                          </Form>
                     )}
                 </div>
                 <div className="p-4 border border-destructive/50 rounded-lg">
                     <h3 className="font-medium text-destructive">Delete Account</h3>
                     <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="mt-2" disabled={!isOwnProfile}>Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your account
                              and remove your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Continue"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="appearance">
             <Card>
              <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                          <h3 className="font-medium">Theme</h3>
                          <p className="text-sm text-muted-foreground">Select the theme for the dashboard.</p>
                      </div>
                      <ThemeToggle />
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

    

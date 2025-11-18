'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, X } from 'lucide-react';
import { Header } from '@/components/dashboard/header';

const formSchema = z.object({
  message: z.string().min(1, { message: 'Message cannot be empty.' }).max(280, { message: 'Message must be 280 characters or less.'}),
});

export default function NotificationsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'admin@noukha.com') {
        router.replace('/');
      }
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setLoading(true);
    try {
      // 1. Create the global notification
      const notificationsCollection = collection(firestore, 'notifications');
      const newNotifDocRef = await addDoc(notificationsCollection, {
        message: values.message,
        createdAt: serverTimestamp(),
      });

      // 2. Fan-out to all users
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const batch = writeBatch(firestore);

      usersSnapshot.forEach((userDoc) => {
        const userNotifRef = doc(firestore, 'users', userDoc.id, 'user_notifications', newNotifDocRef.id);
        batch.set(userNotifRef, {
          message: values.message,
          createdAt: serverTimestamp(),
          read: false, // Per-user read status
          globalNotificationId: newNotifDocRef.id,
        });
      });

      await batch.commit();

      toast({
        title: 'Notification Sent',
        description: `Your message has been broadcast to ${usersSnapshot.size} users.`,
      });
      form.reset();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: 'Error',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (isUserLoading || !user || user.email !== 'admin@noukha.com') {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 justify-center p-4 md:p-8">
        <div className="w-full">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Send a Notification</CardTitle>
                  <CardDescription>Broadcast a message to all registered users.</CardDescription>
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your notification message here..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Notification'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

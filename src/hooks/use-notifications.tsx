
'use client';

import { useMemo, useEffect } from 'react';
import { collection, query, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Standard notification type for user-specific alerts
export interface UserNotification {
  message: string;
  createdAt: Timestamp;
  read: boolean;
  link?: string;
  globalNotificationId?: string; 
}

// Type for admin-specific notifications, like payment alerts
export interface AdminNotification {
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
    link?: string;
    paymentStatus: 'pending' | 'paid' | 'rejected';
}

// A unified type that includes a 'type' field to distinguish between notification sources
export type AppNotification = WithId<UserNotification & { type: 'user' }> | WithId<AdminNotification & { type: 'admin' }>;

const LAST_SEEN_TOAST_TIMESTAMP_KEY = 'lastSeenToastTimestamp';

export function useNotifications() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const isAdmin = user?.email === 'admin@noukha.com';

  // --- DATA FETCHING ---
  // Fetch standard user notifications
  const userNotificationsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'user_notifications'), orderBy('createdAt', 'desc'), limit(50))
        : null,
    [firestore, user]
  );
  const { data: userNotifications, isLoading: isUserLoading } = useCollection<UserNotification>(userNotificationsQuery);

  // Fetch admin notifications, but only if the user is an admin
  const adminNotificationsQuery = useMemoFirebase(
    () =>
      firestore && isAdmin
        ? query(collection(firestore, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(50))
        : null,
    [firestore, isAdmin]
  );
  const { data: adminNotifications, isLoading: isAdminLoading } = useCollection<AdminNotification>(adminNotificationsQuery);


  // --- TOASTS FOR NEW ANNOUNCEMENTS ---
  useEffect(() => {
    if (user && typeof window !== 'undefined' && userNotifications?.length) {
        const lastSeenTimestamp = localStorage.getItem(LAST_SEEN_TOAST_TIMESTAMP_KEY);
        const lastSeenDate = lastSeenTimestamp ? new Date(JSON.parse(lastSeenTimestamp)) : new Date(0);
        let newestNotifDate: Date | null = null;

        userNotifications.forEach(notif => {
            if (notif.globalNotificationId) {
                const notifDate = notif.createdAt?.toDate();
                if (notifDate) {
                    if (!newestNotifDate || notifDate > newestNotifDate) {
                        newestNotifDate = notifDate;
                    }
                    if (notifDate > lastSeenDate) {
                        toast({
                            title: "New Announcement",
                            description: notif.message,
                            action: notif.link ? <Link href={notif.link}><Button variant="outline">View</Button></Link> : undefined,
                        });
                    }
                }
            }
        });

        if (newestNotifDate && newestNotifDate > lastSeenDate) {
            localStorage.setItem(LAST_SEEN_TOAST_TIMESTAMP_KEY, JSON.stringify(newestNotifDate.toISOString()));
        }
    }
  }, [user, userNotifications, toast]);

  // --- MERGING & SORTING ---
  // Combine user and admin notifications into a single, sorted list
  const mergedNotifications = useMemo<AppNotification[]>(() => {
    if (!user) return [];

    const userNotifs: AppNotification[] = (userNotifications || []).map(n => ({ ...n, type: 'user' }));

    // Only include admin notifications if the user is an admin
    const adminNotifs: AppNotification[] = isAdmin ? (adminNotifications || []).map(n => ({ ...n, type: 'admin' })) : [];

    return [...userNotifs, ...adminNotifs]
        .sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
  }, [user, userNotifications, adminNotifications, isAdmin]);

  // --- DERIVED STATE ---
  const unreadNotifications = useMemo(() => {
      return mergedNotifications.filter(n => !n.read);
  }, [mergedNotifications]);
  
  // --- ACTIONS ---
  const handleMarkAsRead = async (notif: AppNotification) => {
    if (!user || !firestore || notif.read) return;

    try {
        let notifRef;
        // Determine which collection to update based on the notification type
        if (notif.type === 'user') {
            notifRef = doc(firestore, 'users', user.uid, 'user_notifications', notif.id);
        } else if (notif.type === 'admin') {
            notifRef = doc(firestore, 'admin_notifications', notif.id);
        } else {
            return; // Unknown notification type
        }
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        toast({
            title: "Error",
            description: "Could not update notification status.",
            variant: "destructive"
        });
    }
  };

  // Return the hook's public API
  return {
      isLoading: (isUserLoading || isAdminLoading) && !!user,
      mergedNotifications, 
      unreadNotifications,
      handleMarkAsRead
  };
}

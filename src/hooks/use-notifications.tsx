
'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Notification types
export interface UserNotification {
  message: string;
  createdAt: any;
  read: boolean;
  link?: string;
  type: 'user';
  updatedAt?: any;
}

export interface GlobalNotification {
    message: string;
    createdAt: any;
    link?: string;
    type: 'global';
}

export type MergedNotification = WithId<UserNotification | GlobalNotification>;

// Local storage keys
const SEEN_GLOBAL_NOTIFS_KEY = 'seenGlobalNotifIds';
const LAST_SEEN_TOAST_TIMESTAMP_KEY = 'lastSeenToastTimestamp';

export function useNotifications() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [seenGlobalNotifIds, setSeenGlobalNotifIds] = useState<Set<string>>(new Set());

  // Load seen IDs from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedIds = localStorage.getItem(SEEN_GLOBAL_NOTIFS_KEY);
        if (storedIds) {
            setSeenGlobalNotifIds(new Set(JSON.parse(storedIds)));
        }
    }
  }, []);

  // --- DATA FETCHING ---
  // Queries are now conditional on the user being authenticated.
  // If the user is null, the query will be null, and useCollection will not fetch data.
  const userNotificationsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'users', user.uid, 'user_notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
          )
        : null,
    [firestore, user]
  );
  const { data: userNotifications, isLoading: isUserLoading } = useCollection<UserNotification>(userNotificationsQuery);

  const globalNotificationsQuery = useMemoFirebase(
      () =>
        firestore && user // This query now correctly depends on the user.
        ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(20))
        : null,
      [firestore, user]
  );
  const { data: globalNotifications, isLoading: isGlobalLoading } = useCollection<Omit<GlobalNotification, 'type'>>(globalNotificationsQuery);

  // --- TOASTS FOR NEW ANNOUNCEMENTS ---
  useEffect(() => {
    if (user && typeof window !== 'undefined' && globalNotifications?.length) {
        const lastSeenTimestamp = localStorage.getItem(LAST_SEEN_TOAST_TIMESTAMP_KEY);
        const lastSeenDate = lastSeenTimestamp ? new Date(JSON.parse(lastSeenTimestamp)) : new Date(0);
        let newestNotifDate: Date | null = null;

        globalNotifications.forEach(notif => {
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
        });

        if (newestNotifDate && newestNotifDate > lastSeenDate) {
            localStorage.setItem(LAST_SEEN_TOAST_TIMESTAMP_KEY, JSON.stringify(newestNotifDate.toISOString()));
        }
    }
  }, [user, globalNotifications, toast]);

  // --- MERGING & DEDUPLICATION ---
  const mergedNotifications = useMemo<MergedNotification[]>(() => {
    if (!user) return []; // Return empty array if no user, preventing errors
    const userNotifs: MergedNotification[] = userNotifications?.map(n => ({...n, type: 'user'})) || [];
    const globalNotifs: MergedNotification[] = globalNotifications?.map(n => ({
        ...n,
        type: 'global',
        read: seenGlobalNotifIds.has(n.id)
    })) || [];
    
    const globalNotifMessages = new Set(globalNotifs.map(n => n.message));
    const filteredUserNotifs = userNotifs.filter(n => !globalNotifMessages.has(n.message));

    return [...filteredUserNotifs, ...globalNotifs]
        .sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
  }, [user, userNotifications, globalNotifications, seenGlobalNotifIds]);

  const unreadNotifications = useMemo(() => {
      return mergedNotifications.filter(n => !n.read);
  }, [mergedNotifications]);
  
  // --- ACTIONS ---
  const handleMarkAsRead = async (notif: MergedNotification) => {
    if (notif.read || !user) return;

    if (notif.type === 'global') {
        const newSeenIds = new Set(seenGlobalNotifIds).add(notif.id);
        setSeenGlobalNotifIds(newSeenIds);
        localStorage.setItem(SEEN_GLOBAL_NOTIFS_KEY, JSON.stringify(Array.from(newSeenIds)));
    } else if (notif.type === 'user' && firestore) {
        try {
            const notifRef = doc(firestore, 'users', user.uid, 'user_notifications', notif.id);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Failed to mark user notification as read:", error);
        }
    }
  };

  return {
      isLoading: (isUserLoading || isGlobalLoading) && !!user,
      mergedNotifications,
      unreadNotifications,
      handleMarkAsRead
  };
}

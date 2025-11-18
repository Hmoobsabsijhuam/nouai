
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { collection, query, orderBy, limit, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserNotification {
  message: string;
  createdAt: any; // Firestore Timestamp
  read: boolean;
  link?: string;
  type?: 'user';
}

interface AdminNotification {
    message: string;
    createdAt: any;
    read: boolean;
    link?: string;
    type?: 'admin';
}

type MergedNotification = WithId<UserNotification | AdminNotification>;

export function Notifications() {
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);
  
  const isAdmin = user?.email === 'admin@noukha.com';

  // Query for standard user notifications
  const userNotificationsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'users', user.uid, 'user_notifications'),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : null,
    [firestore, user]
  );
  
  const { data: userNotifications, isLoading: isUserLoading } = useCollection<UserNotification>(userNotificationsQuery);
  
  // Query for admin-specific notifications (only if user is an admin)
  const adminNotificationsQuery = useMemoFirebase(
      () =>
        firestore && isAdmin
        ? query(
            collection(firestore, 'admin_notifications'),
            orderBy('createdAt', 'desc'),
            limit(10)
        )
        : null,
      [firestore, isAdmin]
  );

  const { data: adminNotifications, isLoading: isAdminLoading } = useCollection<AdminNotification>(adminNotificationsQuery);

  // Merge and sort notifications
  const mergedNotifications = useMemo<MergedNotification[]>(() => {
    const userNotifsWithType: MergedNotification[] = userNotifications?.map(n => ({...n, type: 'user'})) || [];
    const adminNotifsWithType: MergedNotification[] = adminNotifications?.map(n => ({...n, type: 'admin'})) || [];
    
    return [...userNotifsWithType, ...adminNotifsWithType]
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

  }, [userNotifications, adminNotifications]);

  const unreadCount = useMemo(() => {
      return mergedNotifications.filter(n => !n.read).length;
  }, [mergedNotifications]);

  const handleMarkAsRead = async (notif: MergedNotification) => {
    if (!firestore || !user || notif.read) return;

    try {
        const collectionPath = notif.type === 'admin' ? 'admin_notifications' : `users/${user.uid}/user_notifications`;
        const notifRef = doc(firestore, collectionPath, notif.id);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };

  
  const isLoading = isUserLoading || (isAdmin && isAdminLoading);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0">
        <div className="flex flex-col">
          <div className="space-y-1.5 p-4">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Recent updates.
            </p>
          </div>
          <ScrollArea className="h-72 w-full">
            <div className="p-4 pt-0">
              {isLoading ? (
                 <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[25px_1fr] items-start">
                       <Skeleton className="h-2 w-2 rounded-full translate-y-1" />
                       <div className="grid gap-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                       </div>
                    </div>
                  ))}
                </div>
              ) : mergedNotifications && mergedNotifications.length > 0 ? (
                mergedNotifications.map((notif) => (
                  <Link 
                    key={notif.id}
                    href={notif.link ?? '#'}
                    onClick={(e) => {
                      handleMarkAsRead(notif);
                      if (!notif.link) e.preventDefault();
                      else setOpen(false);
                    }}
                    className={cn(
                        "grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 rounded-lg p-2 -mx-2 hover:bg-accent",
                        !notif.read && "bg-primary/10 hover:bg-primary/20"
                    )}
                  >
                    <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notif.read ? 'bg-primary' : 'bg-muted'}`} />
                    <div className="grid gap-1">
                       <p className="text-sm font-medium">{notif.message}</p>
                       <div className="flex items-center justify-between">
                         {notif.createdAt?.toDate && (
                           <p className="text-sm text-muted-foreground">
                             {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                           </p>
                         )}
                         {notif.link && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                         )}
                       </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

    
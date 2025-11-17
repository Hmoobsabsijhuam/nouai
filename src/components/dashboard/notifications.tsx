'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
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

interface UserNotification {
  message: string;
  createdAt: any; // Firestore Timestamp
  read: boolean;
}

export function Notifications() {
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'users', user.uid, 'user_notifications'),
            orderBy('createdAt', 'desc'),
            limit(20) // Fetch more notifications
          )
        : null,
    [firestore, user]
  );
  
  const { data: notifications, isLoading } = useCollection<UserNotification>(
    notificationsQuery
  );

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    if (open && user && firestore && notifications) {
      // When popover opens, mark all visible notifications as read for the current user
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(firestore);
      unreadNotifications.forEach(notif => {
        const notifRef = doc(firestore, 'users', user.uid, 'user_notifications', notif.id);
        batch.update(notifRef, { read: true });
      });
      batch.commit().catch(console.error);
    }
  }, [open, user, firestore, notifications]);

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
              Recent updates from the admin.
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
              ) : notifications && notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                  >
                    <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notif.read ? 'bg-primary' : 'bg-muted'}`} />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">{notif.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {notif.createdAt?.toDate && formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
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

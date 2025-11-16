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
            limit(10)
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
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Recent updates from the admin.
            </p>
          </div>
          <div className="grid gap-2">
            {isLoading ? (
              <p>Loading...</p>
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
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

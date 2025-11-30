
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { collection, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';

// User-specific notifications (private)
interface UserNotification {
  message: string;
  createdAt: any;
  read: boolean;
  link?: string;
  type: 'user';
  updatedAt?: any;
}

// Global admin announcements (public)
interface GlobalNotification {
    message: string;
    createdAt: any;
    link?: string;
    type: 'global';
    // 'read' status is handled client-side for global notifications
}

type MergedNotification = WithId<UserNotification | GlobalNotification>;

// Local storage keys
const SEEN_GLOBAL_NOTIFS_KEY = 'seenGlobalNotifIds';
const LAST_SEEN_TOAST_TIMESTAMP_KEY = 'lastSeenToastTimestamp';

function groupNotificationsByDay(notifications: MergedNotification[]): Record<string, MergedNotification[]> {
    return notifications.reduce((acc, notif) => {
        if (!notif.createdAt?.toDate) return acc;
        
        const date = notif.createdAt.toDate();
        let dayLabel: string;

        if (isToday(date)) {
            dayLabel = 'Today';
        } else if (isYesterday(date)) {
            dayLabel = 'Yesterday';
        } else {
            dayLabel = format(date, 'MMMM d, yyyy');
        }

        if (!acc[dayLabel]) {
            acc[dayLabel] = [];
        }
        acc[dayLabel].push(notif);
        return acc;
    }, {} as Record<string, MergedNotification[]>);
}

export function Notifications() {
  const { firestore, user } = useFirebase();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [seenGlobalNotifIds, setSeenGlobalNotifIds] = useState<Set<string>>(new Set());

  // Load seen global notification IDs from local storage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedIds = localStorage.getItem(SEEN_GLOBAL_NOTIFS_KEY);
        if (storedIds) {
            setSeenGlobalNotifIds(new Set(JSON.parse(storedIds)));
        }
    }
  }, []);

  // Query for user-specific notifications
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
  
  // Query for global admin announcements
  const globalNotificationsQuery = useMemoFirebase(
      () =>
        firestore
        ? query(
            collection(firestore, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        )
        : null,
      [firestore]
  );

  const { data: globalNotifications, isLoading: isGlobalLoading } = useCollection<Omit<GlobalNotification, 'type'>>(globalNotificationsQuery);

  // Effect to show toast for new global announcements
  useEffect(() => {
    if (typeof window !== 'undefined' && globalNotifications && globalNotifications.length > 0) {
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
                        action: notif.link ? (
                            <Link href={notif.link}>
                                <Button variant="outline">View</Button>
                            </Link>
                        ) : undefined,
                    });
                }
            }
        });

        if (newestNotifDate && newestNotifDate > lastSeenDate) {
            localStorage.setItem(LAST_SEEN_TOAST_TIMESTAMP_KEY, JSON.stringify(newestNotifDate.toISOString()));
        }
    }
  }, [globalNotifications, toast]);

  // Merge notifications and apply client-side 'read' status for global ones
  const mergedNotifications = useMemo<MergedNotification[]>(() => {
    const userNotifs: MergedNotification[] = userNotifications?.map(n => ({...n, type: 'user'})) || [];
    
    const globalNotifs: MergedNotification[] = globalNotifications?.map(n => ({
        ...n,
        type: 'global',
        read: seenGlobalNotifIds.has(n.id) // Synthetic 'read' property
    })) || [];
    
    return [...userNotifs, ...globalNotifs]
        .sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));

  }, [userNotifications, globalNotifications, seenGlobalNotifIds]);

  const groupedNotifications = useMemo(() => groupNotificationsByDay(mergedNotifications), [mergedNotifications]);
  const notificationGroups = Object.entries(groupedNotifications);

  const unreadCount = useMemo(() => {
      return mergedNotifications.filter(n => !n.read).length;
  }, [mergedNotifications]);

  const handleMarkAsRead = async (notif: MergedNotification) => {
    if (notif.read) return;

    if (notif.type === 'global') {
        const newSeenIds = new Set(seenGlobalNotifIds).add(notif.id);
        setSeenGlobalNotifIds(newSeenIds);
        localStorage.setItem(SEEN_GLOBAL_NOTIFS_KEY, JSON.stringify(Array.from(newSeenIds)));
    } else if (notif.type === 'user' && firestore && user) {
        try {
            const notifRef = doc(firestore, 'users', user.uid, 'user_notifications', notif.id);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Failed to mark user notification as read:", error);
        }
    }
  };
  
  const isLoading = isUserLoading || isGlobalLoading;

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
          <ScrollArea className="h-96 w-full">
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
              ) : notificationGroups.length > 0 ? (
                  <div className="space-y-4">
                    {notificationGroups.map(([day, notifs]) => (
                        <div key={day}>
                           <div className="relative my-2">
                              <Separator />
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-popover">
                                  <span className="text-xs font-medium text-muted-foreground">{day}</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                            {notifs.map(notif => (
                               <Link 
                                key={notif.id}
                                href={notif.link ?? '#'}
                                onClick={(e) => {
                                    handleMarkAsRead(notif);
                                    if (!notif.link) e.preventDefault();
                                    else setOpen(false);
                                }}
                                className={cn(
                                    "block rounded-lg p-3 -mx-2 hover:bg-accent",
                                    !notif.read && "bg-primary/10 hover:bg-primary/20"
                                )}
                                >
                                <div className="grid grid-cols-[15px_1fr_auto] items-start gap-3">
                                    <span className={cn("flex h-2 w-2 translate-y-1.5 rounded-full", !notif.read ? 'bg-primary' : 'bg-muted')} />
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-tight">{notif.message}</p>
                                        {(notif.createdAt?.toDate) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    {formatDistanceToNow(notif.updatedAt?.toDate() || notif.createdAt.toDate(), { addSuffix: true })}
                                                </span>
                                                <span>
                                                    · {format(notif.updatedAt?.toDate() || notif.createdAt.toDate(), 'dd/MM/yyyy')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {notif.link && <ExternalLink className="h-4 w-4 text-muted-foreground justify-self-end" />}
                                </div>
                               </Link>
                            ))}
                           </div>
                        </div>
                    ))}
                  </div>
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

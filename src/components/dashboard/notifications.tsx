
'use client';

import { useState, useMemo } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
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
import { useNotifications } from '@/context/notifications-context';
import { MergedNotification } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';

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
  const [open, setOpen] = useState(false);
  const {
      isLoading,
      mergedNotifications,
      unreadNotifications,
      handleMarkAsRead
  } = useNotifications();

  const unreadCount = unreadNotifications.length;

  const groupedNotifications = useMemo(() => groupNotificationsByDay(mergedNotifications), [mergedNotifications]);
  const notificationGroups = Object.entries(groupedNotifications);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0">
        <div className="flex flex-col">
          <div className="space-y-1.5 p-4">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread messages.
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

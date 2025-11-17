'use client';

import { useState, useMemo } from 'react';
import { collection, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Send, CalendarIcon, MessageSquare, Clock } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { UserListDialog } from './user-list-dialog';

interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

interface NotificationData {
  message: string;
  createdAt: Timestamp;
}

type ChartDataItem = {
  date: string;
  count: number;
  users: WithId<UserData>[];
};

function RecentUsersTable({ users, isLoading }: { users: WithId<UserData>[] | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent user data.</p>;
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.photoURL ?? undefined} />
            <AvatarFallback>{user.displayName?.charAt(0) ?? user.email.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium truncate">{user.displayName || 'N/A'}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          {user.createdAt && (
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(user.createdAt.toDate(), { addSuffix: true })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}


function NotificationHistory({ notifications, isLoading }: { notifications: WithId<NotificationData>[] | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No notifications sent yet.</p>;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => (
        <div key={notif.id} className="flex flex-col gap-1 border-l-2 pl-3">
          <p className="text-sm font-medium leading-snug">{notif.message}</p>
          <p className="text-xs text-muted-foreground">
            {format(notif.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      ))}
    </div>
  );
}


export default function AdminDashboard({ user }: { user: any }) {
  const { firestore } = useFirebase();
  const [selectedDay, setSelectedDay] = useState<ChartDataItem | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading: isUsersLoading } = useCollection<UserData>(usersCollection);
  
  const recentUsersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5)) : null),
    [firestore]
  );
  const { data: recentUsers, isLoading: isRecentUsersLoading } = useCollection<UserData>(recentUsersQuery);
  
  const notificationsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(3)) : null),
    [firestore]
  );
  const { data: notifications, isLoading: isNotificationsLoading } = useCollection<NotificationData>(notificationsQuery);


  const { chartData, totalUsers } = useMemo(() => {
    if (!users) return { chartData: [], totalUsers: 0 };

    const groupedByDay = users.reduce((acc, user) => {
      if (user.createdAt) {
        const date = format(user.createdAt.toDate(), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(user);
      }
      return acc;
    }, {} as Record<string, WithId<UserData>[]>);

    const chartData = Object.entries(groupedByDay)
      .map(([date, usersOnDay]) => ({
        date,
        count: usersOnDay.length,
        users: usersOnDay,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { chartData, totalUsers: users.length };
  }, [users]);

  const handleBarClick = (data: ChartDataItem) => {
    setSelectedDay(data);
  };

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-muted-foreground">Welcome, {user.email}!</p>
      
      {/* Top Cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registered Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              Total number of users in the system.
            </p>
             <Button size="sm" onClick={() => setIsUserListOpen(true)} disabled={isUsersLoading}>
              View All Users
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Send Notifications
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground mb-4">
              Broadcast a message to all users.
            </p>
            <Button asChild>
              <Link href="/notifications">Send a notification</Link>
            </Button>
          </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Registrations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <RecentUsersTable users={recentUsers} isLoading={isRecentUsersLoading} />
            </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Daily User Registrations
                </CardTitle>
                <CardDescription>
                    Click on a bar to see the users registered on that day.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {isUsersLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        onClick={(e) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                        cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                        content={({ active, payload, label }) =>
                            active && payload && payload.length ? (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-bold">{`${format(new Date(label), 'eeee, MMM d')}`}</p>
                                <p className="text-sm text-muted-foreground">{`${payload[0].value} users`}</p>
                            </div>
                            ) : null
                        }
                        />
                        <Bar dataKey="count" name="New Users" unit=" users">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="hsl(var(--primary))" className="cursor-pointer" />
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No user registration data yet.</p>
                    </div>
                )}
                </CardContent>
            </Card>
          </div>

        <div className="space-y-6 lg:space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Notification History
                    </CardTitle>
                    <CardDescription>The last 3 notifications sent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationHistory notifications={notifications} isLoading={isNotificationsLoading} />
                </CardContent>
            </Card>
        </div>
      </div>
      

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Users Registered on {selectedDay ? format(new Date(selectedDay.date), 'MMMM d, yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedDay?.count} user(s) registered on this day.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDay?.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName || ''} />
                        <AvatarFallback>
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{u.displayName || 'N/A'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      <UserListDialog 
          isOpen={isUserListOpen} 
          onOpenChange={setIsUserListOpen}
          users={users}
          isLoading={isUsersLoading}
        />
    </div>
  );
}

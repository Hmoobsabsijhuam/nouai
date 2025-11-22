'use client';

import { useState, useMemo, FormEvent } from 'react';
import { collection, Timestamp, query, orderBy, limit, updateDoc, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Send, CalendarIcon, MessageSquare, Clock, LifeBuoy, Loader2, Bell, CreditCard } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { UserListDialog } from './user-list-dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
  credits?: number;
}

interface SupportTicket {
    userId: string;
    userEmail: string;
    subject: string;
    message: string;
    status: 'open' | 'closed';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface AdminNotification {
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
    link?: string;
    paymentStatus: 'pending' | 'paid' | 'rejected';
}

type UserChartDataItem = {
  date: string;
  count: number;
  users: WithId<UserData>[];
};

type CreditChartDataItem = {
    date: string;
    credits: number;
    revenue: number;
};

const creditPricing: { [key: number]: number } = {
  100: 5,
  500: 20,
  1000: 35,
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
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.displayName || 'N/A'}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          {user.createdAt && (
            <p className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
              {formatDistanceToNow(user.createdAt.toDate(), { addSuffix: true })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function SupportTickets({ tickets, isLoading, onTicketSelect }: { tickets: WithId<SupportTicket>[] | null; isLoading: boolean, onTicketSelect: (ticket: WithId<SupportTicket>) => void; }) {

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

  if (!tickets || tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No open support tickets.</p>;
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <button key={ticket.id} onClick={() => onTicketSelect(ticket)} className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border">
            <div className="flex justify-between items-start">
                 <p className="font-medium truncate pr-4">{ticket.subject}</p>
                 <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{ticket.userEmail}</p>
        </button>
      ))}
    </div>
  );
}


function TicketDetailsDialog({
  ticket,
  onOpenChange,
  onStatusChange,
}: {
  ticket: WithId<SupportTicket> | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (ticketId: string, status: 'open' | 'closed') => void;
}) {

  return (
    <Dialog open={!!ticket} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket?.subject}</DialogTitle>
          <DialogDescription>
            From: {ticket?.userEmail} | Status:
            <Select
              value={ticket?.status}
              onValueChange={(value: 'open' | 'closed') => ticket && onStatusChange(ticket.id, value)}
            >
              <SelectTrigger className="inline-flex w-auto h-auto p-1 text-xs ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64">
            <div className="py-4 space-y-2">
                <p className="text-sm text-muted-foreground">Message:</p>
                <p className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">{ticket?.message}</p>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


export default function AdminDashboard({ user }: { user: any }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<UserChartDataItem | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<WithId<SupportTicket> | null>(null);
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
  
  const supportTicketsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'support_tickets'), orderBy('updatedAt', 'desc')) : null),
    [firestore]
  );
  const { data: supportTickets, isLoading: isTicketsLoading } = useCollection<SupportTicket>(supportTicketsQuery);

  const adminNotificationsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(100)) : null),
    [firestore]
  );
  const { data: adminNotifications, isLoading: isAdminNotifsLoading } = useCollection<AdminNotification>(adminNotificationsQuery);


  const { userChartData, totalUsers } = useMemo(() => {
    if (!users) return { userChartData: [], totalUsers: 0 };

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

    const userChartData = Object.entries(groupedByDay)
      .map(([date, usersOnDay]) => ({
        date,
        count: usersOnDay.length,
        users: usersOnDay,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { userChartData, totalUsers: users.length };
  }, [users]);
  
  const creditChartData = useMemo(() => {
    if (!adminNotifications) return [];
    
    const purchases = adminNotifications.filter(n => n.paymentStatus === 'paid' && n.message.includes('purchased'));

    const groupedByDay = purchases.reduce((acc, notif) => {
        const date = format(notif.createdAt.toDate(), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = { credits: 0, revenue: 0 };
        }
        
        const creditAmountMatch = notif.message.match(/(\d+)\s*credits/);
        const credits = creditAmountMatch ? parseInt(creditAmountMatch[1], 10) : 0;
        
        const priceMatch = notif.message.match(/\$(\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;

        if (credits > 0) {
            acc[date].credits += credits;
            acc[date].revenue += price;
        }

        return acc;
    }, {} as Record<string, { credits: number, revenue: number }>);

     return Object.entries(groupedByDay)
      .map(([date, data]) => ({
        date,
        credits: data.credits,
        revenue: data.revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [adminNotifications]);

  const handleBarClick = (data: UserChartDataItem) => {
    setSelectedDay(data);
  };
  
  const openSupportTickets = useMemo(() => {
    return supportTickets?.filter(t => t.status === 'open') ?? [];
  }, [supportTickets]);

  const handleTicketStatusChange = async (ticketId: string, status: 'open' | 'closed') => {
    if (!firestore) return;
    try {
        const ticketRef = doc(firestore, 'support_tickets', ticketId);
        await updateDoc(ticketRef, { status, updatedAt: serverTimestamp() });
        toast({
            title: 'Ticket Updated',
            description: `Ticket status changed to ${status}.`
        });
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket(prev => prev ? {...prev, status} : null);
        }
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to update ticket status.',
            variant: 'destructive',
        });
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore) return;
    try {
      const notifRef = doc(firestore, 'admin_notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadAdminNotifications = useMemo(() => {
      return adminNotifications?.filter(n => !n.read) ?? [];
  }, [adminNotifications]);


  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Admin Control Panel
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
                    Send Notification
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                    Broadcast a message to all users.
                </p>
                <Button asChild size="sm">
                    <Link href="/notifications">
                        <Send className="mr-2 h-4 w-4" /> Go to Notifications
                    </Link>
                </Button>
            </CardContent>
        </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Support Tickets
            </CardTitle>
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isTicketsLoading ? (
                 <Skeleton className="h-8 w-1/4" />
            ) : (
                <div className="text-2xl font-bold">{openSupportTickets.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              New issues reported by users.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                ) : userChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={userChartData}
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
                        {userChartData.map((entry, index) => (
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Daily Credit Purchases
                    </CardTitle>
                    <CardDescription>
                        Total credits sold and revenue generated per day.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isAdminNotifsLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : creditChartData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={creditChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                                />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const revenueValue = payload[1].value;
                                            const displayRevenue = typeof revenueValue === 'number' ? revenueValue.toFixed(2) : Number(revenueValue).toFixed(2);
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <p className="font-bold">{`${format(new Date(label), 'eeee, MMM d')}`}</p>
                                                    <p className="text-sm" style={{ color: '#8884d8' }}>Credits: {payload[0].value}</p>
                                                    <p className="text-sm" style={{ color: '#82ca9d' }}>Revenue: ${displayRevenue}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="credits" fill="#8884d8" name="Credits Sold" />
                                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex h-[300px] items-center justify-center">
                            <p className="text-muted-foreground">No credit purchase data yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

        <div className="space-y-6 lg:space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Registrations</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <RecentUsersTable users={recentUsers} isLoading={isRecentUsersLoading} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Credit Purchase Alerts
                        </CardTitle>
                    </div>
                    <CardDescription>Recent credit refills by users.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isAdminNotifsLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : adminNotifications && adminNotifications.length > 0 ? (
                        <ScrollArea className="h-48">
                            <div className="space-y-2 pr-4">
                                {adminNotifications.filter(n => n.paymentStatus === 'paid').map(notif => (
                                    <Link href={`/admin/payments/${notif.id}`} key={notif.id} onClick={() => !notif.read && handleMarkAsRead(notif.id)} className={cn("block p-3 rounded-lg hover:bg-accent transition-colors border", !notif.read && "border-primary bg-primary/10")}>
                                        <p className="font-medium text-sm">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}</p>
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground">No new credit purchases.</p>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LifeBuoy className="h-5 w-5" />
                        Open Support Tickets
                    </CardTitle>
                    <CardDescription>The most recent open tickets.</CardDescription>
                </Header>
                <CardContent>
                    <SupportTickets tickets={openSupportTickets} isLoading={isTicketsLoading} onTicketSelect={setSelectedTicket}/>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <UserListDialog 
          isOpen={isUserListOpen} 
          onOpenChange={setIsUserListOpen}
          users={users}
          isLoading={isUsersLoading}
      />
      <TicketDetailsDialog
        ticket={selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
        onStatusChange={handleTicketStatusChange}
      />
    </div>
  );
}

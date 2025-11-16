'use client';

import { useState, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
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
import { Users, Send, CalendarIcon } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { UserListDialog } from './user-list-dialog';

interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

type ChartDataItem = {
  date: string;
  count: number;
  users: WithId<UserData>[];
};

export default function AdminDashboard({ user }: { user: any }) {
  const { firestore } = useFirebase();
  const [selectedDay, setSelectedDay] = useState<ChartDataItem | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<UserData>(usersCollection);

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registered Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              Total number of users in the system.
            </p>
             <Button size="sm" onClick={() => setIsUserListOpen(true)} disabled={isLoading}>
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
      </div>

       <Card className="mb-6">
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
          {isLoading ? (
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
          isLoading={isLoading}
        />
    </div>
  );
}

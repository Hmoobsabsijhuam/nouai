'use client';

import { collection } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Send } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
}

export default function AdminDashboard({ user }: { user: any }) {
  const { firestore } = useFirebase();

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<UserData>(usersCollection);

  const userCount = users ? users.length : 0;

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
              <div className="text-2xl font-bold">{userCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total number of users in the system.
            </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : users && users.length > 0 ? (
                users.map((u: WithId<UserData>) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={u.photoURL} alt={u.displayName || ''} />
                        <AvatarFallback>
                           {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{u.displayName || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>
                      {u.email === 'admin@noukha.com' ? (
                        <Badge>Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { collection, getFirestore } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useFirebase } from '@/firebase';

export default function AdminDashboard({ user }: { user: any }) {
  const { firestore } = useFirebase();

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection(usersCollection);

  const userCount = users ? users.length : 0;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-muted-foreground">Welcome, {user.email}!</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registered Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <div className="text-2xl font-bold">{userCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total number of users in the system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { WithId } from '@/firebase/firestore/use-collection';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

interface UserListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users: WithId<UserData>[] | null;
  isLoading: boolean;
}

export function UserListDialog({ isOpen, onOpenChange, users, isLoading }: UserListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>All Registered Users</DialogTitle>
          <DialogDescription>A complete list of all users in the system.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : users && users.length > 0 ? (
                users.map((u: WithId<UserData>) => (
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
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      {u.createdAt ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

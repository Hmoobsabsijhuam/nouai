'use client';

import { useState } from 'react';
import { WithId } from '@/firebase/firestore/use-collection';
import { Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useFirebase } from '@/firebase';
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
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<WithId<UserData> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
    onOpenChange(false);
  };

  const handleDeleteConfirm = (user: WithId<UserData>) => {
    setUserToDelete(user);
  };

  const handleDelete = async () => {
    if (!userToDelete || !firestore) return;

    setIsDeleting(true);
    try {
      const userDocRef = doc(firestore, 'users', userToDelete.id);
      await deleteDoc(userDocRef);

      // Note: This only deletes the Firestore document.
      // Deleting the Firebase Auth user requires admin privileges and a backend function.
      // The user will no longer appear in the app, but their auth record still exists.

      toast({
        title: 'User Deleted',
        description: `${userToDelete.email} has been removed from the system.`,
      });
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>All Registered Users</DialogTitle>
          <DialogDescription>A complete list of all users in the system.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sm:w-[80px]">Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    <TableCell className="space-x-2">
                        <Skeleton className="h-8 w-8 inline-block" />
                        <Skeleton className="h-8 w-8 inline-block" />
                    </TableCell>
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
                    <TableCell className="font-medium truncate max-w-xs">{u.displayName || 'N/A'}</TableCell>
                    <TableCell className="truncate max-w-xs">{u.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {u.createdAt ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {u.email === 'admin@noukha.com' ? (
                        <Badge>Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(u.id)} className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit User</span>
                            </Button>
                            {u.email !== 'admin@noukha.com' && (
                               <Button variant="destructive" size="icon" onClick={() => handleDeleteConfirm(u)} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete User</span>
                                </Button>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user record for <span className="font-semibold">{userToDelete?.email}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

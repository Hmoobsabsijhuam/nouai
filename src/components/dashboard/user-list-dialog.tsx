'use client';

import { useState } from 'react';
import { WithId } from '@/firebase/firestore/use-collection';
import { Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useFirebase } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Edit, Trash2, Coins, Loader2 } from 'lucide-react';
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
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
  credits?: number;
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
  const [userToEditCredits, setUserToEditCredits] = useState<WithId<UserData> | null>(null);
  const [newCreditAmount, setNewCreditAmount] = useState<number>(0);
  const [isCreditSaving, setIsCreditSaving] = useState(false);

  const handleEditProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
    onOpenChange(false);
  };

  const handleDeleteConfirm = (user: WithId<UserData>) => {
    setUserToDelete(user);
  };

  const handleEditCredits = (user: WithId<UserData>) => {
    setUserToEditCredits(user);
    setNewCreditAmount(user.credits ?? 0);
  };

  const handleSaveCredits = async () => {
    if (!userToEditCredits || !firestore) return;

    setIsCreditSaving(true);
    try {
        const userRef = doc(firestore, 'users', userToEditCredits.id);
        await updateDoc(userRef, { credits: Number(newCreditAmount) });
        toast({
            title: 'Credits Updated',
            description: `${userToEditCredits.email}'s balance is now ${newCreditAmount}.`
        });
        setUserToEditCredits(null);
    } catch (error) {
        console.error("Error updating credits:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update credits.'
        });
    } finally {
        setIsCreditSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!userToDelete || !firestore) return;

    setIsDeleting(true);
    try {
      const userDocRef = doc(firestore, 'users', userToDelete.id);
      await deleteDoc(userDocRef);
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
      <DialogContent className="max-w-5xl w-full">
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
                <TableHead>Credits</TableHead>
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
                     <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
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
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <Coins className="h-4 w-4 text-yellow-500" />
                            <span>{u.credits ?? 0}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditCredits(u)}>
                                <Edit className="h-3 w-3" />
                            </Button>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditProfile(u.id)} className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Profile</span>
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

     <Dialog open={!!userToEditCredits} onOpenChange={() => setUserToEditCredits(null)}>
        <DialogContent className="max-w-sm">
            <DialogHeader>
                <DialogTitle>Edit Credits</DialogTitle>
                <DialogDescription>
                    Update the credit balance for {userToEditCredits?.email}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="credits-amount" className="text-right">
                        Credits
                    </Label>
                    <Input
                        id="credits-amount"
                        type="number"
                        value={newCreditAmount}
                        onChange={(e) => setNewCreditAmount(Number(e.target.value))}
                        className="col-span-3"
                    />
                </div>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setUserToEditCredits(null)}>Cancel</Button>
                <Button onClick={handleSaveCredits} disabled={isCreditSaving}>
                    {isCreditSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
    </>
  );
}

'use client';

import { LogOut, User as UserIcon, Settings, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { UserListDialog } from './user-list-dialog';


interface UserData {
  email: string;
  id: string;
  displayName: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

export function UserNav() {
  const { user, auth, firestore } = useFirebase();
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const usersCollection = useMemoFirebase(
    () => (firestore && user?.email === 'admin@noukha.com' ? collection(firestore, 'users') : null),
    [firestore, user]
  );
  
  const { data: users, isLoading: usersLoading } = useCollection<UserData>(usersCollection);

  const handleLogout = async () => {
    if(auth) {
      await signOut(auth);
    }
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.email === 'admin@noukha.com';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? user.email ?? ''} />
              <AvatarFallback>
                {user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : user.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName || 'My Account'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => setIsUserListOpen(true)} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>View Users</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && (
        <UserListDialog 
          isOpen={isUserListOpen} 
          onOpenChange={setIsUserListOpen}
          users={users}
          isLoading={usersLoading}
        />
      )}
    </>
  );
}

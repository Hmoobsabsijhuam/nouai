'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { UserNav } from './user-nav';
import { Notifications } from './notifications';
import { Home, Search, MoreVertical, LifeBuoy, HelpCircle, Settings, Image as ImageIcon, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold">Nou AI</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
           <Link href="/" passHref>
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          <Notifications />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}

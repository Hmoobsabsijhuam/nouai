'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { UserNav } from './user-nav';
import { Notifications } from './notifications';
import { Home, Search, MoreVertical, LifeBuoy, HelpCircle, Settings, Image as ImageIcon, Video, Mic, PanelLeft } from 'lucide-react';
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
import { SidebarTrigger } from '../ui/sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <Link href="/" className="hidden items-center gap-2 md:flex">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold">Nou AI</span>
        </Link>
      </div>

      <div className="flex flex-1 justify-center px-4">
        {/* Placeholder for a centered search bar if needed later */}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Notifications />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}

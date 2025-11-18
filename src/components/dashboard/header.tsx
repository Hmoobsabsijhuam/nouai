'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { UserNav } from './user-nav';
import { Notifications } from './notifications';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { SidebarTrigger } from '../ui/sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex flex-1 items-center gap-2">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <Link href="/" className="hidden items-center gap-2 md:flex">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold">Nou AI</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Notifications />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}

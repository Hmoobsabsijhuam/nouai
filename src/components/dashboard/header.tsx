import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { UserNav } from './user-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold">SecureLogin</span>
        </Link>
        <UserNav />
      </div>
    </header>
  );
}

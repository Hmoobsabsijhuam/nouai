'use client';

import { AuthProvider } from '@/context/auth-context';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseClientProvider>
        <AuthProvider>{children}</AuthProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}

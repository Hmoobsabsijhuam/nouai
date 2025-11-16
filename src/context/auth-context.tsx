'use client';

import type { ReactNode } from 'react';
import { useFirebase, UserHookResult } from '@/firebase';
import { createContext, useContext } from 'react';

const AuthContext = createContext<UserHookResult | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const userHook = useFirebase();

  return (
    <AuthContext.Provider value={{ user: userHook.user, isUserLoading: userHook.isUserLoading, userError: userHook.userError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

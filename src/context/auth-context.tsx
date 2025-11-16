'use client';

import type { ReactNode } from 'react';
import { useFirebase, UserHookResult } from '@/firebase';
import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { User } from 'firebase/auth';

// Extend the context to include a function to update the user
interface AuthContextType extends UserHookResult {
  updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading, userError, setUser } = useFirebase();

  // The function that will be exposed to update the user state
  const updateUser = (newUser: User | null) => {
    if (setUser) {
      setUser(newUser);
    }
  };

  const contextValue = {
    user,
    isUserLoading,
    userError,
    updateUser, // Provide the updater function
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

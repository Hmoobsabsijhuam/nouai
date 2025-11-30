
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useNotifications as useOriginalNotifications, MergedNotification } from '@/hooks/use-notifications';

interface NotificationsContextType {
  isLoading: boolean;
  mergedNotifications: MergedNotification[];
  unreadNotifications: MergedNotification[];
  handleMarkAsRead: (notification: MergedNotification) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const notifications = useOriginalNotifications();
  return (
    <NotificationsContext.Provider value={notifications}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/types';
import { memoryStore } from '@/lib/firebase/db';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const list = memoryStore.getNotifications(user.id);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = memoryStore.subscribe(() => {
      loadNotifications();
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    memoryStore.markNotificationRead(id);
    loadNotifications();
  };

  const markAllAsRead = () => {
    if (user) {
      memoryStore.markAllNotificationsRead(user.id);
      loadNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

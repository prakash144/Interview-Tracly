"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { NotificationItem, NotificationCategory } from "@/lib/notifications/types";
import { MAX_STORED_NOTIFICATIONS, NOTIFICATIONS_STORAGE_KEY } from "@/lib/notifications/types";
import { onNotification, onDndChange, getDnd, setDnd as serviceSetDnd } from "@/lib/notifications/service";

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  recentUnread: NotificationItem[];
  dnd: boolean;
  setDnd: (dnd: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  clearCategory: (category: NotificationCategory) => void;
  getByCategory: (category: NotificationCategory) => NotificationItem[];
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function loadHistory(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: NotificationItem[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dnd, setDndState] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      setNotifications(loadHistory());
      setDndState(getDnd());
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    const unsub = onNotification((item) => {
      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
        saveHistory(next);
        return next;
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onDndChange((val) => setDndState(val));
    return unsub;
  }, []);

  const setDnd = useCallback((val: boolean) => {
    serviceSetDnd(val);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveHistory(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveHistory(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveHistory([]);
  }, []);

  const clearCategory = useCallback((category: NotificationCategory) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.category !== category);
      saveHistory(next);
      return next;
    });
  }, []);

  const getByCategory = useCallback((category: NotificationCategory) => {
    return notifications.filter((n) => n.category === category);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentUnread = notifications.filter((n) => !n.read).slice(0, 5);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        recentUnread,
        dnd,
        setDnd,
        markRead,
        markAllRead,
        clearAll,
        clearCategory,
        getByCategory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
  return ctx;
}

export type NotificationType = "success" | "error" | "info" | "warning";

export type NotificationCategory = "activity" | "reminder" | "achievement" | "system";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  action?: NotificationAction;
  secondaryAction?: NotificationAction;
  persistent?: boolean;
  source?: string;
}

export interface NotificationOptions {
  id?: string;
  description?: string;
  duration?: number;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  action?: NotificationAction;
  secondaryAction?: NotificationAction;
  persistent?: boolean;
  source?: string;
  important?: boolean;
}

export const NOTIFICATIONS_STORAGE_KEY = "interview-tracly-notifications";
export const MAX_STORED_NOTIFICATIONS = 100;
export const DEFAULT_DURATION = 4000;
export const UNDO_DURATION = 6000;
export const PERSISTENT_DURATION = 120000;

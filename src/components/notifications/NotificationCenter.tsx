"use client";

import { useState, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Activity,
  AlarmClock,
  Trophy,
  Settings2,
  Trash2,
  CheckCheck,
  ExternalLink,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNotificationContext } from "@/contexts/NotificationContext";
import type { NotificationItem, NotificationCategory } from "@/lib/notifications/types";

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  activity: "Activity",
  reminder: "Reminders",
  achievement: "Achievements",
  system: "System",
};

const TYPE_ICONS: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
};

function NotificationItemCard({
  item,
  onMarkRead,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const TypeIcon = TYPE_ICONS[item.type] || Info;
  const color = TYPE_COLORS[item.type] || "text-muted-foreground";

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        item.read ? "opacity-60 hover:opacity-80" : "bg-accent/30 hover:bg-accent/50"
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${item.read ? "text-muted-foreground/50" : color}`}>
        <TypeIcon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs leading-snug ${item.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
            {item.title}
          </p>
          {!item.read && (
            <button
              onClick={() => onMarkRead(item.id)}
              className="shrink-0 size-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Mark as read"
            >
              <CheckCheck className="size-3" />
            </button>
          )}
        </div>
        {item.description && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/40">
            {formatTimestamp(item.timestamp)}
          </span>
          {item.action && (
            <button
              onClick={item.action.onClick}
              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
            >
              {item.action.label} <ExternalLink className="size-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const { unreadCount, dnd } = useNotificationContext();

  return (
    <div className="relative">
      <Bell className="size-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      {dnd && (
        <span className="absolute -bottom-1 -right-1.5 size-2.5 rounded-full bg-muted-foreground/50 ring-1 ring-background" />
      )}
    </div>
  );
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    dnd,
    setDnd,
    markRead,
    markAllRead,
    clearAll,
    clearCategory,
  } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<NotificationCategory | "all">("all");
  const [open, setOpen] = useState(false);

  const tabs: { id: typeof activeTab; label: string; icon: typeof Activity }[] = [
    { id: "all", label: "All", icon: Bell },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "reminder", label: "Reminders", icon: AlarmClock },
    { id: "achievement", label: "Achievements", icon: Trophy },
    { id: "system", label: "System", icon: Settings2 },
  ];

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.category === activeTab);
  }, [notifications, activeTab]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
        >
          <NotificationBell />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDnd(!dnd)}
                className={`size-7 flex items-center justify-center rounded-md text-xs transition-colors ${
                  dnd ? "bg-muted-foreground/15 text-muted-foreground" : "hover:bg-accent text-muted-foreground/50"
                }`}
                title={dnd ? "Do Not Disturb is on" : "Enable Do Not Disturb"}
              >
                <Timer className={`size-3.5 ${dnd ? "text-warning" : ""}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="size-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground/50 hover:text-foreground"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3.5" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="size-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive"
                title="Clear all"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          {dnd && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 mt-2 rounded-lg bg-warning/10 border border-warning/20 text-[11px] text-warning">
              <Zap className="size-3" />
              Do Not Disturb is active — notifications are suppressed
            </div>
          )}
        </SheetHeader>

        <div className="flex gap-1 px-4 py-3 border-b border-border overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const count = tab.id === "all" ? unreadCount : notifications.filter((n) => n.category === tab.id && !n.read).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent border border-transparent"
                }`}
              >
                <TabIcon className="size-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className="size-4 rounded-full bg-destructive/10 text-destructive text-[9px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ScrollArea className="flex-1 px-3 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="size-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/50">No notifications</p>
              <p className="text-xs text-muted-foreground/30 mt-1">
                {activeTab === "all" ? "Your notifications will appear here" : `No ${CATEGORY_LABELS[activeTab as NotificationCategory].toLowerCase()} yet`}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((item) => (
                <NotificationItemCard key={item.id} item={item} onMarkRead={markRead} />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/40">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </span>
            {activeTab !== "all" && (
              <button
                onClick={() => clearCategory(activeTab as NotificationCategory)}
                className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                Clear {CATEGORY_LABELS[activeTab as NotificationCategory]}
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

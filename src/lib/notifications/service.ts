import { toast } from "sonner";
import type { NotificationItem, NotificationType, NotificationOptions } from "./types";
import { DEFAULT_DURATION, UNDO_DURATION, PERSISTENT_DURATION } from "./types";

let counter = 0;
function generateId(): string {
  counter += 1;
  return `n_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 6)}`;
}

let historyListeners: Array<(item: NotificationItem) => void> = [];
let dndListeners: Array<(dnd: boolean) => void> = [];
let isDnd = false;

export function onNotification(cb: (item: NotificationItem) => void) {
  historyListeners.push(cb);
  return () => { historyListeners = historyListeners.filter((l) => l !== cb); };
}

export function onDndChange(cb: (dnd: boolean) => void) {
  dndListeners.push(cb);
  return () => { dndListeners = dndListeners.filter((l) => l !== cb); };
}

export function setDnd(dnd: boolean) {
  isDnd = dnd;
  dndListeners.forEach((cb) => cb(dnd));
}

export function getDnd(): boolean {
  return isDnd;
}

function emitHistory(item: NotificationItem) {
  historyListeners.forEach((cb) => cb(item));
}

function buildItem(
  title: string,
  type: NotificationType,
  opts?: NotificationOptions
): NotificationItem {
  const id = opts?.id || generateId();
  return {
    id,
    title,
    description: opts?.description,
    type,
    category: opts?.category || "activity",
    priority: opts?.priority || "normal",
    timestamp: Date.now(),
    read: false,
    action: opts?.action,
    secondaryAction: opts?.secondaryAction,
    persistent: opts?.persistent,
    source: opts?.source,
  };
}

function getDuration(opts?: NotificationOptions): number | undefined {
  if (opts?.persistent) return PERSISTENT_DURATION;
  if (opts?.duration) return opts.duration;
  if (opts?.action) return UNDO_DURATION;
  return DEFAULT_DURATION;
}

function showToast(
  title: string,
  type: NotificationType,
  opts?: NotificationOptions
) {
  if (isDnd && !opts?.important) return;

  const item = buildItem(title, type, opts);
  emitHistory(item);

  const duration = getDuration(opts);

  const toastProps: Record<string, unknown> = {
    id: item.id,
    duration,
    description: opts?.description,
  };

  if (opts?.action) {
    (toastProps as { action: { label: string; onClick: () => void } }).action = {
      label: opts.action.label,
      onClick: opts.action.onClick,
    };
  }

  if (opts?.secondaryAction) {
    (toastProps as Record<string, unknown>).cancel = {
      label: opts.secondaryAction.label,
      onClick: opts.secondaryAction.onClick,
    };
  }

  switch (type) {
    case "success":
      toast.success(title, toastProps);
      break;
    case "error":
      toast.error(title, toastProps);
      break;
    case "info":
      toast.info(title, toastProps);
      break;
    case "warning":
      toast.warning(title, toastProps);
      break;
  }
}

export const notify = {
  success(title: string, opts?: NotificationOptions) {
    showToast(title, "success", opts);
  },

  error(title: string, opts?: NotificationOptions) {
    showToast(title, "error", opts);
  },

  info(title: string, opts?: NotificationOptions) {
    showToast(title, "info", opts);
  },

  warning(title: string, opts?: NotificationOptions) {
    showToast(title, "warning", opts);
  },

  undo(
    title: string,
    onUndo: () => void,
    opts?: NotificationOptions
  ) {
    showToast(title, "info", {
      ...opts,
      duration: UNDO_DURATION,
      action: { label: "Undo", onClick: onUndo },
      category: opts?.category || "system",
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
    opts?: NotificationOptions
  ) {
    if (isDnd && !opts?.important) return promise;

    const loadingId = generateId();
    toast.loading(messages.loading, { id: loadingId });

    return promise
      .then((result) => {
        toast.dismiss(loadingId);
        showToast(messages.success, "success", opts);
        return result;
      })
      .catch((err) => {
        toast.dismiss(loadingId);
        showToast(messages.error, "error", { ...opts, description: err?.message });
        throw err;
      });
  },

  dismiss(id: string) {
    toast.dismiss(id);
  },

  dismissAll() {
    toast.dismiss();
  },
};

"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning";
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
}: ConfirmDialogProps) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const isDestructive = variant === "destructive";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full mx-4 p-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              isDestructive ? "bg-destructive/10" : "bg-warning/10"
            }`}
          >
            <AlertTriangle
              className={`size-5 ${isDestructive ? "text-destructive" : "text-warning"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="text-sm font-semibold text-foreground">
              {title}
            </h3>
            <p id="confirm-message" className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={() => { onConfirm(); onOpenChange(false); }}
            className={`h-8 text-xs ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                : "bg-warning text-white hover:bg-warning/80"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

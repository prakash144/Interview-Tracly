"use client";

import { useState, useEffect, useRef } from "react";
import { Briefcase, CheckCircle2, Play, Archive, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewCompleteDialogProps {
  open: boolean;
  company?: string;
  role?: string;
  suspendedSprintName?: string;
  onResumePrevious: () => void;
  onResumeTomorrow: () => void;
  onArchive: () => void;
}

type Outcome = "" | "selected" | "not-selected" | "pending";

export default function InterviewCompleteDialog({
  open,
  company,
  role,
  suspendedSprintName,
  onResumePrevious,
  onResumeTomorrow,
  onArchive,
}: InterviewCompleteDialogProps) {
  const [outcome, setOutcome] = useState<Outcome>("");
  const [notes, setNotes] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && onResumeTomorrow) {
          onResumeTomorrow();
        }
        if (e.key === "Tab") {
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [open, onResumeTomorrow]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-complete-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-xl border border-border/70 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h3 id="interview-complete-title" className="text-sm font-semibold text-foreground">Interview Sprint Complete</h3>
            <p className="text-xs text-muted-foreground/70">
              {company}{role ? ` — ${role}` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Interview Outcome</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: "selected", label: "Selected", icon: <CheckCircle2 className="size-3.5" />, color: "text-success", border: "border-success/30 bg-success/5" },
                { value: "not-selected", label: "Not Selected", icon: <Archive className="size-3.5" />, color: "text-destructive", border: "border-destructive/30 bg-destructive/5" },
                { value: "pending", label: "Waiting", icon: <Clock className="size-3.5" />, color: "text-warning", border: "border-warning/30 bg-warning/5" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcome(opt.value as Outcome)}
                  className={cn(
                    "rounded-lg border p-2.5 text-center transition-all text-[11px]",
                    outcome === opt.value
                      ? `${opt.border} ${opt.color}`
                      : "border-border bg-secondary/40 hover:bg-accent hover:border-foreground/20"
                  )}
                >
                  <span className="block mb-1">{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? Any feedback or next steps?"
              rows={3}
              className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-[11px] text-muted-foreground/60 mb-3">
              What would you like to do with your suspended sprint{suspendedSprintName ? ` (${suspendedSprintName})` : ""}?
            </p>
            <div className="space-y-1.5">
              <button
                onClick={onResumePrevious}
                className="w-full rounded-lg border border-border/70 bg-secondary/40 hover:bg-accent transition-colors p-2.5 text-left flex items-center gap-3"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-success/10 text-success">
                  <Play className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">Resume Previous Sprint</p>
                  <p className="text-[10px] text-muted-foreground/60">Continue where you left off immediately</p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
              </button>

              <button
                onClick={onResumeTomorrow}
                className="w-full rounded-lg border border-border/70 bg-secondary/40 hover:bg-accent transition-colors p-2.5 text-left flex items-center gap-3"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Clock className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">Resume Tomorrow</p>
                  <p className="text-[10px] text-muted-foreground/60">Keep it suspended, resume later</p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
              </button>

              <button
                onClick={onArchive}
                className="w-full rounded-lg border border-border/70 bg-secondary/40 hover:bg-accent transition-colors p-2.5 text-left flex items-center gap-3"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Archive className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">Archive Previous Sprint</p>
                  <p className="text-[10px] text-muted-foreground/60">Discard the suspended sprint and its progress</p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

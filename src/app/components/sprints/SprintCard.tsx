"use client";

import { useMemo } from "react";
import { ChevronRight, Play, CheckCircle2, CalendarDays, Target, Sparkles, BookOpen, Briefcase, GraduationCap, Layers, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sprint, SprintTaskV2 } from "@/lib/sprints";
import { Button } from "@/components/ui/button";

interface SprintCardProps {
  sprint: Sprint;
  tasks?: SprintTaskV2[];
  suspendedBy?: { name: string; company?: string } | null;
  onClick?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; border: string }> = {
  learning: { label: "Learning", icon: <BookOpen className="size-3" />, color: "text-blue-500", border: "border-blue-500/20" },
  interview: { label: "Interview", icon: <Briefcase className="size-3" />, color: "text-cyan-500", border: "border-cyan-500/20" },
  certification: { label: "Certification", icon: <GraduationCap className="size-3" />, color: "text-purple-500", border: "border-purple-500/20" },
  custom: { label: "Custom", icon: <Layers className="size-3" />, color: "text-muted-foreground", border: "border-border/50" },
};

const SprintCard = ({ sprint, tasks = [], suspendedBy, onClick, onStart, onComplete, onArchive, onRestore, onDelete }: SprintCardProps) => {
  const tc = typeConfig[sprint.type] ?? typeConfig.custom;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const countdown = useMemo(() => {
    if (sprint.type !== "interview" || !sprint.interviewDate) return null;
    const diff = new Date(sprint.interviewDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, urgent: false };
    const days = Math.ceil(diff / 86400000);
    return { days, urgent: days <= 3 };
  }, [sprint.interviewDate, sprint.type]);

  return (
    <div
      onClick={() => onClick?.(sprint.id)}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(sprint.id); } }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm transition-all duration-200 cursor-pointer",
        "hover:border-foreground/15 hover:shadow-md hover:shadow-foreground/[0.02] hover:-translate-y-0.5",
        sprint.status === "active" && "border-success/20 bg-success/[0.02]",
        sprint.type === "interview" && sprint.status === "active" && "border-cyan-500/20 bg-cyan-500/[0.02]"
      )}
    >
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-300",
        sprint.status === "active" ? (sprint.type === "interview" ? "bg-cyan-500" : "bg-success") : sprint.status === "completed" ? "bg-info" : "bg-border",
        "group-hover:opacity-80"
      )} />

      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium inline-flex items-center gap-1", tc.color, tc.border)}>
              {tc.icon}
              {tc.label}
            </span>
            {sprint.status === "planned" && sprint.pausedSprintId && (
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1">
                <PauseCircle className="size-2.5" />
                Suspended
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">{sprint.name}</h3>
          {sprint.goal && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1 flex items-center gap-1">
              <Target className="size-3 shrink-0" />
              {sprint.goal}
            </p>
          )}
          {sprint.company && (
            <p className="text-xs text-muted-foreground/50 mt-0.5 flex items-center gap-1">
              <Briefcase className="size-2.5 shrink-0" />
              {sprint.company}{sprint.role ? ` — ${sprint.role}` : ""}
            </p>
          )}
          {sprint.status === "planned" && sprint.pausedSprintId && suspendedBy && (
            <div className="mt-1.5 rounded-md bg-amber-500/5 border border-amber-500/10 p-2 space-y-1">
              <p className="text-[10px] text-amber-600/80 flex items-center gap-1">
                <PauseCircle className="size-2.5" />
                Suspended for <span className="font-medium">{suspendedBy.name}</span>
              </p>
              {suspendedBy.company && (
                <p className="text-[10px] text-amber-600/60">{suspendedBy.company}</p>
              )}
              <p className="text-[9px] text-amber-600/50 italic">Will resume after interview</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {countdown && (
            <span className={cn(
              "text-xs font-bold tabular-nums",
              countdown.urgent ? "text-destructive" : "text-cyan-500"
            )}>
              {countdown.days}d
            </span>
          )}
          <div className={cn(
            "size-6 rounded-md flex items-center justify-center transition-all",
            "text-muted-foreground/30 group-hover:text-foreground/50 group-hover:bg-accent"
          )}>
            <ChevronRight className="size-4" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pl-3 text-[11px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />
          {sprint.startDate} → {sprint.endDate}
        </span>
        {sprint.retro && (
          <span className="text-success/70 text-[10px] flex items-center gap-0.5">
            <Sparkles className="size-2.5" />
            Retro done
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 pl-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 mb-1.5">
            <span className="flex items-center gap-2">
              <span className="text-foreground/70 font-medium">{done}/{total}</span> tasks
              {inProgress > 0 && (
                <span className="text-warning/70">{inProgress} active</span>
              )}
            </span>
            <span className={cn(
              "font-medium tabular-nums",
              pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-muted-foreground/60"
            )}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-info"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {!total && sprint.status === "planned" && (
        <div className="mt-3 pl-3">
          <p className="text-[10px] text-muted-foreground/40 italic">No tasks yet</p>
        </div>
      )}

      {sprint.archivedAt ? (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50 pl-3">
          {onRestore && (
            <Button
              onClick={(e) => { e.stopPropagation(); onRestore(sprint.id); }}
              className="h-6 text-[10px] bg-info/15 text-info hover:bg-info/25 cursor-pointer rounded-md"
            >
              <Play className="size-3 mr-1" />
              Restore
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={(e) => { e.stopPropagation(); onDelete(sprint.id); }}
              variant="outline"
              className="h-6 text-[10px] ml-auto text-destructive/50 border-destructive/20 bg-transparent hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-md"
            >
              Delete Forever
            </Button>
          )}
        </div>
      ) : sprint.status !== "completed" && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50 pl-3">
          {sprint.status === "planned" && onStart && !sprint.pausedSprintId && (
            <Button
              onClick={(e) => { e.stopPropagation(); onStart(sprint.id); }}
              className="h-6 text-[10px] bg-success/15 text-success hover:bg-success/25 cursor-pointer rounded-md"
            >
              <Play className="size-3 mr-1" />
              Start Sprint
            </Button>
          )}
          {sprint.status === "active" && onComplete && (
            <Button
              onClick={(e) => { e.stopPropagation(); onComplete(sprint.id); }}
              className="h-6 text-[10px] bg-info/15 text-info hover:bg-info/25 cursor-pointer rounded-md"
            >
              <CheckCircle2 className="size-3 mr-1" />
              Complete
            </Button>
          )}
          {onArchive && (
            <Button
              onClick={(e) => { e.stopPropagation(); onArchive(sprint.id); }}
              variant="outline"
              className="h-6 text-[10px] ml-auto text-muted-foreground/50 border-border/50 bg-transparent hover:bg-accent cursor-pointer rounded-md"
            >
              Archive
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SprintCard;

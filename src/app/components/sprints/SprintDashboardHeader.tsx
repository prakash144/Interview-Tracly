"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Clock, Target, Gauge, ListChecks, Briefcase, AlertTriangle, PauseCircle, Eye } from "lucide-react";
import type { SprintTaskV2, SprintType } from "@/lib/sprints";

interface SprintDashboardHeaderProps {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  tasks: SprintTaskV2[];
  capacityHours?: number;
  type?: SprintType;
  company?: string;
  role?: string;
  interviewDate?: string;
  targetLevel?: string;
  suspendedSprintName?: string;
  onViewSprint?: (id: string) => void;
  suspendedSprintId?: string;
}

const StatCard = ({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div className="rounded-lg border border-border/60 bg-card/40 p-3 min-w-0">
    <div className="flex items-center gap-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
  </div>
);

const TrackBar = ({
  track,
  icon,
  pct,
  count,
  color,
}: {
  track: string;
  icon: string;
  pct: number;
  count: number;
  color: string;
}) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-sm shrink-0">{icon}</span>
    <span className="w-20 truncate text-muted-foreground">{track}</span>
    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
    <span className="text-[10px] text-muted-foreground/60 w-8 text-right tabular-nums">{count}</span>
  </div>
);

const SprintDashboardHeader = ({
  name,
  goal,
  startDate,
  endDate,
  tasks,
  capacityHours,
  type,
  company,
  role,
  interviewDate,
  targetLevel,
  suspendedSprintName,
  onViewSprint,
  suspendedSprintId,
}: SprintDashboardHeaderProps) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;
    const estimatedHours = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const actualHours = tasks.reduce((s, t) => s + (t.actualHours || 0), 0);
    const remainingHours = estimatedHours - actualHours;

    const tracks: Record<string, { icon: string; count: number; color: string }> = {};
    for (const t of tasks) {
      if (!t.track) continue;
      if (!tracks[t.track]) {
        const colors = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];
        tracks[t.track] = { icon: "📌", count: 0, color: colors[Object.keys(tracks).length % colors.length] };
      }
      tracks[t.track].count++;
    }

    return { total, done, inProgress, review, completion, estimatedHours, actualHours, remainingHours, tracks };
  }, [tasks]);

  const countdown = useMemo(() => {
    if (!interviewDate) return null;
    const diff = new Date(interviewDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, urgent: false };
    const days = Math.ceil(diff / 86400000);
    return { days, urgent: days <= 3 };
  }, [interviewDate]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      {type === "interview" && (
        <div className={cn(
          "rounded-lg border p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500",
          countdown?.urgent ? "border-destructive/20 bg-destructive/5" : "border-cyan-500/20 bg-cyan-500/5"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex size-9 items-center justify-center rounded-full shrink-0",
              countdown?.urgent ? "bg-destructive/10 text-destructive" : "bg-cyan-500/10 text-cyan-500"
            )}>
              {countdown?.urgent ? <AlertTriangle className="size-4" /> : <Briefcase className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Interview Focus Mode</p>
                {countdown && (
                  <span className={cn(
                    "text-xl font-bold tabular-nums",
                    countdown.urgent ? "text-destructive" : "text-cyan-500"
                  )}>
                    {countdown.days}d
                  </span>
                )}
              </div>
              {company && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {company}{role ? ` — ${role}` : ""}{targetLevel ? ` · Target: ${targetLevel}` : ""}
                </p>
              )}
            </div>
          </div>

          {suspendedSprintName && (
            <div className="rounded-md bg-amber-500/5 border border-amber-500/10 p-2.5 space-y-1">
              <p className="text-[11px] text-amber-600/80 flex items-center gap-1.5">
                <PauseCircle className="size-3" />
                <span><span className="font-medium">{suspendedSprintName}</span> has been safely suspended.</span>
              </p>
              <p className="text-[10px] text-amber-600/50 italic">Nothing has been lost. It will be available to resume after the interview.</p>
            </div>
          )}

          <div className="flex gap-2">
            {onViewSprint && (
              <button
                onClick={() => onViewSprint("__current__")}
                className="h-7 text-[10px] px-2.5 rounded-md bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Eye className="size-3" />
                View Interview Sprint
              </button>
            )}
            {suspendedSprintId && onViewSprint && (
              <button
                onClick={() => onViewSprint(suspendedSprintId)}
                className="h-7 text-[10px] px-2.5 rounded-md bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Eye className="size-3" />
                View Suspended Sprint
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{name}</h2>
          {goal && <p className="text-xs text-muted-foreground/70 mt-0.5">{goal}</p>}
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            {startDate} → {endDate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={<Gauge className="size-3.5" />} label="Progress" value={`${stats.completion}%`} sub={`${stats.done}/${stats.total} tasks`} color="text-success" />
        <StatCard icon={<Clock className="size-3.5" />} label="Estimated" value={`${stats.estimatedHours}h`} sub={capacityHours ? `Capacity ${capacityHours}h` : undefined} color="text-info" />
        <StatCard icon={<Target className="size-3.5" />} label="Remaining" value={`${Math.max(0, stats.remainingHours)}h`} sub={`${stats.inProgress + stats.review} in progress`} color="text-warning" />
        <StatCard icon={<ListChecks className="size-3.5" />} label="Actual" value={`${stats.actualHours}h`} sub={`${stats.review} in review`} color="text-purple-500" />
      </div>

      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            stats.completion >= 80 ? "bg-success" : stats.completion >= 50 ? "bg-warning" : "bg-info"
          )}
          style={{ width: `${stats.completion}%` }}
        />
      </div>

      {Object.keys(stats.tracks).length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Track Breakdown</p>
          {Object.entries(stats.tracks).map(([track, data]) => (
            <TrackBar
              key={track}
              track={track}
              icon={data.icon}
              pct={stats.total > 0 ? Math.round((data.count / stats.total) * 100) : 0}
              count={data.count}
              color={data.color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SprintDashboardHeader;

"use client";

import { BookOpen, Briefcase, Play, PauseCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStepProps {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  color: string;
  isLast?: boolean;
}

function TimelineStep({ icon, label, sub, color, isLast }: TimelineStepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("flex size-7 items-center justify-center rounded-full shrink-0", color)}>
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border/50 my-1" />}
      </div>
      <div className="pb-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

interface SprintTimelineProps {
  currentSprintName: string;
  currentSprintType: string;
  company?: string;
  role?: string;
  suspendedSprintName?: string;
  status: string;
}

export default function SprintTimeline({
  currentSprintName,
  currentSprintType,
  company,
  role,
  suspendedSprintName,
  status,
}: SprintTimelineProps) {
  const steps: TimelineStepProps[] = [];

  if (suspendedSprintName) {
    steps.push({
      icon: <BookOpen className="size-3.5" />,
      label: suspendedSprintName,
      color: "bg-blue-500/10 text-blue-500",
    });
    steps.push({
      icon: <PauseCircle className="size-3.5" />,
      label: "Suspended",
      sub: `for ${company ?? currentSprintName}`,
      color: "bg-amber-500/10 text-amber-500",
    });
  }

  steps.push({
    icon: currentSprintType === "interview" ? <Briefcase className="size-3.5" /> : <Play className="size-3.5" />,
    label: currentSprintName,
    sub: company ? `${company}${role ? ` — ${role}` : ""}` : undefined,
    color: status === "completed" ? "bg-info/10 text-info" : "bg-cyan-500/10 text-cyan-500",
  });

  if (status === "completed") {
    steps.push({
      icon: <CheckCircle2 className="size-3.5" />,
      label: "Completed",
      sub: "Interview prep finished",
      color: "bg-success/10 text-success",
      isLast: true,
    });
  } else {
    steps[steps.length - 1].isLast = true;
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-2">Sprint Timeline</p>
      {steps.map((step, i) => (
        <TimelineStep key={i} {...step} />
      ))}
    </div>
  );
}

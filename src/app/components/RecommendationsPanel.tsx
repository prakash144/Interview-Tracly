"use client";

import { ArrowRight, CheckCircle2, RotateCcw, Target, Crosshair } from "lucide-react";
import Link from "next/link";
import type { ActionItem } from "@/hooks/useInterviewReadiness";

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-warning bg-warning/5",
  low: "border-l-info bg-info/5",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  solve: Target,
  revise: RotateCcw,
  practice: Crosshair,
  complete: CheckCircle2,
};

interface RecommendationsPanelProps {
  actionPlan: ActionItem[];
}

export function RecommendationsPanel({ actionPlan }: RecommendationsPanelProps) {
  const primaryActions = actionPlan.filter((a) => a.priority === "high");
  const secondaryActions = actionPlan.filter((a) => a.priority !== "high");

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Target className="size-4 text-success" />
          Recommended Next Actions
        </h3>

        <div className="space-y-2">
          {primaryActions.map((action) => {
            const Icon = TYPE_ICONS[action.type] || Target;
            return (
              <div
                key={action.id}
                className={`border-l-2 pl-3 py-2 rounded-r-md ${PRIORITY_COLORS[action.priority] || "bg-muted/30"}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="size-3.5 text-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{action.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{action.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {secondaryActions.slice(0, 3).map((action) => {
            const Icon = TYPE_ICONS[action.type] || Target;
            return (
              <div
                key={action.id}
                className={`border-l-2 pl-3 py-2 rounded-r-md ${PRIORITY_COLORS[action.priority] || "bg-muted/30"}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="size-3.5 text-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{action.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{action.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {primaryActions.length === 0 && secondaryActions.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              You&apos;re on track! Keep up the great work.
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <Link
            href="/readiness"
            className="inline-flex items-center gap-1 text-xs font-medium text-info hover:text-info/80 transition-colors"
          >
            View full readiness report
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

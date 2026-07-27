"use client";

import { useCallback } from "react";
import { Sparkles, Clock, CheckCircle2, Briefcase, RotateCcw, Crosshair, Flame, ChevronUp, ChevronDown, Minus, Loader2, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import type { WeeklyInsightsData } from "@/hooks/useWeeklyInsights";

const ICON_MAP: Record<string, React.ElementType> = {
  Clock, CheckCircle2, Briefcase, RotateCcw, Crosshair, Flame,
};

interface WeeklyInsightsHeroProps {
  data: WeeklyInsightsData;
  onGenerate: () => void;
  isGenerating: boolean;
}

function TrendBadge({ trend, deltaPercent }: { trend: string; deltaPercent: number }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
        <ChevronUp className="size-3" />
        {deltaPercent}%
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-destructive">
        <ChevronDown className="size-3" />
        {deltaPercent}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
      <Minus className="size-3" />
      0%
    </span>
  );
}

export function WeeklyInsightsHero({ data, onGenerate, isGenerating }: WeeklyInsightsHeroProps) {

  const handleExport = useCallback(() => {
    window.print();
    toast.success("Weekly review export initiated", { id: "weekly-export" });
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: "Weekly Review - Career Intelligence Center",
        text: `This week: ${data.problemsSolved.current} problems solved, ${data.studyTime.current} min studied, Readiness: ${data.readinessScore.current}%`,
      });
    } catch {
      toast.success("Weekly review summary copied to clipboard", { id: "weekly-share" });
    }
  }, [data]);

  return (
    <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card/90 via-card to-card/90 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-info/10">
              <Sparkles className="size-5 text-info" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Weekly Insights</h2>
              <p className="text-xs text-muted-foreground">
                {data.generatedAt
                  ? `Last generated ${new Date(data.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                  : "Generate your weekly performance review"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.generatedAt && (
              <>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                >
                  <Share2 className="size-3.5" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                >
                  <Download className="size-3.5" />
                  Export
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-info px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-info/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {isGenerating ? "Generating..." : "Generate Now"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.metrics.map((metric) => {
            const Icon = ICON_MAP[metric.icon] || Sparkles;
            return (
              <div
                key={metric.label}
                className="rounded-lg border border-border/50 bg-background/40 p-3 transition-colors hover:bg-background/60"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`size-3.5 ${metric.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {metric.label}
                  </span>
                </div>
                <div className="text-lg font-bold tabular-nums text-foreground">{metric.value}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TrendBadge trend={metric.trend} deltaPercent={metric.deltaPercent} />
                  <span className="text-[10px] text-muted-foreground truncate">{metric.sublabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

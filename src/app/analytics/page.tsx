"use client";

import { useMemo } from "react";
import { TrendingUp, Target, BarChart3, CalendarDays, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { AnalyticsSkeleton } from "@/components/states/PageSkeletons";
import ErrorState from "@/components/states/ErrorState";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { computePredictions, computeWeeklyTrends } from "@/lib/predictions";
import { getWeeklyMinutes, getTodayMinutes } from "@/lib/studySessions";
import { useStudySessions } from "@/hooks/useStudySessions";
import { StudyTimer } from "@/app/components/StudyTimer";

function WeeklyChart({ trends }: { trends: { weekStart: string; solved: number; attempted: number }[] }) {
  if (trends.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No weekly data yet</p>;
  const maxVal = Math.max(...trends.map((t) => t.solved + t.attempted), 1);
  const w = 600;
  const h = 200;
  const barW = Math.max(12, Math.min(40, (w - 40) / trends.length - 4));
  const padL = 35;
  const padR = 10;
  const padT = 20;
  const padB = 30;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <line key={frac} x1={padL} y1={padT + chartH * (1 - frac)} x2={w - padR} y2={padT + chartH * (1 - frac)}
          stroke="currentColor" strokeOpacity={0.1} strokeWidth="1" />
      ))}
      {trends.map((t, i) => {
        const x = padL + (i / trends.length) * chartW + (chartW / trends.length - barW) / 2;
        const solvedH = (t.solved / maxVal) * chartH;
        const attemptedH = (t.attempted / maxVal) * chartH;
        return (
          <g key={t.weekStart}>
            <rect x={x} y={padT + chartH - solvedH - attemptedH} width={barW} height={attemptedH}
              fill="hsl(var(--warning))" rx="2" opacity={0.5} />
            <rect x={x} y={padT + chartH - solvedH} width={barW} height={solvedH}
              fill="hsl(var(--success))" rx="2" />
            <text x={x + barW / 2} y={padT + chartH + 16} textAnchor="middle"
              className="fill-muted-foreground text-[9px]">
              {t.weekStart.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GoalCompletionChart({ history }: { history: { date: string; dailyMet: boolean; weeklyMet: boolean }[] }) {
  const recent = history.slice(-8);
  if (recent.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No goal data yet</p>;
  const dailyRate = Math.round((recent.filter((r) => r.dailyMet).length / recent.length) * 100);
  const weeklyRate = Math.round((recent.filter((r) => r.weeklyMet).length / recent.length) * 100);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold text-info tabular-nums">{dailyRate}%</p>
          <p className="text-[10px] text-muted-foreground">Daily Goal Rate</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold text-success tabular-nums">{weeklyRate}%</p>
          <p className="text-[10px] text-muted-foreground">Weekly Goal Rate</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {recent.map((r) => (
          <div key={r.date} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground shrink-0">{r.date.slice(5)}</span>
            <div className="flex gap-1.5 flex-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.dailyMet ? "bg-success/20 text-success" : "bg-destructive/10 text-destructive"}`}>
                D
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.weeklyMet ? "bg-success/20 text-success" : "bg-destructive/10 text-destructive"}`}>
                W
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyReadinessChart({ stats }: { stats: { name: string; solved: number; total: number }[] }) {
  const companies = stats.filter((c) => c.total > 0).sort((a, b) => (b.solved / b.total) - (a.solved / a.total)).slice(0, 8);
  if (companies.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No company data</p>;
  return (
    <div className="space-y-2.5">
      {companies.map((c) => {
        const pct = Math.round((c.solved / c.total) * 100);
        return (
          <div key={c.name}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-foreground font-medium">{c.name}</span>
              <span className="text-muted-foreground tabular-nums">{c.solved}/{c.total} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { auth, progress, questionsState } = useProblemWorkspaceData();
  const { sessions } = useStudySessions();

  const predictions = useMemo(
    () => computePredictions(progress.progressMap, 150),
    [progress.progressMap]
  );

  const trends = useMemo(
    () => computeWeeklyTrends(progress.progressMap),
    [progress.progressMap]
  );

  const statsSummary = useMemo(() => {
    const map = progress.progressMap;
    if (!map) return { solved: 0, total: 0, attempted: 0, companyStats: [] as { name: string; solved: number; total: number }[] };
    let solved = 0;
    let attempted = 0;
    for (const p of Object.values(map)) {
      if (p.solved) solved++;
      if (p.attempted) attempted++;
    }
    const total = questionsState.questions.length;
    const companyMap = new Map<string, { solved: number; total: number }>();
    for (const q of questionsState.questions) {
      const key = q.company || "Other";
      const entry = companyMap.get(key) ?? { solved: 0, total: 0 };
      entry.total++;
      if (map[q.problemId]?.solved) entry.solved++;
      companyMap.set(key, entry);
    }
    return { solved, total, attempted, companyStats: Array.from(companyMap.entries()).map(([name, v]) => ({ name, ...v })) };
  }, [progress.progressMap, questionsState.questions]);

  const goalHistory = useMemo(() => {
    const map = progress.progressMap;
    if (!map) return [];
    const weeks = new Map<string, { dailyMet: boolean; weeklyMet: boolean }>();
    for (const p of Object.values(map)) {
      if (!p.solvedAt) continue;
      const d = new Date(p.solvedAt.seconds * 1000);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      const entry = weeks.get(key) ?? { dailyMet: true, weeklyMet: false };
      weeks.set(key, entry);
    }
    return Array.from(weeks.entries()).map(([date, v]) => ({ date, ...v }));
  }, [progress.progressMap]);

  const isLoading = questionsState.loading || progress.loading;
  const hasError = questionsState.error || auth.error || progress.error;

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Analytics"
        title="Performance Analytics"
        description="Trends, predictions, and study accountability"
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 space-y-6">
        {isLoading && <AnalyticsSkeleton />}
        {hasError && typeof hasError === "string" && <ErrorState message={hasError} />}

        {!isLoading && !hasError && (
          <>
            {/* Top row: Timer + Quick Stats */}
            <div className="grid gap-4 lg:grid-cols-3">
              <StudyTimer />
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="size-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Solved</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{statsSummary.solved}</p>
                  <p className="text-xs text-muted-foreground">of {statsSummary.total} problems</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="size-3.5 text-success" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rate</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{predictions.problemsPerWeek}</p>
                  <p className="text-xs text-muted-foreground">problems / week</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="size-3.5 text-warning" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Projected</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{predictions.projectedTotal}</p>
                  <p className="text-xs text-muted-foreground">in 12 weeks</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="size-3.5 text-info" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Goal</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{predictions.weeksToGoal}</p>
                  <p className="text-xs text-muted-foreground">weeks to 150</p>
                </div>
              </div>
            </div>

            {/* Predictions banner */}
            <div className={`rounded-lg border p-4 flex items-center gap-3 ${
              predictions.onTrack ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
            }`}>
              <Zap className={`size-5 shrink-0 ${predictions.onTrack ? "text-success" : "text-warning"}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {predictions.onTrack
                    ? "On track to reach 150 problems within 12 weeks"
                    : `At current pace (${predictions.problemsPerWeek}/wk), you'll reach 150 in ${predictions.weeksToGoal} weeks`}
                </p>
                {predictions.projectedDate && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Projected completion: {predictions.projectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            {/* Main charts row */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Weekly Solved Trend
                </h3>
                <WeeklyChart trends={trends} />
                {trends.length > 0 && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-success" /> Solved</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-warning opacity-50" /> Attempted</span>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  Goal Completion History
                </h3>
                <GoalCompletionChart history={goalHistory} />
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Company Readiness
                  </h3>
                  <Link href="/readiness" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                    Full report <ArrowRight className="size-3" />
                  </Link>
                </div>
                <CompanyReadinessChart stats={statsSummary.companyStats} />
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Quick Insights
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-foreground">Submission-to-Solve Ratio</p>
                    <p className="text-lg font-bold tabular-nums mt-1">
                      {statsSummary.attempted > 0
                        ? `${Math.round((statsSummary.solved / Math.max(statsSummary.attempted, 1)) * 100)}%`
                        : "N/A"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {statsSummary.attempted - statsSummary.solved > 0
                        ? `${statsSummary.attempted - statsSummary.solved} problems need another look`
                        : "Every attempt leads to a solve — great work!"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-foreground">Study Time This Week</p>
                    <p className="text-lg font-bold tabular-nums mt-1">{getWeeklyMinutes(sessions)}m</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Across {sessions.filter((s) => s.completed && s.startTime >= Date.now() - 7 * 24 * 60 * 60 * 1000).length} sessions
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-foreground">Study Time Today</p>
                    <p className="text-lg font-bold tabular-nums mt-1">{getTodayMinutes(sessions)}m</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {getTodayMinutes(sessions) >= 60 ? "Great focus today!" : getTodayMinutes(sessions) > 0 ? "Keep going!" : "No sessions yet today"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw data export link */}
            <div className="text-center">
              <Link href="/settings?tab=preferences" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Export full data in Settings <ArrowRight className="size-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

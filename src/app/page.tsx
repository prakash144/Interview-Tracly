"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, FolderKanban, Kanban, Layers, Play, RotateCcw, Sparkles, Target, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import CompanyLogo from "@/components/data-display/CompanyLogo";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import ErrorState from "@/components/states/ErrorState";
import { DashboardSkeleton } from "@/components/states/PageSkeletons";
import { ProgressRingChart } from "@/app/components/ProgressRingChart";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandLink, MetricCard, PremiumSurface, SectionHeader } from "@/components/ui/premium";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { useAchievements } from "@/hooks/useAchievements";
import { AnimatedStreak } from "@/app/components/AnimatedStreak";
import { AchievementBadges } from "@/app/components/AchievementBadges";
import { OnboardingWalkthrough } from "@/app/components/OnboardingWalkthrough";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useResources } from "@/hooks/useResources";
import { useResourceProgress } from "@/hooks/useResourceProgress";
import { useSprints, useSprintTasks } from "@/hooks/useSprints";
import FavoriteResourcesWidget from "@/app/components/FavoriteResourcesWidget";
import DailyMissionWidget from "@/app/components/DailyMission";
import { useGoals } from "@/hooks/useGoals";
import { useTracks } from "@/hooks/useTracks";
import { useRevisionTracker } from "@/hooks/useRevisionTracker";
import { useNextUpQueue } from "@/hooks/useNextUpQueue";
import { WeaknessRadarChart } from "@/app/components/WeaknessRadarChart";
import { ReadinessGauge } from "@/app/components/ReadinessGauge";
import { NextUpQueue } from "@/app/components/NextUpQueue";
import type { Problem, UserProblemProgress } from "@/lib/progressTypes";
import type { Sprint } from "@/lib/sprints";

const Heatmap = dynamic(() => import("@/app/components/Heatmap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-border bg-card/70 px-4 py-6 transition-shadow duration-200 hover:shadow-md">
      <div className="mx-auto mb-4 h-3 max-w-xs overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-success" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="size-3 rounded-sm bg-secondary animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
});

const computeStreak = (progressMap: Record<string, UserProblemProgress>): number => {
  const solvedDates = new Set<string>();
  for (const p of Object.values(progressMap)) {
    if (p.solved && p.solvedAt) {
      solvedDates.add(new Date(p.solvedAt.seconds * 1000).toISOString().slice(0, 10));
    }
  }
  if (solvedDates.size === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (solvedDates.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const DashboardPage = () => {
  const router = useRouter();
  const { auth, progress, questionsState } = useProblemWorkspaceData();
  const stats = useDashboardStats(questionsState.questions, progress.progressMap);
  const { resources: allResources } = useResources(auth.user?.uid);
  const { progressMap: resourceProgress } = useResourceProgress(auth.user?.uid);
  const { sprints } = useSprints(auth.user?.uid);
  const { tracks } = useTracks(auth.user?.uid);
  const revisionTracker = useRevisionTracker(progress.progressMap, questionsState.questions);
  const { settings: goalSettings } = useGoals();
  const activeSprint = sprints.find((s) => s.status === "active");

  const solvedPercent = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.solved / stats.total) * 100);
  }, [stats]);

  const streak = useMemo(
    () => (auth.user ? computeStreak(progress.progressMap) : 0),
    [auth.user, progress.progressMap]
  );

  const achievements = useAchievements(stats.solved, streak, stats.bookmarked);

  const recentSolved = useMemo(() => {
    const solved: { problem: Problem; date: Date }[] = [];
    for (const [problemId, p] of Object.entries(progress.progressMap)) {
      if (p.solved && p.solvedAt) {
        const problem = questionsState.questions.find((q) => q.problemId === problemId);
        if (problem) solved.push({ problem, date: new Date(p.solvedAt.seconds * 1000) });
      }
    }
    return solved.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }, [progress.progressMap, questionsState.questions]);

  const lastAttempted = useMemo(() => {
    const entries: { problem: Problem; progress: UserProblemProgress }[] = [];
    for (const p of Object.values(progress.progressMap)) {
      if (p.attempted && !p.solved && p.attemptedAt) {
        const q = questionsState.questions.find((q) => q.problemId === p.problemId);
        if (q) entries.push({ problem: q, progress: p });
      }
    }
    if (entries.length === 0) return null;
    entries.sort((a, b) => (b.progress.attemptedAt!.seconds * 1000) - (a.progress.attemptedAt!.seconds * 1000));
    return entries[0];
  }, [questionsState.questions, progress.progressMap]);

  const lastSolved = useMemo(() => {
    let last: { problem: Problem; date: Date } | null = null;
    for (const [problemId, p] of Object.entries(progress.progressMap)) {
      if (p.solved && p.solvedAt) {
        const d = new Date(p.solvedAt.seconds * 1000);
        if (!last || d > last.date) {
          const problem = questionsState.questions.find((q) => q.problemId === problemId);
          if (problem) last = { problem, date: d };
        }
      }
    }
    return last;
  }, [questionsState.questions, progress.progressMap]);

  const weeklySolved = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let count = 0;
    for (const p of Object.values(progress.progressMap)) {
      if (p.solved && p.solvedAt) {
        const d = new Date(p.solvedAt.seconds * 1000);
        if (d >= weekAgo) count++;
      }
    }
    return count;
  }, [progress.progressMap]);

  const dailySolved = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (const p of Object.values(progress.progressMap)) {
      if (p.solved && p.solvedAt) {
        const d = new Date(p.solvedAt.seconds * 1000);
        if (d >= today) count++;
      }
    }
    return count;
  }, [progress.progressMap]);

  const weeklyGoalPct = goalSettings.weeklyTarget > 0 ? Math.min(100, Math.round((weeklySolved / goalSettings.weeklyTarget) * 100)) : 0;
  const dailyGoalPct = goalSettings.dailyTarget > 0 ? Math.min(100, Math.round((dailySolved / goalSettings.dailyTarget) * 100)) : 0;

  const topCompanies = useMemo(() => {
    return stats.companyStats
      .filter((c) => c.solved > 0)
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 5);
  }, [stats.companyStats]);

  const topicStrengths = useMemo(() => {
    return stats.topicStats
      .filter((t) => t.total >= 2)
      .map((t) => ({ name: t.name, strength: t.total > 0 ? (t.solved / t.total) * 100 : 0 }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 6);
  }, [stats.topicStats]);

  const nextUpProblems = useNextUpQueue(questionsState.questions, progress.progressMap, stats.topicStats, 5);

  const ringSegments = useMemo(() => {
    const colorMap: Record<string, string> = { Easy: "var(--color-success)", Medium: "var(--color-warning)", Hard: "var(--color-destructive)" };
    return stats.difficultyStats.map((d) => ({
      name: d.name, total: d.total, solved: d.solved, color: colorMap[d.name] || "var(--color-info)",
    }));
  }, [stats.difficultyStats]);

  const difficultyColors: Record<string, string> = {
    Easy: "bg-success/20 border-success/30 text-success",
    Medium: "bg-warning/20 border-warning/30 text-warning",
    Hard: "bg-error/20 border-error/30 text-error",
  };

  const difficultyBarColors: Record<string, string> = {
    Easy: "bg-success",
    Medium: "bg-warning",
    Hard: "bg-error",
  };

  const isLoading = questionsState.loading || progress.loading;
  const hasError = questionsState.error || auth.error || progress.error;

  const revisionItems = useMemo(
    () => [
      ...revisionTracker.buckets.overdue,
      ...revisionTracker.buckets.reviewToday,
      ...revisionTracker.buckets.reviewThisWeek,
    ],
    [revisionTracker.buckets]
  );

  const resourceCompletion = useMemo(() => {
    if (allResources.length === 0) return 0;
    const completed = allResources.filter((resource) => resourceProgress[resource.id]?.status === "completed").length;
    return Math.round((completed / allResources.length) * 100);
  }, [allResources, resourceProgress]);

  const nextFocus = useMemo(() => {
    if (revisionItems.length > 0) {
      return {
        label: "Review due",
        title: revisionItems[0].title,
        description: `${revisionItems.length} item${revisionItems.length === 1 ? "" : "s"} waiting in revision`,
        href: "/activity",
        icon: RotateCcw,
        tone: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    }
    if (lastAttempted) {
      return {
        label: "Continue solving",
        title: lastAttempted.problem.title,
        description: "Resume the most recent attempted problem",
        href: "/problems",
        icon: Play,
        tone: "text-success bg-success/10 border-success/20",
      };
    }
    if (activeSprint) {
      return {
        label: "Active sprint",
        title: activeSprint.name,
        description: activeSprint.goal || "Keep the current sprint moving",
        href: "/sprints",
        icon: Kanban,
        tone: "text-info bg-info/10 border-info/20",
      };
    }
    return {
      label: "Start strong",
      title: "Choose your next problem",
      description: "Build momentum from the problem workspace",
      href: "/problems",
      icon: Target,
      tone: "text-success bg-success/10 border-success/20",
    };
  }, [activeSprint, lastAttempted, revisionItems]);

  const quickActions = [
    { title: "Continue Solving", description: "Resume your last problem", href: "/problems", icon: Play },
    { title: "Interview Tracks", description: "System design, backend, behavioral prep", href: "/tracks", icon: Layers },
    { title: "Collections", description: "Organize problems into collections", href: "/collections", icon: FolderKanban },
    { title: "Progress", description: "Detailed stats and history", href: "/progress", icon: BarChart3 },
  ];

  const renderQuickActions = (contentStart = false) => (
    <section className={`grid gap-3 grid-cols-2 sm:grid-cols-4${contentStart ? " content-start" : ""}`}>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-lg border border-border/70 bg-card/85 p-4 text-center shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-card hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex size-10 items-center justify-center rounded-md border border-success/20 bg-success/10 text-success">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{action.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
            </div>
          </Link>
        );
      })}
    </section>
  );

  const handleDifficultyClick = useCallback(() => {
    router.push("/progress");
  }, [router]);

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Dashboard"
        title="Interview Command Center"
        description="A focused cockpit for practice momentum, revision, tracks, and sprint execution."
      />

      <OnboardingWalkthrough />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {isLoading && <DashboardSkeleton />}
        {hasError && typeof hasError === "string" && <ErrorState message={hasError} />}

        {!isLoading && !hasError && (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <PremiumSurface className="relative overflow-hidden p-5 sm:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.14),transparent_38%),linear-gradient(45deg,transparent_55%,rgba(59,130,246,0.10))]" />
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-wrap items-start gap-5">
                  {auth.user ? (
                    <>
                      <Avatar className="size-14 shrink-0 border-2 border-success/30 shadow-sm">
                        {auth.user.photoURL && <AvatarImage src={auth.user.photoURL} alt={auth.user.displayName ?? "User"} referrerPolicy="no-referrer" />}
                        <AvatarFallback className="bg-secondary text-lg text-success">
                          {(auth.user.displayName || auth.user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                          <Sparkles className="size-3" />
                          Smart prep overview
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                          {auth.user.displayName ? `Welcome back, ${auth.user.displayName.split(" ")[0]}` : "Welcome back"}
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                          {stats.total} coding problems, {allResources.length} track resources, and your most important next action in one place.
                        </p>
                        {streak > 0 && (
                          <div className="mt-3">
                            <AnimatedStreak streak={streak} />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex size-14 items-center justify-center rounded-md border border-success/20 bg-success/10 text-success">
                        <Target className="size-6" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                          <Sparkles className="size-3" />
                          Smart prep overview
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Welcome to Interview Tracly</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Sign in to unlock personalized progress, revision signals, and sprint planning.</p>
                      </div>
                    </>
                  )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3 shadow-sm">
                      <div className="text-2xl font-semibold tracking-tight text-success tabular-nums">{stats.solved}</div>
                      <div className="text-xs text-muted-foreground">Solved problems</div>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3 shadow-sm">
                      <div className="text-2xl font-semibold tracking-tight text-info tabular-nums">{stats.attempted}</div>
                      <div className="text-xs text-muted-foreground">Attempted</div>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3 shadow-sm">
                      <div className="text-2xl font-semibold tracking-tight text-warning tabular-nums">{stats.bookmarked}</div>
                      <div className="text-xs text-muted-foreground">Bookmarked</div>
                    </div>
                  </div>
                  {auth.user && achievements.length > 0 && (
                    <div className="mt-3">
                      <AchievementBadges achievements={achievements} />
                    </div>
                  )}
                </div>
                {stats.total > 0 && (
                  <div className="relative mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Overall Progress</span>
                      <span>{solvedPercent}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-secondary/80"
                      role="progressbar"
                      aria-valuenow={solvedPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Overall progress"
                    >
                      <div className="h-full rounded-full bg-gradient-to-r from-success via-info to-warning transition-all duration-500" style={{ width: `${solvedPercent}%` }} />
                    </div>
                  </div>
                )}
                {auth.user && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Daily Goal</span>
                        <span className="font-medium text-foreground tabular-nums">{dailySolved}/{goalSettings.dailyTarget}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
                        <div className="h-full rounded-full bg-info transition-all duration-500" style={{ width: `${dailyGoalPct}%` }} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Weekly Goal</span>
                        <span className="font-medium text-foreground tabular-nums">{weeklySolved}/{goalSettings.weeklyTarget}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
                        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${weeklyGoalPct}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </PremiumSurface>

              <PremiumSurface className="p-5">
                <SectionHeader
                  eyebrow={nextFocus.label}
                  title={nextFocus.title}
                  description={nextFocus.description}
                  icon={nextFocus.icon}
                  action={<CommandLink href={nextFocus.href}>Open</CommandLink>}
                  className="mb-5"
                />
                <div className={`mb-5 flex items-center gap-3 rounded-lg border p-3 shadow-sm ${nextFocus.tone}`}>
                  <nextFocus.icon className="size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Recommended next action</p>
                    <p className="truncate text-[11px] opacity-80">{nextFocus.description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <ProgressRingChart
                      segments={ringSegments}
                      size={140}
                      strokeWidth={20}
                      onSegmentClick={handleDifficultyClick}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-foreground">{stats.solved}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">/ {stats.total}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress</h3>
                    <div className="space-y-2 text-xs">
                      {ringSegments.map((s) => {
                        const pct = s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0;
                        return (
                          <div key={s.name} className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">{s.name}</span>
                              <span className="text-card-foreground font-medium tabular-nums">{s.solved}/{s.total}</span>
                            </div>
                            <div
                              className="h-1.5 overflow-hidden rounded-full bg-secondary/80"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${s.name} progress`}
                            >
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <CommandLink href="/progress" className="mt-2">Full stats</CommandLink>
                  </div>
                </div>
              </PremiumSurface>
            </div>

            {/* Row 2: Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Problem mastery" value={`${solvedPercent}%`} detail={`${stats.solved} of ${stats.total} solved`} icon={Trophy} tone="success" />
              <MetricCard label="Learning tracks" value={`${resourceCompletion}%`} detail={`${allResources.length} resources mapped`} icon={BookOpen} tone="info" />
              <MetricCard label="Revision queue" value={revisionItems.length} detail="Due, overdue, and upcoming" icon={RotateCcw} tone="warning" />
              <MetricCard label="Active sprint" value={activeSprint ? "Live" : "None"} detail={activeSprint?.name ?? "Create a focused sprint"} icon={Kanban} tone={activeSprint ? "success" : "rose"} />
            </div>

            {/* Row 3: Activity Heatmap */}
            <section>
              <Heatmap uid={auth.user?.uid} />
              {auth.user && (
                <div className="mt-1 text-right">
                  <Link href="/progress" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    View full history <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </section>

            {/* Row 4: Continue Solving + Recent Activity */}
            <div className="grid gap-4 lg:grid-cols-2">
              <PremiumSurface interactive className="p-5">
                <SectionHeader eyebrow="Momentum" title="Continue Solving" icon={Play} className="mb-3" />
                {lastAttempted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-success/20 bg-success/15 text-success">
                        <Play className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-success uppercase tracking-wider">Last Attempted</div>
                        <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{lastAttempted.problem.title}</div>
                      </div>
                      <DifficultyBadge difficulty={lastAttempted.problem.difficulty} />
                    </div>
                    <CommandLink href="/problems">Resume</CommandLink>
                  </div>
                ) : lastSolved ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-success/20 bg-success/15 text-success">
                        <Play className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Last Solved</div>
                        <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{lastSolved.problem.title}</div>
                      </div>
                      <DifficultyBadge difficulty={lastSolved.problem.difficulty} />
                    </div>
                    <CommandLink href="/problems">Solve another</CommandLink>
                  </div>
                ) : (
                  <Link href="/problems" className="group block">
                    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-foreground/20">
                      <p className="text-sm text-muted-foreground">Start solving your first problem</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-success group-hover:text-success">
                        Browse Problems <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                )}
                {lastSolved && lastAttempted && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3 text-success" />
                      Last solved: {formatRelativeTime(lastSolved.date)}
                    </div>
                  </div>
                )}
              </PremiumSurface>

              <PremiumSurface interactive className="p-5">
                <SectionHeader
                  eyebrow="Signal"
                  title="Recent Activity"
                  icon={CheckCircle2}
                  action={recentSolved.length > 0 ? <CommandLink href="/progress" className="text-muted-foreground hover:text-foreground">View all</CommandLink> : null}
                  className="mb-3"
                />
                {recentSolved.length > 0 ? (
                  <ul className="space-y-2">
                    {recentSolved.map((entry) => (
                      <li key={entry.problem.problemId}>
                        <a
                          href={entry.problem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">{entry.problem.title}</div>
                            <div className="text-xs text-muted-foreground">{formatRelativeTime(entry.date)}</div>
                          </div>
                          <DifficultyBadge difficulty={entry.problem.difficulty} />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">No solved problems yet</p>
                    <Link href="/problems" className="mt-2 inline-flex items-center gap-1 text-xs text-success hover:text-success">
                      Start solving <ArrowRight className="size-3" />
                    </Link>
                  </div>
                )}
              </PremiumSurface>
            </div>

            {/* Row 5: Difficulty Breakdown + Company Progress */}
            <div className="grid gap-4 lg:grid-cols-2">
              <PremiumSurface interactive className="p-5">
                <SectionHeader eyebrow="Coverage" title="Difficulty Breakdown" icon={BarChart3} className="mb-3" />
                {ringSegments.some((s) => s.solved > 0) ? (
                  <div className="space-y-3">
                    {ringSegments.map((seg) => {
                      const percent = seg.total > 0 ? Math.round((seg.solved / seg.total) * 100) : 0;
                      return (
                        <Link
                          key={seg.name}
                          href={`/progress`}
                          className={`block rounded-lg border p-3 transition-colors hover:opacity-80 ${difficultyColors[seg.name] || "bg-secondary/50 border-border text-foreground"}`}
                        >
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium">{seg.name}</span>
                            <span>{seg.solved}/{seg.total} ({percent}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${difficultyBarColors[seg.name] || "bg-success"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No solved problems yet</p>
                )}
              </PremiumSurface>

              <PremiumSurface interactive className="p-5">
                <SectionHeader eyebrow="Readiness" title="Company Progress" icon={Target} className="mb-3" />
                {topCompanies.length > 0 ? (
                  <div className="space-y-3">
                    {topCompanies.map((company) => {
                      const percent = company.total > 0 ? Math.round((company.solved / company.total) * 100) : 0;
                      return (
                        <Link
                          key={company.name}
                          href={`/problems`}
                          className="block rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            <CompanyLogo company={company.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-card-foreground truncate text-sm">{company.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{company.solved} solved</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className="h-2 rounded-full bg-secondary overflow-hidden"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${company.name} progress`}
                          >
                            <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : stats.companyStats.length > 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Start solving problems from different companies</p>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No company data available</p>
                )}
              </PremiumSurface>
            </div>

            {/* Row 5b: Radar Chart + Readiness Gauge + Next Up */}
            <div className="grid gap-4 lg:grid-cols-3">
              {topicStrengths.length >= 3 && (
                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur flex flex-col items-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Topic Radar</p>
                  <WeaknessRadarChart topics={topicStrengths} size={180} />
                </div>
              )}
              <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur flex flex-col items-center justify-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Readiness</p>
                <ReadinessGauge score={solvedPercent} size={130} />
                <Link href="/readiness" className="mt-2 inline-flex items-center gap-1 text-[10px] text-info hover:text-info/80 transition-colors">
                  Full report <ArrowRight className="size-3" />
                </Link>
              </div>
              <NextUpQueue problems={nextUpProblems} />
            </div>

            {/* Active Sprint + Quick Actions */}
            {activeSprint ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ActiveSprintWidget sprint={activeSprint} uid={auth.user?.uid} />
                {renderQuickActions(true)}
              </div>
            ) : (
              renderQuickActions()
            )}

            {/* Daily Mission */}
            <DailyMissionWidget
              uid={auth.user?.uid}
              sprintId={activeSprint?.id}
              revisionItems={revisionItems}
              onRevisionAction={(problemId, action) => {
                if (action === "review") revisionTracker.markReviewed(problemId);
                else revisionTracker.markSkipped(problemId);
              }}
            />

            {/* Track Progress + Bookmarks */}
            {allResources.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <PremiumSurface interactive className="p-5">
                  <SectionHeader
                    eyebrow="Learning system"
                    title="Track Progress"
                    description="Knowledge resources organized by preparation track."
                    icon={BookOpen}
                    action={<CommandLink href="/tracks" className="text-muted-foreground hover:text-foreground">View all</CommandLink>}
                    className="mb-4"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tracks.map((track) => {
                      const trackResources = allResources.filter((r) => r.track === track.id);
                      const total = trackResources.length;
                      if (total === 0) return null;
                      const completed = trackResources.filter((r) => resourceProgress[r.id]?.status === "completed").length;
                      const pct = Math.round((completed / total) * 100);
                      return (
                        <Link
                          key={track.id}
                          href={`/tracks/${track.id}`}
                          className="group rounded-lg border border-border bg-background p-3 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-lg">{track.icon}</span>
                            <span className={`text-sm font-medium ${track.color}`}>{track.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{completed}/{total}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">{pct}% complete</div>
                        </Link>
                      );
                    })}
                  </div>
                </PremiumSurface>
                <FavoriteResourcesWidget />
              </div>
            ) : (
              <FavoriteResourcesWidget />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

const ActiveSprintWidget = ({ sprint, uid }: { sprint: Sprint; uid?: string | null }) => {
  const { tasks, todoTasks, inProgressTasks, doneTasks, taskStats, updateTaskStatus } = useSprintTasks(uid, sprint.id);
  const pct = taskStats.completion;

  const todayDue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => t.dueDate && t.dueDate <= today && t.status !== "done");
  }, [tasks]);

  return (
    <PremiumSurface interactive className="p-5">
      <SectionHeader
        eyebrow="Active sprint"
        title={sprint.name}
        description={sprint.goal || "Current focused preparation sprint"}
        icon={Kanban}
        action={<CommandLink href="/sprints" className="text-muted-foreground hover:text-foreground">View Sprint</CommandLink>}
        className="mb-3"
      />

      {todayDue.length > 0 && (
        <div className="mb-3 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
          <p className="text-[10px] text-warning font-medium mb-1">
            {todayDue.length} task{todayDue.length !== 1 ? "s" : ""} due today or overdue
          </p>
          <div className="space-y-1">
            {todayDue.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => updateTaskStatus(t.id, "done")}
                  className="size-3.5 rounded border border-muted-foreground/30 hover:border-success hover:bg-success/20 transition-all shrink-0 flex items-center justify-center"
                  aria-label="Mark as done"
                />
                <span className="flex-1 truncate text-muted-foreground">{t.title}</span>
              </div>
            ))}
            {todayDue.length > 3 && (
              <p className="text-[10px] text-muted-foreground/50">+{todayDue.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative size-12 shrink-0">
            <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${pct * 0.873} 87.3`}
                className="text-success"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{pct}%</span>
          </div>
          <div className="flex gap-3 text-xs">
            <div><span className="font-medium text-muted-foreground">{todoTasks.length}</span><span className="text-muted-foreground/60 ml-1">todo</span></div>
            <div><span className="font-medium text-warning">{inProgressTasks.length}</span><span className="text-muted-foreground/60 ml-1">active</span></div>
            <div><span className="font-medium text-success">{doneTasks.length}</span><span className="text-muted-foreground/60 ml-1">done</span></div>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-right text-xs">
          <div className="text-lg font-bold text-foreground">{doneTasks.length}/{taskStats.total}</div>
          <div className="text-muted-foreground">tasks done</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {inProgressTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">In Progress</p>
          {inProgressTasks.slice(0, 3).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => updateTaskStatus(t.id, "done")}
                className="size-3.5 rounded border border-muted-foreground/30 hover:border-success hover:bg-success/20 transition-all shrink-0 flex items-center justify-center"
                aria-label="Mark as done"
              />
              <span className="flex-1 truncate text-foreground">{t.title}</span>
              {t.estimatedHours ? (
                <span className="text-[10px] text-muted-foreground/50">{t.estimatedHours}h</span>
              ) : null}
            </div>
          ))}
          {inProgressTasks.length > 3 && (
            <p className="text-[10px] text-muted-foreground/50">+{inProgressTasks.length - 3} more</p>
          )}
        </div>
      )}
    </PremiumSurface>
  );
};

export default DashboardPage;

"use client";

import { useMemo, useState, useCallback } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, CheckCircle2, Circle, Clock, RotateCcw, Search, X, AlertTriangle } from "lucide-react";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import ErrorState from "@/components/states/ErrorState";
import { TableSkeleton } from "@/components/states/PageSkeletons";
import CompanyLogo from "@/components/data-display/CompanyLogo";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import { ProgressRingChart } from "@/app/components/ProgressRingChart";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useResources } from "@/hooks/useResources";
import { useResourceProgress } from "@/hooks/useResourceProgress";
import { useGoals } from "@/hooks/useGoals";
import { useStudySessions } from "@/hooks/useStudySessions";
import { useRevisionTracker } from "@/hooks/useRevisionTracker";
import { useSprints } from "@/hooks/useSprints";
import { useWeeklyInsights } from "@/hooks/useWeeklyInsights";
import { WeeklyInsightsHero } from "@/app/components/WeeklyInsightsHero";
import { StrengthsWeaknesses } from "@/app/components/StrengthsWeaknesses";
import { RecommendationsPanel } from "@/app/components/RecommendationsPanel";
import { CareerMilestones } from "@/app/components/CareerMilestones";
import { computeBurndown, computePace } from "@/lib/burndown";
import { BUILTIN_COLLECTIONS } from "@/lib/builtinCollections";
import type { Problem, UserProblemProgress } from "@/lib/progressTypes";
import type { ActionItem } from "@/hooks/useInterviewReadiness";
import { toast } from "sonner";

type ProgressEntry = {
  problem: Problem;
  progress: UserProblemProgress;
  lastAction: string;
  lastDate: Date;
};

type SortField = "lastSubmitted" | "title" | "difficulty";
type SortOrder = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50] as const;

const ProgressPage = () => {
  const { auth, progress, questionsState, unifiedProblems } = useProblemWorkspaceData();
  const stats = useDashboardStats(unifiedProblems.length > 0 ? unifiedProblems : questionsState.questions, progress.progressMap);
  const { resources: allResources } = useResources(auth.user?.uid);
  const { progressMap: resourceProgress } = useResourceProgress(auth.user?.uid);
  const { sessions } = useStudySessions();
  const { settings: goalSettings } = useGoals();
  const { sprints } = useSprints(auth.user?.uid);
  const allQuestions = unifiedProblems.length > 0 ? unifiedProblems : questionsState.questions;
  const revisionTracker = useRevisionTracker(progress.progressMap, allQuestions);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("lastSubmitted");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);

  const burndown = useMemo(
    () => computeBurndown(progress.progressMap, goalSettings.targetTotal, goalSettings.targetDate),
    [progress.progressMap, goalSettings.targetTotal, goalSettings.targetDate]
  );
  const pace = useMemo(
    () => computePace(progress.progressMap, goalSettings.targetDate, goalSettings.targetTotal),
    [progress.progressMap, goalSettings.targetDate, goalSettings.targetTotal]
  );

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("desc");
      return field;
    });
    setCurrentPage(1);
  }, []);

  const entries = useMemo(() => {
    const result: ProgressEntry[] = [];
    const lookup = allQuestions;
    for (const [problemId, p] of Object.entries(progress.progressMap)) {
      if (!p.solved && !p.attempted) continue;
      const problem = lookup.find((q) => q.problemId === problemId);
      if (!problem) continue;
      const lastDate = p.solvedAt
        ? new Date(p.solvedAt.seconds * 1000)
        : p.attemptedAt
          ? new Date(p.attemptedAt.seconds * 1000)
          : new Date(p.updatedAt.seconds * 1000);
      result.push({
        problem,
        progress: p,
        lastAction: p.solved ? "Accepted" : "Attempted",
        lastDate,
      });
    }
    return result;
  }, [progress.progressMap, allQuestions]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuestions) {
      if (q.company) set.add(q.company);
    }
    return Array.from(set).sort();
  }, [allQuestions]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuestions) {
      for (const t of q.topics) if (t) set.add(t);
    }
    return Array.from(set).sort();
  }, [allQuestions]);

  const filtered = useMemo(() => {
    let result = entries;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((e) => e.problem.title.toLowerCase().includes(q));
    }
    if (difficultyFilter !== "all") {
      result = result.filter((e) => e.problem.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }
    if (statusFilter === "solved") {
      result = result.filter((e) => e.progress.solved);
    } else if (statusFilter === "attempted") {
      result = result.filter((e) => e.progress.attempted && !e.progress.solved);
    } else if (statusFilter === "unsolved") {
      result = result.filter((e) => !e.progress.solved);
    }
    if (companyFilter !== "all") {
      result = result.filter((e) => e.problem.company === companyFilter);
    }
    if (topicFilter !== "all") {
      result = result.filter((e) => e.problem.topics.includes(topicFilter));
    }
    return result;
  }, [entries, debouncedSearch, difficultyFilter, statusFilter, companyFilter, topicFilter]);

  const sorted = useMemo(() => {
    const result = [...filtered];
    result.sort((a, b) => {
      let cmp: number;
      switch (sortField) {
        case "title":
          cmp = a.problem.title.localeCompare(b.problem.title);
          break;
        case "difficulty": {
          const order = { Easy: 1, Medium: 2, Hard: 3 };
          cmp = (order[a.problem.difficulty as keyof typeof order] || 0) - (order[b.problem.difficulty as keyof typeof order] || 0);
          break;
        }
        default:
          cmp = a.lastDate.getTime() - b.lastDate.getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return result;
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return sorted.slice(from, from + pageSize);
  }, [sorted, currentPage, pageSize]);

  const totalSubmissions = entries.length;
  const acceptedCount = entries.filter((e) => e.progress.solved).length;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;

  const { solvedThisWeek, solvedThisMonth } = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    let week = 0;
    let month = 0;
    for (const e of entries) {
      if (e.progress.solved && e.progress.solvedAt) {
        const t = e.progress.solvedAt.seconds * 1000;
        if (t >= weekAgo) week++;
        if (t >= monthAgo) month++;
      }
    }
    return { solvedThisWeek: week, solvedThisMonth: month };
  }, [entries]);

  const resourceStats = useMemo(() => {
    const total = allResources.length;
    const completed = allResources.filter((r) => resourceProgress[r.id]?.status === "completed").length;
    const inProgress = allResources.filter((r) => resourceProgress[r.id]?.status === "in-progress").length;
    const inRevision = allResources.filter((r) => resourceProgress[r.id]?.inRevisionList).length;
    const easy = allResources.filter((r) => r.difficulty === "Easy").length;
    const medium = allResources.filter((r) => r.difficulty === "Medium").length;
    const hard = allResources.filter((r) => r.difficulty === "Hard").length;
    return { total, completed, inProgress, inRevision, easy, medium, hard };
  }, [allResources, resourceProgress]);

  const { currentStreak, maxStreak } = useMemo(() => {
    const solvedDates = new Set<string>();
    for (const e of entries) {
      if (e.progress.solved && e.progress.solvedAt) {
        solvedDates.add(new Date(e.progress.solvedAt.seconds * 1000).toISOString().slice(0, 10));
      }
    }
    if (solvedDates.size === 0) return { currentStreak: 0, maxStreak: 0 };
    let cur = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (solvedDates.has(d.toISOString().slice(0, 10))) {
        cur++;
      } else {
        break;
      }
    }
    const allDates = Array.from(solvedDates).sort();
    let mx = 0;
    let streak = 0;
    let prevDate: Date | null = null;
    for (const dateStr of allDates) {
      const d = new Date(dateStr);
      if (prevDate) {
        const diff = (d.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
        if (diff === 1) streak++;
        else streak = 1;
      } else {
        streak = 1;
      }
      mx = Math.max(mx, streak);
      prevDate = d;
    }
    return { currentStreak: cur, maxStreak: mx };
  }, [entries]);

  const { avgDaily, avgWeekly } = useMemo(() => {
    if (entries.length === 0) return { avgDaily: 0, avgWeekly: 0 };
    const oldest = entries.reduce((min, e) => (e.lastDate < min ? e.lastDate : min), entries[0].lastDate);
    const now = Date.now();
    const days = Math.max(1, Math.ceil((now - oldest.getTime()) / (24 * 60 * 60 * 1000)));
    const weeks = Math.max(1, Math.ceil((now - oldest.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    return {
      avgDaily: Math.round((totalSubmissions / days) * 10) / 10,
      avgWeekly: Math.round((totalSubmissions / weeks) * 10) / 10,
    };
  }, [entries, totalSubmissions]);

  const insights = useMemo(() => {
    const topicStats = new Map<string, { solved: number; total: number }>();
    for (const e of entries) {
      for (const t of e.problem.topics) {
        if (!t) continue;
        const s = topicStats.get(t) || { solved: 0, total: 0 };
        s.total++;
        if (e.progress.solved) s.solved++;
        topicStats.set(t, s);
      }
    }
    const topicEntries = Array.from(topicStats.entries()).map(([name, s]) => ({
      name, rate: s.total > 0 ? s.solved / s.total : 0, solved: s.solved, total: s.total,
    }));
    const sortedByRate = [...topicEntries].sort((a, b) => b.rate - a.rate);
    const strongest = sortedByRate.filter((t) => t.total >= 2).slice(0, 3);
    const weakest = sortedByRate.filter((t) => t.total >= 2).reverse().slice(0, 3);
    const companyCount = new Map<string, number>();
    for (const e of entries) {
      if (e.problem.company) {
        companyCount.set(e.problem.company, (companyCount.get(e.problem.company) || 0) + 1);
      }
    }
    const topCompany = Array.from(companyCount.entries()).sort((a, b) => b[1] - a[1])[0];
    const avgAttempts = entries.length > 0 ? Math.round((totalSubmissions / entries.length) * 10) / 10 : 0;
    return { strongest, weakest, topCompany: topCompany?.[0] || null, topCompanyCount: topCompany?.[1] || 0, avgAttempts };
  }, [entries, totalSubmissions]);

  const monthlyTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const e of entries) {
      const monthKey = `${e.lastDate.getFullYear()}-${String(e.lastDate.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [entries]);

  const ringSegments = useMemo(() => {
    const colorMap: Record<string, string> = { Easy: "var(--color-success)", Medium: "var(--color-warning)", Hard: "var(--color-destructive)" };
    return stats.difficultyStats.map((d) => ({
      name: d.name, total: d.total, solved: d.solved, color: colorMap[d.name] || "var(--color-info)",
    }));
  }, [stats.difficultyStats]);

  const readinessScore = useMemo(() => {
    if (entries.length === 0) return 0;
    const topicCoverage = insights.strongest.length > 0 ? 60 : 30;
    const difficultyBalance = stats.difficultyStats.some((d) => d.solved > 0) ? 70 : 0;
    const consistency = currentStreak > 0 ? Math.min(100, (currentStreak / 30) * 100) : 0;
    const revisionScore = revisionTracker.stats.total > 0
      ? Math.round((revisionTracker.stats.completed / revisionTracker.stats.total) * 100)
      : 0;
    return Math.round(
      topicCoverage * 0.3 + difficultyBalance * 0.25 + consistency * 0.25 + revisionScore * 0.2
    );
  }, [entries, insights, stats.difficultyStats, currentStreak, revisionTracker.stats]);

  const readinessLevel = readinessScore >= 90 ? "Excellent" : readinessScore >= 75 ? "Strong Candidate" : readinessScore >= 60 ? "Interview Ready" : readinessScore >= 40 ? "Improving" : "Beginner";

  const baseInsights = useWeeklyInsights(
    progress.progressMap,
    revisionTracker.stats,
    sessions,
    readinessScore,
    readinessLevel,
  );

  const weeklyInsights = useMemo(
    () => ({ ...baseInsights, generatedAt }),
    [baseInsights, generatedAt]
  );

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const now = Date.now();
      setGeneratedAt(now);
      toast.success("Weekly Review Ready", {
        description: "Your career intelligence insights are now up to date.",
        duration: 5000,
      });
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Weekly Review Ready", {
          body: "Your Career Intelligence insights are ready to review.",
          icon: "/favicon.ico",
        });
      }
    }, 1500);
  }, []);

  const completedCollections = useMemo(() => {
    let completed = 0;
    for (const c of BUILTIN_COLLECTIONS) {
      const allSolved = c.problemIds.every((pid) => progress.progressMap[pid]?.solved);
      if (allSolved) completed++;
    }
    return completed;
  }, [progress.progressMap]);

  const hasEntries = entries.length > 0;
  const hasFilteredResults = paginated.length > 0;
  const isLoading = questionsState.loading || progress.loading;
  const hasError = questionsState.error || auth.error || progress.error;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 ml-1 opacity-40" />;
    return sortOrder === "asc" ? <ArrowUp className="size-3 ml-1" /> : <ArrowDown className="size-3 ml-1" />;
  };

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Career Intelligence Center"
        title="Practice History"
        description="Track your progress, discover insights, and understand how you&apos;re improving — with actionable next steps."
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 space-y-6">
        {hasError && typeof hasError === "string" && <ErrorState message={hasError} />}
        {isLoading && <TableSkeleton rows={8} />}

        {!auth.user && !isLoading && (
          <div className="rounded-lg border border-dashed border-border/80 bg-card/70 px-4 py-12 text-center shadow-sm">
            <Clock className="mx-auto size-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Sign in to track your practice history and progress.</p>
          </div>
        )}

        {auth.user && !isLoading && !hasError && (
          <>
            <WeeklyInsightsHero
              data={weeklyInsights}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search problems..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full rounded-md border border-border/70 bg-background/75 py-1.5 pl-8 pr-8 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus:border-success/50 focus:outline-none"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
                    className="rounded-md border border-border/70 bg-background/75 px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-success/50 focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="rounded-md border border-border/70 bg-background/75 px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-success/50 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="solved">Solved</option>
                    <option value="attempted">Attempted</option>
                    <option value="unsolved">Unsolved</option>
                  </select>
                  <select
                    value={companyFilter}
                    onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                    className="max-w-[140px] rounded-md border border-border/70 bg-background/75 px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-success/50 focus:outline-none"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <select
                    value={topicFilter}
                    onChange={(e) => { setTopicFilter(e.target.value); setCurrentPage(1); }}
                    className="max-w-[140px] rounded-md border border-border/70 bg-background/75 px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-success/50 focus:outline-none"
                  >
                    <option value="all">All Topics</option>
                    {topics.slice(0, 30).map((t) => (<option key={t} value={t}>{t}</option>))}
                    {topics.length > 30 && <option disabled>— more —</option>}
                  </select>
                  <span className="text-xs text-muted-foreground ml-auto">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
                </div>

                {hasFilteredResults ? (
                  <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/90 shadow-sm">
                    <table className="w-full text-left text-sm text-foreground" aria-label="Practice history">
                      <thead className="sticky top-0 z-10 border-b border-border/70 bg-card/95 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">
                            <button type="button" onClick={() => toggleSort("lastSubmitted")} className="inline-flex items-center hover:text-foreground transition-colors">
                              Last Submitted <SortIcon field="lastSubmitted" />
                            </button>
                          </th>
                          <th className="px-4 py-3">
                            <button type="button" onClick={() => toggleSort("title")} className="inline-flex items-center hover:text-foreground transition-colors">
                              Problem <SortIcon field="title" />
                            </button>
                          </th>
                          <th className="px-4 py-3">
                            <button type="button" onClick={() => toggleSort("difficulty")} className="inline-flex items-center hover:text-foreground transition-colors">
                              Difficulty <SortIcon field="difficulty" />
                            </button>
                          </th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3">Last Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((entry) => (
                          <tr key={entry.problem.problemId} className="border-b border-border/60 bg-background/35 transition-colors duration-150 hover:bg-accent/40">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(entry.lastDate)}</td>
                            <td className="px-4 py-3 font-medium">
                              <a href={entry.problem.link} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-info transition-colors">
                                {entry.problem.title}
                              </a>
                            </td>
                            <td className="px-4 py-3"><DifficultyBadge difficulty={entry.problem.difficulty} /></td>
                            <td className="px-4 py-3">
                              {entry.problem.company ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <CompanyLogo company={entry.problem.company} size="sm" />
                                  <span className="text-xs text-muted-foreground">{entry.problem.company}</span>
                                </span>
                              ) : (<span className="text-xs text-muted-foreground">—</span>)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${entry.progress.solved ? "text-success" : "text-warning"}`}>
                                {entry.progress.solved ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                                {entry.lastAction}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-card/70 px-4 py-12 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">
                      {!hasEntries ? "No practice history yet. Solve or attempt a problem to start tracking." : "No entries match the current filters."}
                    </p>
                  </div>
                )}

                {hasFilteredResults && (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Rows per page:</span>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="rounded-md border border-border/70 bg-background px-2 py-1 text-foreground focus:outline-none">
                        {PAGE_SIZES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                      <span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-md border border-border/70 bg-background px-2 py-1 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) { pageNum = i + 1; }
                        else if (currentPage <= 3) { pageNum = i + 1; }
                        else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                        else { pageNum = currentPage - 2 + i; }
                        return (<button key={pageNum} type="button" onClick={() => setCurrentPage(pageNum)} className={`rounded-md px-2 py-1 ${currentPage === pageNum ? "bg-success/15 text-success" : "border border-border/70 bg-background text-muted-foreground hover:bg-accent"}`}>{pageNum}</button>);
                      })}
                      <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-border/70 bg-background px-2 py-1 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="w-full lg:w-80 shrink-0 space-y-4">
                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Overall Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Solved</span><span className="text-card-foreground font-medium">{acceptedCount}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Attempted</span><span className="text-card-foreground font-medium">{totalSubmissions - acceptedCount}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Submissions</span><span className="text-card-foreground font-medium">{totalSubmissions}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Acceptance</span><span className="text-success font-medium">{acceptanceRate}%</span></div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Difficulty Breakdown</h3>
                  {ringSegments.some((s) => s.solved > 0) ? (
                    <div className="flex flex-col items-center">
                      <ProgressRingChart segments={ringSegments} size={160} strokeWidth={22} />
                      <div className="flex flex-wrap justify-center gap-3 mt-3">
                        {ringSegments.map((s) => (
                          <div key={s.name} className="flex items-center gap-1.5 text-xs">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-muted-foreground">{s.name}</span>
                            <span className="text-foreground font-medium">{s.solved}/{s.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">No solved problems yet</p>)}
                </div>

                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Monthly Submissions</h3>
                  {monthlyTrend.length > 0 ? (
                    <div className="flex items-end gap-1.5 h-20">
                      {monthlyTrend.map(([month, count]) => {
                        const maxCount = Math.max(...monthlyTrend.map(([, c]) => c));
                        const height = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                        return (
                          <div key={month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{count}</span>
                            <div
                              className="w-full rounded-sm bg-success/60 transition-all duration-500"
                              style={{ height: `${Math.max(height, 4)}%` }}
                              role="progressbar"
                              aria-valuenow={count}
                              aria-valuemin={0}
                              aria-valuemax={maxCount}
                              aria-label={`${month} submissions`}
                            />
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">{month.split("-")[1]}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">No data yet</p>)}
                </div>

                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recent Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-lg font-bold text-success">{solvedThisWeek}</div><div className="text-xs text-muted-foreground">This Week</div></div>
                    <div><div className="text-lg font-bold text-success">{solvedThisMonth}</div><div className="text-xs text-muted-foreground">This Month</div></div>
                    <div><div className="text-lg font-bold text-warning">{currentStreak}</div><div className="text-xs text-muted-foreground">Current Streak</div></div>
                    <div><div className="text-lg font-bold text-foreground">{maxStreak}</div><div className="text-xs text-muted-foreground">Max Streak</div></div>
                    <div><div className="text-lg font-bold text-foreground">{avgDaily}</div><div className="text-xs text-muted-foreground">Avg Daily</div></div>
                    <div><div className="text-lg font-bold text-foreground">{avgWeekly}</div><div className="text-xs text-muted-foreground">Avg / Week</div></div>
                  </div>
                </div>

                <div className={`rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${!pace.onTrack ? "border-warning/30" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Burn-down</h3>
                    {!pace.onTrack && <AlertTriangle className="size-3.5 text-warning" />}
                  </div>
                  {burndown.points.length > 0 ? (
                    <div className="space-y-2">
                      <svg viewBox="0 0 300 120" className="w-full h-auto">
                        <line x1="20" y1="100" x2="280" y2="100" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
                        <line x1="20" y1="30" x2="20" y2="100" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
                        {burndown.points.length > 1 && (
                          <line x1="20" y1="30" x2="280" y2="100" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 2" />
                        )}
                        {burndown.points.map((p, i) => {
                          const x = 20 + (i / Math.max(burndown.points.length - 1, 1)) * 260;
                          const yMax = burndown.points[0]?.problemsRemaining || 150;
                          const h = yMax > 0 ? (p.problemsRemaining / yMax) * 70 : 0;
                          const y = 100 - h;
                          const next = burndown.points[i + 1];
                          return (
                            <g key={p.day}>
                              {next && (
                                <line x1={x} y1={y} x2={20 + ((i + 1) / Math.max(burndown.points.length - 1, 1)) * 260}
                                  y2={100 - ((next.problemsRemaining / yMax) * 70)} stroke="hsl(var(--success))" strokeWidth="2" />
                              )}
                              <circle cx={x} cy={y} r="3" fill="hsl(var(--success))" className="drop-shadow-sm" />
                            </g>
                          );
                        })}
                      </svg>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Remaining</span><br /><span className="text-lg font-bold tabular-nums">{burndown.remaining}</span></div>
                        <div><span className="text-muted-foreground">Pace</span><br />
                          <span className={`text-sm font-medium ${pace.onTrack ? "text-success" : "text-warning"}`}>
                            {pace.onTrack ? "On track" : `${pace.neededPerDay}/day needed`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Not enough data yet</p>
                  )}
                </div>

                {resourceStats.total > 0 && (
                  <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Knowledge Base</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="size-4 text-info shrink-0" />
                        <span className="text-muted-foreground">Resources</span>
                        <span className="ml-auto text-card-foreground font-medium">{resourceStats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="text-success font-medium">{resourceStats.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">In Progress</span>
                        <span className="text-warning font-medium">{resourceStats.inProgress}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">In Revision</span>
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                          <RotateCcw className="size-3" />
                          {resourceStats.inRevision}
                        </span>
                      </div>
                      {resourceStats.total > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> {resourceStats.easy}E</span>
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" /> {resourceStats.medium}M</span>
                            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-error" /> {resourceStats.hard}H</span>
                          </div>
                          <div className="flex gap-1 mt-1.5 h-1.5">
                            {(() => {
                              const maxV = Math.max(resourceStats.easy, resourceStats.medium, resourceStats.hard, 1);
                              return (
                                <>
                                  <div className="bg-success rounded-l-full" style={{ width: `${(resourceStats.easy / maxV) * 100}%` }} />
                                  <div className="bg-warning" style={{ width: `${(resourceStats.medium / maxV) * 100}%` }} />
                                  <div className="bg-error rounded-r-full" style={{ width: `${(resourceStats.hard / maxV) * 100}%` }} />
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Practice Insights</h3>
                  {entries.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {insights.strongest.length > 0 && (
                        <div><div className="text-muted-foreground mb-1">Strongest Topics</div>
                          {insights.strongest.map((t) => (
                            <div key={t.name} className="flex justify-between text-foreground"><span className="truncate">{t.name}</span><span className="text-success shrink-0 ml-2">{Math.round(t.rate * 100)}%</span></div>
                          ))}
                        </div>
                      )}
                      {insights.weakest.length > 0 && (
                        <div><div className="text-muted-foreground mb-1">Weakest Topics</div>
                          {insights.weakest.map((t) => (
                            <div key={t.name} className="flex justify-between text-foreground"><span className="truncate">{t.name}</span><span className="text-destructive shrink-0 ml-2">{Math.round(t.rate * 100)}%</span></div>
                          ))}
                        </div>
                      )}
                      {insights.topCompany && (
                        <div><div className="text-muted-foreground mb-1">Most Practiced Company</div>
                          <div className="text-foreground inline-flex items-center gap-1.5"><CompanyLogo company={insights.topCompany} size="sm" /> {insights.topCompany} ({insights.topCompanyCount} problem{insights.topCompanyCount !== 1 ? "s" : ""})</div>
                        </div>
                      )}
                      <div><div className="text-muted-foreground mb-1">Avg Attempts per Problem</div><div className="text-foreground">{insights.avgAttempts}</div></div>
                    </div>
                  ) : (<p className="text-sm text-muted-foreground text-center py-2">No data to analyze</p>)}
                </div>
              </aside>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <StrengthsWeaknesses
                weakTopics={insights.weakest.map((t) => ({
                  topic: t.name,
                  total: t.total,
                  solved: t.solved,
                  completion: Math.round(t.rate * 100),
                  daysSinceLastSolved: 0,
                }))}
                patternCoverage={[]}
                strongestTopics={insights.strongest}
              />
              <RecommendationsPanel
                actionPlan={(() => {
                  const actions: ActionItem[] = [];
                  if (insights.weakest.length > 0) {
                    for (const t of insights.weakest.slice(0, 2)) {
                      actions.push({
                        id: `solve-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
                        type: "solve",
                        description: `Solve more ${t.name} problems`,
                        explanation: `${t.name} is at ${Math.round(t.rate * 100)}% completion — practice more to improve.`,
                        priority: "high",
                      });
                    }
                  }
                  if (revisionTracker.stats.overdue > 0) {
                    actions.push({
                      id: "revise-overdue",
                      type: "revise",
                      description: `Revise ${revisionTracker.stats.overdue} overdue problem${revisionTracker.stats.overdue > 1 ? "s" : ""}`,
                      explanation: `${revisionTracker.stats.overdue} problem${revisionTracker.stats.overdue > 1 ? "s are" : " is"} past revision interval.`,
                      priority: "high",
                    });
                  }
                  return actions;
                })()}
              />
            </div>

            <CareerMilestones
              currentStreak={currentStreak}
              totalSolved={acceptedCount}
              sprints={sprints}
              completedCollections={completedCollections}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ProgressPage;

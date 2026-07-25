"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileDown, Github, Monitor, Moon, RotateCcw, Settings2, Sun, Trash2, User as UserIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import ErrorState from "@/components/states/ErrorState";
import { SettingsSkeleton } from "@/components/states/PageSkeletons";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ProfileStatusChart from "@/app/components/ProfileStatusChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadCodingPrefs, saveCodingPrefs, COMPANIES, SHEET_OPTIONS, SORT_OPTIONS, PAGE_SIZE_OPTIONS } from "@/lib/codingPreferences";
import type { CodingPrefs } from "@/lib/codingPreferences";

const ACCENT_COLORS = [
  { label: "Green", value: "#22c55e", class: "bg-success" },
  { label: "Blue", value: "#3b82f6", class: "bg-info" },
  { label: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { label: "Orange", value: "#f97316", class: "bg-orange-500" },
];

const GOAL_STORAGE_KEY = "goal-settings";

function loadGoal(key: "weeklyTarget" | "dailyTarget", defaultVal: number): number {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!raw) return defaultVal;
    return JSON.parse(raw)[key] ?? defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveGoal(weekly: number, daily: number) {
  try {
    const existing = JSON.parse(localStorage.getItem(GOAL_STORAGE_KEY) || "{}");
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify({ ...existing, weeklyTarget: weekly, dailyTarget: daily }));
  } catch {
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify({ weeklyTarget: weekly, dailyTarget: daily }));
    } catch {}
  }
}

function getStoredAccent(): string {
  if (typeof window === "undefined") return "#22c55e";
  return localStorage.getItem("interview-tracly-accent") || "#22c55e";
}

type TabId = "profile" | "preferences";

const SettingsContent = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { auth, progress, questionsState } = useProblemWorkspaceData();
  const { mode, setMode, effective } = useTheme();
  const [accent, setAccent] = useState<string>(getStoredAccent);
  const [tab, setTab] = useState<TabId>("preferences");

  useEffect(() => {
    if (tabParam === "profile" || tabParam === "preferences") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const handleAccentChange = useCallback((color: string) => {
    setAccent(color);
    localStorage.setItem("interview-tracly-accent", color);
    document.documentElement.style.setProperty("--accent-color", color);
  }, []);

  const [weeklyGoal, setWeeklyGoal] = useState(() => loadGoal("weeklyTarget", 10));
  const [dailyGoal, setDailyGoal] = useState(() => loadGoal("dailyTarget", 3));
  const updateGoal = useCallback((w: number, d: number) => {
    setWeeklyGoal(w);
    setDailyGoal(d);
    saveGoal(w, d);
  }, []);

  const [prefs, setPrefs] = useState<CodingPrefs>(loadCodingPrefs);
  const updatePref = useCallback(<K extends keyof CodingPrefs>(key: K, value: CodingPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveCodingPrefs(next);
      return next;
    });
  }, []);

  const [heatmapVisible, setHeatmapVisible] = useState(true);

  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportScope, setExportScope] = useState<"progress" | "full">("progress");

  const totalSolved = useMemo(
    () => Object.values(progress.progressMap).filter((p) => p.solved).length,
    [progress.progressMap]
  );

  const profileStats = useMemo(() => {
    const entries = Object.values(progress.progressMap);
    const solved = entries.filter((p) => p.solved).length;
    const attempted = entries.filter((p) => p.attempted && !p.solved).length;
    const bookmarked = entries.filter((p) => p.bookmarked && !p.solved && !p.attempted).length;
    const revision = entries.filter((p) => p.inRevisionList).length;
    const total = questionsState.questions.length;
    const completion = total > 0 ? Math.round((solved / total) * 100) : 0;

    const difficultyStats = [
      { label: "Easy", solved: 0, total: 0, color: "bg-success" },
      { label: "Medium", solved: 0, total: 0, color: "bg-warning" },
      { label: "Hard", solved: 0, total: 0, color: "bg-error" },
    ];
    for (const q of questionsState.questions) {
      const d = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase();
      const stat = difficultyStats.find((s) => s.label === d);
      if (stat) {
        stat.total += 1;
        if (progress.progressMap[q.problemId]?.solved) stat.solved += 1;
      }
    }

    const companySolved: { name: string; solved: number }[] = [];
    const companyMap = new Map<string, number>();
    for (const q of questionsState.questions) {
      if (progress.progressMap[q.problemId]?.solved) {
        companyMap.set(q.company, (companyMap.get(q.company) || 0) + 1);
      }
    }
    for (const [name, solved] of companyMap) {
      companySolved.push({ name, solved });
    }
    companySolved.sort((a, b) => b.solved - a.solved);

    let streak = 0;
    const solvedDates = new Set<string>();
    for (const p of entries) {
      if (p.solved && p.solvedAt) {
        solvedDates.add(new Date(p.solvedAt.seconds * 1000).toISOString().slice(0, 10));
      }
    }
    if (solvedDates.size > 0) {
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (solvedDates.has(d.toISOString().slice(0, 10))) {
          streak++;
        } else break;
      }
    }

    return { solved, attempted, bookmarked, revision, total, completion, difficultyStats, companySolved, streak };
  }, [progress.progressMap, questionsState.questions]);

  const handleExport = useCallback(() => {
    if (exportFormat === "json") {
      const studySessions = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("study-sessions") || "[]") : [];
      const cheatSheets = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("cheat-sheets") || "[]") : [];
      const behavioralEntries = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("behavioral-entries") || "[]") : [];
      const exportData = exportScope === "full"
        ? JSON.stringify({
            progressMap: progress.progressMap,
            questions: questionsState.questions,
            preferences: prefs,
            goals: { weeklyTarget: weeklyGoal, dailyTarget: dailyGoal },
            studySessions,
            cheatSheets,
            behavioralEntries,
            exportedAt: new Date().toISOString(),
          }, null, 2)
        : JSON.stringify(progress.progressMap, null, 2);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportScope === "full" ? "interview-tracly-full.json" : "interview-tracly-progress.json";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ["Title", "Difficulty", "Company", "Status", "Solved At", "Notes"];
    const rows: string[][] = [];
    for (const [problemId, p] of Object.entries(progress.progressMap)) {
      const q = questionsState.questions.find((qq) => qq.problemId === problemId);
      const status = p.solved ? "Solved" : p.attempted ? "Attempted" : "Bookmarked";
      const solvedAt = p.solvedAt ? new Date(p.solvedAt.seconds * 1000).toISOString().slice(0, 10) : "";
      const notes = exportScope === "full" ? (p.notes || "") : "";
      rows.push([q?.title || problemId, q?.difficulty || "", q?.company || "", status, solvedAt, notes]);
    }
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-tracly-progress.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportFormat, exportScope, progress, questionsState.questions, prefs, weeklyGoal, dailyGoal]);

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = useCallback(() => {
    if (typeof window === "undefined") return;
    const keys = [
      "coding-preferences", "goal-settings", "cheat-sheets", "behavioral-entries",
      "study-sessions", "goal-history", "revision-progress", "mock-test-history",
      "system-design-notes", "cheat-sheets-seeded", "behavioral-seeded",
      "system-design-seeded", "achievements", "study-reminder-last-check",
      "welcome-seen", "interviewtracly:prefs",
    ];
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    window.location.reload();
  }, []);

  const tabs: { id: TabId; label: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "preferences", label: "Preferences", icon: Settings2 },
  ];

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Settings"
        title="Account & Preferences"
        description="Manage your profile, preferences, and application settings."
      />

      <div className="mx-auto max-w-3xl p-4 sm:px-6 lg:px-8 pb-10">
        {questionsState.error && <ErrorState message={questionsState.error} />}
        {auth.error && typeof auth.error === "string" && <ErrorState message={auth.error} />}
        {progress.error && <ErrorState message={progress.error} />}
        {progress.loading && <SettingsSkeleton />}

        {!progress.loading && (
          <>
            {/* Tab bar */}
            <div className="mb-6 flex gap-1 rounded-lg border border-border/70 bg-card/80 p-1 shadow-sm">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      tab === t.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === "profile" ? (
              /* ── Profile Tab ── */
              <div className="space-y-6">
                {/* Section 1: Identity */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="size-14 shrink-0 border-2 border-border">
                      {auth.user?.photoURL && (
                        <AvatarImage src={auth.user.photoURL} alt={auth.user.displayName ?? "User"} referrerPolicy="no-referrer" />
                      )}
                      <AvatarFallback className="bg-secondary text-base text-foreground">
                        {(auth.user?.displayName || auth.user?.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-foreground truncate">{auth.user?.displayName || "Signed in"}</div>
                      <div className="text-xs text-muted-foreground truncate">{auth.user?.email || "—"}</div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-success" />
                          <span className="font-semibold text-success">{profileStats.solved}</span> solved
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-info" />
                          <span className="font-semibold text-info">{profileStats.attempted}</span> attempted
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-warning" />
                          <span className="font-semibold text-warning">{profileStats.bookmarked}</span> bookmarked
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Key Metrics */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Key Metrics</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Completion", value: `${profileStats.completion}%`, color: "text-success", bg: "bg-success/10 border-success/20" },
                      { label: "Streak", value: `${profileStats.streak} day${profileStats.streak !== 1 ? "s" : ""}`, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
                      { label: "Revision", value: profileStats.revision, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                      { label: "Tracked", value: Object.keys(progress.progressMap).length, color: "text-info", bg: "bg-info/10 border-info/20" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-lg border ${s.bg} p-3 text-center`}>
                        <div className={`text-xl font-bold tabular-nums leading-none ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-1.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {profileStats.total > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Overall Progress</span>
                        <span className="tabular-nums">{profileStats.solved} / {profileStats.total} ({profileStats.completion}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
                        <div className="h-full rounded-full bg-gradient-to-r from-success via-info to-warning transition-all duration-500" style={{ width: `${profileStats.completion}%` }} />
                      </div>
                    </div>
                  )}
                </section>

                {/* Section 3: Visualizations */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Analytics</h2>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Problem Status</h3>
                      <div className="flex justify-center sm:justify-start">
                        <ProfileStatusChart
                          total={profileStats.total}
                          solved={profileStats.solved}
                          attempted={profileStats.attempted}
                          bookmarked={profileStats.bookmarked}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Difficulty Breakdown</h3>
                      <div className="space-y-5">
                        {(() => {
                          const diffs = profileStats.difficultyStats.filter((d) => d.total > 0);
                          return diffs.length > 0 ? diffs.map((d) => {
                            const pct = Math.round((d.solved / d.total) * 100);
                            return (
                              <div key={d.label}>
                                <div className="flex items-center justify-between text-xs mb-2">
                                  <span className="font-semibold text-foreground">{d.label}</span>
                                  <span className="tabular-nums text-muted-foreground">
                                    <span className="font-medium text-foreground">{d.solved}</span>
                                    <span className="text-muted-foreground/50 mx-0.5">/</span>
                                    <span>{d.total}</span>
                                    <span className="text-muted-foreground/50 ml-1.5">({pct}%)</span>
                                  </span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-secondary/60">
                                  <div className={`h-full rounded-full ${d.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No problem data yet</p>
                          );
                        })()}
                      </div>
                      {profileStats.companySolved.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Top Companies</h3>
                          <div className="space-y-2">
                            {profileStats.companySolved.slice(0, 5).map((c) => (
                              <div key={c.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                                <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">{c.solved} solved</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* ── Preferences Tab ── */
              <div className="space-y-8">
                {/* Appearance */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-base font-semibold text-foreground mb-4">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-card-foreground">Theme</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {mode === "system"
                          ? `Following system preference (${effective === "dark" ? "Dark" : "Light"})`
                          : `Manually set to ${mode === "dark" ? "Dark" : "Light"} mode`}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {[
                          { value: "light" as const, label: "Light", icon: Sun },
                          { value: "dark" as const, label: "Dark", icon: Moon },
                          { value: "system" as const, label: "System", icon: Monitor },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setMode(value)}
                            className={`cursor-pointer flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all ${
                              mode === value
                                ? "border-success/50 bg-success/10 text-success font-medium"
                                : "border-border bg-secondary text-muted-foreground hover:border-border hover:bg-accent"
                            }`}
                          >
                            <Icon className="size-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Accent Color</div>
                        <div className="text-xs text-muted-foreground">Customize the primary accent color</div>
                      </div>
                      <div className="flex gap-1.5">
                        {ACCENT_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => handleAccentChange(c.value)}
                            className={`size-6 rounded-full cursor-pointer transition-all ${
                              accent === c.value
                                ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                                : "ring-1 ring-transparent hover:scale-110"
                            }`}
                            style={{ backgroundColor: c.value, "--tw-ring-color": c.value } as React.CSSProperties}
                            aria-label={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Coding Preferences */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-base font-semibold text-foreground mb-4">Coding Preferences</h2>
                  <div className="space-y-4 text-sm">
                    <p className="text-xs text-muted-foreground">Configure default values for the problem workspace.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border bg-card/80 p-3">
                        <div className="text-xs text-muted-foreground mb-1.5">Default Company</div>
                        <select
                          value={prefs.company}
                          onChange={(e) => updatePref("company", e.target.value)}
                          className="w-full rounded-md border border-border/70 bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-success/50 focus:outline-none"
                        >
                          {COMPANIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-lg border border-border bg-card/80 p-3">
                        <div className="text-xs text-muted-foreground mb-1.5">Default Sheet</div>
                        <select
                          value={prefs.sheet}
                          onChange={(e) => updatePref("sheet", e.target.value)}
                          className="w-full rounded-md border border-border/70 bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-success/50 focus:outline-none"
                        >
                          {SHEET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-lg border border-border bg-card/80 p-3">
                        <div className="text-xs text-muted-foreground mb-1.5">Default Sorting</div>
                        <div className="flex gap-1">
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => updatePref("sorting", opt)}
                              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                                prefs.sorting === opt
                                  ? "bg-success/15 text-success border border-success/30"
                                  : "bg-secondary text-muted-foreground border border-border/70 hover:bg-accent"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-card/80 p-3">
                        <div className="text-xs text-muted-foreground mb-1.5">Page Size</div>
                        <div className="flex gap-1">
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => updatePref("pageSize", size)}
                              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                                prefs.pageSize === size
                                  ? "bg-success/15 text-success border border-success/30"
                                  : "bg-secondary text-muted-foreground border border-border/70 hover:bg-accent"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Dashboard */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-base font-semibold text-foreground mb-4">Dashboard</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Weekly Goal</div>
                        <div className="text-xs text-muted-foreground">Target problems to solve per week</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoal(Math.max(1, weeklyGoal - 1), dailyGoal)}
                          disabled={weeklyGoal <= 1}
                          className="border-border bg-secondary text-card-foreground h-8 w-8 p-0 cursor-pointer"
                          aria-label="Decrease weekly goal"
                        >-</Button>
                        <span className="w-10 text-center text-sm font-medium text-card-foreground tabular-nums">{weeklyGoal}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoal(Math.min(100, weeklyGoal + 1), dailyGoal)}
                          disabled={weeklyGoal >= 100}
                          className="border-border bg-secondary text-card-foreground h-8 w-8 p-0 cursor-pointer"
                          aria-label="Increase weekly goal"
                        >+</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Daily Goal</div>
                        <div className="text-xs text-muted-foreground">Target problems to solve per day</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoal(weeklyGoal, Math.max(1, dailyGoal - 1))}
                          disabled={dailyGoal <= 1}
                          className="border-border bg-secondary text-card-foreground h-8 w-8 p-0 cursor-pointer"
                          aria-label="Decrease daily goal"
                        >-</Button>
                        <span className="w-10 text-center text-sm font-medium text-card-foreground tabular-nums">{dailyGoal}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoal(weeklyGoal, Math.min(20, dailyGoal + 1))}
                          disabled={dailyGoal >= 20}
                          className="border-border bg-secondary text-card-foreground h-8 w-8 p-0 cursor-pointer"
                          aria-label="Increase daily goal"
                        >+</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Heatmap Visibility</div>
                        <div className="text-xs text-muted-foreground">Show activity heatmap on dashboard</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={heatmapVisible}
                        onClick={() => setHeatmapVisible((v) => !v)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHeatmapVisible((v) => !v); } }}
                        className={`relative h-5 w-10 rounded-full cursor-pointer transition-colors ${
                          heatmapVisible ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                            heatmapVisible ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Account & Export */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-base font-semibold text-foreground mb-4">Account & Data</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Connected Account</div>
                        <div className="text-xs text-muted-foreground">Signed in with Google</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{auth.user?.email || "—"}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="text-sm font-medium text-card-foreground mb-3">Export Progress</div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {(["json", "csv"] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setExportFormat(fmt)}
                              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                                exportFormat === fmt
                                  ? "bg-success/15 text-success border border-success/30"
                                  : "bg-secondary text-muted-foreground border border-border/70 hover:bg-accent"
                              }`}
                            >
                              .{fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {(["progress", "full"] as const).map((scope) => (
                            <button
                              key={scope}
                              type="button"
                              onClick={() => setExportScope(scope)}
                              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                                exportScope === scope
                                  ? "bg-success/15 text-success border border-success/30"
                                  : "bg-secondary text-muted-foreground border border-border/70 hover:bg-accent"
                              }`}
                            >
                              {scope === "progress" ? "Progress only" : "Full data"}
                            </button>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!auth.user}
                          onClick={handleExport}
                          className="w-full border-border bg-secondary text-card-foreground hover:bg-accent cursor-pointer"
                        >
                          <FileDown className="size-3.5 mr-1.5" />
                          Download as {exportFormat === "json" ? "JSON" : "CSV"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Total Solved</div>
                        <div className="text-xs text-muted-foreground">Problems solved across all datasets</div>
                      </div>
                      <span className="text-sm font-semibold text-success">{totalSolved}</span>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResetConfirm(true)}
                        className="border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 cursor-pointer dark:text-orange-400"
                      >
                        <RotateCcw className="size-3.5 mr-1.5" />
                        Reset All Data
                      </Button>
                      <p className="text-xs text-muted-foreground">Clears all local progress, notes, and settings. Auth stays intact.</p>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                        Delete Account
                      </Button>
                      <p className="mt-1.5 text-xs text-muted-foreground">Account deletion is not yet available.</p>
                    </div>
                  </div>
                </section>

                {/* About */}
                <section className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
                  <h2 className="text-base font-semibold text-foreground mb-4">About</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="text-card-foreground">0.1.0</span>
                    </div>
                    <div className="border-t border-border" />
                    <a
                      href="https://github.com/prakash144/leetcode-company-wise-problems"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-muted-foreground hover:text-card-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Github className="size-4" />
                        GitHub
                      </span>
                      <ExternalLink className="size-3" />
                    </a>
                    <div className="border-t border-border" />
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Privacy Policy</span>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Terms of Service</span>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                    <div className="border-t border-border" />
                    <div className="text-muted-foreground text-xs leading-relaxed">
                      Interview Tracly helps you track your coding journey and crack your dream company.
                      Built with Next.js, Firebase, and Tailwind CSS.
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        onConfirm={handleReset}
        title="Reset All Data?"
        message="This permanently deletes all progress, study sessions, notes (cheat sheets, behavioral, system design), mock test history, revision data, goals, and preferences. Your Firebase auth stays signed in. This cannot be undone."
        confirmLabel="Wipe Everything"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </AppShell>
  );
};

const SettingsPage = () => (
  <Suspense fallback={<AppShell footer={<Footer />}><div className="mx-auto max-w-3xl p-4 sm:px-6 lg:px-8 pb-10"><SettingsSkeleton /></div></AppShell>}>
    <SettingsContent />
  </Suspense>
);

export default SettingsPage;

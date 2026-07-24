"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Timer, Play, Flag, RotateCcw, CheckCircle2, SkipForward, Lightbulb, Target } from "lucide-react";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadHistory, saveResult, generateTestId } from "@/lib/mockTest";
import type { MockTestConfig, MockTestResult, MockTestProblemResult } from "@/lib/mockTest";

type Phase = "config" | "active" | "results";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const DURATIONS = [15, 30, 45, 60];
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export default function MockTestPage() {
  const { questionsState, selectedCompany, selectedList, unifiedProblems } = useProblemWorkspaceData();
  const allQuestions = questionsState.questions.length > 0 ? questionsState.questions : unifiedProblems;
  const isLoading = questionsState.loading;
  const hasError = Boolean(questionsState.error);

  const [phase, setPhase] = useState<Phase>("config");
  const [config, setConfig] = useState<MockTestConfig>({
    durationMinutes: 30,
    problemCount: 5,
    difficulties: ["Easy", "Medium"],
    topics: [],
    company: "",
  });
  const [testProblems, setTestProblems] = useState<MockTestProblemResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [testStart, setTestStart] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTestRef = useRef<(completed: boolean) => void>(() => {});
  const [history, setHistory] = useState<MockTestResult[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => { if (q.topicTag) set.add(q.topicTag); q.topics?.forEach((t) => set.add(t)); });
    return Array.from(set).sort();
  }, [allQuestions]);

  const companies = useMemo(() => {
    const set = new Set(allQuestions.map((q) => q.company).filter(Boolean));
    return Array.from(set).sort();
  }, [allQuestions]);

  const startTest = useCallback(() => {
    const pool = allQuestions.filter((q) => {
      if (config.difficulties.length && !config.difficulties.some((d) => d.toUpperCase() === q.difficulty.toUpperCase())) return false;
      if (config.topics.length && !config.topics.some((t) => q.topicTag === t || q.topics?.includes(t))) return false;
      if (config.company && q.company !== config.company) return false;
      return true;
    });

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.problemCount);

    if (selected.length === 0) {
      alert("No problems match your filters. Try broader criteria.");
      return;
    }

    const problems: MockTestProblemResult[] = selected.map((q) => ({
      problemId: q.problemId,
      title: q.title,
      difficulty: q.difficulty,
      topic: q.topicTag,
      timeSpentSeconds: 0,
      usedHint: false,
      solved: false,
      skipped: false,
    }));

    setTestProblems(problems);
    setCurrentIndex(0);
    setTimeLeft(config.durationMinutes * 60);
    setElapsed(0);
    setUsedHint(false);
    setTestStart(Date.now());
    setPhase("active");
  }, [allQuestions, config]);

  useEffect(() => {
    if (phase !== "active") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTestRef.current(false);
          return 0;
        }
        return prev - 1;
      });
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const currentProblem = testProblems[currentIndex];

  const recordCurrent = useCallback((overrides: Partial<MockTestProblemResult>) => {
    setTestProblems((prev) => {
      const next = [...prev];
      if (next[currentIndex]) {
        next[currentIndex] = { ...next[currentIndex], ...overrides, timeSpentSeconds: elapsed - next.reduce((sum, p, i) => i < currentIndex ? sum + p.timeSpentSeconds : sum, 0) };
      }
      return next;
    });
  }, [currentIndex, elapsed]);

  const handleSolve = () => {
    recordCurrent({ solved: true });
    advance();
  };

  const handleSkip = () => {
    recordCurrent({ skipped: true });
    advance();
  };

  const handleHint = () => {
    setUsedHint(true);
    recordCurrent({ usedHint: true });
  };

  const advance = () => {
    if (currentIndex >= testProblems.length - 1) {
      finishTest(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setUsedHint(false);
    }
  };

  const finishTest = useCallback((completed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const now = Date.now();
    const result: MockTestResult = {
      id: generateTestId(),
      config,
      startedAt: testStart,
      endedAt: now,
      totalTimeSeconds: Math.floor((now - testStart) / 1000),
      problems: testProblems.map((p) => ({
        ...p,
        timeSpentSeconds: p.timeSpentSeconds || 10,
      })),
      completed,
    };
    saveResult(result);
    setTestProblems(result.problems);
    setPhase("results");
    setHistory(loadHistory());
  }, [config, testStart, testProblems]);

  finishTestRef.current = finishTest;

  const timePct = config.durationMinutes > 0 ? (timeLeft / (config.durationMinutes * 60)) * 100 : 0;

  if (phase === "active") {
    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="size-5 text-primary" />
              <span className="text-lg font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
              <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${timePct > 20 ? "bg-success" : timePct > 10 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${timePct}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{currentIndex + 1}/{testProblems.length}</span>
              {usedHint && <Lightbulb className="size-3.5 text-warning" />}
            </div>
          </div>

          {currentProblem && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{currentProblem.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <DifficultyBadge difficulty={currentProblem.difficulty} />
                    <span className="text-xs text-muted-foreground">{currentProblem.topic}</span>
                  </div>
                </div>
                <a href={`https://leetcode.com/problems/${currentProblem.problemId}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs">Open LeetCode</Button>
                </a>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button onClick={handleSolve} variant="outline" size="sm" className="text-xs h-8">
                  <CheckCircle2 className="size-3.5 mr-1 text-success" /> Solved
                </Button>
                <Button onClick={handleHint} variant="outline" size="sm" className="text-xs h-8" disabled={usedHint}>
                  <Lightbulb className="size-3.5 mr-1 text-warning" /> {usedHint ? "Hint Used" : "Use Hint"}
                </Button>
                <Button onClick={handleSkip} variant="outline" size="sm" className="text-xs h-8">
                  <SkipForward className="size-3.5 mr-1" /> Skip
                </Button>
                <Button onClick={() => finishTest(false)} variant="outline" size="sm" className="text-xs h-8 ml-auto text-destructive">
                  <Flag className="size-3.5 mr-1" /> End Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  if (phase === "results") {
    const solved = testProblems.filter((p) => p.solved).length;
    const skipped = testProblems.filter((p) => p.skipped).length;
    const hints = testProblems.filter((p) => p.usedHint).length;
    const totalTime = testProblems.reduce((sum, p) => sum + p.timeSpentSeconds, 0);

    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
          <PageHeader
            eyebrow="Post-Mortem"
            title="Mock Test Results"
            description={`${solved}/${testProblems.length} solved · ${formatTime(totalTime)} total · ${hints} hints`}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Solved", value: solved, color: "text-success", icon: CheckCircle2 },
              { label: "Skipped", value: skipped, color: "text-muted-foreground", icon: SkipForward },
              { label: "Hints Used", value: hints, color: "text-warning", icon: Lightbulb },
              { label: "Accuracy", value: testProblems.length > 0 ? `${Math.round((solved / testProblems.filter((p) => !p.skipped).length || 1) * 100)}%` : "N/A", color: "text-info", icon: Target },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <stat.icon className={`size-4 mx-auto mb-1 ${stat.color}`} />
                <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Problem Breakdown</h3>
            </div>
            <div className="divide-y divide-border">
              {testProblems.map((p) => (
                <div key={p.problemId} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className={`size-2 rounded-full shrink-0 ${p.solved ? "bg-success" : p.skipped ? "bg-muted-foreground" : "bg-warning"}`} />
                  <span className="flex-1 truncate">{p.title}</span>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="text-muted-foreground tabular-nums">{formatTime(p.timeSpentSeconds)}</span>
                  {p.usedHint && <Lightbulb className="size-3 text-warning" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => setPhase("config")} variant="outline" size="sm" className="h-8 text-xs">
              <RotateCcw className="size-3.5 mr-1" /> New Test
            </Button>
          </div>

          {history.length > 1 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Previous Tests</h3>
              <div className="space-y-2">
                {history.slice(1, 6).map((r) => {
                  const s = r.problems.filter((p) => p.solved).length;
                  return (
                    <div key={r.id} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground tabular-nums">{new Date(r.startedAt).toLocaleDateString()}</span>
                      <span className="text-success font-medium">{s}/{r.problems.length}</span>
                      <span className="text-muted-foreground">{formatTime(r.totalTimeSeconds)}</span>
                      <span className="text-muted-foreground">{r.config.durationMinutes}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Mock Interview"
        title="Timed Mock Test"
        description="Simulate real interview pressure with configurable time limits and problem mixes."
      />

      <div className="mx-auto max-w-3xl px-4 pb-10 space-y-6">

        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading questions from {selectedCompany} / {selectedList}...</p>
          </div>
        )}

        {!isLoading && allQuestions.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">No questions loaded</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Go to <strong>Settings</strong> and select a company &amp; problem list to load questions.
              The mock test picks from your loaded problem set.
            </p>
          </div>
        )}

        {!isLoading && hasError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">Failed to load questions. Check Settings &gt; Company/List selection.</p>
          </div>
        )}

        {!isLoading && allQuestions.length > 0 && <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-sm font-semibold">Configuration</h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setConfig((c) => ({ ...c, durationMinutes: d }))}
                  className={`px-4 py-1.5 text-xs rounded-lg border transition-colors ${config.durationMinutes === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Problems</label>
            <Input type="number" min={1} max={20} value={config.problemCount}
              onChange={(e) => setConfig((c) => ({ ...c, problemCount: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))}
              className="h-8 text-xs w-24" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Difficulty</label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setConfig((c) => ({
                  ...c, difficulties: c.difficulties.includes(d) ? c.difficulties.filter((x) => x !== d) : [...c.difficulties, d],
                }))}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${config.difficulties.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Topics (optional)</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {availableTopics.map((t) => (
                <button key={t} onClick={() => setConfig((c) => ({
                  ...c, topics: c.topics.includes(t) ? c.topics.filter((x) => x !== t) : [...c.topics, t],
                }))}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${config.topics.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Company (optional)</label>
            <select value={config.company} onChange={(e) => setConfig((c) => ({ ...c, company: e.target.value }))}
              className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground outline-none">
              <option value="">Any Company</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Button onClick={startTest} className="w-full h-10 text-sm">
            <Play className="size-4 mr-1.5" /> Start Test
          </Button>
        </div>}

        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Tests</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.slice(0, 10).map((r) => {
                const s = r.problems.filter((p) => p.solved).length;
                return (
                  <div key={r.id} className="flex items-center gap-3 text-xs py-1.5">
                    <span className="text-muted-foreground tabular-nums shrink-0">{new Date(r.startedAt).toLocaleDateString()}</span>
                    <span className="text-success font-medium">{s}/{r.problems.length}</span>
                    <span className="text-muted-foreground">{formatTime(r.totalTimeSeconds)}</span>
                    <span className="text-muted-foreground/50">{r.config.durationMinutes}m · {r.config.difficulties.join("/")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadHistory, saveResult, generateTestId } from "@/lib/mockTest";
import type { MockInterviewConfig, MockTestResult, MockTestProblemResult } from "@/lib/mockTest";
import MockTestConfig from "@/app/components/mock-test/MockTestConfig";
import MockTestActive from "@/app/components/mock-test/MockTestActive";
import MockTestSummary from "@/app/components/mock-test/MockTestSummary";
import { Timer, Play, Clock, Lightbulb, ChevronRight } from "lucide-react";

const ACTIVE_SESSION_KEY = "mock-test-active-session";

interface ActiveMockSession {
  config: MockInterviewConfig;
  problems: MockTestProblemResult[];
  currentIndex: number;
  timeLeft: number;
  elapsed: number;
  testStart: number;
  usedHint: boolean;
  hintsRemaining: number;
  savedAt: number;
}

function saveActiveSession(session: ActiveMockSession) {
  try { localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session)); } catch {}
}

function loadActiveSession(): ActiveMockSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearActiveSession() {
  try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch {}
}

type Phase = "dashboard" | "active" | "summary";

function buildDefaultConfig(): MockInterviewConfig {
  return {
    sections: [
      {
        id: "sec_default_dsa",
        type: "dsa",
        title: "Coding Problems",
        problemCount: 5,
        difficulties: ["Easy", "Medium"],
        topics: [],
        tags: [],
      },
    ],
    company: "",
    role: "",
    level: "",
    durationMinutes: 30,
    round: "",
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MockTestPage() {
  const { questionsState, unifiedProblems } = useProblemWorkspaceData();
  const allQuestions = questionsState.questions.length > 0 ? questionsState.questions : unifiedProblems;
  const isLoading = questionsState.loading;
  const hasError = Boolean(questionsState.error);

  const [phase, setPhase] = useState<Phase>("dashboard");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [config, setConfig] = useState<MockInterviewConfig>(buildDefaultConfig);
  const [testProblems, setTestProblems] = useState<MockTestProblemResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [testStart, setTestStart] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTestRef = useRef<(completed: boolean) => void>(() => {});
  const [history, setHistory] = useState<MockTestResult[]>([]);
  const [lastResult, setLastResult] = useState<MockTestResult | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingSession, setPendingSession] = useState<ActiveMockSession | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    const session = loadActiveSession();
    if (session) {
      setPendingSession(session);
      setShowResumePrompt(true);
    }
  }, []);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.topicTag) set.add(q.topicTag);
      q.topics?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [allQuestions]);

  const companies = useMemo(() => {
    const set = new Set(allQuestions.map((q) => q.company).filter(Boolean));
    return Array.from(set).sort();
  }, [allQuestions]);

  const startTest = useCallback(() => {
    const dsaSections = config.sections.filter((s) => s.type === "dsa");
    const nonDsaSections = config.sections.filter((s) => s.type !== "dsa");

    const allProblems: MockTestProblemResult[] = [];

    dsaSections.forEach((section) => {
      const pool = allQuestions.filter((q) => {
        if (section.difficulties.length && !section.difficulties.some((d) => d.toUpperCase() === q.difficulty.toUpperCase())) return false;
        if (section.topics.length && !section.topics.some((t) => q.topicTag === t || q.topics?.includes(t))) return false;
        if (config.company && q.company !== config.company) return false;
        return true;
      });

      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, section.problemCount);

      selected.forEach((q) => {
        allProblems.push({
          problemId: q.problemId,
          title: q.title,
          difficulty: q.difficulty,
          topic: q.topicTag || "",
          timeSpentSeconds: 0,
          usedHint: false,
          solved: false,
          skipped: false,
          partiallySolved: false,
          sectionId: section.id,
          sectionType: section.type,
        });
      });
    });

    nonDsaSections.forEach((section) => {
      for (let i = 0; i < section.problemCount; i++) {
        allProblems.push({
          problemId: `${section.type}_${i + 1}`,
          title: `${section.title} — Question ${i + 1}`,
          difficulty: section.difficulties[0] || "Medium",
          topic: section.topics[0] || "",
          timeSpentSeconds: 0,
          usedHint: false,
          solved: false,
          skipped: false,
          partiallySolved: false,
          sectionId: section.id,
          sectionType: section.type,
        });
      }
    });

    if (allProblems.length === 0) {
      toast.error("No problems match your filters", {
        id: "mock-test-no-problems",
        description: "Try broader criteria or check your company/list settings.",
      });
      return;
    }

    const now = Date.now();
    setShowConfigDialog(false);
    setTestProblems(allProblems);
    setCurrentIndex(0);
    setTimeLeft(config.durationMinutes * 60);
    setElapsed(0);
    setUsedHint(false);
    setHintsRemaining(3);
    setTestStart(now);
    setPhase("active");
    saveActiveSession({
      config,
      problems: allProblems,
      currentIndex: 0,
      timeLeft: config.durationMinutes * 60,
      elapsed: 0,
      testStart: now,
      usedHint: false,
      hintsRemaining: 3,
      savedAt: now,
    });
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const testProblemsRef = useRef(testProblems);
  testProblemsRef.current = testProblems;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== "active") {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      return;
    }
    saveTimerRef.current = setInterval(() => {
      saveActiveSession({
        config,
        problems: testProblemsRef.current,
        currentIndex,
        timeLeft: timeLeftRef.current,
        elapsed: elapsedRef.current,
        testStart,
        usedHint,
        hintsRemaining,
        savedAt: Date.now(),
      });
    }, 5000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [phase, config, currentIndex, testStart, usedHint, hintsRemaining]);

  const recordCurrent = useCallback(
    (overrides: Partial<MockTestProblemResult>) => {
      setTestProblems((prev) => {
        const next = [...prev];
        if (next[currentIndex]) {
          const prevTime = next.reduce(
            (sum, p, i) => (i < currentIndex ? sum + p.timeSpentSeconds : sum),
            0,
          );
          next[currentIndex] = {
            ...next[currentIndex],
            ...overrides,
            timeSpentSeconds: elapsed - prevTime,
          };
        }
        return next;
      });
    },
    [currentIndex, elapsed],
  );

  const advance = useCallback(() => {
    if (currentIndex >= testProblems.length - 1) {
      finishTestRef.current(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setUsedHint(false);
    }
  }, [currentIndex, testProblems.length]);

  const handleSolve = useCallback(() => {
    recordCurrent({ solved: true, partiallySolved: false });
    advance();
  }, [recordCurrent, advance]);

  const handlePartialSolve = useCallback(() => {
    recordCurrent({ partiallySolved: true, solved: false });
    advance();
  }, [recordCurrent, advance]);

  const handleSkip = useCallback(() => {
    recordCurrent({ skipped: true });
    advance();
  }, [recordCurrent, advance]);

  const handleHint = useCallback(() => {
    setUsedHint(true);
    setHintsRemaining((prev) => Math.max(0, prev - 1));
    recordCurrent({ usedHint: true });
  }, [recordCurrent]);

  const finishTest = useCallback(
    (completed: boolean) => {
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
      clearActiveSession();
      setLastResult(result);
      setPhase("summary");
      setHistory(loadHistory());
    },
    [config, testStart, testProblems],
  );

  finishTestRef.current = finishTest;

  const handleNewTest = useCallback(() => {
    setConfig(buildDefaultConfig());
    setPhase("dashboard");
  }, []);

  const openNewTest = useCallback(() => {
    setShowConfigDialog(true);
  }, []);

  const reviewResult = useCallback((result: MockTestResult) => {
    setLastResult(result);
    setPhase("summary");
  }, []);

  const resumeSession = useCallback(() => {
    if (!pendingSession) return;
    setConfig(pendingSession.config);
    setTestProblems(pendingSession.problems);
    setCurrentIndex(pendingSession.currentIndex);
    const elapsedSinceSave = Math.floor((Date.now() - pendingSession.savedAt) / 1000);
    setTimeLeft(Math.max(0, pendingSession.timeLeft - elapsedSinceSave));
    setElapsed(pendingSession.elapsed + elapsedSinceSave);
    setTestStart(pendingSession.testStart);
    setUsedHint(pendingSession.usedHint);
    setHintsRemaining(pendingSession.hintsRemaining);
    setShowResumePrompt(false);
    setPendingSession(null);
    setPhase("active");
  }, [pendingSession]);

  const discardSession = useCallback(() => {
    clearActiveSession();
    setShowResumePrompt(false);
    setPendingSession(null);
  }, []);

  const totalTests = history.length;
  const totalSolved = history.reduce((sum, r) => sum + r.problems.filter((p) => p.solved && !p.partiallySolved).length, 0);
  const totalProblems = history.reduce((sum, r) => sum + r.problems.length, 0);
  const avgAccuracy = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const bestScore = history.length > 0
    ? Math.max(...history.map((r) => {
        const s = r.problems.filter((p) => p.solved && !p.partiallySolved).length;
        return r.problems.length > 0 ? Math.round((s / r.problems.length) * 100) : 0;
      }))
    : 0;

  if (phase === "active") {
    return (
      <AppShell footer={<Footer />}>
        <div className="sr-only"><h1>Mock Test — Active</h1></div>
        <MockTestActive
          config={config}
          sections={config.sections}
          problems={testProblems}
          currentIndex={currentIndex}
          timeLeft={timeLeft}
          usedHint={usedHint}
          hintsRemaining={hintsRemaining}
          onSolve={handleSolve}
          onPartialSolve={handlePartialSolve}
          onSkip={handleSkip}
          onHint={handleHint}
          onEnd={() => finishTest(false)}
        />
      </AppShell>
    );
  }

  if (phase === "summary" && lastResult) {
    return (
      <AppShell footer={<Footer />}>
        <MockTestSummary result={lastResult} onNewTest={handleNewTest} history={history} onReview={reviewResult} />
      </AppShell>
    );
  }

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Mock Interview"
        title="Mock Interview Dashboard"
        description="Simulate real interview pressure with timed mock tests across multiple disciplines."
      />

      {showResumePrompt && pendingSession && (
        <div className="mx-auto max-w-4xl px-4 pt-2 pb-0">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Unfinished Interview</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingSession.problems.length} question{pendingSession.problems.length !== 1 ? "s" : ""} ·{" "}
                  {formatTime(pendingSession.timeLeft)} remaining
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={discardSession} variant="outline" size="sm" className="h-8 text-xs">Discard</Button>
              <Button onClick={resumeSession} size="sm" className="h-8 text-xs">Resume</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pb-10 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{totalTests}</p>
            <p className="text-xs text-muted-foreground mt-1">Tests Taken</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-success tabular-nums">{totalSolved}</p>
            <p className="text-xs text-muted-foreground mt-1">Solved</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-info tabular-nums">{avgAccuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Accuracy</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-warning tabular-nums">{bestScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">Best Score</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={openNewTest} className="flex-1 h-11 text-sm">
            <Play className="size-4 mr-1.5" /> New Mock Interview
          </Button>
        </div>

        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Recent Results</h3>
              <span className="text-xs text-muted-foreground/50 ml-auto">{history.length} total</span>
            </div>
            <div className="space-y-1.5">
              {history.slice(0, 10).map((r) => {
                const s = r.problems.filter((p) => p.solved && !p.partiallySolved).length;
                const p = r.problems.filter((p) => p.partiallySolved).length;
                const h = r.problems.filter((pp) => pp.usedHint).length;
                const score = r.problems.length > 0 ? Math.round((s / r.problems.length) * 100) : 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => reviewResult(r)}
                    className="flex items-center gap-3 w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 shrink-0 w-20">
                      <div className={`size-2 rounded-full ${score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"}`} />
                      <span className="text-xs tabular-nums font-medium">{new Date(r.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-1 min-w-0">
                      <span className="font-semibold tabular-nums">{s}/{r.problems.length}</span>
                      {p > 0 && <span className="text-xs text-warning">(+{p})</span>}
                      {h > 0 && <Lightbulb className="size-3 text-warning shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatTime(r.totalTimeSeconds)}</span>
                    <span className="text-xs text-muted-foreground/50 hidden sm:block shrink-0">
                      {r.config.durationMinutes}m{r.config.company && ` · ${r.config.company}`}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0" />
                  </button>
                );
              })}
              {history.length > 10 && (
                <p className="text-xs text-center text-muted-foreground/50 pt-1">
                  +{history.length - 10} more tests
                </p>
              )}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
            <Timer className="mx-auto size-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No tests yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Start your first mock interview to simulate real interview conditions and track your performance over time.
            </p>
            <Button onClick={openNewTest} size="sm" className="mt-2">
              <Play className="size-3.5 mr-1.5" /> Start First Test
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Mock Interview</DialogTitle>
            <DialogDescription>
              Configure your interview sections and settings to match your target role.
            </DialogDescription>
          </DialogHeader>
          <MockTestConfig
            config={config}
            onChange={setConfig}
            onStart={startTest}
            availableTopics={availableTopics}
            companies={companies}
            isLoading={isLoading}
            hasQuestions={allQuestions.length > 0}
            hasNoMatch={false}
            hasError={hasError}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

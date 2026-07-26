"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadHistory, saveResult, generateTestId } from "@/lib/mockTest";
import type { MockInterviewConfig, MockTestResult, MockTestProblemResult } from "@/lib/mockTest";
import MockTestConfig from "@/app/components/mock-test/MockTestConfig";
import MockTestActive from "@/app/components/mock-test/MockTestActive";
import MockTestSummary from "@/app/components/mock-test/MockTestSummary";

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

type Phase = "config" | "active" | "summary";

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

export default function MockTestPage() {
  const { questionsState, unifiedProblems } = useProblemWorkspaceData();
  const allQuestions = questionsState.questions.length > 0 ? questionsState.questions : unifiedProblems;
  const isLoading = questionsState.loading;
  const hasError = Boolean(questionsState.error);

  const [phase, setPhase] = useState<Phase>("config");
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
    setPhase("config");
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

  if (phase === "active") {
    return (
      <AppShell footer={<Footer />}>
        <div className="sr-only">
          <h1>Mock Test — Active</h1>
        </div>
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
      {showResumePrompt && pendingSession && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Unfinished Interview</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingSession.problems.length} question{pendingSession.problems.length !== 1 ? "s" : ""} ·{" "}
                {formatTime(pendingSession.timeLeft)} remaining
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={discardSession} variant="outline" size="sm" className="h-8 text-xs">
                Discard
              </Button>
              <Button onClick={resumeSession} size="sm" className="h-8 text-xs">
                Resume
              </Button>
            </div>
          </div>
        </div>
      )}
      <PageHeader
        eyebrow="Mock Interview"
        title="Timed Mock Interview"
        description="Configure your interview, add sections, and simulate real interview pressure."
      />
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
      {history.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 pb-10">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Past Interviews
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.slice(0, 10).map((r) => {
                const s = r.problems.filter((p) => p.solved && !p.partiallySolved).length;
                const p = r.problems.filter((p) => p.partiallySolved).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => reviewResult(r)}
                    className="flex items-center gap-3 text-xs py-1.5 w-full text-left cursor-pointer hover:bg-accent/40 rounded px-1 transition-colors"
                  >
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {new Date(r.startedAt).toLocaleDateString()}
                    </span>
                    <span className="text-success font-medium">
                      {s}/{r.problems.length}
                      {p > 0 && <span className="text-warning ml-1">(+{p})</span>}
                    </span>
                    <span className="text-muted-foreground">{formatTime(r.totalTimeSeconds)}</span>
                    <span className="text-muted-foreground/50">
                      {r.config.durationMinutes}m{r.config.sections.length > 1 ? ` · ${r.config.sections.length} sections` : ""}
                      {r.config.company && ` · ${r.config.company}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

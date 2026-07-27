"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadHistory, saveResult, generateTestId, generateSectionId } from "@/lib/mockTest";
import type { MockInterviewConfig, MockTestResult, MockTestProblemResult } from "@/lib/mockTest";
import { setDnd } from "@/lib/notifications/service";
import MockTestActive from "@/app/components/mock-test/MockTestActive";
import MockTestSummary from "@/app/components/mock-test/MockTestSummary";
import WizardStepDetails from "@/app/components/mock-test/wizard/WizardStepDetails";
import WizardStepSections from "@/app/components/mock-test/wizard/WizardStepSections";
import WizardStepReview from "@/app/components/mock-test/wizard/WizardStepReview";
import { Timer, Play, Clock, Lightbulb, ChevronRight, ChevronLeft, Check, ListOrdered, Layers } from "lucide-react";

const ACTIVE_SESSION_KEY = "mock-test-active-session";

type Phase = "dashboard" | "active" | "summary" | "review";

interface ActiveMockSession {
  config: MockInterviewConfig;
  problems: MockTestProblemResult[];
  currentIndex: number;
  timeLeft: number;
  elapsed: number;
  testStart: number;
  usedHint: boolean;
  hintsRemaining: number;
  strictMode: boolean;
  markedForReview: boolean[];
  savedAt: number;
}

function saveActiveSession(session: ActiveMockSession) {
  try { localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session)); } catch {}
}

function migrateSession(session: ActiveMockSession): ActiveMockSession {
  return {
    ...session,
    config: {
      ...session.config,
      sections: session.config.sections.map((s) => ({
        ...s,
        customQuestions: s.customQuestions ?? [],
      })),
    },
    problems: session.problems.map((p) => ({
      ...p,
      questionText: p.questionText || undefined,
    })),
  };
}

function loadActiveSession(): ActiveMockSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const session: ActiveMockSession = JSON.parse(raw);
    const migrated = migrateSession(session);
    return migrated;
  } catch { return null; }
}

function clearActiveSession() {
  try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch {}
}

type WizardStep = 1 | 2 | 3;

function buildDefaultConfig(): MockInterviewConfig {
  return {
    sections: [{ id: generateSectionId(), type: "dsa", title: "Coding Problems", problemCount: 1, difficulties: ["Easy", "Medium"], topics: [], tags: [], customQuestions: [] }],
    company: "", role: "", level: "", durationMinutes: 30, round: "",
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const STEPS: { step: WizardStep; label: string; icon: typeof ListOrdered }[] = [
  { step: 1, label: "Details", icon: ListOrdered },
  { step: 2, label: "Sections", icon: Layers },
  { step: 3, label: "Review", icon: Check },
];

export default function MockTestPage() {
  const { questionsState, unifiedProblems } = useProblemWorkspaceData();
  const allQuestions = questionsState.questions.length > 0 ? questionsState.questions : unifiedProblems;

  const [phase, setPhase] = useState<Phase>("dashboard");
  const [wizardStep, setWizardStep] = useState<WizardStep | null>(null);
  const [config, setConfig] = useState<MockInterviewConfig>(buildDefaultConfig);
  const configRef = useRef(config);
  configRef.current = config;
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
  const [topicSearch, setTopicSearch] = useState<Record<string, string>>({});
  const [strictMode, setStrictMode] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
    const session = loadActiveSession();
    if (session) {
      setPendingSession(session);
      setShowResumePrompt(true);
    }
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [wizardStep]);

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
    const cfg = configRef.current;
    const dsaSections = cfg.sections.filter((s) => s.type === "dsa");
    const nonDsaSections = cfg.sections.filter((s) => s.type !== "dsa");
    const allProblems: MockTestProblemResult[] = [];

    dsaSections.forEach((section) => {
      const pool = allQuestions.filter((q) => {
        if (section.difficulties.length && !section.difficulties.some((d) => d.toUpperCase() === q.difficulty.toUpperCase())) return false;
        if (section.topics.length && !section.topics.some((t) => q.topicTag === t || q.topics?.includes(t))) return false;
        if (cfg.company && q.company !== cfg.company) return false;
        return true;
      });
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      shuffled.slice(0, section.problemCount).forEach((q) => {
        allProblems.push({
          problemId: q.problemId, title: q.title, difficulty: q.difficulty, topic: q.topicTag || "",
          timeSpentSeconds: 0, usedHint: false, solved: false, skipped: false, partiallySolved: false,
          sectionId: section.id, sectionType: section.type,
        });
      });
    });

    nonDsaSections.forEach((section) => {
      for (let i = 0; i < section.problemCount; i++) {
        const customQ = section.customQuestions?.[i];
        allProblems.push({
          problemId: `${section.type}_${i + 1}`,
          title: `${section.title} — Q${i + 1}`,
          difficulty: section.difficulties[0] || "Medium", topic: section.topics[0] || "",
          timeSpentSeconds: 0, usedHint: false, solved: false, skipped: false, partiallySolved: false,
          sectionId: section.id, sectionType: section.type,
          questionText: customQ || undefined,
        });
      }
    });

    if (allProblems.length === 0) {
      toast.error("No problems match your filters", { id: "mock-test-no-problems", description: "Try broader criteria or check your company/list settings." });
      return;
    }

    const now = Date.now();
    setWizardStep(null);
    setTestProblems(allProblems);
    setCurrentIndex(0);
    setTimeLeft(cfg.durationMinutes * 60);
    setElapsed(0);
    setUsedHint(false);
    setHintsRemaining(3);
    setTestStart(now);
    setStrictMode(false);
    setMarkedForReview(new Array(allProblems.length).fill(false));
    setPhase("active");
    setDnd(true);
    saveActiveSession({ config: cfg, problems: allProblems, currentIndex: 0, timeLeft: cfg.durationMinutes * 60, elapsed: 0, testStart: now, usedHint: false, hintsRemaining: 3, strictMode: false, markedForReview: new Array(allProblems.length).fill(false), savedAt: now });
  }, [allQuestions]);

  useEffect(() => {
    if (phase !== "active") { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => { if (prev <= 1) { finishTestRef.current(false); return 0; } return prev - 1; });
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const testProblemsRef = useRef(testProblems);
  testProblemsRef.current = testProblems;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const markedForReviewRef = useRef(markedForReview);
  markedForReviewRef.current = markedForReview;
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== "active") { if (saveTimerRef.current) clearInterval(saveTimerRef.current); return; }
    saveTimerRef.current = setInterval(() => {
      saveActiveSession({ config, problems: testProblemsRef.current, currentIndex, timeLeft: timeLeftRef.current, elapsed: elapsedRef.current, testStart, usedHint, hintsRemaining, strictMode, markedForReview: markedForReviewRef.current, savedAt: Date.now() });
    }, 5000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [phase, config, currentIndex, testStart, usedHint, hintsRemaining, strictMode]);

  const recordCurrent = useCallback((overrides: Partial<MockTestProblemResult>) => {
    setTestProblems((prev) => {
      const next = [...prev];
      if (next[currentIndex]) {
        const prevTime = next.reduce((sum, p, i) => (i < currentIndex ? sum + p.timeSpentSeconds : sum), 0);
        next[currentIndex] = { ...next[currentIndex], ...overrides, timeSpentSeconds: elapsed - prevTime };
      }
      return next;
    });
  }, [currentIndex, elapsed]);

  const advance = useCallback(() => {
    if (currentIndex >= testProblems.length - 1) finishTestRef.current(true);
    else { setCurrentIndex((i) => i + 1); setUsedHint(false); }
  }, [currentIndex, testProblems.length]);

  const handleSolve = useCallback(() => { recordCurrent({ solved: true, partiallySolved: false }); advance(); }, [recordCurrent, advance]);
  const handlePartialSolve = useCallback(() => { recordCurrent({ partiallySolved: true, solved: false }); advance(); }, [recordCurrent, advance]);
  const handleSkip = useCallback(() => { recordCurrent({ skipped: true }); advance(); }, [recordCurrent, advance]);
  const handleHint = useCallback(() => { setUsedHint(true); setHintsRemaining((prev) => Math.max(0, prev - 1)); recordCurrent({ usedHint: true }); }, [recordCurrent]);

  const finishTest = useCallback((completed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const now = Date.now();
    const cfg = configRef.current;
    const result: MockTestResult = { id: generateTestId(), config: cfg, startedAt: testStart, endedAt: now, totalTimeSeconds: Math.floor((now - testStart) / 1000), problems: testProblems.map((p) => ({ ...p, timeSpentSeconds: p.timeSpentSeconds || 10 })), completed };
    saveResult(result);
    clearActiveSession();
    setLastResult(result);
    setPhase("summary");
    setDnd(false);
    setHistory(loadHistory());
  }, [testStart, testProblems]);
  finishTestRef.current = finishTest;

  const handleNewTest = useCallback(() => { clearActiveSession(); setConfig(buildDefaultConfig()); setPhase("dashboard"); }, []);
  const reviewResult = useCallback((result: MockTestResult) => { setLastResult(result); setPhase("summary"); }, []);

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
    setStrictMode(pendingSession.strictMode ?? false);
    setMarkedForReview(pendingSession.markedForReview ?? new Array(pendingSession.problems.length).fill(false));
    setShowResumePrompt(false);
    setPendingSession(null);
    setPhase("active");
  }, [pendingSession]);

  const discardSession = useCallback(() => { clearActiveSession(); setShowResumePrompt(false); setPendingSession(null); setDnd(false); }, []);

  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < testProblems.length) {
      recordCurrent({});
      setCurrentIndex(index);
      setUsedHint(false);
    }
  }, [testProblems.length, recordCurrent]);

  const toggleStrictMode = useCallback(() => setStrictMode((p) => !p), []);

  const toggleMarkForReview = useCallback(() => {
    setMarkedForReview((prev) => {
      const next = [...prev];
      next[currentIndex] = !next[currentIndex];
      return next;
    });
  }, [currentIndex]);

  if (phase === "active") {
    return (
      <AppShell>
        <MockTestActive
          config={config} sections={config.sections} problems={testProblems}
          currentIndex={currentIndex} timeLeft={timeLeft} usedHint={usedHint} hintsRemaining={hintsRemaining}
          strictMode={strictMode} markedForReview={markedForReview}
          onSolve={handleSolve} onPartialSolve={handlePartialSolve} onSkip={handleSkip} onHint={handleHint}
          onNavigate={navigateToQuestion} onToggleReview={toggleMarkForReview} onToggleStrictMode={toggleStrictMode}
          onEnd={() => finishTest(false)} onBack={() => { setPhase("dashboard"); setDnd(false); }}
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

  const renderWizard = () => (
    <div ref={topRef} className="mx-auto max-w-4xl px-4 pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setWizardStep(null)} className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors shrink-0">
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="flex items-center justify-center flex-1 gap-0">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = wizardStep === s.step;
            const isDone = wizardStep && wizardStep > s.step;
            return (
              <div key={s.step} className="flex items-center gap-0">
                <button onClick={() => setWizardStep(s.step)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary border border-primary/20" : isDone ? "text-success" : "text-muted-foreground/50"
                  }`}
                >
                  <StepIcon className="size-3.5" />
                  <span>{s.label}</span>
                  {isDone && <Check className="size-3" />}
                </button>
                {i < STEPS.length - 1 && <div className="w-6 sm:w-10 h-px bg-border mx-1 sm:mx-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {wizardStep === 1 && (
        <WizardStepDetails
          config={config}
          setConfig={setConfig}
          companies={companies}
          onNext={() => setWizardStep(2)}
          onCancel={() => setWizardStep(null)}
        />
      )}

      {wizardStep === 2 && (
        <WizardStepSections
          config={config}
          setConfig={setConfig}
          availableTopics={availableTopics}
          topicSearch={topicSearch}
          setTopicSearch={setTopicSearch}
          onBack={() => setWizardStep(1)}
          onNext={() => setWizardStep(3)}
        />
      )}

      {wizardStep === 3 && (
        <WizardStepReview
          config={config}
          allQuestions={allQuestions}
          onBack={() => setWizardStep(2)}
          onStart={startTest}
        />
      )}
    </div>
  );

  const totalTests = history.length;
  const totalSolved = history.reduce((sum, r) => sum + r.problems.filter((p) => p.solved && !p.partiallySolved).length, 0);
  const totalProblems = history.reduce((sum, r) => sum + r.problems.length, 0);
  const avgAccuracy = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const bestScore = history.length > 0 ? Math.max(...history.map((r) => { const s = r.problems.filter((p) => p.solved && !p.partiallySolved).length; return r.problems.length > 0 ? Math.round((s / r.problems.length) * 100) : 0; })) : 0;

  return (
    <AppShell footer={<Footer />}>
      <PageHeader eyebrow="Mock Interview" title={wizardStep ? "New Mock Interview" : "Mock Interview Dashboard"}
        description={wizardStep ? "Configure your interview in three steps." : "Simulate real interview pressure with timed mock tests across multiple disciplines."}
      />

      {showResumePrompt && pendingSession && !wizardStep && (
        <div className="mx-auto max-w-4xl px-4 pt-2 pb-0">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Unfinished Interview</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pendingSession.problems.length} question{pendingSession.problems.length !== 1 ? "s" : ""} · {formatTime(pendingSession.timeLeft)} remaining</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={discardSession} variant="outline" size="sm" className="h-8 text-xs">Discard</Button>
              <Button onClick={resumeSession} size="sm" className="h-8 text-xs">Resume</Button>
            </div>
          </div>
        </div>
      )}

      {wizardStep ? renderWizard() : (
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
            <Button onClick={() => { clearActiveSession(); setConfig(buildDefaultConfig()); setWizardStep(1); }} className="flex-1 h-11 text-sm">
              <Play className="size-4 mr-1.5" /> New Mock Interview
            </Button>
          </div>

          {history.length > 0 ? (
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
                    <button key={r.id} onClick={() => reviewResult(r)}
                      className="flex items-center gap-3 w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 shrink-0 w-20">
                        <div className={`size-2 rounded-full ${score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"}`} />
                        <span className="text-xs tabular-nums font-medium">{new Date(r.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                        <span className="font-semibold tabular-nums">{s}/{r.problems.length}</span>
                        {p > 0 && <span className="text-xs text-warning">(+{p})</span>}
                        {h > 0 && <Lightbulb className="size-3 text-warning shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatTime(r.totalTimeSeconds)}</span>
                      <span className="text-xs text-muted-foreground/50 hidden sm:block shrink-0">{r.config.durationMinutes}m{r.config.company && ` · ${r.config.company}`}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0" />
                    </button>
                  );
                })}
                {history.length > 10 && <p className="text-xs text-center text-muted-foreground/50 pt-1">+{history.length - 10} more tests</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
              <Timer className="mx-auto size-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">No tests yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">Start your first mock interview to simulate real interview conditions and track your performance over time.</p>
              <Button onClick={() => { clearActiveSession(); setConfig(buildDefaultConfig()); setWizardStep(1); }} size="sm" className="mt-2"><Play className="size-3.5 mr-1.5" /> Start First Test</Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

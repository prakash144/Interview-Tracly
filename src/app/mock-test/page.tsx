"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/app/components/Footer";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";
import { loadHistory, saveResult, generateTestId, MOCK_TYPE_LABELS, LEVELS, generateSectionId } from "@/lib/mockTest";
import type { MockInterviewConfig, MockTestResult, MockTestProblemResult, MockSection, MockInterviewType } from "@/lib/mockTest";
import MockTestActive from "@/app/components/mock-test/MockTestActive";
import MockTestSummary from "@/app/components/mock-test/MockTestSummary";
import { Timer, Play, Clock, Lightbulb, ChevronRight, ChevronLeft, Check, Code, Layers, Server, Users, Crown, Brain, Settings2, X, Search, ListOrdered } from "lucide-react";

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
type WizardStep = 1 | 2 | 3;

const TYPE_ICONS: Record<MockInterviewType, typeof Code> = {
  dsa: Code, "system-design": Layers, backend: Server, behavioral: Users, leadership: Crown, "ai-ml": Brain, custom: Settings2,
};

const DURATIONS = [15, 30, 45, 60] as const;
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const SECTION_PRESETS: { type: MockInterviewType; count: number; title: string }[] = [
  { type: "dsa", count: 3, title: "Coding Problems" },
  { type: "system-design", count: 1, title: "System Design" },
  { type: "behavioral", count: 2, title: "Behavioral Questions" },
  { type: "backend", count: 2, title: "Backend Deep Dive" },
  { type: "leadership", count: 2, title: "Leadership Principles" },
  { type: "ai-ml", count: 2, title: "AI/ML Questions" },
];

function buildDefaultConfig(): MockInterviewConfig {
  return {
    sections: [{ id: generateSectionId(), type: "dsa", title: "Coding Problems", problemCount: 5, difficulties: ["Easy", "Medium"], topics: [], tags: [] }],
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
        allProblems.push({
          problemId: `${section.type}_${i + 1}`, title: `${section.title} — Question ${i + 1}`,
          difficulty: section.difficulties[0] || "Medium", topic: section.topics[0] || "",
          timeSpentSeconds: 0, usedHint: false, solved: false, skipped: false, partiallySolved: false,
          sectionId: section.id, sectionType: section.type,
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
    setTimeLeft(config.durationMinutes * 60);
    setElapsed(0);
    setUsedHint(false);
    setHintsRemaining(3);
    setTestStart(now);
    setPhase("active");
    saveActiveSession({ config, problems: allProblems, currentIndex: 0, timeLeft: config.durationMinutes * 60, elapsed: 0, testStart: now, usedHint: false, hintsRemaining: 3, savedAt: now });
  }, [allQuestions, config]);

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
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== "active") { if (saveTimerRef.current) clearInterval(saveTimerRef.current); return; }
    saveTimerRef.current = setInterval(() => {
      saveActiveSession({ config, problems: testProblemsRef.current, currentIndex, timeLeft: timeLeftRef.current, elapsed: elapsedRef.current, testStart, usedHint, hintsRemaining, savedAt: Date.now() });
    }, 5000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [phase, config, currentIndex, testStart, usedHint, hintsRemaining]);

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
    const result: MockTestResult = { id: generateTestId(), config, startedAt: testStart, endedAt: now, totalTimeSeconds: Math.floor((now - testStart) / 1000), problems: testProblems.map((p) => ({ ...p, timeSpentSeconds: p.timeSpentSeconds || 10 })), completed };
    saveResult(result);
    clearActiveSession();
    setLastResult(result);
    setPhase("summary");
    setHistory(loadHistory());
  }, [config, testStart, testProblems]);
  finishTestRef.current = finishTest;

  const handleNewTest = useCallback(() => { setConfig(buildDefaultConfig()); setPhase("dashboard"); }, []);
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
    setShowResumePrompt(false);
    setPendingSession(null);
    setPhase("active");
  }, [pendingSession]);

  const discardSession = useCallback(() => { clearActiveSession(); setShowResumePrompt(false); setPendingSession(null); }, []);

  const addSection = (type: MockInterviewType) => {
    const preset = SECTION_PRESETS.find((p) => p.type === type);
    const section: MockSection = { id: generateSectionId(), type, title: preset?.title ?? MOCK_TYPE_LABELS[type], problemCount: preset?.count ?? 3, difficulties: ["Easy", "Medium"], topics: [], tags: [] };
    setConfig((prev) => ({ ...prev, sections: [...prev.sections, section] }));
  };

  const removeSection = (id: string) => setConfig((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));

  const updateSection = (id: string, patch: Partial<MockSection>) => {
    setConfig((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  const totalQuestions = config.sections.reduce((s, sec) => s + sec.problemCount, 0);

  if (phase === "active") {
    return (
      <AppShell footer={<Footer />}>
        <div className="sr-only"><h1>Mock Test — Active</h1></div>
        <MockTestActive config={config} sections={config.sections} problems={testProblems} currentIndex={currentIndex} timeLeft={timeLeft} usedHint={usedHint} hintsRemaining={hintsRemaining} onSolve={handleSolve} onPartialSolve={handlePartialSolve} onSkip={handleSkip} onHint={handleHint} onEnd={() => finishTest(false)} />
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
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold">Interview Details</h3>
            <p className="text-xs text-muted-foreground mt-1">Basic information about the role you&apos;re preparing for.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <select value={config.company} onChange={(e) => setConfig((p) => ({ ...p, company: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                <option value="">Any Company</option>
                {companies.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <Input value={config.role} onChange={(e) => setConfig((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. SDE II" className="h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Level</label>
              <select value={config.level} onChange={(e) => setConfig((p) => ({ ...p, level: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                <option value="">Any Level</option>
                {LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setConfig((p) => ({ ...p, durationMinutes: d }))}
                    className={`px-1 py-2 text-xs rounded-lg border transition-colors text-center ${
                      config.durationMinutes === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(null)}>Cancel</Button>
            <Button size="sm" onClick={() => setWizardStep(2)}>Next: Sections</Button>
          </div>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold">Sections</h3>
              <p className="text-xs text-muted-foreground mt-1">Add interview rounds by type. Each section can have its own difficulty and topics.</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SECTION_PRESETS.map((preset) => {
                const Icon = TYPE_ICONS[preset.type];
                const exists = config.sections.some((s) => s.type === preset.type);
                return (
                  <button key={preset.type} onClick={() => addSection(preset.type)} disabled={exists}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      exists ? "border-border/30 text-muted-foreground/30 cursor-not-allowed" : "border-border hover:bg-accent hover:text-foreground text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" /> {preset.type === "dsa" ? "DSA" : MOCK_TYPE_LABELS[preset.type]}
                  </button>
                );
              })}
            </div>
          </div>

          {config.sections.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <Settings2 className="mx-auto size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No sections yet</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Click a section type above to add it to your interview.</p>
            </div>
          )}

          <div className="space-y-4">
            {config.sections.map((section) => {
              const Icon = TYPE_ICONS[section.type];
              const searchKey = topicSearch[section.id] ?? "";
              const filteredTopics = searchKey ? availableTopics.filter((t) => t.toLowerCase().includes(searchKey.toLowerCase())) : availableTopics;
              return (
                <div key={section.id} className="rounded-xl border border-border bg-secondary/20 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="size-8 rounded-lg bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="h-8 text-sm font-medium px-2 py-0 border-0 bg-transparent focus:bg-secondary hover:bg-secondary/50 rounded w-full"
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-md bg-secondary border border-border shrink-0">{MOCK_TYPE_LABELS[section.type]}</span>
                    </div>
                    <button onClick={() => removeSection(section.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">Questions</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateSection(section.id, { problemCount: Math.max(1, section.problemCount - 1) })} className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground">−</button>
                        <span className="flex-1 text-center text-sm font-semibold tabular-nums">{section.problemCount}</span>
                        <button onClick={() => updateSection(section.id, { problemCount: Math.min(20, section.problemCount + 1) })} className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground">+</button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">Difficulty</label>
                      <div className="flex gap-1.5">
                        {DIFFICULTIES.map((d) => (
                          <button key={d} onClick={() => updateSection(section.id, { difficulties: section.difficulties.includes(d) ? section.difficulties.filter((x) => x !== d) : [...section.difficulties, d] })}
                            className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                              section.difficulties.includes(d) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent text-muted-foreground"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {section.type === "dsa" && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground">Topics</label>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                          <input type="text" value={searchKey} onChange={(e) => setTopicSearch((p) => ({ ...p, [section.id]: e.target.value }))} placeholder="Search topics..."
                            className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-border bg-secondary text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-border/50 rounded-lg p-2.5 bg-secondary/10 space-y-1">
                          {section.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 pb-2 mb-1 border-b border-border/30">
                              {section.topics.map((t) => (
                                <button key={t} onClick={() => updateSection(section.id, { topics: section.topics.filter((x) => x !== t) })}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-colors"
                                >
                                  {t} <X className="size-2.5" />
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {filteredTopics.length === 0 && <span className="text-[11px] text-muted-foreground/50 px-1 py-1">No topics match</span>}
                            {filteredTopics.map((t) => {
                              const isSelected = section.topics.includes(t);
                              if (isSelected) return null;
                              return (
                                <button key={t} onClick={() => updateSection(section.id, { topics: [...section.topics, t] })}
                                  className="text-[11px] px-2 py-0.5 rounded-full border border-border hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(1)}><ChevronLeft className="size-3.5 mr-1" /> Back</Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">{totalQuestions} question{totalQuestions !== 1 ? "s" : ""} across {config.sections.length} section{config.sections.length !== 1 ? "s" : ""}</span>
              <Button size="sm" disabled={config.sections.length === 0} onClick={() => setWizardStep(3)}>Next: Review</Button>
            </div>
          </div>
        </div>
      )}

      {wizardStep === 3 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold">Review &amp; Launch</h3>
            <p className="text-xs text-muted-foreground mt-1">Confirm your interview configuration before starting.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{config.company || "Any"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Company</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{config.role || "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Role</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{config.level || "Any"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Level</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{config.durationMinutes}m</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Duration</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sections ({config.sections.length})</h4>
            <div className="space-y-2">
              {config.sections.map((sec) => {
                const Icon = TYPE_ICONS[sec.type];
                return (
                  <div key={sec.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/20 px-4 py-3">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sec.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sec.problemCount} question{sec.problemCount !== 1 ? "s" : ""} · {sec.difficulties.join(", ")}
                        {sec.topics.length > 0 && ` · ${sec.topics.length} topic${sec.topics.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-md bg-secondary border border-border shrink-0">{MOCK_TYPE_LABELS[sec.type]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setWizardStep(2)}><ChevronLeft className="size-3.5 mr-1" /> Back</Button>
            <Button size="lg" onClick={startTest} className="px-8"><Play className="size-4 mr-2" /> Start Interview</Button>
          </div>
        </div>
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
            <Button onClick={() => { setConfig(buildDefaultConfig()); setWizardStep(1); }} className="flex-1 h-11 text-sm">
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
              <Button onClick={() => { setConfig(buildDefaultConfig()); setWizardStep(1); }} size="sm" className="mt-2"><Play className="size-3.5 mr-1.5" /> Start First Test</Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

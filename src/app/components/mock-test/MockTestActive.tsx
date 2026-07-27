"use client";

import { useState } from "react";
import { Timer, Flag, SkipForward, Lightbulb, Target, CheckCircle2, ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Eye, EyeOff, ChevronLeft, ChevronRight, Code, Layers, Server, Users, Crown, Brain, Settings2, HelpCircle, Grid3X3, List, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import type { MockTestProblemResult, MockInterviewConfig, MockSection, MockInterviewType } from "@/lib/mockTest";
import { MOCK_TYPE_LABELS } from "@/lib/mockTest";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const TYPE_ICONS: Record<MockInterviewType, typeof Code> = {
  dsa: Code, "system-design": Layers, backend: Server, behavioral: Users, leadership: Crown, "ai-ml": Brain, custom: Settings2,
};



function SectionIcon({ type, className }: { type: MockInterviewType; className?: string }) {
  const Icon = TYPE_ICONS[type] || Code;
  return <Icon className={className} />;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface MockTestActiveProps {
  config: MockInterviewConfig;
  sections: MockSection[];
  problems: MockTestProblemResult[];
  currentIndex: number;
  timeLeft: number;
  usedHint: boolean;
  hintsRemaining: number;
  strictMode: boolean;
  markedForReview: boolean[];
  onSolve: () => void;
  onPartialSolve: () => void;
  onSkip: () => void;
  onHint: () => void;
  onNavigate: (index: number) => void;
  onToggleReview: () => void;
  onToggleStrictMode: () => void;
  onEnd: () => void;
  onBack: () => void;
}

export default function MockTestActive({
  config, sections, problems, currentIndex, timeLeft, usedHint, hintsRemaining,
  strictMode, markedForReview,
  onSolve, onPartialSolve, onSkip, onHint, onNavigate, onToggleReview, onToggleStrictMode, onEnd, onBack,
}: MockTestActiveProps) {
  const currentProblem = problems[currentIndex];
  const timePct = config.durationMinutes > 0 ? (timeLeft / (config.durationMinutes * 60)) * 100 : 0;
  const totalProblems = problems.length;
  const attemptedCount = problems.filter((p) => p.solved || p.partiallySolved || p.skipped).length;
  const currentSection = sections.find((s) => s.id === currentProblem?.sectionId);
  const [sheetOpen, setSheetOpen] = useState<"sections" | "navigator" | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const sectionGroups = sections.map((sec) => ({
    section: sec,
    problemIndices: problems.reduce<number[]>((acc, p, i) => { if (p.sectionId === sec.id) acc.push(i); return acc; }, []),
  }));

  const sectionGroup = sectionGroups.find((g) => g.section.id === currentProblem?.sectionId);
  const problemOffset = sectionGroup?.problemIndices.indexOf(currentIndex) ?? -1;
  const resolvedQuestionText = currentProblem.questionText ?? currentSection?.customQuestions?.[problemOffset];

  const navigatorQuestions = problems.map((p, i) => ({
    index: i,
    problem: p,
    isCurrent: i === currentIndex,
    isMarked: markedForReview[i],
  }));

  const handlePrev = () => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  };
  const handleNext = () => {
    if (currentIndex < totalProblems - 1) onNavigate(currentIndex + 1);
    else onEnd();
  };

  const renderSectionSidebar = () => (
    <div className="space-y-1">
      {sectionGroups.map(({ section: sec, problemIndices }) => {
        const secSolved = problemIndices.filter((i) => problems[i].solved).length;
        const SecIcon = TYPE_ICONS[sec.type];
        const isCurrentSec = sec.id === currentProblem?.sectionId;
        return (
          <button
            key={sec.id}
            onClick={() => { if (problemIndices.length > 0) onNavigate(problemIndices[0]); setSheetOpen(null); }}
            className={`w-full text-left rounded-lg p-2.5 transition-all ${
              isCurrentSec
                ? "bg-primary/8 border border-primary/15 shadow-sm"
                : "hover:bg-accent/40 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`size-7 rounded-md flex items-center justify-center ${isCurrentSec ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <SecIcon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{sec.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden max-w-16">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(secSolved / Math.max(problemIndices.length, 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">{secSolved}/{problemIndices.length}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {problemIndices.map((pi) => (
                <span
                  key={pi}
                  className={`size-5 rounded text-[9px] font-semibold flex items-center justify-center transition-colors ${
                    pi === currentIndex
                      ? "ring-1 ring-primary bg-primary text-primary-foreground"
                      : markedForReview[pi]
                        ? "bg-amber-400/20 text-amber-500 border border-amber-400/30"
                        : problems[pi].solved
                          ? "bg-green-500/20 text-green-600 border border-green-500/30"
                          : problems[pi].partiallySolved
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                            : problems[pi].skipped
                              ? "bg-muted-foreground/15 text-muted-foreground border border-muted-foreground/20"
                              : "bg-secondary/40 text-muted-foreground/40 border border-border/40"
                  }`}
                >
                  {pi + 1}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderNavigator = () => (
    <div>
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {navigatorQuestions.map(({ index, problem, isCurrent, isMarked }) => (
          <button key={index} onClick={() => { onNavigate(index); setSheetOpen(null); }}
            className={`size-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
              isCurrent
                ? "ring-2 ring-primary bg-primary text-primary-foreground shadow-sm"
                : isMarked
                  ? "bg-amber-400/15 text-amber-500 border border-amber-400/30"
                  : problem.solved && !problem.partiallySolved
                    ? "bg-green-500/15 text-green-600 border border-green-500/30"
                    : problem.partiallySolved
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : problem.skipped
                        ? "bg-muted-foreground/15 text-muted-foreground border border-muted-foreground/20"
                        : "bg-secondary/30 text-muted-foreground/40 hover:bg-accent border border-border/30"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500 shrink-0" /> Solved</div>
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500 shrink-0" /> Partial</div>
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/50 shrink-0" /> Skipped</div>
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400 shrink-0" /> Review</div>
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-muted-foreground/30 shrink-0" /> Pending</div>
        <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary shrink-0" /> Current</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[inherit]">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 px-3 sm:px-6 h-14">
            <button onClick={onBack} className="size-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0">
              <ChevronLeft className="size-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {config.company && <span className="text-sm font-semibold truncate">{config.company}</span>}
                {config.role && <span className="text-[11px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded border border-border">{config.role}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-secondary/60 px-2.5 py-1 rounded-lg border border-border/60">
                <Timer className={`size-3.5 ${timePct > 20 ? "text-muted-foreground" : timePct > 10 ? "text-warning" : "text-destructive"}`} />
                <span className={`text-sm font-mono font-bold tabular-nums ${timePct > 20 ? "text-foreground" : timePct > 10 ? "text-warning" : "text-destructive"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button onClick={onToggleStrictMode} className={`size-8 flex items-center justify-center rounded-lg border transition-all ${strictMode ? "border-red-500/40 bg-red-500/10 text-red-400 shadow-sm" : "border-border hover:bg-accent text-muted-foreground"}`} title={strictMode ? "Strict Mode On" : "Toggle Strict Mode"}>
                {strictMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 sm:px-6 pb-3">
            <div className="flex-1 h-2 rounded-full bg-secondary/80 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${timePct > 20 ? "bg-primary" : timePct > 10 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${(attemptedCount / totalProblems) * 100}%` }} />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
              {attemptedCount}/{totalProblems}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row mx-auto w-full max-w-7xl">
        <aside className="hidden lg:block w-56 xl:w-64 border-r border-border bg-card/30">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sections</span>
            </div>
            <ScrollArea className="h-[calc(100vh-13rem)]">
              {renderSectionSidebar()}
            </ScrollArea>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
            {currentProblem ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/60">
                        <SectionIcon type={currentProblem.sectionType} className="size-3" />
                        {currentSection?.title ?? MOCK_TYPE_LABELS[currentProblem.sectionType]}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">Q {currentIndex + 1}/{totalProblems}</span>
                      {markedForReview[currentIndex] && (
                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 inline-flex items-center gap-0.5">
                          <BookmarkCheck className="size-2.5" /> Review
                        </span>
                      )}
                      {strictMode && (
                        <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full border border-red-400/20 inline-flex items-center gap-0.5">
                          <EyeOff className="size-2.5" /> Strict
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold leading-snug">
                      {resolvedQuestionText || currentProblem.title}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <DifficultyBadge difficulty={currentProblem.difficulty} />
                      {currentProblem.topic && <span className="text-xs text-muted-foreground/70">{currentProblem.topic}</span>}
                      {currentProblem.timeSpentSeconds > 0 && (
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums flex items-center gap-1">
                          <Timer className="size-3" /> {formatTime(currentProblem.timeSpentSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                  {currentProblem.sectionType === "dsa" && (
                    <a href={`https://leetcode.com/problems/${currentProblem.problemId}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                        <Code className="size-3.5" /> Open LeetCode
                      </Button>
                    </a>
                  )}
                </div>

                {currentProblem.sectionType !== "dsa" && (
                  <div className="rounded-xl border border-border bg-card/50 p-4 sm:p-5 space-y-4">
                    {resolvedQuestionText ? (
                      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] p-4">
                        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <HelpCircle className="size-3.5" /> Question
                        </p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{resolvedQuestionText}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/60 bg-secondary/20 p-4 text-center">
                        <p className="text-xs text-muted-foreground/50">No custom question set for this problem</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-2">Your response / notes:</p>
                      <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Type your answer, approach, or notes here..."
                        className="w-full min-h-[140px] sm:min-h-[180px] rounded-lg border border-border bg-card p-3.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary focus:border-primary/40 resize-y placeholder:text-muted-foreground/30 transition-all"
                      />
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground gap-1">
                          <Send className="size-3" /> Save Notes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {currentProblem.sectionType === "dsa" && (
                  <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
                    <Code className="mx-auto size-8 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground/60">Solve this problem on LeetCode, then mark your result below.</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Use the Open LeetCode button above to open the problem in a new tab.</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                  <Button onClick={handlePrev} disabled={strictMode || currentIndex === 0} variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                    <ArrowLeft className="size-3.5" /> Prev
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={onToggleReview} variant="outline" size="sm" className={`h-9 text-xs gap-1.5 ${markedForReview[currentIndex] ? "border-amber-400/40 bg-amber-400/10 text-amber-500" : ""}`}>
                    {markedForReview[currentIndex] ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
                    {markedForReview[currentIndex] ? "Reviewed" : "Review"}
                  </Button>
                  <Button onClick={onHint} size="sm" variant="outline" className="h-9 text-xs gap-1.5" disabled={usedHint || hintsRemaining <= 0}>
                    <Lightbulb className="size-3.5 text-warning" /> {usedHint ? "Hint Used" : hintsRemaining > 0 ? `Hint (${hintsRemaining})` : "No Hints"}
                  </Button>
                  <Button onClick={onSkip} variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                    <SkipForward className="size-3.5" /> Skip
                  </Button>
                  <Button onClick={onPartialSolve} variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-warning/30 text-warning hover:bg-warning/10">
                    <Target className="size-3.5" /> Partial
                  </Button>
                  <Button onClick={onSolve} variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-success/30 text-success hover:bg-success/10">
                    <CheckCircle2 className="size-3.5" /> Solved
                  </Button>
                  <Button onClick={handleNext} size="sm" className="h-9 text-xs gap-1.5 min-w-[80px]">
                    {currentIndex < totalProblems - 1 ? <><ArrowRight className="size-3.5" /> Next</> : <><Flag className="size-3.5" /> Finish</>}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">No problems in this test.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden lg:block w-56 xl:w-64 border-l border-border bg-card/30">
          <div className="p-3">
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Questions</span>
            </div>
            <ScrollArea className="h-[calc(100vh-13rem)]">
              {renderNavigator()}
            </ScrollArea>
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen === "sections"} onOpenChange={(open) => setSheetOpen(open ? "sections" : null)}>
              <SheetTrigger asChild>
                <button className="lg:hidden size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent text-muted-foreground transition-colors" title="Sections">
                  <List className="size-3.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="mb-3">
                  <SheetTitle className="text-sm">Sections</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-10rem)]">
                  {renderSectionSidebar()}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Sheet open={sheetOpen === "navigator"} onOpenChange={(open) => setSheetOpen(open ? "navigator" : null)}>
              <SheetTrigger asChild>
                <button className="lg:hidden size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent text-muted-foreground transition-colors" title="Questions">
                  <Grid3X3 className="size-3.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-4">
                <SheetHeader className="mb-3">
                  <SheetTitle className="text-sm">Questions ({totalProblems})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-10rem)]">
                  {renderNavigator()}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <span className="text-xs text-muted-foreground tabular-nums hidden sm:block font-medium">
              Q {currentIndex + 1}/{totalProblems}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={strictMode || currentIndex === 0} className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums px-1 sm:hidden font-medium">{currentIndex + 1}/{totalProblems}</span>
            <button onClick={handleNext} disabled={currentIndex >= totalProblems - 1} className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
            <Button onClick={onEnd} variant="outline" size="sm" className="text-xs h-8 ml-2 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5">
              <Flag className="size-3" /> Finish
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

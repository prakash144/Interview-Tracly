"use client";

import { Timer, Flag, CheckCircle2, SkipForward, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import type { MockTestProblemResult, MockInterviewConfig, MockSection } from "@/lib/mockTest";
import { MOCK_TYPE_LABELS } from "@/lib/mockTest";

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
  onSolve: () => void;
  onPartialSolve: () => void;
  onSkip: () => void;
  onHint: () => void;
  onEnd: () => void;
}

export default function MockTestActive({
  config,
  sections,
  problems,
  currentIndex,
  timeLeft,
  usedHint,
  hintsRemaining,
  onSolve,
  onPartialSolve,
  onSkip,
  onHint,
  onEnd,
}: MockTestActiveProps) {
  const currentProblem = problems[currentIndex];
  const timePct = config.durationMinutes > 0 ? (timeLeft / (config.durationMinutes * 60)) * 100 : 0;

  const totalProblems = problems.length;
  const solvedCount = problems.filter((p) => p.solved).length;

  const currentSection = sections.find((s) => s.id === currentProblem?.sectionId);
  const sectionProblems = problems.filter((p) => p.sectionId === currentProblem?.sectionId);
  const sectionIndex = sectionProblems.indexOf(currentProblem);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="size-5 text-primary" />
          <span className="text-lg font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
          <div className="h-2 w-32 sm:w-48 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timePct > 20 ? "bg-success" : timePct > 10 ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{currentIndex + 1}/{totalProblems}</span>
          <span className="text-success tabular-nums">{solvedCount} solved</span>
          {usedHint && <Lightbulb className="size-3.5 text-warning" />}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((sec) => {
          const secProblems = problems.filter((p) => p.sectionId === sec.id);
          const secSolved = secProblems.filter((p) => p.solved).length;
          const isCurrent = sec.id === currentProblem?.sectionId;
          return (
            <div
              key={sec.id}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                isCurrent
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground"
              }`}
            >
              <span className="font-medium">{sec.title}</span>
              <span className="text-[10px] tabular-nums">
                {secSolved}/{secProblems.length}
              </span>
            </div>
          );
        })}
      </div>

      {currentProblem && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-muted-foreground/50 bg-secondary px-2 py-0.5 rounded-full border border-border">
                  {currentSection?.title ?? MOCK_TYPE_LABELS[currentProblem.sectionType]}
                </span>
                {sectionIndex >= 0 && (
                  <span className="text-[10px] text-muted-foreground/50">
                    Q {sectionIndex + 1}/{sectionProblems.length}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{currentProblem.title}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <DifficultyBadge difficulty={currentProblem.difficulty} />
                {currentProblem.topic && (
                  <span className="text-xs text-muted-foreground">{currentProblem.topic}</span>
                )}
              </div>
            </div>
            {currentProblem.sectionType === "dsa" && (
              <a
                href={`https://leetcode.com/problems/${currentProblem.problemId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
                  Open LeetCode
                </Button>
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button onClick={onSolve} variant="outline" size="sm" className="text-xs h-8">
              <CheckCircle2 className="size-3.5 mr-1 text-success" /> Solved
            </Button>
            <Button onClick={onPartialSolve} variant="outline" size="sm" className="text-xs h-8">
              <Target className="size-3.5 mr-1 text-warning" /> Partial
            </Button>
            <Button
              onClick={onHint}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              disabled={usedHint || hintsRemaining <= 0}
            >
              <Lightbulb className="size-3.5 mr-1 text-warning" />{" "}
              {usedHint ? "Hint Used" : hintsRemaining > 0 ? `Hint (${hintsRemaining})` : "No Hints"}
            </Button>
            <Button onClick={onSkip} variant="outline" size="sm" className="text-xs h-8">
              <SkipForward className="size-3.5 mr-1" /> Skip
            </Button>
            <Button
              onClick={onEnd}
              variant="outline"
              size="sm"
              className="text-xs h-8 ml-auto text-destructive"
            >
              <Flag className="size-3.5 mr-1" /> End Test
            </Button>
          </div>
        </div>
      )}

      {!currentProblem && totalProblems === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No problems in this test.</p>
        </div>
      )}
    </div>
  );
}

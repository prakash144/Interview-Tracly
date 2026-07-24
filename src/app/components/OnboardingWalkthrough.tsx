"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Kanban, BarChart3, Sparkles, ChevronRight, SkipForward } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "interview-tracly-onboarding-done";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
}

const steps: Step[] = [
  {
    icon: <Sparkles className="size-8 text-success" />,
    title: "Welcome to Interview Tracly",
    description: "Your personal interview preparation command center",
    detail: "Track problems, plan sprints, monitor progress, and get readiness insights — all in one place.",
  },
  {
    icon: <Target className="size-8 text-info" />,
    title: "Solve & Track Problems",
    description: "Browse the problem workspace and mark your progress",
    detail: "Use the Problems page to filter by company, difficulty, and topic. Mark problems as solved, attempted, or bookmarked for revision.",
  },
  {
    icon: <Kanban className="size-8 text-warning" />,
    title: "Plan with Sprints",
    description: "Organize your prep into focused timeboxes",
    detail: "Create sprints with goals, add tasks, and track completion. Use pre-built templates for common prep patterns.",
  },
  {
    icon: <BarChart3 className="size-8 text-success" />,
    title: "Track & Improve",
    description: "Monitor progress and identify weak areas",
    detail: "The Progress page shows your history, streaks, and topic breakdown. Use insights to focus on what matters most.",
  },
];

export const OnboardingWalkthrough = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [step, handleComplete]);

  const isLast = step === steps.length - 1;
  const s = steps[step];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DialogContent className="sm:max-w-sm overflow-hidden p-0">
        <div className="relative p-6 pb-4">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success/15 to-info/15 border border-border/50">
            {s.icon}
          </div>
          <div className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold text-foreground">{s.title}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs text-foreground/80 leading-relaxed">{s.detail}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-card/50">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === step ? "bg-success" : i < step ? "bg-success/40" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
            >
              <SkipForward className="size-3" />
              Skip
            </button>
            <Button
              type="button"
              onClick={handleNext}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"
            >
              {isLast ? "Get Started" : "Next"}
              <ChevronRight className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

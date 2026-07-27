"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import type { WeakTopic } from "@/hooks/useInterviewReadiness";
import type { PatternCoverage } from "@/hooks/useInterviewReadiness";

interface StrengthsWeaknessesProps {
  weakTopics: WeakTopic[];
  patternCoverage: PatternCoverage[];
  strongestTopics: { name: string; rate: number }[];
}

export function StrengthsWeaknesses({ weakTopics, patternCoverage, strongestTopics }: StrengthsWeaknessesProps) {
  const strongPatterns = useMemo(
    () => patternCoverage.filter((p) => p.completion >= 70).slice(0, 3),
    [patternCoverage]
  );

  const weakPatterns = useMemo(
    () => patternCoverage.filter((p) => p.completion < 50).slice(0, 3),
    [patternCoverage]
  );

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Lightbulb className="size-4 text-warning" />
          Strengths & Weaknesses
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="size-3.5 text-success" />
              <span className="text-xs font-medium text-success">Strengths</span>
            </div>
            {strongestTopics.length > 0 || strongPatterns.length > 0 ? (
              <div className="space-y-2">
                {strongestTopics.map((t) => (
                  <div key={t.name} className="flex items-center justify-between rounded-md bg-success/5 px-3 py-2">
                    <span className="text-xs text-foreground truncate">{t.name}</span>
                    <span className="text-xs font-medium text-success shrink-0 ml-2">{Math.round(t.rate * 100)}%</span>
                  </div>
                ))}
                {strongPatterns.map((p) => (
                  <div key={p.pattern} className="flex items-center justify-between rounded-md bg-success/5 px-3 py-2">
                    <span className="text-xs text-foreground truncate">{p.pattern}</span>
                    <span className="text-xs font-medium text-success shrink-0 ml-2">{p.completion}%</span>
                  </div>
                ))}
                {strongestTopics.length === 0 && strongPatterns.length === 0 && (
                  <p className="text-xs text-muted-foreground">Not enough data</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Solve more problems to identify strengths</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="size-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">Needs Improvement</span>
            </div>
            {weakTopics.length > 0 || weakPatterns.length > 0 ? (
              <div className="space-y-2">
                {weakTopics.slice(0, 3).map((t) => (
                  <div key={t.topic} className="flex items-center justify-between rounded-md bg-destructive/5 px-3 py-2">
                    <span className="text-xs text-foreground truncate">{t.topic}</span>
                    <span className="text-xs font-medium text-destructive shrink-0 ml-2">{t.completion}%</span>
                  </div>
                ))}
                {weakPatterns.map((p) => (
                  <div key={p.pattern} className="flex items-center justify-between rounded-md bg-destructive/5 px-3 py-2">
                    <span className="text-xs text-foreground truncate">{p.pattern}</span>
                    <span className="text-xs font-medium text-destructive shrink-0 ml-2">{p.completion}%</span>
                  </div>
                ))}
                {weakTopics.length === 0 && weakPatterns.length === 0 && (
                  <p className="text-xs text-muted-foreground">No weak areas detected</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Not enough data to assess weak areas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

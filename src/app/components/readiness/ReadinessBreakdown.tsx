"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import type { ReadinessFactors } from "@/hooks/useInterviewReadiness";

interface ReadinessBreakdownProps {
  factors: ReadinessFactors;
}

interface FactorDef {
  key: keyof ReadinessFactors;
  label: string;
  description: string;
  weight: string;
}

const FACTORS: FactorDef[] = [
  { key: "companyCompletion", label: "Company Coverage", description: "Average solved percentage across tracked companies", weight: "25%" },
  { key: "topicCoverage", label: "Topic Coverage", description: "Percentage of topics with at least one solved problem", weight: "20%" },
  { key: "difficultyBalance", label: "Difficulty Balance", description: "Even distribution across Easy, Medium, and Hard problems", weight: "15%" },
  { key: "revisionCompletion", label: "Revision Completion", description: "Percentage of revision tasks marked as reviewed", weight: "15%" },
  { key: "consistency", label: "Consistency", description: "Active practice days relative to target (30 days)", weight: "15%" },
  { key: "currentStreakScore", label: "Streak", description: "Current practice streak relative to 30-day target", weight: "10%" },
];

const FactorProgress = ({ value, label, description, weight }: { value: number; label: string; description: string; weight: string }) => {
  const [expanded, setExpanded] = useState(false);
  const color = value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-1.5 group cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground/50 font-mono">{weight}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">{value}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </div>
      </button>
      {expanded && (
        <div className="px-1 pb-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          {description}
          <div className="mt-1 text-[10px] text-muted-foreground/50">
            Weight: {weight} of overall score
          </div>
        </div>
      )}
    </div>
  );
};

const ReadinessBreakdown = ({ factors }: ReadinessBreakdownProps) => {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-6 items-center justify-center rounded bg-info/10">
          <BarChart3 className="size-3.5 text-info" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Readiness Breakdown</h2>
      </div>
      <div className="divide-y divide-border/50">
        {FACTORS.map((f) => (
          <FactorProgress
            key={f.key}
            value={factors[f.key]}
            label={f.label}
            description={f.description}
            weight={f.weight}
          />
        ))}
      </div>
    </div>
  );
};

export default ReadinessBreakdown;

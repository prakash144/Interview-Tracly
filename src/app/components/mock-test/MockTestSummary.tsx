"use client";

import {
  RotateCcw,
  CheckCircle2,
  SkipForward,
  Lightbulb,
  Target,
  Clock,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Layers,
  Trophy,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import type { MockTestResult, MockTestSummary as Summary } from "@/lib/mockTest";
import { computeSummary, MOCK_TYPE_LABELS } from "@/lib/mockTest";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--secondary))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xl font-bold"
        fill="currentColor"
      >
        {score}
      </text>
    </svg>
  );
}

interface StatCardProps {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <Icon className={`size-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionCard({
  section,
}: {
  section: Summary["sections"][number];
}) {
  const color = section.score >= 80 ? "text-success" : section.score >= 50 ? "text-warning" : "text-destructive";
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{section.sectionTitle}</p>
          <p className="text-[10px] text-muted-foreground">{MOCK_TYPE_LABELS[section.sectionType]}</p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreRing score={section.score} size={48} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className={`text-sm font-bold tabular-nums ${color}`}>{section.solved}</p>
          <p className="text-[10px] text-muted-foreground">Solved</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-warning">{section.partiallySolved}</p>
          <p className="text-[10px] text-muted-foreground">Partial</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-muted-foreground">{section.unsolved}</p>
          <p className="text-[10px] text-muted-foreground">Unsolved</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            section.score >= 80 ? "bg-success" : section.score >= 50 ? "bg-warning" : "bg-destructive"
          }`}
          style={{ width: `${section.score}%` }}
        />
      </div>
    </div>
  );
}

function RecommendCard({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: Summary["strengths"];
  icon: typeof Trophy;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${color}`} />
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-[10px] text-muted-foreground ml-auto">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-xs">
            <div className={`size-1.5 rounded-full mt-1.5 shrink-0 ${color}`} />
            <div className="min-w-0">
              <p className="font-medium">{item.label}</p>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MockTestSummaryProps {
  result: MockTestResult;
  onNewTest: () => void;
  history: MockTestResult[];
  onReview?: (result: MockTestResult) => void;
}

export default function MockTestSummary({ result, onNewTest, history, onReview }: MockTestSummaryProps) {
  const summary = computeSummary(result);
  const solved = summary.solved;
  const partiallySolved = summary.partiallySolved;
  const unsolved = summary.unsolved;
  const total = solved + partiallySolved + unsolved;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Mock Interview Review
        </p>
        <h2 className="text-2xl font-bold">
          {summary.overallScore >= 80
            ? "Excellent!"
            : summary.overallScore >= 50
              ? "Good Effort"
              : "Keep Practicing"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {result.config.company && `${result.config.company} · `}
          {result.config.role && `${result.config.role} · `}
          {result.config.durationMinutes} min
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-6">
          <ScoreRing score={summary.overallScore} size={100} />
          <div className="text-left space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="text-success font-bold tabular-nums">{solved}</span> Solved
              {partiallySolved > 0 && (
                <span className="ml-2">
                  <span className="text-warning font-bold tabular-nums">{partiallySolved}</span> Partial
                </span>
              )}
              {unsolved > 0 && (
                <span className="ml-2">
                  <span className="text-muted-foreground font-bold tabular-nums">{unsolved}</span> Unsolved
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> {formatTime(summary.totalTimeSeconds)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle2} label="Solved" value={solved} color="text-success" />
        <StatCard icon={SkipForward} label="Skipped" value={summary.unsolved} color="text-muted-foreground" />
        <StatCard
          icon={Lightbulb}
          label="Hints Used"
          value={result.problems.filter((p) => p.usedHint).length}
          color="text-warning"
        />
        <StatCard
          icon={Target}
          label="Accuracy"
          value={total > 0 ? `${Math.round((solved / total) * 100)}%` : "N/A"}
          color="text-info"
        />
      </div>

      {summary.difficultyBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Difficulty Breakdown</h4>
          </div>
          <div className="space-y-2">
            {summary.difficultyBreakdown.map((d) => (
              <div key={d.label} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 font-medium">{d.label}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.label === "Easy"
                        ? "bg-success"
                        : d.label === "Medium"
                          ? "bg-warning"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="tabular-nums shrink-0 text-muted-foreground">
                  {d.solved}/{d.total}
                </span>
                <span className="tabular-nums w-10 text-right shrink-0">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.sections.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Sections</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.sections.map((sec) => (
              <SectionCard key={sec.sectionId} section={sec} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <RecommendCard
          title="Strengths"
          items={summary.strengths}
          icon={Trophy}
          color="text-success"
        />
        <RecommendCard
          title="Weaknesses"
          items={summary.weaknesses}
          icon={AlertTriangle}
          color="text-destructive"
        />
      </div>

      {summary.recommendations.length > 0 && (
        <RecommendCard
          title="Recommendations"
          items={summary.recommendations}
          icon={Zap}
          color="text-info"
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {summary.suggestedTopics.length > 0 && (
          <RecommendCard
            title="Suggested Topics"
            items={summary.suggestedTopics}
            icon={BookOpen}
            color="text-warning"
          />
        )}
        {summary.nextPlan.length > 0 && (
          <RecommendCard
            title="Next Practice Plan"
            items={summary.nextPlan}
            icon={Sparkles}
            color="text-primary"
          />
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-semibold">Problem Breakdown</h4>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {result.problems.map((p) => (
            <div key={`${p.sectionId}-${p.problemId}`} className="flex items-center gap-3 px-1 py-2 text-xs">
              <span
                className={`size-2 rounded-full shrink-0 ${
                  p.solved && !p.partiallySolved
                    ? "bg-success"
                    : p.partiallySolved
                      ? "bg-warning"
                      : p.skipped
                        ? "bg-muted-foreground"
                        : "bg-destructive/50"
                }`}
              />
              <span className="flex-1 truncate">{p.title}</span>
              <DifficultyBadge difficulty={p.difficulty} />
              <span className="text-muted-foreground tabular-nums shrink-0">{formatTime(p.timeSpentSeconds)}</span>
              {p.usedHint && <Lightbulb className="size-3 text-warning shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={onNewTest} variant="outline" size="sm" className="h-8 text-xs">
          <RotateCcw className="size-3.5 mr-1" /> New Interview
        </Button>
      </div>

      {history.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Interview History
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.slice(1, 11).map((r) => {
              const s = r.problems.filter((p) => p.solved && !p.partiallySolved).length;
              const p = r.problems.filter((p) => p.partiallySolved).length;
              return (
                <button
                  key={r.id}
                  onClick={() => onReview?.(r)}
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
                    {r.config.durationMinutes}m
                    {r.config.company && ` · ${r.config.company}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

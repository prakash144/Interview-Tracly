"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadHistory } from "@/lib/mockTest";
import type { MockTestResult } from "@/lib/mockTest";
import { Timer, Play, SkipForward, Lightbulb, TrendingUp } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MockTestView({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<MockTestResult[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const totalTests = history.length;
  const totalSolved = history.reduce((sum, r) => sum + r.problems.filter((p) => p.solved).length, 0);
  const totalProblems = history.reduce((sum, r) => sum + r.problems.length, 0);
  const avgAccuracy = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-1 block">&larr; Back to Tracks</button>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Timer className="size-5 text-primary" /> Mock Test
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-white tabular-nums">{totalTests}</p>
          <p className="text-[10px] text-muted-foreground">Tests Taken</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-success tabular-nums">{totalSolved}</p>
          <p className="text-[10px] text-muted-foreground">Solved</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-info tabular-nums">{avgAccuracy}%</p>
          <p className="text-[10px] text-muted-foreground">Accuracy</p>
        </div>
      </div>

      <Link href="/mock-test"
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Play className="size-4" /> Start New Test
      </Link>

      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Results</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.slice(0, 8).map((r) => {
              const s = r.problems.filter((p) => p.solved).length;
              const sk = r.problems.filter((p) => p.skipped).length;
              const h = r.problems.filter((p) => p.usedHint).length;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-md bg-gray-800/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground tabular-nums shrink-0 w-16">{new Date(r.startedAt).toLocaleDateString()}</span>
                  <span className="text-success font-medium">{s}/{r.problems.length}</span>
                  {sk > 0 && <span className="text-muted-foreground flex items-center gap-0.5"><SkipForward className="size-3" />{sk}</span>}
                  {h > 0 && <span className="text-warning flex items-center gap-0.5"><Lightbulb className="size-3" />{h}</span>}
                  <span className="text-muted-foreground ml-auto tabular-nums">{formatTime(r.totalTimeSeconds)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <TrendingUp className="mx-auto size-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No tests yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Start your first mock interview to track performance</p>
        </div>
      )}
    </div>
  );
}

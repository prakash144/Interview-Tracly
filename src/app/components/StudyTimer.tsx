"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Square, Clock, Timer, Trash2 } from "lucide-react";
import { useStudySessions } from "@/hooks/useStudySessions";

export function StudyTimer() {
  const { sessions, activeSession, elapsed, startSession, stopSession, deleteSessionById, formatElapsed } = useStudySessions();
  const [focusInput, setFocusInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const todayMinutes = sessions
    .filter((s) => s.completed && s.startTime >= new Date().setHours(0, 0, 0, 0))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const weekMinutes = sessions
    .filter((s) => s.completed && s.startTime >= Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const recentSessions = sessions.filter((s) => s.completed).slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Study Timer</h3>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {showHistory ? "Hide" : "History"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold tabular-nums">{todayMinutes}m</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-bold tabular-nums">{weekMinutes}m</p>
          <p className="text-[10px] text-muted-foreground">This Week</p>
        </div>
      </div>

      {/* Timer display */}
      {activeSession && !activeSession.endTime ? (
        <div className="space-y-3">
          <div className="text-center py-4">
            <div className="text-4xl font-mono font-bold tabular-nums tracking-wider text-primary">
              {formatElapsed(elapsed)}
            </div>
            {activeSession.focusArea && (
              <p className="text-xs text-muted-foreground mt-1">{activeSession.focusArea}</p>
            )}
          </div>
          <Button onClick={stopSession} variant="destructive" className="w-full" size="sm">
            <Square className="size-4 mr-1.5" /> Stop Session
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            value={focusInput}
            onChange={(e) => setFocusInput(e.target.value)}
            placeholder="What are you studying? (optional)"
            className="text-sm h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                startSession(focusInput);
                setFocusInput("");
              }
            }}
          />
          <Button
            onClick={() => { startSession(focusInput); setFocusInput(""); }}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Play className="size-4 mr-1.5" /> Start Session
          </Button>
        </div>
      )}

      {/* History */}
      {showHistory && recentSessions.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Sessions</p>
          {recentSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-muted/50 group">
              <Clock className="size-3 text-muted-foreground shrink-0" />
              <span className="font-mono tabular-nums text-foreground shrink-0">{s.durationMinutes}m</span>
              <span className="text-muted-foreground truncate flex-1">{s.focusArea || "Focused study"}</span>
              <span className="text-muted-foreground/50 shrink-0">
                {new Date(s.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <button onClick={() => deleteSessionById(s.id)} className="size-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showHistory && recentSessions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No sessions yet</p>
      )}
    </div>
  );
}

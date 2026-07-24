"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { loadSessions, saveSession, deleteSession, generateSessionId } from "@/lib/studySessions";
import type { StudySession } from "@/lib/studySessions";

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    const active = loaded.find((s) => !s.completed && !s.endTime);
    if (active) {
      setActiveSession(active);
      const running = Math.floor((Date.now() - active.startTime) / 1000);
      setElapsed(running);
    }
  }, []);

  useEffect(() => {
    if (activeSession && !activeSession.endTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSession]);

  const startSession = useCallback((focusArea = "", notes = "") => {
    const session: StudySession = {
      id: generateSessionId(),
      startTime: Date.now(),
      endTime: null,
      durationMinutes: 0,
      focusArea,
      notes,
      completed: false,
    };
    saveSession(session);
    setActiveSession(session);
    setSessions((prev) => [session, ...prev]);
    setElapsed(0);
  }, []);

  const stopSession = useCallback(() => {
    if (!activeSession) return;
    const minutes = Math.round(elapsed / 60);
    const ended: StudySession = {
      ...activeSession,
      endTime: Date.now(),
      durationMinutes: minutes,
      completed: true,
    };
    saveSession(ended);
    setActiveSession(null);
    setSessions((prev) => prev.map((s) => (s.id === ended.id ? ended : s)));
    setElapsed(0);
  }, [activeSession, elapsed]);

  const deleteSessionById = useCallback((id: string) => {
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      setElapsed(0);
    }
  }, [activeSession]);

  const refresh = useCallback(() => {
    setSessions(loadSessions());
  }, []);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return {
    sessions,
    activeSession,
    elapsed,
    startSession,
    stopSession,
    deleteSessionById,
    refresh,
    formatElapsed,
  };
}

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { ProgressMap, Problem } from "@/lib/progressTypes";
import { type Sm2State, createSm2State, scheduleFirstReview, computeNextReview } from "@/lib/spacedRepetition";

const STORAGE_KEY = "revision-progress";

interface ReviewEntry {
  status: "reviewed" | "skipped";
  date: string;
  sm2?: Sm2State;
}

type RevisionProgress = Record<string, ReviewEntry>;

function loadProgress(): RevisionProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: RevisionProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export interface RevisionItem {
  problemId: string;
  title: string;
  company: string;
  difficulty: string;
  lastSolved: string;
  daysSinceSolved: number;
}

export interface RevisionBuckets {
  overdue: RevisionItem[];
  reviewToday: RevisionItem[];
  reviewThisWeek: RevisionItem[];
}

export interface RevisionStats {
  pending: number;
  completed: number;
  overdue: number;
  total: number;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function useRevisionTracker(progressMap: ProgressMap, questions: Problem[]) {
  const [progress, setProgress] = useState<RevisionProgress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const questionMap = useMemo(() => {
    const map = new Map<string, Problem>();
    for (const q of questions) map.set(q.problemId, q);
    return map;
  }, [questions]);

  const buckets = useMemo((): RevisionBuckets => {
    const now = Date.now();
    const overdue: RevisionItem[] = [];
    const reviewToday: RevisionItem[] = [];
    const reviewThisWeek: RevisionItem[] = [];

    for (const [id, p] of Object.entries(progressMap)) {
      if (!p.solved || !p.solvedAt) continue;
      const solvedDate = new Date(p.solvedAt.seconds * 1000);
      const daysSinceSolved = Math.round((now - solvedDate.getTime()) / 86400000);
      if (daysSinceSolved < 1) continue;

      const entry = progress[id];
      const nextReview = entry?.sm2?.nextReviewAt ?? null;
      const q = questionMap.get(id);
      const item: RevisionItem = {
        problemId: id,
        title: q?.title || id,
        company: q?.company || "",
        difficulty: q?.difficulty || "",
        lastSolved: formatDate(solvedDate),
        daysSinceSolved,
      };

      if (nextReview && nextReview <= now) {
        overdue.push(item);
      } else if (nextReview && nextReview <= now + 86400000) {
        reviewToday.push(item);
      } else if (nextReview && nextReview <= now + 7 * 86400000) {
        reviewThisWeek.push(item);
      } else if (!entry?.sm2 && daysSinceSolved >= 1) {
        if (daysSinceSolved <= 1) reviewToday.push(item);
        else if (daysSinceSolved <= 7) reviewThisWeek.push(item);
        else overdue.push(item);
      }
    }

    return {
      overdue: overdue.sort((a, b) => b.daysSinceSolved - a.daysSinceSolved),
      reviewToday: reviewToday.sort((a, b) => a.daysSinceSolved - b.daysSinceSolved),
      reviewThisWeek: reviewThisWeek.sort((a, b) => a.daysSinceSolved - b.daysSinceSolved),
    };
  }, [progressMap, questionMap, progress]);

  const stats = useMemo((): RevisionStats => {
    const completed = Object.values(progress).filter((e) => e.status === "reviewed").length;
    const overdueCount = buckets.overdue.length;
    const pending = buckets.reviewToday.length + buckets.reviewThisWeek.length + overdueCount;
    return {
      pending,
      completed,
      overdue: overdueCount,
      total: pending + completed,
    };
  }, [buckets, progress]);

  const scheduleReview = useCallback((problemId: string) => {
    const sm2 = scheduleFirstReview();
    setProgress((prev) => ({
      ...prev,
      [problemId]: { status: "reviewed", date: new Date().toISOString().slice(0, 10), sm2 },
    }));
  }, []);

  const markReviewed = useCallback((problemId: string, quality = 3) => {
    setProgress((prev) => {
      const existing = prev[problemId];
      const currentSm2 = existing?.sm2 ?? createSm2State();
      const nextSm2 = computeNextReview(currentSm2, quality);
      return {
        ...prev,
        [problemId]: { status: "reviewed", date: new Date().toISOString().slice(0, 10), sm2: nextSm2 },
      };
    });
  }, []);

  const markSkipped = useCallback((problemId: string) => {
    setProgress((prev) => ({
      ...prev,
      [problemId]: { status: "skipped", date: new Date().toISOString().slice(0, 10) },
    }));
  }, []);

  const resetProgress = useCallback((problemId: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
  }, []);

  return { buckets, stats, progress, scheduleReview, markReviewed, markSkipped, resetProgress };
}

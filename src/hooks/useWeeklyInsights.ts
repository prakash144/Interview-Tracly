"use client";

import { useMemo } from "react";
import type { ProgressMap } from "@/lib/progressTypes";
import type { RevisionStats } from "@/hooks/useRevisionTracker";
import type { StudySession } from "@/lib/studySessions";
import { loadHistory } from "@/lib/mockTest";

export interface WeekOverWeekDelta {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  direction: "up" | "down" | "flat";
}

export interface WeeklyInsightMetric {
  label: string;
  value: string;
  sublabel: string;
  icon: string;
  trend: "up" | "down" | "flat";
  deltaPercent: number;
  color: string;
}

export interface WeeklyInsightsData {
  metrics: WeeklyInsightMetric[];
  studyTime: WeekOverWeekDelta;
  problemsSolved: WeekOverWeekDelta;
  mockInterviews: WeekOverWeekDelta;
  revisionRate: WeekOverWeekDelta;
  readinessScore: WeekOverWeekDelta;
  learningStreak: WeekOverWeekDelta;
  generatedAt: number | null;
}

function computeWeekOverWeek(
  getCurrent: () => number,
  getPrevious: () => number
): WeekOverWeekDelta {
  const current = getCurrent();
  const previous = getPrevious();
  const delta = current - previous;
  const deltaPercent = previous > 0 ? Math.round((delta / previous) * 100) : current > 0 ? 100 : 0;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { current, previous, delta, deltaPercent, direction };
}

function countProblemsInRange(
  progressMap: ProgressMap,
  daysAgoStart: number,
  daysAgoEnd: number
): number {
  const now = Date.now();
  const start = now - daysAgoStart * 86400000;
  const end = now - daysAgoEnd * 86400000;
  let count = 0;
  for (const p of Object.values(progressMap)) {
    if (p.solved && p.solvedAt) {
      const t = p.solvedAt.seconds * 1000;
      if (t >= end && t < start) count++;
    }
  }
  return count;
}

function countMockInterviewsInRange(
  results: { startedAt: number }[],
  daysAgoStart: number,
  daysAgoEnd: number
): number {
  const now = Date.now();
  const start = now - daysAgoStart * 86400000;
  const end = now - daysAgoEnd * 86400000;
  return results.filter((r) => r.startedAt >= end && r.startedAt < start).length;
}

function getWeeklyAverageMinutes(sessions: StudySession[], weeksAgo: number): number {
  const now = Date.now();
  const weekStart = now - weeksAgo * 7 * 86400000;
  const weekEnd = weekStart + 7 * 86400000;
  const weekSessions = sessions.filter(
    (s) => s.completed && s.startTime >= weekEnd && s.startTime < weekStart
  );
  return weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
}

function computeCurrentStreak(progressMap: ProgressMap): number {
  const solvedDates = new Set<string>();
  for (const p of Object.values(progressMap)) {
    if (p.solved && p.solvedAt) {
      solvedDates.add(new Date(p.solvedAt.seconds * 1000).toISOString().slice(0, 10));
    }
  }
  if (solvedDates.size === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (solvedDates.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useWeeklyInsights(
  progressMap: ProgressMap,
  revisionStats: RevisionStats,
  sessions: StudySession[],
  readinessScore: number,
  readinessLevel: string,
): WeeklyInsightsData {
  return useMemo(() => {
    const mockResults = loadHistory();

    const problemsSolved = computeWeekOverWeek(
      () => countProblemsInRange(progressMap, 7, 0),
      () => countProblemsInRange(progressMap, 14, 7)
    );

    const studyTime = computeWeekOverWeek(
      () => getWeeklyAverageMinutes(sessions, 0),
      () => getWeeklyAverageMinutes(sessions, 1)
    );

    const mockInterviews = computeWeekOverWeek(
      () => countMockInterviewsInRange(mockResults, 7, 0),
      () => countMockInterviewsInRange(mockResults, 14, 7)
    );

    const currentRate = revisionStats.total > 0
      ? Math.round((revisionStats.completed / revisionStats.total) * 100)
      : 0;
    const revisionRate: WeekOverWeekDelta = {
      current: currentRate,
      previous: currentRate,
      delta: 0,
      deltaPercent: 0,
      direction: "flat",
    };

    const readinessScoreVal = readinessScore;
    const readinessScoreDelta: WeekOverWeekDelta = {
      current: readinessScoreVal,
      previous: readinessScoreVal,
      delta: 0,
      deltaPercent: 0,
      direction: "flat",
    };

    const currentStreak = computeCurrentStreak(progressMap);
    const learningStreak: WeekOverWeekDelta = {
      current: currentStreak,
      previous: currentStreak,
      delta: 0,
      deltaPercent: 0,
      direction: "flat",
    };

    const metrics: WeeklyInsightMetric[] = [
      {
        label: "Study Time",
        value: `${studyTime.current}m`,
        sublabel: `${studyTime.deltaPercent > 0 ? "+" : ""}${studyTime.deltaPercent}% vs last week`,
        icon: "Clock",
        trend: studyTime.direction,
        deltaPercent: studyTime.deltaPercent,
        color: "text-info",
      },
      {
        label: "Problems Solved",
        value: String(problemsSolved.current),
        sublabel: `${problemsSolved.delta >= 0 ? "+" : ""}${problemsSolved.delta} vs last week`,
        icon: "CheckCircle2",
        trend: problemsSolved.direction,
        deltaPercent: problemsSolved.deltaPercent,
        color: "text-success",
      },
      {
        label: "Mock Interviews",
        value: String(mockInterviews.current),
        sublabel: `${mockInterviews.delta >= 0 ? "+" : ""}${mockInterviews.delta} vs last week`,
        icon: "Briefcase",
        trend: mockInterviews.direction,
        deltaPercent: mockInterviews.deltaPercent,
        color: "text-warning",
      },
      {
        label: "Revision Rate",
        value: `${revisionRate.current}%`,
        sublabel: `${revisionStats.pending} pending reviews`,
        icon: "RotateCcw",
        trend: revisionRate.direction,
        deltaPercent: revisionRate.deltaPercent,
        color: "text-cyan-400",
      },
      {
        label: "Readiness Score",
        value: `${readinessScoreVal}%`,
        sublabel: readinessLevel,
        icon: "Crosshair",
        trend: readinessScoreDelta.direction,
        deltaPercent: readinessScoreDelta.deltaPercent,
        color: "text-purple-400",
      },
      {
        label: "Learning Streak",
        value: `${learningStreak.current} days`,
        sublabel: "Keep it going!",
        icon: "Flame",
        trend: learningStreak.direction,
        deltaPercent: learningStreak.deltaPercent,
        color: "text-orange-400",
      },
    ];

    return {
      metrics,
      studyTime,
      problemsSolved,
      mockInterviews,
      revisionRate,
      readinessScore: readinessScoreDelta,
      learningStreak,
      generatedAt: null,
    };
  }, [progressMap, revisionStats, sessions, readinessScore, readinessLevel]);
}

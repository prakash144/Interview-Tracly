"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserActivity, type DailyActivity } from "@/services/firebase/progressService";
import type { Problem, ProgressMap } from "@/lib/progressTypes";

export type TimeRangeId =
  | "today"
  | "yesterday"
  | "this-week"
  | "last-7-days"
  | "this-month"
  | "last-30-days"
  | "last-90-days"
  | "this-quarter"
  | "this-year"
  | "custom";

export interface TimeRange {
  id: TimeRangeId;
  label: string;
}

export const TIME_RANGES: TimeRange[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this-week", label: "This Week" },
  { id: "last-7-days", label: "Last 7 Days" },
  { id: "this-month", label: "This Month" },
  { id: "last-30-days", label: "Last 30 Days" },
  { id: "last-90-days", label: "Last 90 Days" },
  { id: "this-quarter", label: "This Quarter" },
  { id: "this-year", label: "This Year" },
  { id: "custom", label: "Custom" },
];

export interface CalendarDay {
  date: string;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  solvedCount: number;
  attemptedCount: number;
  totalCount: number;
  problemTitles: string[];
  solvedTitles: string[];
  attemptedTitles: string[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  label: string;
  weeks: CalendarWeek[];
}

export interface CalendarStats {
  totalSolved: number;
  totalAttempted: number;
  totalSubmissions: number;
  acceptanceRate: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  avgPerDay: number;
}

export interface WeeklyTrend {
  weekLabel: string;
  count: number;
  startDate: string;
}

export interface CalendarInsightsData {
  mostProductiveDay: { date: string; count: number; problemTitles: string[] } | null;
  mostProductiveWeek: { weekLabel: string; count: number } | null;
  mostProductiveMonth: { month: string; count: number } | null;
  inactiveDays: number;
  weeklyTrend: WeeklyTrend[];
  monthlyTrend: { month: string; count: number }[];
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });
}

function buildCalendarMonth(year: number, month: number, dayData: Map<string, { solved: string[]; attempted: string[] }>, problemTitles: Map<string, string>): CalendarMonth {
  const today = getDateKey(new Date());
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDay[] = [];

  const makePadDay = (d: Date) => {
    const dateKey = getDateKey(d);
    return {
      date: dateKey,
      day: d.getDate(),
      isToday: dateKey === today,
      isCurrentMonth: false,
      solvedCount: 0,
      attemptedCount: 0,
      totalCount: 0,
      problemTitles: [] as string[],
      solvedTitles: [] as string[],
      attemptedTitles: [] as string[],
    };
  };

  for (let i = 0; i < startPad; i++) {
    currentWeek.push(makePadDay(new Date(year, month, -startPad + i + 1)));
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateKey = getDateKey(date);
    const data = dayData.get(dateKey);
    const solved = data?.solved ?? [];
    const attempted = data?.attempted ?? [];
    const solvedTitles = solved.map((id) => problemTitles.get(id) ?? id);
    const attemptedTitles = attempted.map((id) => problemTitles.get(id) ?? id);

    currentWeek.push({
      date: dateKey,
      day: d,
      isToday: dateKey === today,
      isCurrentMonth: true,
      solvedCount: solved.length,
      attemptedCount: attempted.length,
      totalCount: solved.length + attempted.length,
      problemTitles: solvedTitles,
      solvedTitles,
      attemptedTitles,
    });

    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const lastDate = currentWeek.length > 0
        ? new Date(currentWeek[currentWeek.length - 1].date)
        : new Date(year, month + 1, 0);
      const padDate = new Date(lastDate);
      padDate.setDate(padDate.getDate() + 1);
      currentWeek.push(makePadDay(padDate));
    }
    weeks.push({ days: currentWeek });
  }

  return {
    year,
    month,
    label: getMonthLabel(year, month),
    weeks,
  };
}

function getDateRange(rangeId: TimeRangeId, customRange?: { start?: string; end?: string }): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(end);

  switch (rangeId) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "this-week": {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "last-7-days":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "this-month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last-30-days":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "last-90-days":
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case "this-quarter": {
      const qMonth = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(qMonth, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "this-year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customRange?.start) {
        const s = new Date(customRange.start + "T00:00:00");
        if (!isNaN(s.getTime())) return { start: s, end: customRange.end ? new Date(customRange.end + "T23:59:59.999") : end };
      }
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

function computeStreaks(dateStrings: string[]): { current: number; longest: number } {
  const unique = [...new Set(dateStrings)].sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  const today = getDateKey(new Date());
  const yesterday = getDateKey(new Date(Date.now() - 86400000));

  let longest = 1;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  let current = 0;
  const lastDate = unique[unique.length - 1];
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = unique.length - 2; i >= 0; i--) {
      const next = new Date(unique[i + 1]);
      const curr = new Date(unique[i]);
      if ((next.getTime() - curr.getTime()) / 86400000 === 1) current++;
      else break;
    }
  }

  return { current, longest: Math.max(longest, 1) };
}

export function useCalendarData(
  uid: string | undefined | null,
  progressMap: ProgressMap,
  questions: Problem[],
  rangeId: TimeRangeId,
  customRange?: { start?: string; end?: string }
) {
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!uid) {
        setActivity([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getUserActivity(uid);
        if (!cancelled) setActivity(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [uid]);

  const problemTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) map.set(q.problemId, q.title);
    return map;
  }, [questions]);

  const dayData = useMemo(() => {
    const map = new Map<string, { solved: string[]; attempted: string[] }>();
    for (const [problemId, p] of Object.entries(progressMap)) {
      if (p.solved && p.solvedAt) {
        const dateStr = getDateKey(new Date(p.solvedAt.seconds * 1000));
        const entry = map.get(dateStr) ?? { solved: [], attempted: [] };
        entry.solved.push(problemId);
        map.set(dateStr, entry);
      } else if (p.attempted && p.attemptedAt) {
        const dateStr = getDateKey(new Date(p.attemptedAt.seconds * 1000));
        const entry = map.get(dateStr) ?? { solved: [], attempted: [] };
        entry.attempted.push(problemId);
        map.set(dateStr, entry);
      }
    }
    return map;
  }, [progressMap]);

  const { start, end } = getDateRange(rangeId, customRange);

  const filteredDayData = useMemo(() => {
    const filtered = new Map<string, { solved: string[]; attempted: string[] }>();
    const startKey = getDateKey(start);
    const endKey = getDateKey(end);
    for (const [dateStr, data] of dayData) {
      if (dateStr >= startKey && dateStr <= endKey) {
        filtered.set(dateStr, data);
      }
    }
    return filtered;
  }, [dayData, start, end]);

  const navigateMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      let newMonth = prev + delta;
      if (newMonth > 11) { setViewYear((y) => y + 1); newMonth = 0; }
      if (newMonth < 0) { setViewYear((y) => y - 1); newMonth = 11; }
      return newMonth;
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  const isCurrentMonth = viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth();

  const calendarMonth = useMemo(
    () => buildCalendarMonth(viewYear, viewMonth, dayData, problemTitles),
    [viewYear, viewMonth, dayData, problemTitles]
  );

  const stats = useMemo((): CalendarStats => {
    let totalSolved = 0;
    let totalAttempted = 0;
    const solvedDates: string[] = [];

    for (const [dateStr, data] of filteredDayData) {
      totalSolved += data.solved.length;
      totalAttempted += data.attempted.length;
      if (data.solved.length > 0) solvedDates.push(dateStr);
    }

    const totalSubmissions = totalSolved + totalAttempted;
    const acceptanceRate = totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0;
    const { current, longest } = computeStreaks(solvedDates);
    const activeDays = filteredDayData.size;
    const avgPerDay = activeDays > 0 ? Math.round((totalSubmissions / activeDays) * 10) / 10 : 0;

    return {
      totalSolved,
      totalAttempted,
      totalSubmissions,
      acceptanceRate,
      currentStreak: current,
      longestStreak: longest,
      activeDays,
      avgPerDay,
    };
  }, [filteredDayData]);

  const insights = useMemo((): CalendarInsightsData => {
    const days: { date: string; count: number; problemTitles: string[] }[] = [];
    for (const [dateStr, data] of dayData) {
      if (dateStr >= getDateKey(start) && dateStr <= getDateKey(end)) {
        const titles = data.solved.map((id) => problemTitles.get(id) ?? id);
        days.push({ date: dateStr, count: data.solved.length + data.attempted.length, problemTitles: titles });
      }
    }
    days.sort((a, b) => a.date.localeCompare(b.date));

    const mostProductiveDay = days.length > 0
      ? days.reduce((best, d) => d.count > best.count ? d : best)
      : null;

    const weeks = new Map<string, { count: number }>();
    for (const d of days) {
      const date = new Date(d.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = getDateKey(weekStart);
      const w = weeks.get(weekKey) ?? { count: 0 };
      w.count += d.count;
      weeks.set(weekKey, w);
    }
    const weeklyEntries = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));
    let mostProductiveWeek: { weekLabel: string; count: number } | null = null;
    if (weeklyEntries.length > 0) {
      const best = weeklyEntries.reduce((best, [wk, w]) =>
        w.count > best[1].count ? [wk, w] as const : best
      );
      mostProductiveWeek = { weekLabel: best[0], count: best[1].count };
    }

    const months = new Map<string, number>();
    for (const d of days) {
      const monthKey = d.date.slice(0, 7);
      months.set(monthKey, (months.get(monthKey) ?? 0) + d.count);
    }
    const monthlyEntries = Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b));
    const mostProductiveMonth = monthlyEntries.length > 0
      ? monthlyEntries.reduce<{ month: string; count: number }>((best, [m, c]) =>
          c > best.count ? { month: m, count: c } : best
        , { month: "", count: 0 })
      : null;

    const allDates = new Set<string>();
    const cursor = new Date(start);
    while (cursor <= end) {
      allDates.add(getDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const inactiveDays = allDates.size - days.length;

    const weeklyTrend: WeeklyTrend[] = weeklyEntries.slice(-12).map(([wk, w]) => ({
      weekLabel: wk,
      count: w.count,
      startDate: wk,
    }));

    const monthlyTrend = monthlyEntries.slice(-12).map(([m, c]) => ({
      month: m,
      count: c,
    }));

    return {
      mostProductiveDay,
      mostProductiveWeek,
      mostProductiveMonth,
      inactiveDays,
      weeklyTrend,
      monthlyTrend,
    };
  }, [dayData, start, end, problemTitles]);

  return {
    calendarMonth,
    stats,
    insights,
    loading,
    error,
    activityCount: activity.length,
    viewYear,
    viewMonth,
    isCurrentMonth,
    navigateMonth,
    goToToday,
  };
}

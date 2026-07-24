import type { UserProblemProgress } from "./progressTypes";

interface PredictionResult {
  projectedDate: Date | null;
  problemsPerWeek: number;
  projectedTotal: number;
  weeksToGoal: number;
  onTrack: boolean;
}

export function computePredictions(
  progressMap: Record<string, UserProblemProgress>,
  targetTotal: number
): PredictionResult {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  let solvedTotal = 0;
  let solvedLast30 = 0;
  let solvedLast7 = 0;

  for (const p of Object.values(progressMap)) {
    if (!p.solved || !p.solvedAt) continue;
    solvedTotal++;
    const t = p.solvedAt.seconds * 1000;
    if (t >= thirtyDaysAgo) solvedLast30++;
    if (t >= sevenDaysAgo) solvedLast7++;
  }

  const rate7 = solvedLast7;
  const rate30 = solvedLast30 / 4;
  const problemsPerWeek = Math.max(rate7, rate30, 0.5);

  const remaining = Math.max(0, targetTotal - solvedTotal);
  const weeksToGoal = Math.ceil(remaining / problemsPerWeek);

  const projectedDate = weeksToGoal > 0 && weeksToGoal < 520
    ? new Date(now + weeksToGoal * 7 * 24 * 60 * 60 * 1000)
    : null;

  const projectedTotal = solvedTotal + Math.round(problemsPerWeek * 12);

  return {
    projectedDate,
    problemsPerWeek: Math.round(problemsPerWeek * 10) / 10,
    projectedTotal,
    weeksToGoal,
    onTrack: weeksToGoal <= 12,
  };
}

export interface WeeklyTrend {
  weekStart: string;
  solved: number;
  attempted: number;
}

export function computeWeeklyTrends(
  progressMap: Record<string, UserProblemProgress>
): WeeklyTrend[] {
  const weeks = new Map<string, { solved: number; attempted: number }>();

  for (const p of Object.values(progressMap)) {
    const ts = p.solvedAt?.seconds ?? p.attemptedAt?.seconds;
    if (!ts) continue;
    const d = new Date(ts * 1000);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const entry = weeks.get(key) ?? { solved: 0, attempted: 0 };
    if (p.solved) entry.solved++;
    if (p.attempted) entry.attempted++;
    weeks.set(key, entry);
  }

  return Array.from(weeks.entries())
    .map(([weekStart, v]) => ({ weekStart, ...v }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-12);
}

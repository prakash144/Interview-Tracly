import type { UserProblemProgress } from "./progressTypes";

export interface BurndownPoint {
  day: string;
  label: string;
  problemsRemaining: number;
  idealRemaining: number;
}

export function computeBurndown(
  progressMap: Record<string, UserProblemProgress>,
  targetTotal: number,
  targetDate: string
): { points: BurndownPoint[]; solved: number; remaining: number; onTrack: boolean; totalDays: number; daysElapsed: number } {
  const solved = Object.values(progressMap).filter((p) => p.solved).length;
  const remaining = Math.max(0, targetTotal - solved);
  const startDate = new Date(Math.min(...Object.values(progressMap).filter((p) => p.solvedAt).map((p) => p.solvedAt!.seconds * 1000), Date.now()));
  const endDate = new Date(targetDate);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const daysElapsed = Math.ceil((Date.now() - startDate.getTime()) / 86400000);

  const solvedByDay = new Map<string, number>();
  for (const p of Object.values(progressMap)) {
    if (!p.solved || !p.solvedAt) continue;
    const day = new Date(p.solvedAt.seconds * 1000).toISOString().slice(0, 10);
    solvedByDay.set(day, (solvedByDay.get(day) || 0) + 1);
  }

  const points: BurndownPoint[] = [];
  let cumulativeSolved = 0;

  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const dayKey = d.toISOString().slice(0, 10);
    const label = i % Math.ceil(totalDays / 8) === 0 || i === 0 || i === totalDays
      ? dayKey.slice(5) : "";
    cumulativeSolved += solvedByDay.get(dayKey) || 0;
    const problemsRemaining = Math.max(0, targetTotal - cumulativeSolved);
    const idealRemaining = targetTotal - (targetTotal / totalDays) * (i + 1);

    if (i <= daysElapsed || i === totalDays) {
      points.push({
        day: dayKey,
        label,
        problemsRemaining: i === totalDays ? 0 : problemsRemaining,
        idealRemaining: Math.max(0, Math.round(idealRemaining)),
      });
    }
  }

  const onTrack = points.length > 0 ? points[points.length - 1].problemsRemaining <= points[points.length - 1].idealRemaining : true;

  return { points, solved, remaining, onTrack, totalDays, daysElapsed };
}

export function computePace(
  progressMap: Record<string, UserProblemProgress>,
  targetDate: string,
  targetTotal: number
): { neededPerDay: number; currentPerDay: number; onTrack: boolean; daysRemaining: number } {
  const solved = Object.values(progressMap).filter((p) => p.solved).length;
  const remaining = Math.max(0, targetTotal - solved);
  const daysRemaining = Math.max(1, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000));
  const neededPerDay = Math.ceil(remaining / daysRemaining);

  const solvedLast7 = Object.values(progressMap).filter(
    (p) => p.solved && p.solvedAt && p.solvedAt.seconds * 1000 >= Date.now() - 7 * 86400000
  ).length;
  const currentPerDay = solvedLast7 / 7;

  return {
    neededPerDay,
    currentPerDay: Math.round(currentPerDay * 10) / 10,
    onTrack: currentPerDay >= neededPerDay,
    daysRemaining,
  };
}

export interface StudySession {
  id: string;
  startTime: number;
  endTime: number | null;
  durationMinutes: number;
  focusArea: string;
  notes: string;
  completed: boolean;
}

const STORAGE_KEY = "study-sessions";

export function loadSessions(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSession(session: StudySession) {
  if (typeof window === "undefined") return;
  const all = loadSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function deleteSession(id: string) {
  if (typeof window === "undefined") return;
  const all = loadSessions().filter((s) => s.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function generateSessionId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getWeeklyMinutes(sessions: StudySession[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter((s) => s.completed && s.startTime >= weekAgo)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function getTodayMinutes(sessions: StudySession[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessions
    .filter((s) => s.completed && s.startTime >= today.getTime())
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export interface GoalRecord {
  date: string;
  dailySolved: number;
  weeklySolved: number;
  dailyGoal: number;
  weeklyGoal: number;
  dailyMet: boolean;
  weeklyMet: boolean;
}

const GOAL_HISTORY_KEY = "goal-history";

export function loadGoalHistory(): GoalRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GOAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveGoalRecord(record: GoalRecord) {
  if (typeof window === "undefined") return;
  const all = loadGoalHistory().filter((r) => r.date !== record.date);
  all.push(record);
  all.sort((a, b) => a.date.localeCompare(b.date));
  try { localStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(all)); } catch {}
}

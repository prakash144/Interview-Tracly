export interface MockTestConfig {
  durationMinutes: number;
  problemCount: number;
  difficulties: ("Easy" | "Medium" | "Hard")[];
  topics: string[];
  company: string;
}

export interface MockTestProblemResult {
  problemId: string;
  title: string;
  difficulty: string;
  topic: string;
  timeSpentSeconds: number;
  usedHint: boolean;
  solved: boolean;
  skipped: boolean;
}

export interface MockTestResult {
  id: string;
  config: MockTestConfig;
  startedAt: number;
  endedAt: number;
  totalTimeSeconds: number;
  problems: MockTestProblemResult[];
  completed: boolean;
}

const HISTORY_KEY = "mock-test-history";

export function loadHistory(): MockTestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveResult(result: MockTestResult) {
  if (typeof window === "undefined") return;
  const all = loadHistory();
  all.unshift(result);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 50))); } catch {}
}

export function generateTestId(): string {
  return `mt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

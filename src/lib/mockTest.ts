export type MockInterviewType = "dsa" | "system-design" | "backend" | "behavioral" | "leadership" | "ai-ml" | "custom";

export const MOCK_TYPE_LABELS: Record<MockInterviewType, string> = {
  dsa: "DSA",
  "system-design": "System Design",
  backend: "Backend Engineering",
  behavioral: "Behavioral",
  leadership: "Leadership Principles",
  "ai-ml": "AI & Machine Learning",
  custom: "Custom",
};

export const MOCK_TYPE_ICONS: Record<MockInterviewType, string> = {
  dsa: "Code",
  "system-design": "Layers",
  backend: "Server",
  behavioral: "Users",
  leadership: "Crown",
  "ai-ml": "Brain",
  custom: "Settings2",
};

export const LEVELS = ["Entry", "Junior", "Mid", "Senior", "Staff", "Principal"] as const;

export interface MockSection {
  id: string;
  type: MockInterviewType;
  title: string;
  problemCount: number;
  difficulties: ("Easy" | "Medium" | "Hard")[];
  topics: string[];
  tags: string[];
  customQuestions?: string[];
}

export interface MockInterviewConfig {
  sections: MockSection[];
  company: string;
  role: string;
  level: string;
  durationMinutes: number;
  round: string;
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
  partiallySolved: boolean;
  sectionId: string;
  sectionType: MockInterviewType;
  questionText?: string;
}

export interface MockSectionResult {
  sectionId: string;
  sectionType: MockInterviewType;
  sectionTitle: string;
  problems: MockTestProblemResult[];
  totalTimeSeconds: number;
  solved: number;
  partiallySolved: number;
  unsolved: number;
  score: number;
}

export interface MockTestResult {
  id: string;
  config: MockInterviewConfig;
  startedAt: number;
  endedAt: number;
  totalTimeSeconds: number;
  problems: MockTestProblemResult[];
  completed: boolean;
}

export interface MockTestRecommendation {
  type: "strength" | "weakness" | "recommendation" | "topic" | "plan";
  label: string;
  description: string;
  priority: number;
}

export interface MockTestSummary {
  overallScore: number;
  solved: number;
  partiallySolved: number;
  unsolved: number;
  totalTimeSeconds: number;
  sections: MockSectionResult[];
  difficultyBreakdown: { label: string; total: number; solved: number; percentage: number }[];
  topicCoverage: { topic: string; total: number; solved: number }[];
  strengths: MockTestRecommendation[];
  weaknesses: MockTestRecommendation[];
  recommendations: MockTestRecommendation[];
  suggestedTopics: MockTestRecommendation[];
  nextPlan: MockTestRecommendation[];
}

const HISTORY_KEY = "mock-test-history";

function isOldConfig(config: Record<string, unknown>): boolean {
  return "problemCount" in config || !("sections" in config);
}

function migrateOldProblems(problems: Record<string, unknown>[]): MockTestProblemResult[] {
  return problems.map((p) => ({
    problemId: String(p.problemId ?? ""),
    title: String(p.title ?? ""),
    difficulty: String(p.difficulty ?? "Medium"),
    topic: String(p.topic ?? ""),
    timeSpentSeconds: Number(p.timeSpentSeconds ?? 0),
    usedHint: Boolean(p.usedHint),
    solved: Boolean(p.solved),
    skipped: Boolean(p.skipped),
    partiallySolved: Boolean(p.partiallySolved ?? false),
    sectionId: String(p.sectionId ?? "legacy"),
    sectionType: "dsa" as MockInterviewType,
    questionText: p.questionText ? String(p.questionText) : undefined,
  }));
}

function migrateResult(raw: Record<string, unknown>): MockTestResult {
  const config = (raw.config ?? {}) as Record<string, unknown>;
  let migratedConfig: MockInterviewConfig;

  if (isOldConfig(config)) {
    migratedConfig = {
      sections: [
        {
          id: "legacy",
          type: "dsa",
          title: "Coding Problems",
          problemCount: Number(config.problemCount ?? 5),
          difficulties: (config.difficulties as ("Easy" | "Medium" | "Hard")[]) ?? ["Easy", "Medium"],
          topics: (config.topics as string[]) ?? [],
          tags: [],
        },
      ],
      company: String(config.company ?? ""),
      role: "",
      level: "",
      durationMinutes: Number(config.durationMinutes ?? 30),
      round: "",
    };
  } else {
    const secs = (config.sections ?? []) as Record<string, unknown>[];
    migratedConfig = {
      sections: secs.map((s) => ({
        id: String(s.id ?? ""),
        type: (s.type as MockInterviewType) ?? "dsa",
        title: String(s.title ?? ""),
        problemCount: Number(s.problemCount ?? 3),
        difficulties: (s.difficulties as ("Easy" | "Medium" | "Hard")[]) ?? ["Easy", "Medium"],
        topics: (s.topics as string[]) ?? [],
        tags: (s.tags as string[]) ?? [],
        customQuestions: s.customQuestions ? (s.customQuestions as string[]) : [],
      })),
      company: String(config.company ?? ""),
      role: String(config.role ?? ""),
      level: String(config.level ?? ""),
      durationMinutes: Number(config.durationMinutes ?? 30),
      round: String(config.round ?? ""),
    };
  }

  return {
    id: String(raw.id ?? ""),
    config: migratedConfig,
    startedAt: Number(raw.startedAt ?? 0),
    endedAt: Number(raw.endedAt ?? 0),
    totalTimeSeconds: Number(raw.totalTimeSeconds ?? 0),
    problems: migrateOldProblems((raw.problems ?? []) as Record<string, unknown>[]),
    completed: Boolean(raw.completed),
  };
}

export function loadHistory(): MockTestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    return parsed.map(migrateResult);
  } catch {
    return [];
  }
}

export function saveResult(result: MockTestResult) {
  if (typeof window === "undefined") return;
  const all = loadHistory();
  all.unshift(result);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {}
}

export function generateTestId(): string {
  return `mt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateSectionId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function computeSummary(result: MockTestResult): MockTestSummary {
  const problems = result.problems;
  const solved = problems.filter((p) => p.solved && !p.partiallySolved).length;
  const partiallySolved = problems.filter((p) => p.partiallySolved).length;
  const unsolved = problems.filter((p) => !p.solved && !p.partiallySolved).length;
  const total = problems.length;
  const overallScore = total > 0 ? Math.round((solved / total) * 100) : 0;

  const sections = result.config.sections.map((sec) => {
    const secProblems = problems.filter((p) => p.sectionId === sec.id);
    const secSolved = secProblems.filter((p) => p.solved && !p.partiallySolved).length;
    const secPartial = secProblems.filter((p) => p.partiallySolved).length;
    const secTime = secProblems.reduce((s, p) => s + p.timeSpentSeconds, 0);
    return {
      sectionId: sec.id,
      sectionType: sec.type,
      sectionTitle: sec.title,
      problems: secProblems,
      totalTimeSeconds: secTime,
      solved: secSolved,
      partiallySolved: secPartial,
      unsolved: secProblems.length - secSolved - secPartial,
      score: secProblems.length > 0 ? Math.round((secSolved / secProblems.length) * 100) : 0,
    };
  });

  const diffGroups: Record<string, { total: number; solved: number }> = {};
  problems.forEach((p) => {
    if (!diffGroups[p.difficulty]) diffGroups[p.difficulty] = { total: 0, solved: 0 };
    diffGroups[p.difficulty].total++;
    if (p.solved) diffGroups[p.difficulty].solved++;
  });
  const difficultyBreakdown = Object.entries(diffGroups).map(([label, d]) => ({
    label,
    total: d.total,
    solved: d.solved,
    percentage: d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0,
  }));

  const topicGroups: Record<string, { total: number; solved: number }> = {};
  problems.forEach((p) => {
    if (p.topic) {
      if (!topicGroups[p.topic]) topicGroups[p.topic] = { total: 0, solved: 0 };
      topicGroups[p.topic].total++;
      if (p.solved) topicGroups[p.topic].solved++;
    }
  });
  const topicCoverage = Object.entries(topicGroups)
    .map(([topic, d]) => ({ topic, total: d.total, solved: d.solved }))
    .sort((a, b) => a.solved / Math.max(a.total, 1) - b.solved / Math.max(b.total, 1));

  const weakTopics = topicCoverage.filter((t) => t.solved / Math.max(t.total, 1) < 0.5).slice(0, 3);
  const strongTopics = topicCoverage.filter((t) => t.solved / Math.max(t.total, 1) >= 0.8).slice(0, 3);

  const strengths: MockTestRecommendation[] = [];
  const weaknesses: MockTestRecommendation[] = [];
  const recommendations: MockTestRecommendation[] = [];
  const suggestedTopics: MockTestRecommendation[] = [];
  const nextPlan: MockTestRecommendation[] = [];

  sections.forEach((sec) => {
    if (sec.score >= 80) {
      strengths.push({
        type: "strength",
        label: `${sec.sectionTitle}`,
        description: `${sec.score}% success rate (${sec.solved}/${sec.problems.length})`,
        priority: 1,
      });
    } else if (sec.score < 50) {
      weaknesses.push({
        type: "weakness",
        label: `${sec.sectionTitle}`,
        description: `${sec.score}% success rate — needs significant improvement`,
        priority: 1,
      });
      recommendations.push({
        type: "recommendation",
        label: `Focus on ${sec.sectionTitle}`,
        description: `Dedicate more practice time to ${sec.sectionTitle.toLowerCase()} problems to improve your ${sec.score}% score`,
        priority: 1,
      });
    }
  });

  weakTopics.forEach((t) => {
    weaknesses.push({
      type: "weakness",
      label: t.topic,
      description: `${t.solved}/${t.total} solved (${Math.round((t.solved / t.total) * 100)}%)`,
      priority: 2,
    });
    suggestedTopics.push({
      type: "topic",
      label: t.topic,
      description: `Review and practice ${t.topic} problems`,
      priority: 2,
    });
  });

  strongTopics.forEach((t) => {
    strengths.push({
      type: "strength",
      label: t.topic,
      description: `${t.solved}/${t.total} solved (${Math.round((t.solved / t.total) * 100)}%)`,
      priority: 3,
    });
  });

  if (overallScore < 50) {
    recommendations.push({
      type: "recommendation",
      label: "Foundation review",
      description: "Focus on core concepts and fundamentals before attempting advanced problems",
      priority: 1,
    });
  }

  if (partiallySolved > 0) {
    recommendations.push({
      type: "recommendation",
      label: "Revisit partial solves",
      description: `Review the ${partiallySolved} partially solved problems — understanding gaps is key to improvement`,
      priority: 2,
    });
  }

  if (result.config.sections.some((s) => s.type === "dsa")) {
    nextPlan.push({
      type: "plan",
      label: "Daily DSA practice",
      description: "Solve 2-3 DSA problems daily focusing on weak topics identified above",
      priority: 1,
    });
    nextPlan.push({
      type: "plan",
      label: "Weekly mock tests",
      description: "Take a timed mock test weekly to track improvement",
      priority: 2,
    });
  }

  if (result.config.sections.some((s) => s.type === "system-design" || s.type === "backend")) {
    nextPlan.push({
      type: "plan",
      label: "System design study",
      description: "Review system design patterns and practice whiteboarding",
      priority: 2,
    });
  }

  if (result.config.sections.some((s) => s.type === "behavioral" || s.type === "leadership")) {
    nextPlan.push({
      type: "plan",
      label: "STAR story preparation",
      description: "Prepare 3-5 STAR stories covering common behavioral scenarios",
      priority: 2,
    });
  }

  suggestionsTopics: if (weakTopics.length > 0) {
    suggestedTopics.push({
      type: "topic",
      label: "Spaced revision",
      description: "Add weak topics to revision list and review daily for 15 minutes",
      priority: 3,
    });
  }

  return {
    overallScore,
    solved,
    partiallySolved,
    unsolved,
    totalTimeSeconds: result.totalTimeSeconds,
    sections,
    difficultyBreakdown,
    topicCoverage,
    strengths,
    weaknesses,
    recommendations,
    suggestedTopics,
    nextPlan,
  };
}

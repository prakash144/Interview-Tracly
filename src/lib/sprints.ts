export type SprintStatus = "planned" | "active" | "completed" | "archived";

export type SprintType = "learning" | "interview" | "certification" | "custom";

export type TaskStatus = "todo" | "in-progress" | "done";

export type TaskStatusV2 = "backlog" | "todo" | "in-progress" | "review" | "done";

export type TaskType = "problem" | "resource";

export type Priority = "low" | "medium" | "high" | "critical";

export interface SprintTask {
  id: string;
  sprintId: string;
  type: TaskType;
  itemId: string;
  title: string;
  status: TaskStatus;
  order?: number;
  addedAt: number;
  updatedAt: number;
}

export interface SprintTaskV2 {
  id: string;
  sprintId: string;
  type: TaskType;
  itemId: string;
  title: string;
  description: string;
  track: string;
  category: string;
  priority: Priority;
  difficulty: string;
  estimatedHours: number;
  actualHours: number;
  status: TaskStatusV2;
  dueDate: string;
  company: string;
  tags: string[];
  collectionIds: string[];
  notes: string;
  linkedProblemIds: string[];
  linkedResourceIds: string[];
  addedAt: number;
  updatedAt: number;
  order: number;
}

export interface SprintRetro {
  wentWell: string;
  wentWrong: string;
  weaknesses: string[];
  rating: number;
  actionItems: string;
  completedAt: number;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  type: SprintType;
  capacityHours?: number;
  company?: string;
  role?: string;
  interviewDate?: string;
  targetLevel?: string;
  stages?: string[];
  template?: string;
  priority?: number;
  pausedSprintId?: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
  retro?: SprintRetro;
}

export interface SprintWithTasks extends Sprint {
  tasks: SprintTask[];
}

export const SPRINTS_COLLECTION = "sprints";
export const SPRINT_TASKS_SUBCOLLECTION = "tasks";

export interface SprintTemplate {
  name: string;
  goal: string;
  durationDays: number;
  description: string;
  icon: string;
  tasks: { title: string; estimatedHours: number; priority: Priority }[];
}

export const SPRINT_TEMPLATES: SprintTemplate[] = [
  {
    name: "Algorithm Mastery",
    goal: "Master core algorithmic patterns with daily practice and review",
    durationDays: 7,
    description: "Arrays, Strings, Trees, Graphs, DP",
    icon: "Zap",
    tasks: [
      { title: "Arrays & Strings — solve 3 problems", estimatedHours: 2, priority: "high" },
      { title: "Two Pointers & Sliding Window — solve 3 problems", estimatedHours: 2, priority: "high" },
      { title: "Trees & Graphs — solve 3 problems", estimatedHours: 2.5, priority: "high" },
      { title: "Dynamic Programming — solve 3 problems", estimatedHours: 3, priority: "high" },
      { title: "Review & re-solve 2 weak-area problems", estimatedHours: 1.5, priority: "medium" },
      { title: "Practice system design basics", estimatedHours: 1.5, priority: "medium" },
      { title: "Mock interview (self or peer)", estimatedHours: 1, priority: "medium" },
    ],
  },
  {
    name: "System Design Deep Dive",
    goal: "Build confidence in distributed systems, scalability, and high-level design",
    durationDays: 7,
    description: "HLD, scalability, databases, case studies",
    icon: "Building2",
    tasks: [
      { title: "Read: System Design Fundamentals", estimatedHours: 2, priority: "high" },
      { title: "Design URL Shortener (complete HLD)", estimatedHours: 2, priority: "high" },
      { title: "Design Chat System (complete HLD)", estimatedHours: 2, priority: "high" },
      { title: "Design News Feed (complete HLD)", estimatedHours: 2.5, priority: "high" },
      { title: "Database deep-dive: SQL vs NoSQL trade-offs", estimatedHours: 1.5, priority: "medium" },
      { title: "Practice estimation & capacity planning", estimatedHours: 1, priority: "medium" },
      { title: "Mock system design interview", estimatedHours: 1, priority: "medium" },
    ],
  },
  {
    name: "Interview Warmup",
    goal: "Mixed practice covering algorithms, behavioral prep, and weak areas",
    durationDays: 5,
    description: "Mixed problems + behavioral prep",
    icon: "Sparkles",
    tasks: [
      { title: "Solve 2 easy + 2 medium problems", estimatedHours: 2, priority: "high" },
      { title: "Review behavioral: STAR framework", estimatedHours: 1, priority: "medium" },
      { title: "Solve 2 medium + 1 hard problem", estimatedHours: 2.5, priority: "high" },
      { title: "Practice 3 behavioral questions aloud", estimatedHours: 1, priority: "medium" },
      { title: "Review weak topics & re-solve past mistakes", estimatedHours: 1.5, priority: "high" },
    ],
  },
  {
    name: "Company Focus",
    goal: "Target specific company patterns and frequently asked questions",
    durationDays: 7,
    description: "Target specific company patterns",
    icon: "Target",
    tasks: [
      { title: "Research target company interview format", estimatedHours: 1, priority: "medium" },
      { title: "Solve 3 problems from target company set", estimatedHours: 2, priority: "high" },
      { title: "Solve 3 more company-tagged problems", estimatedHours: 2, priority: "high" },
      { title: "Review company-specific system design trends", estimatedHours: 1.5, priority: "medium" },
      { title: "Solve 2 hard problems from company set", estimatedHours: 2.5, priority: "high" },
      { title: "Peer mock interview with company focus", estimatedHours: 1, priority: "medium" },
      { title: "Review all solved problems & document patterns", estimatedHours: 1.5, priority: "medium" },
    ],
  },
];

export interface CompanyTemplate {
  id: string;
  company: string;
  topics: string[];
  stages: string[];
  recommendedProblems: number;
}

export const COMPANY_TEMPLATES: CompanyTemplate[] = [
  { id: "google", company: "Google", topics: ["Graphs", "DP", "System Design", "Behavioral"], stages: ["OA", "Phone Screen", "Onsite"], recommendedProblems: 50 },
  { id: "microsoft", company: "Microsoft", topics: ["Trees", "DP", "LLD", "Concurrency", "Behavioral"], stages: ["OA", "Phone Screen", "Onsite"], recommendedProblems: 45 },
  { id: "amazon", company: "Amazon", topics: ["Leadership Principles", "DSA", "System Design"], stages: ["OA", "Phone Screen", "Onsite"], recommendedProblems: 50 },
  { id: "meta", company: "Meta", topics: ["Graphs", "BFS", "DFS", "Behavioral"], stages: ["OA", "Phone Screen", "Onsite"], recommendedProblems: 40 },
  { id: "apple", company: "Apple", topics: ["LLD", "DSA", "System Design", "Behavioral"], stages: ["Phone Screen", "Onsite"], recommendedProblems: 35 },
  { id: "netflix", company: "Netflix", topics: ["System Design", "DSA", "Behavioral"], stages: ["Phone Screen", "Onsite"], recommendedProblems: 30 },
];

export function createDefaultTaskV2(base: {
  id: string;
  sprintId: string;
  type: TaskType;
  itemId: string;
  title: string;
}): SprintTaskV2 {
  const now = Date.now();
  return {
    ...base,
    description: "",
    track: "",
    category: "",
    priority: "medium",
    difficulty: "",
    estimatedHours: 0,
    actualHours: 0,
    status: "todo",
    dueDate: "",
    company: "",
    tags: [],
    collectionIds: [],
    notes: "",
    linkedProblemIds: [],
    linkedResourceIds: [],
    addedAt: now,
    updatedAt: now,
    order: 0,
  };
}

export function migrateTask(task: Record<string, unknown>): SprintTaskV2 {
  return {
    id: (task.id as string) ?? "",
    sprintId: (task.sprintId as string) ?? "",
    type: (task.type as TaskType) ?? "problem",
    itemId: (task.itemId as string) ?? "",
    title: (task.title as string) ?? "",
    description: (task.description as string) ?? "",
    track: (task.track as string) ?? "",
    category: (task.category as string) ?? "",
    priority: (task.priority as Priority) ?? "medium",
    difficulty: (task.difficulty as string) ?? "",
    estimatedHours: (task.estimatedHours as number) ?? 0,
    actualHours: (task.actualHours as number) ?? 0,
    status: (task.status as TaskStatusV2) ?? "todo",
    dueDate: (task.dueDate as string) ?? "",
    company: (task.company as string) ?? "",
    tags: (task.tags as string[]) ?? [],
    collectionIds: (task.collectionIds as string[]) ?? [],
    notes: (task.notes as string) ?? "",
    linkedProblemIds: (task.linkedProblemIds as string[]) ?? [],
    linkedResourceIds: (task.linkedResourceIds as string[]) ?? [],
    addedAt: (task.addedAt as number) ?? Date.now(),
    updatedAt: (task.updatedAt as number) ?? Date.now(),
    order: (task.order as number) ?? 0,
  };
}

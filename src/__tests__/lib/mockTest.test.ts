import { describe, it, expect, beforeEach } from "vitest";
import {
  generateTestId,
  generateSectionId,
  computeSummary,
  loadHistory,
  saveResult,
  MOCK_TYPE_LABELS,
  LEVELS,
} from "@/lib/mockTest";
import type {
  MockInterviewConfig,
  MockTestResult,
  MockTestProblemResult,
  MockSection,
  MockInterviewType,
} from "@/lib/mockTest";

const HISTORY_KEY = "mock-test-history";

function makeSection(overrides: Partial<MockSection> = {}): MockSection {
  return {
    id: generateSectionId(),
    type: "dsa",
    title: "Coding Problems",
    problemCount: 3,
    difficulties: ["Easy", "Medium"],
    topics: [],
    tags: [],
    customQuestions: [],
    ...overrides,
  };
}

function makeConfig(overrides: Partial<MockInterviewConfig> = {}): MockInterviewConfig {
  return {
    sections: [makeSection()],
    company: "Google",
    role: "SDE II",
    level: "Mid",
    durationMinutes: 30,
    round: "",
    ...overrides,
  };
}

function makeProblem(overrides: Partial<MockTestProblemResult> = {}): MockTestProblemResult {
  return {
    problemId: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "arrays",
    timeSpentSeconds: 120,
    usedHint: false,
    solved: false,
    skipped: false,
    partiallySolved: false,
    sectionId: "sec1",
    sectionType: "dsa",
    ...overrides,
  };
}

function makeResult(config: MockInterviewConfig, problems: MockTestProblemResult[], overrides: Partial<MockTestResult> = {}): MockTestResult {
  const now = Date.now();
  return {
    id: generateTestId(),
    config,
    startedAt: now - 60000,
    endedAt: now,
    totalTimeSeconds: 60,
    problems,
    completed: true,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("generateTestId", () => {
  it("returns a string starting with mt_", () => {
    const id = generateTestId();
    expect(id).toMatch(/^mt_/);
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTestId()));
    expect(ids.size).toBe(100);
  });

  it("contains a timestamp", () => {
    const before = Date.now();
    const id = generateTestId();
    const after = Date.now();
    const ts = parseInt(id.split("_")[1], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("generateSectionId", () => {
  it("returns a string starting with sec_", () => {
    const id = generateSectionId();
    expect(id).toMatch(/^sec_/);
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateSectionId()));
    expect(ids.size).toBe(100);
  });
});

describe("MOCK_TYPE_LABELS", () => {
  it("has labels for all mock interview types", () => {
    const types: MockInterviewType[] = [
      "dsa", "system-design", "backend", "behavioral", "leadership", "ai-ml", "custom",
    ];
    types.forEach((t) => {
      expect(MOCK_TYPE_LABELS[t]).toBeDefined();
      expect(MOCK_TYPE_LABELS[t].length).toBeGreaterThan(0);
    });
  });
});

describe("LEVELS", () => {
  it("contains standard career levels", () => {
    expect(LEVELS).toContain("Entry");
    expect(LEVELS).toContain("Junior");
    expect(LEVELS).toContain("Mid");
    expect(LEVELS).toContain("Senior");
    expect(LEVELS).toContain("Staff");
    expect(LEVELS).toContain("Principal");
  });
});

describe("saveResult and loadHistory", () => {
  it("saves and loads a result", () => {
    const config = makeConfig();
    const problems = [makeProblem({ solved: true })];
    const result = makeResult(config, problems);

    saveResult(result);
    const history = loadHistory();

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(result.id);
    expect(history[0].problems).toHaveLength(1);
    expect(history[0].problems[0].solved).toBe(true);
  });

  it("stores results in reverse chronological order", () => {
    const r1 = makeResult(makeConfig(), [], { startedAt: 1000, endedAt: 2000 });
    const r2 = makeResult(makeConfig(), [], { startedAt: 3000, endedAt: 4000 });

    saveResult(r1);
    saveResult(r2);
    const history = loadHistory();

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(r2.id);
    expect(history[1].id).toBe(r1.id);
  });

  it("caps history at 50 entries", () => {
    for (let i = 0; i < 60; i++) {
      saveResult(makeResult(makeConfig(), []));
    }
    const history = loadHistory();
    expect(history.length).toBeLessThanOrEqual(50);
  });

  it("returns empty array when no history exists", () => {
    const history = loadHistory();
    expect(history).toEqual([]);
  });

  it("returns empty array on corrupt data", () => {
    localStorage.setItem(HISTORY_KEY, "not-json");
    const history = loadHistory();
    expect(history).toEqual([]);
  });
});

describe("computeSummary", () => {
  it("returns perfect score when all problems solved", () => {
    const config = makeConfig({ sections: [makeSection({ id: "sec1" })] });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: true, partiallySolved: false }),
      makeProblem({ sectionId: "sec1", solved: true, partiallySolved: false }),
      makeProblem({ sectionId: "sec1", solved: true, partiallySolved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.overallScore).toBe(100);
    expect(summary.solved).toBe(3);
    expect(summary.unsolved).toBe(0);
  });

  it("returns zero score when nothing solved", () => {
    const config = makeConfig({ sections: [makeSection({ id: "sec1" })] });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: false }),
      makeProblem({ sectionId: "sec1", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.overallScore).toBe(0);
    expect(summary.solved).toBe(0);
  });

  it("counts partially solved separately", () => {
    const config = makeConfig({ sections: [makeSection({ id: "sec1" })] });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: true, partiallySolved: false }),
      makeProblem({ sectionId: "sec1", solved: false, partiallySolved: true }),
      makeProblem({ sectionId: "sec1", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.solved).toBe(1);
    expect(summary.partiallySolved).toBe(1);
    expect(summary.unsolved).toBe(1);
    expect(summary.overallScore).toBe(33);
  });

  it("computes per-section scores", () => {
    const config = makeConfig({
      sections: [
        makeSection({ id: "sec1", title: "Coding", type: "dsa" }),
        makeSection({ id: "sec2", title: "Design", type: "system-design" }),
      ],
    });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: true }),
      makeProblem({ sectionId: "sec1", solved: true }),
      makeProblem({ sectionId: "sec2", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.sections).toHaveLength(2);
    const sec1 = summary.sections.find((s) => s.sectionId === "sec1")!;
    const sec2 = summary.sections.find((s) => s.sectionId === "sec2")!;
    expect(sec1.score).toBe(100);
    expect(sec1.solved).toBe(2);
    expect(sec2.score).toBe(0);
    expect(sec2.unsolved).toBe(1);
  });

  it("builds difficulty breakdown", () => {
    const config = makeConfig({ sections: [makeSection({ id: "sec1" })] });
    const problems = [
      makeProblem({ sectionId: "sec1", difficulty: "Easy", solved: true }),
      makeProblem({ sectionId: "sec1", difficulty: "Medium", solved: true }),
      makeProblem({ sectionId: "sec1", difficulty: "Hard", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.difficultyBreakdown).toHaveLength(3);
    const easy = summary.difficultyBreakdown.find((d) => d.label === "Easy")!;
    expect(easy.total).toBe(1);
    expect(easy.solved).toBe(1);
    expect(easy.percentage).toBe(100);
  });

  it("identifies strengths for sections with >=80% score", () => {
    const config = makeConfig({
      sections: [
        makeSection({ id: "sec1", title: "Coding", type: "dsa" }),
        makeSection({ id: "sec2", title: "Design", type: "system-design" }),
      ],
    });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: true }),
      makeProblem({ sectionId: "sec2", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.strengths.length).toBeGreaterThanOrEqual(1);
    expect(summary.strengths.some((s) => s.label === "Coding")).toBe(true);
  });

  it("identifies weaknesses for sections with <50% score", () => {
    const config = makeConfig({
      sections: [
        makeSection({ id: "sec1", title: "Coding", type: "dsa" }),
        makeSection({ id: "sec2", title: "Design", type: "system-design" }),
      ],
    });
    const problems = [
      makeProblem({ sectionId: "sec1", solved: true }),
      makeProblem({ sectionId: "sec2", solved: false }),
    ];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.weaknesses.some((w) => w.label === "Design")).toBe(true);
    expect(summary.recommendations.some((r) => r.label.includes("Design"))).toBe(true);
  });

  it("provides next practice plans for DSA sections", () => {
    const config = makeConfig({ sections: [makeSection({ type: "dsa", id: "sec1" })] });
    const problems = [makeProblem({ sectionId: "sec1", solved: true })];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.nextPlan.some((p) => p.label.includes("Daily DSA"))).toBe(true);
    expect(summary.nextPlan.some((p) => p.label.includes("Weekly mock"))).toBe(true);
  });

  it("provides STAR story plans for behavioral sections", () => {
    const config = makeConfig({
      sections: [makeSection({ type: "behavioral", id: "sec1", title: "Behavioral" })],
    });
    const problems = [makeProblem({ sectionId: "sec1", solved: true, sectionType: "behavioral" })];
    const result = makeResult(config, problems);
    const summary = computeSummary(result);

    expect(summary.nextPlan.some((p) => p.label.includes("STAR story"))).toBe(true);
  });

  it("does not duplicate strengths/weaknesses when empty", () => {
    const config = makeConfig({ sections: [] });
    const result = makeResult(config, []);
    const summary = computeSummary(result);

    expect(summary.strengths).toEqual([]);
    expect(summary.weaknesses).toEqual([]);
  });
});

describe("migration (legacy data)", () => {
  it("migrates old-format config without sections", () => {
    const oldData = [
      {
        id: "mt_old",
        config: {
          problemCount: 5,
          difficulties: ["Easy", "Medium"],
          company: "Amazon",
          durationMinutes: 45,
        },
        startedAt: 1000,
        endedAt: 2000,
        totalTimeSeconds: 60,
        problems: [
          { problemId: "p1", title: "Problem 1", difficulty: "Easy", solved: true },
        ],
        completed: true,
      },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(oldData));
    const history = loadHistory();

    expect(history).toHaveLength(1);
    expect(history[0].config.company).toBe("Amazon");
    expect(history[0].config.sections).toHaveLength(1);
    expect(history[0].config.sections[0].problemCount).toBe(5);
    expect(history[0].problems[0].solved).toBe(true);
  });

  it("migrates old-format problems adding sectionId defaults", () => {
    const oldData = [
      {
        id: "mt_old2",
        config: { sections: [{ id: "custom", type: "dsa", title: "Custom", problemCount: 2, difficulties: ["Medium"], topics: [], tags: [] }], company: "", role: "", level: "", durationMinutes: 30, round: "" },
        startedAt: 1000,
        endedAt: 2000,
        totalTimeSeconds: 60,
        problems: [
          { problemId: "p1", title: "P1", difficulty: "Medium", solved: false, partiallySolved: true },
        ],
        completed: true,
      },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(oldData));
    const history = loadHistory();

    expect(history).toHaveLength(1);
    expect(history[0].problems[0].partiallySolved).toBe(true);
  });
});

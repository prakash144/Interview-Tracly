"use client";

import { useMemo } from "react";
import type { ProgressMap, Problem } from "@/lib/progressTypes";
import type { CalendarStats, CalendarInsightsData } from "@/hooks/useCalendarData";
import type { GoalSettings } from "@/hooks/useGoals";
import type { RevisionStats } from "@/hooks/useRevisionTracker";
import type { CompanyStat } from "@/hooks/useCompanyReadiness";

export interface ReadinessFactors {
  companyCompletion: number;
  topicCoverage: number;
  difficultyBalance: number;
  revisionCompletion: number;
  consistency: number;
  currentStreakScore: number;
}

export interface WeakTopic {
  topic: string;
  total: number;
  solved: number;
  completion: number;
  daysSinceLastSolved: number;
}

export interface Recommendation {
  topic: string;
  count: number;
  reason: string;
}

export interface WeeklyReview {
  problemsSolved: number;
  acceptanceRate: number;
  mostPracticedTopic: string;
  weakestTopic: string;
  bestDay: string;
  missedDays: number;
  goalCompletion: number;
}

export interface PatternCoverage {
  pattern: string;
  total: number;
  solved: number;
  completion: number;
}

export interface MockInterviewItem {
  company: string;
  coding: number;
  revision: number;
  topics: number;
  overall: number;
}

export interface Achievement {
  label: string;
  unlocked: boolean;
  icon: string;
  description: string;
}

export interface ActionItem {
  id: string;
  type: "solve" | "revise" | "practice" | "complete";
  description: string;
  explanation: string;
  priority: "high" | "medium" | "low";
}

export interface InterviewReadinessResult {
  overallScore: number;
  factors: ReadinessFactors;
  companyScores: { company: string; score: number }[];
  weakTopics: WeakTopic[];
  weakDifficulties: { difficulty: string; completion: number }[];
  weakPatterns: { pattern: string; completion: number }[];
  recommendations: Recommendation[];
  weeklyReview: WeeklyReview;
  patternCoverage: PatternCoverage[];
  mockReadiness: MockInterviewItem[];
  achievements: Achievement[];
  level: string;
  remainingProblems: number;
  estimatedTime: string;
  actionPlan: ActionItem[];
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function useInterviewReadiness(
  progressMap: ProgressMap,
  questions: Problem[],
  companyStats: CompanyStat[],
  revisionStats: RevisionStats,
  calendarStats: CalendarStats,
  calendarInsights: CalendarInsightsData,
  settings: GoalSettings,
  weeklySolved: number,
  selectedCompany?: string | null,
): InterviewReadinessResult {
  return useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let totalSolved = 0;
    let totalAttempted = 0;
    let totalSubmissions = 0;

    const difficultyCounts: Record<string, { total: number; solved: number }> = {
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 },
    };

    const topicData = new Map<string, { total: number; solved: number; lastSolved: Date | null }>();
    const weekTopicCount = new Map<string, number>();

    for (const q of questions) {
      const isSolved = progressMap[q.problemId]?.solved ?? false;
      const solvedAt = progressMap[q.problemId]?.solvedAt;

      // Difficulty counts
      const d = q.difficulty as string;
      if (difficultyCounts[d]) {
        difficultyCounts[d].total++;
        if (isSolved) difficultyCounts[d].solved++;
      }

      // Topic data
      for (const topic of q.topics) {
        if (!topic) continue;
        const entry = topicData.get(topic) ?? { total: 0, solved: 0, lastSolved: null };
        entry.total++;
        if (isSolved) {
          entry.solved++;
          if (solvedAt) {
            const sd = new Date(solvedAt.seconds * 1000);
            if (!entry.lastSolved || sd > entry.lastSolved) entry.lastSolved = sd;
          }
        }
        topicData.set(topic, entry);
      }

      // Weekly topic count
      if (isSolved && solvedAt) {
        const sd = new Date(solvedAt.seconds * 1000);
        if (sd >= weekStart) {
          for (const topic of q.topics) {
            if (!topic) continue;
            weekTopicCount.set(topic, (weekTopicCount.get(topic) ?? 0) + 1);
          }
        }
      }

      if (isSolved) totalSolved++;
      if (progressMap[q.problemId]?.attempted) totalAttempted++;
    }

    totalSubmissions = totalSolved + totalAttempted;

    // --- Factor 1: Company Completion (25%) ---
    const validStats = companyStats.filter((s) => !s.loading && s.total > 0);
    const companyCompletion =
      validStats.length > 0
        ? validStats.reduce((sum, s) => sum + (s.solved / s.total) * 100, 0) / validStats.length
        : 0;

    // --- Factor 2: Topic Coverage (20%) ---
    const totalTopics = topicData.size;
    const coveredTopics = Array.from(topicData.values()).filter((t) => t.solved > 0).length;
    const topicCoverage = totalTopics > 0 ? (coveredTopics / totalTopics) * 100 : 0;

    // --- Factor 3: Difficulty Balance (15%) ---
    const diffPcts: number[] = [];
    for (const d of Object.values(difficultyCounts)) {
      if (d.total > 0) diffPcts.push((d.solved / d.total) * 100);
    }
    const difficultyBalance =
      diffPcts.length > 0
        ? Math.max(0, diffPcts.reduce((a, b) => a + b, 0) / diffPcts.length - (Math.max(...diffPcts) - Math.min(...diffPcts)))
        : 0;

    // --- Factor 4: Revision Completion (15%) ---
    const revisionCompletion =
      revisionStats.total > 0 ? (revisionStats.completed / revisionStats.total) * 100 : 0;

    // --- Factor 5: Consistency (15%) ---
    const consistency = calendarStats.activeDays > 0
      ? Math.min(100, (calendarStats.activeDays / 30) * 100)
      : 0;

    // --- Factor 6: Current Streak (10%) ---
    const currentStreakScore = Math.min(100, (calendarStats.currentStreak / 30) * 100);

    // --- Overall Score ---
    const overallScore = Math.round(
      companyCompletion * 0.25 +
      topicCoverage * 0.20 +
      difficultyBalance * 0.15 +
      revisionCompletion * 0.15 +
      consistency * 0.15 +
      currentStreakScore * 0.10
    );

    // --- Company Scores ---
    const companyScores = validStats.map((s) => ({
      company: s.company,
      score: Math.round((s.solved / s.total) * 100),
    }));

    // --- Weak Topics ---
    const weakTopics: WeakTopic[] = Array.from(topicData.entries())
      .map(([topic, data]) => ({
        topic,
        total: data.total,
        solved: data.solved,
        completion: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
        daysSinceLastSolved: data.lastSolved ? daysBetween(data.lastSolved, now) : 999,
      }))
      .sort((a, b) => a.completion - b.completion)
      .slice(0, 5);

    // --- Weak Difficulties ---
    const weakDifficulties = Object.entries(difficultyCounts)
      .filter(([, d]) => d.total > 0)
      .map(([difficulty, d]) => ({
        difficulty,
        completion: Math.round((d.solved / d.total) * 100),
      }))
      .sort((a, b) => a.completion - b.completion);

    // --- Recommendations ---
    const recommendations: Recommendation[] = [];
    const needsPractice = weakTopics
      .filter((t) => t.completion < 70 && t.daysSinceLastSolved > 3)
      .slice(0, 3);

    for (const wt of needsPractice) {
      const days = wt.daysSinceLastSolved === 999 ? 30 : wt.daysSinceLastSolved;
      const count = Math.max(1, Math.min(3, Math.ceil(days / 7)));
      recommendations.push({
        topic: wt.topic,
        count,
        reason: `${wt.topic} has not been practiced for ${days} day${days > 1 ? "s" : ""}.`,
      });
    }

    // --- Pattern Coverage ---
    const PATTERN_RULES: { name: string; keywords: string[] }[] = [
      { name: "Array", keywords: ["array"] },
      { name: "String", keywords: ["string"] },
      { name: "Hash Table", keywords: ["hash table", "hashmap", "hash map"] },
      { name: "Two Pointers", keywords: ["two pointers", "two pointer"] },
      { name: "Sliding Window", keywords: ["sliding window"] },
      { name: "Binary Search", keywords: ["binary search"] },
      { name: "Sorting", keywords: ["sorting", "sort"] },
      { name: "Recursion", keywords: ["recursion", "recursive"] },
      { name: "Backtracking", keywords: ["backtracking"] },
      { name: "DFS", keywords: ["depth-first", "depth first", "dfs"] },
      { name: "BFS", keywords: ["breadth-first", "breadth first", "bfs"] },
      { name: "Tree", keywords: ["tree", "bst", "binary search tree", "binary tree"] },
      { name: "Graph", keywords: ["graph"] },
      { name: "Linked List", keywords: ["linked list", "linked-list"] },
      { name: "Stack", keywords: ["stack"] },
      { name: "Queue", keywords: ["queue"] },
      { name: "Heap", keywords: ["heap", "priority queue"] },
      { name: "Trie", keywords: ["trie"] },
      { name: "Dynamic Programming", keywords: ["dynamic programming", "dp"] },
      { name: "Greedy", keywords: ["greedy"] },
      { name: "Union Find", keywords: ["union find", "disjoint"] },
      { name: "Bit Manipulation", keywords: ["bit", "bit manipulation"] },
      { name: "Math", keywords: ["math", "mathematical"] },
      { name: "Matrix", keywords: ["matrix"] },
      { name: "Prefix Sum", keywords: ["prefix sum", "prefix-sum", "prefix"] },
      { name: "Counting", keywords: ["counting", "count"] },
      { name: "Design", keywords: ["design"] },
      { name: "Simulation", keywords: ["simulation", "simulate"] },
      { name: "Monotonic Stack", keywords: ["monotonic stack"] },
      { name: "Segment Tree", keywords: ["segment tree", "segment-tree"] },
    ];

    function matchPattern(topic: string): string | null {
      const lower = topic.toLowerCase();
      for (const rule of PATTERN_RULES) {
        for (const kw of rule.keywords) {
          if (lower.includes(kw)) return rule.name;
        }
      }
      return null;
    }

    const patternMap = new Map<string, { total: number; solved: number }>();
    const topicToPattern = new Map<string, string>();

    for (const topic of topicData.keys()) {
      const pattern = matchPattern(topic);
      if (pattern) {
        topicToPattern.set(topic, pattern);
        const data = topicData.get(topic)!;
        const entry = patternMap.get(pattern) ?? { total: 0, solved: 0 };
        entry.total += data.total;
        entry.solved += data.solved;
        patternMap.set(pattern, entry);
      }
    }

    const patternCoverage: PatternCoverage[] = Array.from(patternMap.entries())
      .map(([pattern, data]) => ({
        pattern,
        total: data.total,
        solved: data.solved,
        completion: Math.round((data.solved / data.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);

    // --- Mock Interview Readiness ---
    const mockReadiness: MockInterviewItem[] = validStats.map((s) => {
      const coding = s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0;
      const revision = revisionStats.total > 0
        ? Math.round((revisionStats.completed / revisionStats.total) * 100)
        : 0;
      const topics = totalTopics > 0
        ? Math.round((coveredTopics / totalTopics) * 100)
        : 0;
      const overall = Math.round(coding * 0.5 + revision * 0.25 + topics * 0.25);
      return { company: s.company, coding, revision, topics, overall };
    });

    // --- Achievements ---
    const achievements: Achievement[] = [
      {
        label: "First Solved",
        unlocked: totalSolved >= 1,
        icon: "🌱",
        description: "Solved your first problem",
      },
      {
        label: "10 Problems",
        unlocked: totalSolved >= 10,
        icon: "⭐",
        description: "Solved 10 problems",
      },
      {
        label: "50 Problems",
        unlocked: totalSolved >= 50,
        icon: "🌟",
        description: "Solved 50 problems",
      },
      {
        label: "100 Problems",
        unlocked: totalSolved >= 100,
        icon: "🏆",
        description: "Solved 100 problems",
      },
      {
        label: "7-Day Streak",
        unlocked: calendarStats.currentStreak >= 7,
        icon: "🔥",
        description: "Maintained a 7-day streak",
      },
      {
        label: "30-Day Streak",
        unlocked: calendarStats.currentStreak >= 30,
        icon: "🔥",
        description: "Maintained a 30-day streak",
      },
      {
        label: "Consistent",
        unlocked: calendarStats.activeDays >= 20,
        icon: "📅",
        description: "Active on 20+ days",
      },
      {
        label: "Company Ready",
        unlocked: validStats.some((s) => s.total > 0 && (s.solved / s.total) >= 0.8),
        icon: "🎯",
        description: "80%+ completion for a company",
      },
      {
        label: "Topic Master",
        unlocked: Array.from(topicData.values()).some((t) => t.total >= 5 && (t.solved / t.total) >= 0.9),
        icon: "🧠",
        description: "90%+ completion in a topic with 5+ problems",
      },
      {
        label: "Revision Ace",
        unlocked: revisionStats.total >= 5 && revisionStats.completed >= revisionStats.total * 0.8,
        icon: "🔄",
        description: "80%+ revision completion rate",
      },
    ];

    // --- Level ---
    const level =
      overallScore >= 90 ? "Excellent" :
      overallScore >= 75 ? "Strong Candidate" :
      overallScore >= 60 ? "Interview Ready" :
      overallScore >= 40 ? "Improving" :
      "Beginner";

    // --- Weekly Review ---
    const mostPracticedTopic =
      weekTopicCount.size > 0
        ? Array.from(weekTopicCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : "N/A";

    const weakestTopicName =
      weakTopics.length > 0 && weakTopics[0].total > 0 ? weakTopics[0].topic : "N/A";

    const weeklyReview: WeeklyReview = {
      problemsSolved: weeklySolved,
      acceptanceRate: totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0,
      mostPracticedTopic,
      weakestTopic: weakestTopicName,
      bestDay: calendarInsights.mostProductiveDay?.date
        ? new Date(calendarInsights.mostProductiveDay.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "N/A",
      missedDays: calendarInsights.inactiveDays,
      goalCompletion: settings.weeklyTarget > 0
        ? Math.min(100, Math.round((weeklySolved / settings.weeklyTarget) * 100))
        : 0,
    };

    // --- Remaining Problems (deduplicated from global questions set) ---
    const uniqueProblemMap = new Map<string, Problem>();
    for (const q of questions) {
      if (!uniqueProblemMap.has(q.problemId)) {
        uniqueProblemMap.set(q.problemId, q);
      }
    }
    const totalUnique = uniqueProblemMap.size;
    const totalUniqueSolved = Array.from(uniqueProblemMap.keys()).filter((id) => progressMap[id]?.solved).length;
    const remainingProblems = totalUnique - totalUniqueSolved;

    // --- Estimated Time ---
    const dailyTarget = settings.dailyTarget || 3;
    const estimatedDays = Math.ceil(remainingProblems / dailyTarget);
    const estimatedTime = remainingProblems === 0 ? "Complete!" : estimatedDays <= 1 ? "1 Day" : `${estimatedDays} Days`;

    // --- Weak Patterns ---
    const weakPatterns: { pattern: string; completion: number }[] = patternCoverage
      .map((p) => ({ pattern: p.pattern, completion: p.completion }))
      .sort((a, b) => a.completion - b.completion)
      .slice(0, 5);

    // --- Action Plan ---
    const actionPlan: ActionItem[] = [];
    const usedTopics = new Set<string>();

    const weakForActions = weakTopics
      .filter((t) => t.completion < 70 && t.daysSinceLastSolved > 3)
      .slice(0, 3);

    for (const wt of weakForActions) {
      const days = wt.daysSinceLastSolved === 999 ? 30 : wt.daysSinceLastSolved;
      const count = Math.max(1, Math.min(3, Math.ceil(days / 7)));
      const topic = wt.topic as string;
      if (!usedTopics.has(topic)) {
        usedTopics.add(topic);
        actionPlan.push({
          id: `solve-${topic.toLowerCase().replace(/\s+/g, "-")}`,
          type: "solve",
          description: `Solve ${count} ${topic} problem${count > 1 ? "s" : ""}`,
          explanation: `${topic} is at ${wt.completion}% completion and hasn't been practiced for ${days} day${days > 1 ? "s" : ""}.`,
          priority: days > 14 ? "high" : days > 7 ? "medium" : "low",
        });
      }
    }

    if (weakPatterns.length > 0 && actionPlan.length < 3) {
      for (const wp of weakPatterns) {
        if (wp.completion >= 70) continue;
        actionPlan.push({
          id: `practice-${wp.pattern.toLowerCase().replace(/\s+/g, "-")}`,
          type: "practice",
          description: `Practice ${wp.pattern} patterns`,
          explanation: `${wp.pattern} patterns are at ${wp.completion}% completion.`,
          priority: wp.completion < 40 ? "high" : "medium",
        });
        if (actionPlan.length >= 4) break;
      }
    }

    if (revisionStats.overdue > 0 && actionPlan.length < 4) {
      actionPlan.push({
        id: "revise-overdue",
        type: "revise",
        description: `Revise ${revisionStats.overdue} overdue problem${revisionStats.overdue > 1 ? "s" : ""}`,
        explanation: `${revisionStats.overdue} problem${revisionStats.overdue > 1 ? "s are" : " is"} past their revision interval.`,
        priority: "high",
      });
    }

    const sc = selectedCompany;
    const selectedCompanyStat = sc
      ? validStats.find((s) => s.company === sc)
      : null;

    if (sc && selectedCompanyStat && actionPlan.length < 4) {
      const remaining = selectedCompanyStat.total - selectedCompanyStat.solved;
      if (remaining > 0) {
        actionPlan.push({
          id: `complete-${sc.toLowerCase().replace(/\s+/g, "-")}`,
          type: "complete",
          description: `Complete ${Math.min(remaining, 5)} more ${sc} problem${Math.min(remaining, 5) > 1 ? "s" : ""}`,
          explanation: `You have ${remaining} unsolved ${sc} problems remaining.`,
          priority: "medium",
        });
      }
    }

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      factors: {
        companyCompletion: Math.round(companyCompletion),
        topicCoverage: Math.round(topicCoverage),
        difficultyBalance: Math.round(Math.max(0, difficultyBalance)),
        revisionCompletion: Math.round(revisionCompletion),
        consistency: Math.round(consistency),
        currentStreakScore: Math.round(currentStreakScore),
      },
      companyScores,
      weakTopics,
      weakDifficulties,
      weakPatterns,
      recommendations,
      weeklyReview,
      patternCoverage,
      mockReadiness,
      achievements,
      level,
      remainingProblems,
      estimatedTime,
      actionPlan,
    };
  }, [progressMap, questions, companyStats, revisionStats, calendarStats, calendarInsights, settings, weeklySolved, selectedCompany]);
}

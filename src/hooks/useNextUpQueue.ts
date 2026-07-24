"use client";

import { useMemo } from "react";
import type { Problem, ProgressMap } from "@/lib/progressTypes";

interface TopicStrength {
  name: string;
  strength: number;
}

export function useNextUpQueue(
  questions: Problem[],
  progressMap: ProgressMap,
  topicStats: { name: string; total: number; solved: number }[],
  limit = 5,
) {
  return useMemo(() => {
    const topicStrengths: TopicStrength[] = topicStats
      .filter((t) => t.total >= 2)
      .map((t) => ({
        name: t.name,
        strength: t.total > 0 ? (t.solved / t.total) * 100 : 0,
      }))
      .sort((a, b) => a.strength - b.strength);

    const weakTopics = topicStrengths.slice(0, 3).map((t) => t.name);
    const weakSet = new Set(weakTopics);

    const easySolved = Object.entries(progressMap).filter(
      ([id, p]) => p.solved && questions.find((q) => q.problemId === id)?.difficulty === "Easy",
    ).length;
    const mediumSolved = Object.entries(progressMap).filter(
      ([id, p]) => p.solved && questions.find((q) => q.problemId === id)?.difficulty === "Medium",
    ).length;

    const easyPct = easySolved / Math.max(1, Object.values(questions).filter((q) => q.difficulty === "Easy").length);
    const mediumPct = mediumSolved / Math.max(1, Object.values(questions).filter((q) => q.difficulty === "Medium").length);

    let targetDifficulty: string;
    if (easyPct < 0.6) targetDifficulty = "Easy";
    else if (mediumPct < 0.5) targetDifficulty = "Medium";
    else targetDifficulty = "Hard";

    const candidates = questions.filter((q) => {
      const p = progressMap[q.problemId];
      if (p?.solved) return false;
      if (p?.inRevisionList) return false;
      if (weakSet.size > 0) {
        const matchesWeak = q.topics.some((t) => weakSet.has(t));
        if (!matchesWeak) return false;
      }
      return true;
    });

    candidates.sort((a, b) => {
      const aWeak = a.topics.some((t) => weakSet.has(t)) ? 0 : 1;
      const bWeak = b.topics.some((t) => weakSet.has(t)) ? 0 : 1;
      if (aWeak !== bWeak) return aWeak - bWeak;
      if (a.difficulty === targetDifficulty && b.difficulty !== targetDifficulty) return -1;
      if (b.difficulty === targetDifficulty && a.difficulty !== targetDifficulty) return 1;
      return 0;
    });

    return candidates.slice(0, limit);
  }, [questions, progressMap, topicStats, limit]);
}

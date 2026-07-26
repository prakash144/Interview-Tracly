"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import type { Problem, ProgressMap, UserProblemProgress } from "@/lib/progressTypes";
import {
  getUserProgress,
  saveProblemProgress,
  updateDailyActivity,
} from "@/services/firebase/progressService";

const emptyProgress = (problemId: string): UserProblemProgress => ({
  problemId,
  solved: false,
  attempted: false,
  bookmarked: false,
  inRevisionList: false,
  notes: "",
  solvedAt: null,
  attemptedAt: null,
  bookmarkedAt: null,
  revisionAddedAt: null,
  updatedAt: Timestamp.now(),
});

const getActivityDate = () => new Date().toISOString().slice(0, 10);

export const useProblemProgress = (uid?: string | null) => {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const progressMapRef = useRef<ProgressMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressMapRef.current = progressMap;
  }, [progressMap]);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      if (!uid) {
        progressMapRef.current = {};
        setProgressMap({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const progress = await getUserProgress(uid);

        if (!cancelled) {
          progressMapRef.current = progress;
          setProgressMap(progress);
        }
      } catch (progressError) {
        if (!cancelled) {
          setError(
            progressError instanceof Error
              ? progressError.message
              : "Unable to load progress."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const updateProgress = useCallback(
    async (
      problem: Problem,
      updater: (current: UserProblemProgress) => UserProblemProgress,
      activity?: (current: UserProblemProgress, next: UserProblemProgress) => {
        solvedDelta?: number;
        attemptedDelta?: number;
      }
    ) => {
      if (!uid) {
        return;
      }

      const current =
        progressMapRef.current[problem.problemId] ?? emptyProgress(problem.problemId);
      const next = updater(current);

      const optimisticProgress = {
        ...progressMapRef.current,
        [problem.problemId]: next,
      };

      progressMapRef.current = optimisticProgress;
      setProgressMap(optimisticProgress);

      try {
        await saveProblemProgress(uid, next);
        const activityDelta = activity?.(current, next);

        if (activityDelta?.solvedDelta || activityDelta?.attemptedDelta) {
          await updateDailyActivity(uid, getActivityDate(), activityDelta);
        }
      } catch (progressError) {
        const revertedProgress = {
          ...progressMapRef.current,
          [problem.problemId]: current,
        };

        progressMapRef.current = revertedProgress;
        setProgressMap(revertedProgress);
        toast.error("Failed to save progress", { id: "progress-save-error" });
        setError(
          progressError instanceof Error
            ? progressError.message
            : "Unable to save progress."
        );
      }
    },
    [uid]
  );

  const toggleSolved = useCallback(
    (problem: Problem) =>
      updateProgress(problem, (current) => {
        const solved = !current.solved;
        const now = Timestamp.now();

        return {
          ...current,
          solved,
          attempted: solved ? true : current.attempted,
          solvedAt: solved ? now : null,
          attemptedAt: solved && !current.attemptedAt ? now : current.attemptedAt,
          updatedAt: now,
        };
      }, (current, next) => ({
        solvedDelta: !current.solved && next.solved ? 1 : 0,
        attemptedDelta: !current.attempted && next.attempted ? 1 : 0,
      })),
    [updateProgress]
  );

  const toggleAttempted = useCallback(
    (problem: Problem) =>
      updateProgress(problem, (current) => {
        const attempted = !current.attempted;
        const now = Timestamp.now();

        return {
          ...current,
          attempted,
          attemptedAt: attempted ? now : null,
          updatedAt: now,
        };
      }, (current, next) => ({
        attemptedDelta: !current.attempted && next.attempted ? 1 : 0,
      })),
    [updateProgress]
  );

  const toggleBookmarked = useCallback(
    (problem: Problem) =>
      updateProgress(problem, (current) => {
        const bookmarked = !current.bookmarked;
        const now = Timestamp.now();

        return {
          ...current,
          bookmarked,
          bookmarkedAt: bookmarked ? now : null,
          updatedAt: now,
        };
      }),
    [updateProgress]
  );

  const toggleRevision = useCallback(
    (problem: Problem) =>
      updateProgress(problem, (current) => {
        const inRevisionList = !current.inRevisionList;
        const now = Timestamp.now();

        return {
          ...current,
          inRevisionList,
          revisionAddedAt: inRevisionList ? now : null,
          updatedAt: now,
        };
      }),
    [updateProgress]
  );

  const saveNotes = useCallback(
    (problem: Problem, notes: string) =>
      updateProgress(problem, (current) => ({
        ...current,
        notes,
        updatedAt: Timestamp.now(),
      })),
    [updateProgress]
  );

  return useMemo(
    () => ({
      progressMap,
      loading,
      error,
      toggleSolved,
      toggleAttempted,
      toggleBookmarked,
      toggleRevision,
      saveNotes,
    }),
    [
      error,
      loading,
      progressMap,
      saveNotes,
      toggleAttempted,
      toggleBookmarked,
      toggleRevision,
      toggleSolved,
    ]
  );
};

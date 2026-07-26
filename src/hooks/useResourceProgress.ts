"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import type { ResourceProgressMap, UserResourceProgress, ResourceStatus } from "@/lib/knowledgeBase";
import {
  saveResourceProgress,
  subscribeResourceProgress,
} from "@/services/firebase/resourceService";

const emptyProgress = (resourceId: string): UserResourceProgress => ({
  resourceId,
  status: "not-started",
  inRevisionList: false,
  favorited: false,
  personalNotes: "",
  statusChangedAt: null,
  revisionAddedAt: null,
  favoritedAt: null,
  updatedAt: Timestamp.now(),
});

export const useResourceProgress = (uid?: string | null) => {
  const [progressMap, setProgressMap] = useState<ResourceProgressMap>({});
  const progressMapRef = useRef<ResourceProgressMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressMapRef.current = progressMap;
  }, [progressMap]);

  useEffect(() => {
    if (!uid) {
      progressMapRef.current = {};
      setProgressMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeResourceProgress(uid,
      (progress) => {
        progressMapRef.current = progress;
        setProgressMap(progress);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const updateProgress = useCallback(
    async (
      resourceId: string,
      updater: (current: UserResourceProgress) => UserResourceProgress
    ) => {
      if (!uid) return;

      const current = progressMapRef.current[resourceId] ?? emptyProgress(resourceId);
      const next = updater(current);

      const optimistic = { ...progressMapRef.current, [resourceId]: next };
      progressMapRef.current = optimistic;
      setProgressMap(optimistic);

      try {
        await saveResourceProgress(uid, next);
        toast.success("Progress saved", { id: "progress-saved" });
      } catch (err) {
        const reverted = { ...progressMapRef.current, [resourceId]: current };
        progressMapRef.current = reverted;
        setProgressMap(reverted);
        setError(err instanceof Error ? err.message : "Unable to save resource progress.");
        toast.error("Failed to save progress", { id: "progress-save-error" });
      }
    },
    [uid]
  );

  const setStatus = useCallback(
    (resourceId: string, status: ResourceStatus) =>
      updateProgress(resourceId, (current) => ({
        ...current,
        status,
        statusChangedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })),
    [updateProgress]
  );

  const toggleRevision = useCallback(
    (resourceId: string) =>
      updateProgress(resourceId, (current) => {
        const inRevisionList = !current.inRevisionList;
        return {
          ...current,
          inRevisionList,
          revisionAddedAt: inRevisionList ? Timestamp.now() : null,
          updatedAt: Timestamp.now(),
        };
      }),
    [updateProgress]
  );

  const toggleFavorite = useCallback(
    (resourceId: string) =>
      updateProgress(resourceId, (current) => {
        const favorited = !current.favorited;
        return {
          ...current,
          favorited,
          favoritedAt: favorited ? Timestamp.now() : null,
          updatedAt: Timestamp.now(),
        };
      }),
    [updateProgress]
  );

  const savePersonalNotes = useCallback(
    (resourceId: string, personalNotes: string) =>
      updateProgress(resourceId, (current) => ({
        ...current,
        personalNotes,
        updatedAt: Timestamp.now(),
      })),
    [updateProgress]
  );

  return useMemo(
    () => ({
      progressMap,
      loading,
      error,
      setStatus,
      toggleRevision,
      toggleFavorite,
      savePersonalNotes,
    }),
    [error, loading, progressMap, savePersonalNotes, setStatus, toggleFavorite, toggleRevision]
  );
};

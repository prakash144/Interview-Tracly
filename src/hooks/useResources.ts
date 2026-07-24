"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { KnowledgeResource, KnowledgeResourceInput } from "@/lib/knowledgeBase";
import type { TrackId } from "@/lib/interviewTracks";
import * as resourceService from "@/services/firebase/resourceService";
import { SAMPLE_RESOURCES_BY_TRACK } from "@/lib/knowledgeBase";

let sampleIdCounter = 0;
const generateId = () => `res_${Date.now()}_${++sampleIdCounter}`;

export const useResources = (uid?: string | null, trackId?: TrackId) => {
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const resourcesRef = useRef<KnowledgeResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  const sampleForTrack = useCallback((tid: TrackId): KnowledgeResource[] => {
    return (SAMPLE_RESOURCES_BY_TRACK[tid] ?? []).map(
      (r: KnowledgeResourceInput, i: number) => ({
        ...r,
        id: `sample-${tid}-${i}`,
        tags: r.tags ?? [],
        company: r.company ?? "General",
        difficulty: r.difficulty ?? "Medium",
        resourceLinks: r.resourceLinks ?? [],
        askedAt: r.askedAt ?? "",
        notes: r.notes ?? "",
        createdAt: Date.now() - i * 86400000,
        updatedAt: Date.now(),
        track: tid,
      })
    ) as KnowledgeResource[];
  }, []);

  const sampleTrackIds = useMemo(() => Object.keys(SAMPLE_RESOURCES_BY_TRACK), []);
  const allSampleResources = useMemo(
    () => sampleTrackIds.flatMap((tid) => sampleForTrack(tid)),
    [sampleTrackIds, sampleForTrack]
  );

  useEffect(() => {
    if (!uid) {
      resourcesRef.current = allSampleResources;
      setResources(allSampleResources);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsub = resourceService.subscribeResources(uid,
      (data) => {
        const samples = trackId
          ? sampleForTrack(trackId)
          : allSampleResources;
        const merged = [...data];
        for (const s of samples) {
          if (!merged.find((r) => r.id === s.id)) {
            merged.push(s);
          }
        }
        resourcesRef.current = merged;
        setResources(merged);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, trackId, allSampleResources, sampleForTrack]);

  const addResource = useCallback(
    async (input: KnowledgeResourceInput) => {
      const now = Date.now();
      const resource: KnowledgeResource = {
        id: generateId(),
        title: input.title,
        company: input.company ?? "General",
        track: input.track,
        difficulty: input.difficulty ?? "Medium",
        tags: input.tags ?? [],
        resourceLinks: input.resourceLinks ?? [],
        askedAt: input.askedAt ?? "",
        notes: input.notes ?? "",
        createdAt: now,
        updatedAt: now,
      };

      const optimistic = [...resourcesRef.current, resource];
      resourcesRef.current = optimistic;
      setResources(optimistic);

      if (uid) {
        try {
          await resourceService.addResource(uid, resource);
          toast.success("Resource added");
        } catch (err) {
          const reverted = resourcesRef.current.filter((r) => r.id !== resource.id);
          resourcesRef.current = reverted;
          setResources(reverted);
          setError(err instanceof Error ? err.message : "Failed to add resource");
          toast.error("Failed to add resource");
        }
      }
    },
    [uid]
  );

  const updateResource = useCallback(
    async (resourceId: string, data: Partial<KnowledgeResourceInput>) => {
      const optimistic = resourcesRef.current.map((r) =>
        r.id === resourceId
          ? { ...r, ...data, tags: data.tags ?? r.tags, resourceLinks: data.resourceLinks ?? r.resourceLinks, updatedAt: Date.now() }
          : r
      );
      resourcesRef.current = optimistic;
      setResources(optimistic);

      if (uid) {
        const prevSnapshot = [...resourcesRef.current];
        try {
          await resourceService.updateResource(uid, resourceId, data);
          toast.success("Resource updated");
        } catch (err) {
          resourcesRef.current = prevSnapshot;
          setResources(prevSnapshot);
          setError(err instanceof Error ? err.message : "Failed to update resource");
          toast.error("Failed to update resource");
        }
      }
    },
    [uid]
  );

  const deleteResource = useCallback(
    async (resourceId: string) => {
      const prevSnapshot = [...resourcesRef.current];
      const deleted = prevSnapshot.find((r) => r.id === resourceId);
      const optimistic = prevSnapshot.filter((r) => r.id !== resourceId);
      resourcesRef.current = optimistic;
      setResources(optimistic);

      let deletedFromFirebase = false;
      if (uid && !resourceId.startsWith("sample-")) {
        try {
          await resourceService.deleteResource(uid, resourceId);
          deletedFromFirebase = true;
        } catch (err) {
          resourcesRef.current = prevSnapshot;
          setResources(prevSnapshot);
          setError(err instanceof Error ? err.message : "Failed to delete resource");
          toast.error("Failed to delete resource");
          return;
        }
      }

      toast("Resource deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            resourcesRef.current = prevSnapshot;
            setResources(prevSnapshot);
            if (uid && deleted && deletedFromFirebase) {
              try {
                await resourceService.addResource(uid, deleted);
              } catch {}
            }
          },
        },
        duration: 5000,
      });
    },
    [uid]
  );

  return useMemo(
    () => ({
      resources,
      loading,
      error,
      addResource,
      updateResource,
      deleteResource,
    }),
    [resources, loading, error, addResource, updateResource, deleteResource]
  );
};

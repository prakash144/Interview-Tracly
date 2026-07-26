"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Track } from "@/lib/tracks";
import { INTERVIEW_TRACKS } from "@/lib/interviewTracks";
import * as trackService from "@/services/firebase/trackService";

let idCounter = 0;
const genId = () => `track_${Date.now()}_${++idCounter}`;

const DEFAULT_TRACKS: Track[] = INTERVIEW_TRACKS.map((t, i) => ({
  id: t.id,
  name: t.name,
  icon: t.icon,
  color: t.color,
  description: t.description,
  shortDescription: t.shortDescription,
  createdAt: i,
  updatedAt: i,
}));

export const useTracks = (uid?: string | null) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const tracksRef = useRef<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (!uid) {
      setTracks(DEFAULT_TRACKS);
      tracksRef.current = DEFAULT_TRACKS;
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = trackService.subscribeTracks(uid,
      (data) => {
        if (data.length === 0) {
          Promise.all(
            DEFAULT_TRACKS.map(t =>
              trackService.addTrack(uid, t).catch(() => {
                console.warn("Failed to seed default track:", t.id);
              })
            )
          );
          tracksRef.current = DEFAULT_TRACKS;
          setTracks(DEFAULT_TRACKS);
        } else {
          tracksRef.current = data;
          setTracks(data);
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const addTrack = useCallback(
    async (data: { name: string; icon: string; color: string; description: string; shortDescription: string }) => {
      const now = Date.now();
      const track: Track = {
        id: genId(),
        name: data.name,
        icon: data.icon,
        color: data.color,
        description: data.description,
        shortDescription: data.shortDescription,
        createdAt: now,
        updatedAt: now,
      };
      const optimistic = [...tracksRef.current, track];
      tracksRef.current = optimistic;
      setTracks(optimistic);
      if (uid) {
        const prevSnapshot = [...tracksRef.current];
        try {
          await trackService.addTrack(uid, track);
          toast.success("Track created", { id: "track-created" });
        } catch {
          tracksRef.current = prevSnapshot;
          setTracks(prevSnapshot);
          toast.error("Failed to create track", { id: "track-create-error" });
        }
      }
    },
    [uid]
  );

  const updateTrack = useCallback(
    async (trackId: string, data: Partial<Track>) => {
      const prevSnapshot = [...tracksRef.current];
      const optimistic = prevSnapshot.map((t) =>
        t.id === trackId ? { ...t, ...data, updatedAt: Date.now() } : t
      );
      tracksRef.current = optimistic;
      setTracks(optimistic);
      if (uid) {
        try {
          await trackService.updateTrack(uid, trackId, data);
          toast.success("Track updated", { id: "track-updated" });
        } catch {
          tracksRef.current = prevSnapshot;
          setTracks(prevSnapshot);
          toast.error("Failed to update track", { id: "track-update-error" });
        }
      }
    },
    [uid]
  );

  const deleteTrack = useCallback(
    async (trackId: string) => {
      const prevSnapshot = [...tracksRef.current];
      const optimistic = prevSnapshot.filter((t) => t.id !== trackId);
      tracksRef.current = optimistic;
      setTracks(optimistic);
      if (uid) {
        try {
          await trackService.deleteTrack(uid, trackId);
          toast.success("Track deleted", { id: "track-deleted" });
        } catch {
          tracksRef.current = prevSnapshot;
          setTracks(prevSnapshot);
          toast.error("Failed to delete track", { id: "track-delete-error" });
        }
      }
    },
    [uid]
  );

  const archiveTrack = useCallback(
    async (trackId: string, archived: boolean) => {
      const prevSnapshot = [...tracksRef.current];
      const optimistic = prevSnapshot.map((t) =>
        t.id === trackId ? { ...t, archived, updatedAt: Date.now() } : t
      );
      tracksRef.current = optimistic;
      setTracks(optimistic);
      if (uid) {
        try {
          await trackService.archiveTrack(uid, trackId, archived);
          toast.success(archived ? "Track archived" : "Track restored", { id: archived ? "track-archived" : "track-restored" });
        } catch {
          tracksRef.current = prevSnapshot;
          setTracks(prevSnapshot);
          toast.error("Failed to update track", { id: "track-update-error" });
        }
      }
    },
    [uid]
  );

  const mergeTracks = useCallback(
    async (sourceId: string, targetId: string) => {
      const prevSnapshot = [...tracksRef.current];
      const optimistic = prevSnapshot.filter((t) => t.id !== sourceId);
      tracksRef.current = optimistic;
      setTracks(optimistic);
      if (uid) {
        try {
          await trackService.mergeTracks(uid, sourceId, targetId);
          toast.success("Tracks merged", { id: "tracks-merged" });
        } catch {
          tracksRef.current = prevSnapshot;
          setTracks(prevSnapshot);
          toast.error("Failed to merge tracks", { id: "tracks-merge-error" });
        }
      }
    },
    [uid]
  );

  const getTrack = useCallback(
    (id: string) => tracksRef.current.find((t) => t.id === id) ?? null,
    []
  );

  return useMemo(
    () => ({ tracks, loading, error, addTrack, updateTrack, deleteTrack, getTrack, archiveTrack, mergeTracks }),
    [tracks, loading, error, addTrack, updateTrack, deleteTrack, getTrack, archiveTrack, mergeTracks]
  );
};

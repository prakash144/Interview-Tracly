"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import type { CustomList } from "@/lib/progressTypes";
import * as listService from "@/services/firebase/customListService";

let idCounter = 0;
const genId = () => `list_${Date.now()}_${++idCounter}`;

export const useCustomLists = (uid?: string | null) => {
  const [lists, setLists] = useState<CustomList[]>([]);
  const listsRef = useRef<CustomList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    if (!uid) {
      setLists([]);
      listsRef.current = [];
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = listService.subscribeCustomLists(uid,
      (data) => {
        listsRef.current = data;
        setLists(data);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const create = useCallback(
    async (name: string, description?: string) => {
      if (!uid) return;
      const optimistic: CustomList = {
        id: genId(),
        name,
        description: description || "",
        problemIds: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const next = [...listsRef.current, optimistic];
      listsRef.current = next;
      setLists(next);
      try {
        await listService.createCustomList(uid, name, description || "");
        toast.success("List created", { id: "list-created" });
      } catch {
        const rolled = listsRef.current.filter((l) => l.id !== optimistic.id);
        listsRef.current = rolled;
        setLists(rolled);
        toast.error("Failed to create list", { id: "list-create-error" });
      }
    },
    [uid]
  );

  const rename = useCallback(
    async (listId: string, name: string) => {
      if (!uid) return;
      const prev = listsRef.current;
      const next = prev.map((l) =>
        l.id === listId ? { ...l, name, updatedAt: Timestamp.now() } : l
      );
      listsRef.current = next;
      setLists(next);
      try {
        await listService.renameCustomList(uid, listId, name);
        toast.success("List renamed", { id: "list-renamed" });
      } catch {
        listsRef.current = prev;
        setLists(prev);
        toast.error("Failed to rename list", { id: "list-rename-error" });
      }
    },
    [uid]
  );

  const remove = useCallback(
    async (listId: string) => {
      if (!uid) return;
      const prev = listsRef.current;
      const next = prev.filter((l) => l.id !== listId);
      listsRef.current = next;
      setLists(next);
      try {
        await listService.deleteCustomList(uid, listId);
        toast.success("List deleted", { id: "list-deleted" });
      } catch {
        listsRef.current = prev;
        setLists(prev);
        toast.error("Failed to delete list", { id: "list-delete-error" });
      }
    },
    [uid]
  );

  const addProblem = useCallback(
    async (listId: string, problemId: string) => {
      if (!uid) return;
      const prev = listsRef.current;
      const next = prev.map((l) =>
        l.id === listId
          ? { ...l, problemIds: [...l.problemIds, problemId], updatedAt: Timestamp.now() }
          : l
      );
      listsRef.current = next;
      setLists(next);
      try {
        await listService.addProblemToList(uid, listId, problemId);
        toast.success("Problem added to list", { id: "problem-added-to-list" });
      } catch {
        listsRef.current = prev;
        setLists(prev);
        toast.error("Failed to add problem to list", { id: "problem-add-to-list-error" });
      }
    },
    [uid]
  );

  const removeProblem = useCallback(
    async (listId: string, problemId: string) => {
      if (!uid) return;
      const prev = listsRef.current;
      const next = prev.map((l) =>
        l.id === listId
          ? { ...l, problemIds: l.problemIds.filter((id) => id !== problemId), updatedAt: Timestamp.now() }
          : l
      );
      listsRef.current = next;
      setLists(next);
      try {
        await listService.removeProblemFromList(uid, listId, problemId);
        toast.success("Problem removed from list", { id: "problem-removed-from-list" });
      } catch {
        listsRef.current = prev;
        setLists(prev);
        toast.error("Failed to remove problem from list", { id: "problem-remove-from-list-error" });
      }
    },
    [uid]
  );

  const isProblemInAnyList = useCallback(
    (problemId: string): string[] => {
      return listsRef.current
        .filter((l) => l.problemIds.includes(problemId))
        .map((l) => l.id);
    },
    []
  );

  return {
    lists,
    loading,
    error,
    create,
    rename,
    remove,
    addProblem,
    removeProblem,
    isProblemInAnyList,
  };
};

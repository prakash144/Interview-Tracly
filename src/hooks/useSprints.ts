"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Priority, Sprint, SprintTaskV2, SprintType, TaskType } from "@/lib/sprints";
import { createDefaultTaskV2, migrateTask } from "@/lib/sprints";
import * as sprintService from "@/services/firebase/sprintService";
import { addActivityEvent } from "@/services/firebase/activityService";

let idCounter = 0;
const genId = () => `sprint_${Date.now()}_${++idCounter}`;
const genTaskId = () => `task_${Date.now()}_${++idCounter}`;

export const useSprints = (uid?: string | null) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const sprintsRef = useRef<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sprintsRef.current = sprints;
  }, [sprints]);

  useEffect(() => {
    if (!uid) {
      setSprints([]);
      sprintsRef.current = [];
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = sprintService.subscribeSprints(uid,
      (data) => {
        sprintsRef.current = data;
        setSprints(data);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const addSprint = useCallback(
    async (data: { name: string; goal: string; startDate: string; endDate: string; type?: SprintType; company?: string; role?: string; interviewDate?: string; targetLevel?: string; stages?: string[]; template?: string; tasks?: { title: string; estimatedHours: number; priority: string }[] }) => {
      const now = Date.now();
      const sprintId = genId();
      const sprint: Sprint = {
        id: sprintId,
        name: data.name,
        goal: data.goal,
        status: "planned",
        type: data.type ?? "learning",
        company: data.company,
        role: data.role,
        interviewDate: data.interviewDate,
        targetLevel: data.targetLevel,
        stages: data.stages,
        template: data.template,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: now,
        updatedAt: now,
      };
      const optimistic = [...sprintsRef.current, sprint];
      sprintsRef.current = optimistic;
      setSprints(optimistic);
      if (uid) {
        try {
          await sprintService.addSprint(uid, sprint);
          if (data.tasks && data.tasks.length > 0) {
            const tasks = data.tasks.map((t) => {
              const task = createDefaultTaskV2({
                id: genTaskId(),
                sprintId,
                type: "problem",
                itemId: "",
                title: t.title,
              });
              task.estimatedHours = t.estimatedHours || 0;
              task.priority = (t.priority as Priority) || "medium";
              return task;
            });
            await Promise.all(tasks.map((task) => sprintService.addTask(uid, sprintId, task)));
          }
          toast.success("Sprint created", { id: "sprint-created" });
        } catch {
          const rolled = sprintsRef.current.filter((s) => s.id !== sprint.id);
          sprintsRef.current = rolled;
          setSprints(rolled);
          toast.error("Failed to create sprint", { id: "sprint-create-error" });
        }
      }
    },
    [uid]
  );

  const updateSprint = useCallback(
    async (sprintId: string, data: Partial<Sprint>) => {
      const prev = sprintsRef.current.find((s) => s.id === sprintId);
      const prevSnapshot = [...sprintsRef.current];
      const currentActive = sprintsRef.current.find((s) => s.status === "active" && s.id !== sprintId);
      if (prev && data.status === "active" && prev.status !== "active") {
        if (currentActive) {
          const withPaused = { ...data, pausedSprintId: currentActive.id, updatedAt: Date.now() };
          const optimistic = prevSnapshot.map((s) => {
            if (s.id === sprintId) return { ...s, ...withPaused };
            if (s.id === currentActive.id) return { ...s, status: "planned" as const, updatedAt: Date.now() };
            return s;
          });
          sprintsRef.current = optimistic;
          setSprints(optimistic);
          if (uid) {
            try {
              await sprintService.updateSprint(uid, currentActive.id, { status: "planned", updatedAt: Date.now() });
              await sprintService.updateSprint(uid, sprintId, withPaused);
              addActivityEvent(uid, { type: "sprint_started", sprintId, sprintName: prev.name, message: `Started Sprint: ${prev.name}` }).catch(() => {});
              const pausedName = currentActive.company ? `${currentActive.name} (${currentActive.company})` : currentActive.name;
              toast.success(`Focus Mode active`, { id: "focus-mode-active", description: `"${pausedName}" suspended — will resume after interview` });
            } catch {
              sprintsRef.current = prevSnapshot;
              setSprints(prevSnapshot);
              toast.error("Failed to start sprint", { id: "sprint-start-error" });
            }
          }
          return;
        }
      }

      if (prev && data.status === "completed" && prev.status !== "completed" && prev.type === "interview") {
        const withData = { ...data, updatedAt: Date.now() };
        const optimistic = prevSnapshot.map((s) =>
          s.id === sprintId ? { ...s, ...withData } : s
        );
        sprintsRef.current = optimistic;
        setSprints(optimistic);
        if (uid) {
          try {
            await sprintService.updateSprint(uid, sprintId, withData);
            addActivityEvent(uid, { type: "sprint_completed", sprintId, sprintName: prev.name, message: `Completed Interview Sprint: ${prev.name}` }).catch(() => {});
            toast.success("Interview sprint completed", { id: "interview-completed", description: "Choose what to do with your suspended sprint" });
          } catch {
            sprintsRef.current = prevSnapshot;
            setSprints(prevSnapshot);
            toast.error("Failed to complete sprint", { id: "sprint-complete-error" });
          }
        }
        return;
      }

      const optimistic = prevSnapshot.map((s) =>
        s.id === sprintId ? { ...s, ...data, updatedAt: Date.now() } : s
      );
      sprintsRef.current = optimistic;
      setSprints(optimistic);
      if (uid) {
        try {
          await sprintService.updateSprint(uid, sprintId, data);
          if (prev && data.status === "active" && prev.status !== "active") {
            addActivityEvent(uid, { type: "sprint_started", sprintId, sprintName: prev.name, message: `Started Sprint: ${prev.name}` }).catch(() => {});
          }
          if (prev && data.status === "completed" && prev.status !== "completed") {
            addActivityEvent(uid, { type: "sprint_completed", sprintId, sprintName: prev.name, message: `Completed Sprint: ${prev.name}` }).catch(() => {});
          }
          toast.success("Sprint updated", { id: "sprint-updated" });
        } catch {
          sprintsRef.current = prevSnapshot;
          setSprints(prevSnapshot);
          toast.error("Failed to update sprint", { id: "sprint-update-error" });
        }
      }
    },
    [uid]
  );

  const archiveSprint = useCallback(
    async (sprintId: string) => {
      const prevSnapshot = [...sprintsRef.current];
      const optimistic = prevSnapshot.map((s) =>
        s.id === sprintId ? { ...s, archivedAt: Date.now(), updatedAt: Date.now() } : s
      );
      sprintsRef.current = optimistic;
      setSprints(optimistic);
      if (uid) {
        try {
          await sprintService.archiveSprint(uid, sprintId);
          toast.success("Sprint archived", { id: "sprint-archived" });
        } catch {
          sprintsRef.current = prevSnapshot;
          setSprints(prevSnapshot);
          toast.error("Failed to archive sprint", { id: "sprint-archive-error" });
        }
      }
    },
    [uid]
  );

  const restoreSprint = useCallback(
    async (sprintId: string) => {
      const prevSnapshot = [...sprintsRef.current];
      const optimistic = prevSnapshot.map((s) => {
        if (s.id !== sprintId) return s;
        const copy = { ...s };
        delete (copy as Record<string, unknown>).archivedAt;
        return { ...copy, updatedAt: Date.now() };
      });
      sprintsRef.current = optimistic;
      setSprints(optimistic);
      if (uid) {
        try {
          await sprintService.restoreSprint(uid, sprintId);
          toast.success("Sprint restored", { id: "sprint-restored" });
        } catch {
          sprintsRef.current = prevSnapshot;
          setSprints(prevSnapshot);
          toast.error("Failed to restore sprint", { id: "sprint-restore-error" });
        }
      }
    },
    [uid]
  );

  const deleteSprint = useCallback(
    async (sprintId: string) => {
      const prevSnapshot = [...sprintsRef.current];
      const optimistic = prevSnapshot.filter((s) => s.id !== sprintId);
      sprintsRef.current = optimistic;
      setSprints(optimistic);
      if (uid) {
        try {
          await sprintService.deleteSprint(uid, sprintId);
          toast.success("Sprint permanently deleted", { id: "sprint-deleted" });
        } catch {
          sprintsRef.current = prevSnapshot;
          setSprints(prevSnapshot);
          toast.error("Failed to delete sprint", { id: "sprint-delete-error" });
        }
      }
    },
    [uid]
  );

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "active") ?? null,
    [sprints]
  );

  return useMemo(
    () => ({ sprints, loading, error, addSprint, updateSprint, archiveSprint, restoreSprint, deleteSprint, activeSprint }),
    [sprints, loading, error, addSprint, updateSprint, archiveSprint, restoreSprint, deleteSprint, activeSprint]
  );
};

export const useSprintTasks = (uid?: string | null, sprintId?: string) => {
  const [tasks, setTasks] = useState<SprintTaskV2[]>([]);
  const tasksRef = useRef<SprintTaskV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!uid || !sprintId) {
      setTasks([]);
      tasksRef.current = [];
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = sprintService.subscribeTasks(uid, sprintId,
      (raw) => {
        const migrated = raw.map((t) => migrateTask(t as unknown as Record<string, unknown>));
        tasksRef.current = migrated;
        setTasks(migrated);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, sprintId]);

  const addTask = useCallback(
    async (data: { type: TaskType; itemId: string; title: string }) => {
      if (!sprintId) return;
      const task = createDefaultTaskV2({
        id: genTaskId(),
        sprintId,
        type: data.type,
        itemId: data.itemId,
        title: data.title,
      });
      const optimistic = [...tasksRef.current, task];
      tasksRef.current = optimistic;
      setTasks(optimistic);
      if (uid) {
        try {
          await sprintService.addTask(uid, sprintId, task);
          addActivityEvent(uid, { type: "task_added", sprintId, sprintName: "", message: `Added task: ${task.title}` }).catch(() => {});
          toast.success("Task added", { id: "task-added" });
        } catch {
          const rolled = tasksRef.current.filter((t) => t.id !== task.id);
          tasksRef.current = rolled;
          setTasks([...rolled]);
          toast.error("Failed to add task", { id: "task-add-error" });
        }
      }
    },
    [uid, sprintId]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: SprintTaskV2["status"]) => {
      const prev = tasksRef.current.find((t) => t.id === taskId);
      const prevSnapshot = [...tasksRef.current];
      const optimistic = prevSnapshot.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: Date.now() } : t
      );
      tasksRef.current = optimistic;
      setTasks(optimistic);
      if (uid && sprintId) {
        try {
          await sprintService.updateTask(uid, sprintId, taskId, { status, updatedAt: Date.now() });
          if (prev && status === "done" && prev.status !== "done") {
            addActivityEvent(uid, { type: "task_status_changed", sprintId, sprintName: "", message: `Completed task: ${prev.title}` }).catch(() => {});
          }
        } catch {
          tasksRef.current = prevSnapshot;
          setTasks(prevSnapshot);
          toast.error("Failed to update task status", { id: "task-status-error" });
        }
      }
    },
    [uid, sprintId]
  );

  const updateTask = useCallback(
    async (taskId: string, data: Partial<SprintTaskV2>) => {
      const prevSnapshot = [...tasksRef.current];
      const optimistic = prevSnapshot.map((t) =>
        t.id === taskId ? { ...t, ...data, updatedAt: Date.now() } : t
      );
      tasksRef.current = optimistic;
      setTasks(optimistic);
      if (uid && sprintId) {
        try {
          await sprintService.updateTask(uid, sprintId, taskId, data);
          toast.success("Task updated", { id: "task-updated" });
        } catch {
          tasksRef.current = prevSnapshot;
          setTasks(prevSnapshot);
          toast.error("Failed to update task", { id: "task-update-error" });
        }
      }
    },
    [uid, sprintId]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const prevSnapshot = [...tasksRef.current];
      const optimistic = prevSnapshot.filter((t) => t.id !== taskId);
      tasksRef.current = optimistic;
      setTasks(optimistic);
      if (uid && sprintId) {
        try {
          await sprintService.deleteTask(uid, sprintId, taskId);
          toast.success("Task removed", { id: "task-removed" });
        } catch {
          tasksRef.current = prevSnapshot;
          setTasks(prevSnapshot);
          toast.error("Failed to remove task", { id: "task-remove-error" });
        }
      }
    },
    [uid, sprintId]
  );

  const backlogTasks = useMemo(() => tasks.filter((t) => t.status === "backlog"), [tasks]);
  const todoTasks = useMemo(() => tasks.filter((t) => t.status === "todo"), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === "in-progress"), [tasks]);
  const reviewTasks = useMemo(() => tasks.filter((t) => t.status === "review"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      backlog: backlogTasks.length,
      todo: todoTasks.length,
      inProgress: inProgressTasks.length,
      review: reviewTasks.length,
      done: doneTasks.length,
      completion: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
      estimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      actualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
    }),
    [tasks, backlogTasks, todoTasks, inProgressTasks, reviewTasks, doneTasks]
  );

  return useMemo(
    () => ({
      tasks,
      loading,
      error,
      addTask,
      updateTaskStatus,
      updateTask,
      removeTask,
      backlogTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      doneTasks,
      taskStats,
    }),
    [tasks, loading, error, addTask, updateTaskStatus, updateTask, removeTask, backlogTasks, todoTasks, inProgressTasks, reviewTasks, doneTasks, taskStats]
  );
};

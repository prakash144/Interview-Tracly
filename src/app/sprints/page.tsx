"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, ChevronLeft, Play, CheckCircle2, X, Target, Star, Sparkles, Lightbulb, TrendingUp, TrendingDown, Kanban as KanbanIcon, Briefcase, Archive } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { SprintsSkeleton } from "@/components/states/PageSkeletons";
import SprintCard from "@/app/components/sprints/SprintCard";
import SprintDialog from "@/app/components/sprints/SprintDialog";
import SprintRetroDialog from "@/app/components/sprints/SprintRetroDialog";
import SprintBoard from "@/app/components/sprints/SprintBoard";
import SprintDashboardHeader from "@/app/components/sprints/SprintDashboardHeader";
import SprintAnalytics from "@/app/components/sprints/SprintAnalytics";
import SprintTimeline from "@/app/components/sprints/SprintTimeline";
import InterviewCompleteDialog from "@/app/components/sprints/InterviewCompleteDialog";
import TaskDetailDialog from "@/app/components/sprints/TaskDetailDialog";
import AddTaskToSprintDialog from "@/app/components/sprints/AddTaskToSprintDialog";
import { useAuth } from "@/hooks/useAuth";
import { useSprints } from "@/hooks/useSprints";
import { useSprintTasks } from "@/hooks/useSprints";
import { useTracks } from "@/hooks/useTracks";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { Sprint, SprintRetro, SprintTaskV2 } from "@/lib/sprints";

const SprintsPage = () => {
  const auth = useAuth();
  const { sprints, loading, error: sprintsError, addSprint, updateSprint, archiveSprint, restoreSprint, deleteSprint } = useSprints(auth.user?.uid);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [retroOpen, setRetroOpen] = useState(false);
  const [completingSprintId, setCompletingSprintId] = useState<string | null>(null);
  const [interviewCompleteOpen, setInterviewCompleteOpen] = useState(false);
  const [completingInterviewId, setCompletingInterviewId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed" | "archived">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "archived" || tab === "active" || tab === "completed") {
        setFilterTab(tab);
      }
    }
  }, []);

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) ?? null,
    [sprints, selectedSprintId]
  );

  const activeSprint = useMemo(() => sprints.find((s) => s.status === "active") ?? null, [sprints]);
  const interviewSprint = useMemo(() => sprints.find((s) => s.type === "interview" && s.status === "active") ?? null, [sprints]);
  const suspendedSprint = useMemo(() => {
    if (!interviewSprint?.pausedSprintId) return null;
    return sprints.find((s) => s.id === interviewSprint.pausedSprintId) ?? null;
  }, [sprints, interviewSprint]);

  const handleStart = useCallback(
    (id: string) => updateSprint(id, { status: "active", updatedAt: Date.now() }),
    [updateSprint]
  );

  const handleComplete = useCallback(
    (id: string) => {
      const sprint = sprints.find((s) => s.id === id);
      if (sprint?.type === "interview") {
        setCompletingInterviewId(id);
        setInterviewCompleteOpen(true);
      } else {
        setCompletingSprintId(id);
        setRetroOpen(true);
      }
    },
    [sprints]
  );

  const handleInterviewResumePrevious = useCallback(async () => {
    if (!completingInterviewId) return;
    const interview = sprints.find((s) => s.id === completingInterviewId);
    if (interview?.pausedSprintId) {
      await updateSprint(interview.pausedSprintId, { status: "active", updatedAt: Date.now() });
    }
    await updateSprint(completingInterviewId, { status: "completed", updatedAt: Date.now() });
    setCompletingInterviewId(null);
    setInterviewCompleteOpen(false);
  }, [completingInterviewId, sprints, updateSprint]);

  const handleInterviewResumeTomorrow = useCallback(async () => {
    if (!completingInterviewId) return;
    await updateSprint(completingInterviewId, { status: "completed", updatedAt: Date.now() });
    setCompletingInterviewId(null);
    setInterviewCompleteOpen(false);
  }, [completingInterviewId, updateSprint]);

  const handleInterviewArchive = useCallback(async () => {
    if (!completingInterviewId) return;
    const interview = sprints.find((s) => s.id === completingInterviewId);
    if (interview?.pausedSprintId) {
      await deleteSprint(interview.pausedSprintId);
    }
    await updateSprint(completingInterviewId, { status: "completed", updatedAt: Date.now() });
    setCompletingInterviewId(null);
    setInterviewCompleteOpen(false);
  }, [completingInterviewId, sprints, deleteSprint, updateSprint]);

  const handleSaveRetro = useCallback(
    async (retro: SprintRetro) => {
      if (completingSprintId) {
        await updateSprint(completingSprintId, { status: "completed", retro, updatedAt: Date.now() });
        setCompletingSprintId(null);
      }
    },
    [completingSprintId, updateSprint]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingSprintId(id);
      setDeleteConfirmOpen(true);
    },
    []
  );

  const handleArchive = useCallback(
    async (id: string) => {
      await archiveSprint(id);
      if (selectedSprintId === id) setSelectedSprintId(null);
    },
    [archiveSprint, selectedSprintId]
  );

  const handleRestore = useCallback(
    async (id: string) => {
      await restoreSprint(id);
    },
    [restoreSprint]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingSprintId) {
      await deleteSprint(deletingSprintId);
      if (selectedSprintId === deletingSprintId) setSelectedSprintId(null);
      setDeletingSprintId(null);
    }
  }, [deletingSprintId, deleteSprint, selectedSprintId]);

  const plannedSprints = useMemo(() => sprints.filter((s) => s.status === "planned" && !s.pausedSprintId && !s.archivedAt), [sprints]);
  const suspendedSprints = useMemo(() => sprints.filter((s) => s.status === "planned" && s.pausedSprintId && !s.archivedAt), [sprints]);
  const completedSprints = useMemo(() => sprints.filter((s) => s.status === "completed" && !s.archivedAt), [sprints]);
  const archivedSprints = useMemo(() => sprints.filter((s) => s.archivedAt), [sprints]);

  if (selectedSprint) {
    return (
      <SprintDetailView
        sprint={selectedSprint}
        uid={auth.user?.uid}
        allSprints={sprints}
        onBack={() => setSelectedSprintId(null)}
        onNavigateToSprint={setSelectedSprintId}
        onStart={() => handleStart(selectedSprint.id)}
        onComplete={() => handleComplete(selectedSprint.id)}
        onArchive={() => handleArchive(selectedSprint.id)}
        onAddTask={() => setAddTaskOpen(true)}
        addTaskOpen={addTaskOpen}
        onAddTaskOpenChange={setAddTaskOpen}
      />
    );
  }

  const hasInterviewSprint = sprints.some((s) => s.type === "interview");

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Planning"
        title="Sprints"
        description="Plan, track, and reflect on your interview preparation in sprints"
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"
          >
            <Plus className="size-3.5 mr-1" />
            New Sprint
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {loading && <SprintsSkeleton />}

        {sprintsError && !loading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center">
            <p className="text-sm text-destructive">{sprintsError}</p>
          </div>
        )}

        {!auth.user && !loading && !sprintsError && (
          <div className="rounded-lg border border-dashed border-border/80 bg-card/70 px-4 py-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Sign in to plan your interview sprints.</p>
          </div>
        )}

        {auth.user && !loading && !sprintsError && (
          <div className="space-y-8">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(["all", "active", "completed", "archived"] as const).map((tabName) => {
                const counts: Record<string, number> = {
                  all: sprints.length,
                  active: activeSprint ? 1 : 0,
                  completed: completedSprints.length,
                  archived: archivedSprints.length,
                };
                return (
                  <button
                    key={tabName}
                    onClick={() => setFilterTab(tabName)}
                    className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      filterTab === tabName
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    {tabName === "active" ? "Active" : tabName === "archived" ? "Archived" : tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                    <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">({counts[tabName]})</span>
                  </button>
                );
              })}
            </div>

            {filterTab === "all" && (<>
              {interviewSprint && (
                <section className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-cyan-500">Interview Focus</h2>
                    <div className="h-px flex-1 bg-cyan-500/10" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SprintCardWithTasks
                      key={interviewSprint.id} sprint={interviewSprint} uid={auth.user?.uid} sprints={sprints}
                      onClick={setSelectedSprintId}
                      onComplete={handleComplete} onArchive={handleArchive}
                    />
                    {suspendedSprint && (
                      <SprintCardWithTasks
                        key={suspendedSprint.id} sprint={suspendedSprint} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onArchive={handleArchive}
                      />
                    )}
                  </div>
                </section>
              )}

              {activeSprint && !interviewSprint && (
                <section className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-success mb-3">Active Sprint</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[activeSprint].map((s) => (
                      <SprintCardWithTasks
                        key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onStart={handleStart} onComplete={handleComplete} onArchive={handleArchive}
                      />
                    ))}
                  </div>
                </section>
              )}

              {suspendedSprints.length > 0 && !interviewSprint && (
                <section className="animate-in fade-in slide-in-from-bottom-1 duration-500 delay-75">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-3">Suspended</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {suspendedSprints.map((s) => (
                      <SprintCardWithTasks
                        key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onStart={handleStart} onArchive={handleArchive}
                      />
                    ))}
                  </div>
                </section>
              )}

              {plannedSprints.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-1 duration-500 delay-75">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Planned</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {plannedSprints.map((s) => (
                      <SprintCardWithTasks
                        key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onStart={handleStart} onComplete={handleComplete} onArchive={handleArchive}
                      />
                    ))}
                  </div>
                </section>
              )}

            {sprints.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-lg border border-dashed border-border/80 bg-card/60 px-4 py-20 text-center shadow-sm">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg border border-success/10 bg-gradient-to-br from-success/20 to-info/20">
                  <KanbanIcon className="size-6 text-success/60" />
                </div>
                <p className="text-sm text-muted-foreground/80">No sprints yet</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Plan your interview preparation in focused timeboxes</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="mt-6 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"
                >
                  <Plus className="size-3 mr-1" />
                  Create Sprint
                </Button>
              </div>
            )}

            {sprints.length > 0 && !hasInterviewSprint && (
              <div className="rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/[0.02] px-4 py-8 text-center shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-cyan-500/10 bg-cyan-500/5">
                  <Briefcase className="size-5 text-cyan-500/60" />
                </div>
                <p className="text-sm text-foreground/80">Have an upcoming interview?</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Create an Interview Sprint to receive a focused preparation plan</p>
                <Button
                  onClick={() => { setDialogOpen(true); }}
                  className="mt-5 h-8 text-xs bg-cyan-600 text-white hover:bg-cyan-500 cursor-pointer rounded-md"
                >
                  <Plus className="size-3 mr-1" />
                  Create Interview Sprint
                </Button>
              </div>
            )}

            {completedSprints.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-1 duration-500 delay-100">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Completed</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {completedSprints.slice(0, 6).map((s) => (
                    <SprintCardWithTasks
                      key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                      onClick={setSelectedSprintId}
                      onArchive={handleArchive}
                    />
                  ))}
                </div>
              </section>
            )}
            </>)}

            {filterTab === "archived" && (
              <section className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Archive className="size-3.5" />
                    Archived
                  </h2>
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums">{archivedSprints.length}</span>
                </div>
                {archivedSprints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 bg-card/60 px-4 py-12 text-center shadow-sm">
                    <Archive className="mx-auto size-6 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground/80">No archived sprints</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Completed sprints can be archived for clean-up</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {archivedSprints.map((s) => (
                      <SprintCardWithTasks
                        key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onRestore={handleRestore}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {filterTab === "active" && (
              <section className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-success mb-3">Active Sprint</h2>
                {activeSprint ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SprintCardWithTasks
                      sprint={activeSprint} uid={auth.user?.uid} sprints={sprints}
                      onClick={setSelectedSprintId}
                      onComplete={handleComplete}
                      onArchive={handleArchive}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-card/60 px-4 py-12 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground/80">No active sprint</p>
                  </div>
                )}
              </section>
            )}

            {filterTab === "completed" && (
              <section className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Completed</h2>
                {completedSprints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 bg-card/60 px-4 py-12 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground/80">No completed sprints</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {completedSprints.map((s) => (
                      <SprintCardWithTasks
                        key={s.id} sprint={s} uid={auth.user?.uid} sprints={sprints}
                        onClick={setSelectedSprintId}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </div>

      <SprintDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(data) => addSprint(data)}
      />

      <SprintRetroDialog
        open={retroOpen}
        onOpenChange={setRetroOpen}
        onSave={handleSaveRetro}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Sprint Permanently"
        message="This will permanently delete this sprint and all its tasks. This action cannot be undone."
        confirmLabel="Delete Forever"
        variant="destructive"
      />

      <InterviewCompleteDialog
        open={interviewCompleteOpen}
        company={sprints.find((s) => s.id === completingInterviewId)?.company}
        role={sprints.find((s) => s.id === completingInterviewId)?.role}
        suspendedSprintName={(() => {
          const interview = sprints.find((s) => s.id === completingInterviewId);
          if (!interview?.pausedSprintId) return undefined;
          return sprints.find((s) => s.id === interview.pausedSprintId)?.name;
        })()}
        onResumePrevious={handleInterviewResumePrevious}
        onResumeTomorrow={handleInterviewResumeTomorrow}
        onArchive={handleInterviewArchive}
      />
    </AppShell>
  );
};

const SprintCardWithTasks = ({
  sprint, uid, sprints, ...actions
}: {
  sprint: Sprint;
  uid?: string | null;
  sprints: Sprint[];
  onClick?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}) => {
  const { tasks } = useSprintTasks(uid, sprint.id);
  const suspendedBy = useMemo(() => {
    if (!sprint.pausedSprintId) return null;
    const interview = sprints.find((s) => s.pausedSprintId === sprint.id && s.status === "active");
    if (!interview) return null;
    return { name: interview.name, company: interview.company };
  }, [sprint.pausedSprintId, sprint.id, sprints]);
  return <SprintCard sprint={sprint} tasks={tasks} suspendedBy={suspendedBy} {...actions} />;
};

const RetroView = ({ retro }: { retro: SprintRetro }) => {
  return (
    <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-4">
        <Sparkles className="size-3.5 text-warning" />
        Sprint Retrospective
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-lg border border-success/20 bg-success/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-success font-medium mb-1">
              <TrendingUp className="size-3" /> What went well
            </div>
            <p className="text-sm text-foreground">{retro.wentWell || "Not specified"}</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mb-1">
              <TrendingDown className="size-3" /> What went wrong
            </div>
            <p className="text-sm text-foreground">{retro.wentWrong || "Not specified"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
              <Lightbulb className="size-3" /> Weaknesses
            </div>
            {retro.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {retro.weaknesses.map((w) => (
                  <span key={w} className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None identified</p>
            )}
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <Star className="size-3 text-warning" /> Rating
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`text-lg ${n <= retro.rating ? "text-warning" : "text-secondary"}`}>★</span>
              ))}
              <span className="text-xs text-muted-foreground ml-2">{retro.rating}/5</span>
            </div>
          </div>
          {retro.actionItems && (
            <div className="rounded-lg border border-info/20 bg-info/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-info font-medium mb-1">
                <Target className="size-3" /> Action Items
              </div>
              <p className="text-sm text-foreground">{retro.actionItems}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SprintDetailView = ({
  sprint, uid, allSprints, onBack, onNavigateToSprint, onStart, onComplete, onArchive, onAddTask, addTaskOpen, onAddTaskOpenChange,
}: {
  sprint: Sprint & { capacityHours?: number };
  uid?: string | null;
  allSprints: Sprint[];
  onBack: () => void;
  onNavigateToSprint?: (id: string) => void;
  onStart: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onAddTask: () => void;
  addTaskOpen: boolean;
  onAddTaskOpenChange: (open: boolean) => void;
}) => {
  const { addTask, updateTaskStatus, updateTask, removeTask, backlogTasks, todoTasks, inProgressTasks, reviewTasks, doneTasks, tasks, taskStats } = useSprintTasks(uid, sprint.id);
  const { tracks } = useTracks(uid);
  const [editingTask, setEditingTask] = useState<SprintTaskV2 | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const suspendedSprint = useMemo(() => {
    if (!sprint.pausedSprintId) return null;
    return allSprints.find((s) => s.id === sprint.pausedSprintId) ?? null;
  }, [sprint.pausedSprintId, allSprints]);

  const isSuspended = useMemo(() => {
    return allSprints.some((s) => s.pausedSprintId === sprint.id && s.status === "active");
  }, [sprint, allSprints]);

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow={
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-3" />
            Sprints
          </button>
        }
        title={sprint.name}
        description={sprint.goal || "No goal set"}
        actions={
          <div className="flex items-center gap-1.5">
            {sprint.status === "planned" && !sprint.pausedSprintId && (
              <Button onClick={onStart} className="h-7 text-xs bg-success/15 text-success hover:bg-success/25 cursor-pointer rounded-md">
                <Play className="size-3 mr-1" />
                Start
              </Button>
            )}
            {sprint.status === "active" && (
              <Button onClick={onComplete} className="h-7 text-xs bg-info/15 text-info hover:bg-info/25 cursor-pointer rounded-md">
                <CheckCircle2 className="size-3 mr-1" />
                Complete
              </Button>
            )}
              <Button onClick={onArchive} variant="outline" aria-label="Archive sprint" className="h-7 text-xs text-muted-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                <Archive className="size-3 mr-1" />
              </Button>
            <button type="button" onClick={onBack} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <X className="size-3.5" />
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
        <SprintDashboardHeader
          name={sprint.name}
          goal={sprint.goal}
          startDate={sprint.startDate}
          endDate={sprint.endDate}
          tasks={tasks}
          capacityHours={sprint.capacityHours}
          type={sprint.type}
          company={sprint.company}
          role={sprint.role}
          interviewDate={sprint.interviewDate}
          targetLevel={sprint.targetLevel}
          suspendedSprintName={suspendedSprint?.name}
          suspendedSprintId={suspendedSprint?.id}
          onViewSprint={sprint.type === "interview" ? (id) => { if (id !== "__current__" && onNavigateToSprint) onNavigateToSprint(id); } : undefined}
        />

        {(sprint.status === "active" || sprint.status === "completed" || isSuspended) && (
          <SprintTimeline
            currentSprintName={sprint.name}
            currentSprintType={sprint.type}
            company={sprint.company}
            role={sprint.role}
            suspendedSprintName={suspendedSprint?.name}
            status={sprint.status}
          />
        )}

        <SprintBoard
          backlogTasks={backlogTasks}
          todoTasks={todoTasks}
          inProgressTasks={inProgressTasks}
          reviewTasks={reviewTasks}
          doneTasks={doneTasks}
          taskStats={taskStats}
          onUpdateStatus={updateTaskStatus}
          onRemoveTask={removeTask}
          onAddTask={onAddTask}
          onEditTask={(task) => { setEditingTask(task); setDetailOpen(true); }}
          readOnly={sprint.status === "completed"}
        />

        {(sprint.status === "active" || sprint.status === "completed") && (
          <SprintAnalytics tasks={tasks} />
        )}

        {sprint.status === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium">
                Sprint Retrospective
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            {sprint.retro ? (
              <RetroView retro={sprint.retro} />
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 bg-card/60 px-4 py-8 text-center shadow-sm">
                <p className="text-xs text-muted-foreground">No retrospective recorded for this sprint.</p>
              </div>
            )}
          </div>
        )}

        <AddTaskToSprintDialog
          open={addTaskOpen}
          onOpenChange={onAddTaskOpenChange}
          onAdd={addTask}
          uid={uid}
        />

        <TaskDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          task={editingTask}
          onSave={updateTask}
          tracks={tracks}
        />
      </div>
    </AppShell>
  );
};

export default SprintsPage;

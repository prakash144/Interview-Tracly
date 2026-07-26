"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, ChevronLeft, Settings2, BookOpen, Search, RotateCcw, ArrowUpDown, ChevronDown, Archive, Heart, Sparkles, Target, CheckCircle2, Clock3, BookMarked, MessageSquareText, Timer } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import TrackCard from "@/app/components/tracks/TrackCard";
import ResourceCard from "@/app/components/tracks/ResourceCard";
import ResourceDialog from "@/app/components/tracks/ResourceDialog";
import ManageTracksDialog from "@/app/components/tracks/ManageTracksDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { TracksSkeleton } from "@/components/states/PageSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useTracks } from "@/hooks/useTracks";
import { useResources } from "@/hooks/useResources";
import { useResourceProgress } from "@/hooks/useResourceProgress";
import * as resourceService from "@/services/firebase/resourceService";
import type { DifficultyLevel, ResourceStatus, ResourceLink, KnowledgeResource } from "@/lib/knowledgeBase";
import { COMPANIES, STATUS_LABELS } from "@/lib/knowledgeBase";
import { CheatSheetView } from "@/app/components/tracks/CheatSheetView";
import { BehavioralView } from "@/app/components/tracks/BehavioralView";
import SystemDesignView from "@/app/components/tracks/SystemDesignView";
import MockTestView from "@/app/components/tracks/MockTestView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortField = "askedAt" | "createdAt" | "title" | "company";
type SortDir = "asc" | "desc";

const TrackDetailView = ({
  trackId,
  tracks,
  onBack,
}: {
  trackId: string;
  tracks: { id: string; name: string; icon: string; color: string; description: string }[];
  onBack: () => void;
}) => {
  const auth = useAuth();
  const track = tracks.find((t) => t.id === trackId);
  const { resources, addResource, updateResource, deleteResource } = useResources(auth.user?.uid, trackId);
  const { progressMap, setStatus, toggleRevision, toggleFavorite, savePersonalNotes } = useResourceProgress(auth.user?.uid);

  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"" | DifficultyLevel>("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ResourceStatus>("");
  const [showRevisionOnly, setShowRevisionOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("askedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const PAGE_SIZE = 20;
  const [resourcePage, setResourcePage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deletingResource = deleteTarget ? resources.find((r) => r.id === deleteTarget) ?? null : null;

  const handleAdd = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };

  const handleEdit = (resource: KnowledgeResource) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleSave = (data: {
    title: string; company: string; difficulty: DifficultyLevel;
    tags: string[]; resourceLinks: ResourceLink[]; askedAt: string; notes: string;
  }) => {
    if (editingResource) {
      updateResource(editingResource.id, data);
    } else {
      addResource({ ...data, track: trackId });
    }
  };

  const handleDeleteRequest = (resourceId: string) => {
    setDeleteTarget(resourceId);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteResource(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const filteredResources = useMemo(() => {
    let result = [...resources];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q) || r.company.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (difficultyFilter) result = result.filter((r) => r.difficulty === difficultyFilter);
    if (companyFilter) result = result.filter((r) => r.company === companyFilter);
    if (showRevisionOnly) result = result.filter((r) => progressMap[r.id]?.inRevisionList);
    if (statusFilter) result = result.filter((r) => (progressMap[r.id]?.status ?? "not-started") === statusFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "askedAt") cmp = (a.askedAt || "").localeCompare(b.askedAt || "");
      else if (sortField === "createdAt") cmp = a.createdAt - b.createdAt;
      else if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "company") cmp = a.company.localeCompare(b.company);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [resources, searchTerm, difficultyFilter, companyFilter, statusFilter, showRevisionOnly, sortField, sortDir, progressMap]);

  const hasActiveFilters = Boolean(searchTerm || difficultyFilter || companyFilter || statusFilter || showRevisionOnly);

  const paginatedResources = useMemo(() => {
    return filteredResources.slice(resourcePage * PAGE_SIZE, (resourcePage + 1) * PAGE_SIZE);
  }, [filteredResources, resourcePage]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));

  useEffect(() => {
    setResourcePage(0);
  }, [searchTerm, difficultyFilter, companyFilter, statusFilter, showRevisionOnly, sortField, sortDir]);

  const resetFilters = () => { setSearchTerm(""); setDifficultyFilter(""); setCompanyFilter(""); setStatusFilter(""); setShowRevisionOnly(false); setResourcePage(0); };
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => r.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [resources]);

  const completedCount = useMemo(
    () => resources.filter((r) => progressMap[r.id]?.status === "completed").length,
    [resources, progressMap]
  );

  const revisionCount = useMemo(
    () => resources.filter((r) => progressMap[r.id]?.inRevisionList).length,
    [resources, progressMap]
  );

  const companiesUsed = useMemo(() => {
    const set = new Set(resources.map((r) => r.company));
    return COMPANIES.filter((c) => set.has(c));
  }, [resources]);

  if (!track) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Track not found.</p>
        <Button onClick={onBack} className="mt-4 h-8 text-xs cursor-pointer rounded-md">Go Back</Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-3" />
            All Tracks
          </button>
        }
        title={`${track.icon} ${track.name}`}
        description={track.description}
        actions={
          <Button onClick={handleAdd} className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md">
            <Plus className="size-3.5 mr-1" />
            Add Resource
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 pl-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">{companyFilter || "Company"} <ChevronDown size={14} className="ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground max-h-60 overflow-y-auto">
              <DropdownMenuItem className="hover:bg-accent cursor-pointer text-xs" onClick={() => setCompanyFilter("")}>{!companyFilter && <span className="mr-2">✅</span>}All</DropdownMenuItem>
              {companiesUsed.map((c) => (
                <DropdownMenuItem key={c} className={`hover:bg-accent cursor-pointer text-xs ${companyFilter === c ? "bg-secondary font-semibold text-success" : ""}`} onClick={() => setCompanyFilter(companyFilter === c ? "" : c)}>
                  {companyFilter === c && <span className="mr-2">✅</span>}{c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">{difficultyFilter || "Difficulty"} <ChevronDown size={14} className="ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              {["", "Easy", "Medium", "Hard"].map((d) => (
                <DropdownMenuItem key={d || "all"} className={`hover:bg-accent cursor-pointer text-xs ${difficultyFilter === d ? "bg-secondary font-semibold text-success" : ""}`} onClick={() => setDifficultyFilter(d as "" | DifficultyLevel)}>
                  {difficultyFilter === d && <span className="mr-2">✅</span>}{d || "All"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">{statusFilter ? STATUS_LABELS[statusFilter] : "Status"} <ChevronDown size={14} className="ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              <DropdownMenuItem className="hover:bg-accent cursor-pointer text-xs" onClick={() => setStatusFilter("")}>{!statusFilter && <span className="mr-2">✅</span>}All</DropdownMenuItem>
              {(["not-started", "in-progress", "completed"] as ResourceStatus[]).map((s) => (
                <DropdownMenuItem key={s} className={`hover:bg-accent cursor-pointer text-xs ${statusFilter === s ? "bg-secondary font-semibold text-success" : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>
                  {statusFilter === s && <span className="mr-2">✅</span>}{STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => setShowRevisionOnly(!showRevisionOnly)} className={`h-8 text-xs cursor-pointer rounded-md ${showRevisionOnly ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "text-foreground border-border bg-secondary hover:bg-accent"}`}>
            <RotateCcw className="size-3 mr-1" /> Revision
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                <ArrowUpDown className="size-3 mr-1" />{sortField === "askedAt" ? "Date Asked" : sortField === "createdAt" ? "Added" : sortField === "title" ? "Title" : "Company"}{sortDir === "asc" ? " ↑" : " ↓"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              {[{ field: "askedAt" as SortField, label: "Date Asked" }, { field: "createdAt" as SortField, label: "Date Added" }, { field: "title" as SortField, label: "Title" }, { field: "company" as SortField, label: "Company" }].map(({ field, label }) => (
                <DropdownMenuItem key={field} className={`hover:bg-accent cursor-pointer text-xs ${sortField === field ? "bg-secondary font-semibold text-success" : ""}`} onClick={() => toggleSort(field)}>
                  {sortField === field && <span className="mr-2">{sortDir === "asc" ? "↑" : "↓"}</span>}{label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters} className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">Clear</Button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4 text-[11px] text-muted-foreground/60">
          <span>{filteredResources.length} of {resources.length} questions</span>
          {resources.length > 0 && (
            <>
              <span className="w-px h-3 bg-border" />
              <span>{completedCount} completed</span>
              <span className="w-px h-3 bg-border" />
              <span>{revisionCount} in revision</span>
              <span className="w-px h-3 bg-border" />
              <span>{Object.keys(tagCounts).length} unique tags</span>
            </>
          )}
        </div>

        <div className="mt-1">
          {filteredResources.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {paginatedResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} progress={progressMap[resource.id]} progressEnabled={Boolean(auth.user)} onRequireAuth={auth.login} onStatusChange={setStatus} onToggleFavorite={toggleFavorite} onToggleRevision={toggleRevision} onSaveNotes={savePersonalNotes} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                ))}
              </div>
              {filteredResources.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-muted-foreground">
                    Showing {resourcePage * PAGE_SIZE + 1}–{Math.min((resourcePage + 1) * PAGE_SIZE, filteredResources.length)} of {filteredResources.length}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={resourcePage === 0} onClick={() => setResourcePage((p) => Math.max(0, p - 1))}>Previous</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={resourcePage >= totalPages - 1} onClick={() => setResourcePage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/70 px-4 py-16 text-center">
              <BookOpen className="mx-auto size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{hasActiveFilters ? "No questions match the current filters." : "No questions yet. Add your first question!"}</p>
              {!hasActiveFilters && <Button onClick={handleAdd} className="mt-4 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"><Plus className="size-3 mr-1" />Add Resource</Button>}
            </div>
          )}
        </div>
      </div>

      <ResourceDialog open={dialogOpen} onOpenChange={setDialogOpen} initialData={editingResource ? { id: editingResource.id, title: editingResource.title, company: editingResource.company, difficulty: editingResource.difficulty, tags: editingResource.tags, resourceLinks: editingResource.resourceLinks, askedAt: editingResource.askedAt, notes: editingResource.notes } : undefined} onSave={handleSave} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deletingResource ? `Delete "${deletingResource.title}"` : "Delete Resource"}
        message="Are you sure you want to permanently delete this resource? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </>
  );
};

const TracksPage = () => {
  const auth = useAuth();
  const { tracks, loading: tracksLoading, error: tracksError, addTrack, updateTrack, deleteTrack, archiveTrack, mergeTracks } = useTracks(auth.user?.uid);
  const { resources, loading: resourcesLoading, error: resourcesError } = useResources(auth.user?.uid);
  const { progressMap, setStatus, toggleRevision, toggleFavorite, savePersonalNotes } = useResourceProgress(auth.user?.uid);
  const loading = tracksLoading || resourcesLoading;
  const hasError = tracksError || resourcesError;
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeSpecialView, setActiveSpecialView] = useState<"cheatsheets" | "behavioral" | "systemdesign" | "mocktest" | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const favoriteResources = useMemo(
    () => resources.filter((r) => progressMap[r.id]?.favorited),
    [resources, progressMap]
  );
  const [manageOpen, setManageOpen] = useState(false);

  const trackResourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tracks) {
      counts[t.id] = resources.filter((r) => r.track === t.id).length;
    }
    return counts;
  }, [tracks, resources]);

  const handleDeleteTrack = useCallback(
    async (trackId: string, cascade?: boolean) => {
      if (cascade && auth.user?.uid) {
        await resourceService.deleteResourcesByTrack(auth.user.uid, trackId).catch(() => {});
      }
      deleteTrack(trackId);
    },
    [auth.user?.uid, deleteTrack]
  );

  const visibleTracks = useMemo(
    () => tracks.filter((t) => showArchived || !t.archived),
    [tracks, showArchived]
  );

  const trackStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; inRevision: number }> = {};
    for (const track of tracks) {
      const trackResources = resources.filter((r) => r.track === track.id);
      const total = trackResources.length;
      const completed = trackResources.filter((r) => progressMap[r.id]?.status === "completed").length;
      const inRevision = trackResources.filter((r) => progressMap[r.id]?.inRevisionList).length;
      stats[track.id] = { total, completed, inRevision };
    }
    return stats;
  }, [tracks, resources, progressMap]);

  const overviewStats = useMemo(() => {
    const completed = resources.filter((r) => progressMap[r.id]?.status === "completed").length;
    const inProgress = resources.filter((r) => progressMap[r.id]?.status === "in-progress").length;
    const inRevision = resources.filter((r) => progressMap[r.id]?.inRevisionList).length;
    const activeTracks = tracks.filter((t) => !t.archived).length;
    const completionRate = resources.length > 0 ? Math.round((completed / resources.length) * 100) : 0;
    return { completed, inProgress, inRevision, activeTracks, completionRate };
  }, [tracks, resources, progressMap]);

  const archivedCount = tracks.filter((t) => t.archived).length;

  if (activeSpecialView === "cheatsheets") {
    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CheatSheetView onBack={() => setActiveSpecialView(null)} />
        </div>
      </AppShell>
    );
  }

  if (activeSpecialView === "behavioral") {
    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <BehavioralView onBack={() => setActiveSpecialView(null)} />
        </div>
      </AppShell>
    );
  }

  if (activeSpecialView === "systemdesign") {
    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <SystemDesignView />
          <div className="mt-4">
            <button onClick={() => setActiveSpecialView(null)} className="text-xs text-muted-foreground hover:text-foreground">&larr; Back to Tracks</button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (activeSpecialView === "mocktest") {
    return (
      <AppShell footer={<Footer />}>
        <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <MockTestView onBack={() => setActiveSpecialView(null)} />
        </div>
      </AppShell>
    );
  }

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  if (selectedTrack) {
    return (
      <AppShell footer={<Footer />}>
        <TrackDetailView trackId={selectedTrack.id} tracks={tracks} onBack={() => setSelectedTrackId(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Smart learning tracks
          </span>
        }
        title="Tracks Command Center"
        description="Plan focused learning paths, keep favorite resources close, and move from discovery to mastery without losing context."
        actions={
          <div className="flex items-center gap-2">
            {archivedCount > 0 && (
              <Button
                onClick={() => setShowArchived(!showArchived)}
                variant="outline"
                className={`h-8 rounded-md text-xs cursor-pointer ${showArchived ? "bg-muted text-foreground border-foreground/20" : "border-border/70 bg-background/75 hover:bg-accent text-muted-foreground"}`}
              >
                <Archive className="size-3 mr-1" />
                {showArchived ? "Hide Archived" : `${archivedCount} Archived`}
              </Button>
            )}
            <Button
              onClick={() => setManageOpen(true)}
              variant="outline"
              className="h-8 rounded-md border-border/70 bg-background/75 text-xs hover:bg-accent cursor-pointer"
            >
              <Settings2 className="size-3 mr-1" />
              Manage
            </Button>
            {auth.user && (
              <Button
                onClick={() => setManageOpen(true)}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"
              >
                <Plus className="size-3 mr-1" />
                Add Track
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {loading && <TracksSkeleton />}

        {hasError && !loading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center mb-5">
            <p className="text-sm text-destructive">Failed to load tracks. Please try again.</p>
          </div>
        )}

        {!hasError && !loading && (<>
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active tracks", value: overviewStats.activeTracks, icon: Target, tone: "text-info bg-info/10 border-info/20" },
            { label: "Resources", value: resources.length, icon: BookOpen, tone: "text-success bg-success/10 border-success/20" },
            { label: "Completed", value: `${overviewStats.completionRate}%`, icon: CheckCircle2, tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            { label: "In review", value: overviewStats.inRevision, icon: Clock3, tone: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                </div>
                <div className={`flex size-10 items-center justify-center rounded-md border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${item.tone}`}>
                  <item.icon className="size-4" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {favoriteResources.length > 0 && (
          <section className="mb-7 overflow-hidden rounded-lg border border-rose-500/20 bg-card/90 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-gradient-to-r from-rose-500/10 via-card/60 to-amber-500/10 px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-md border border-rose-500/20 bg-rose-500/15">
                <Heart className="size-3 text-rose-400 fill-rose-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Favorites inside Tracks</h2>
                <p className="text-xs text-muted-foreground">Pinned questions from every track, ready for quick revision.</p>
              </div>
              <span className="ml-auto rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{favoriteResources.length} saved</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteResources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  progress={progressMap[r.id]}
                  progressEnabled={Boolean(auth.user)}
                  onRequireAuth={auth.login}
                  onStatusChange={setStatus}
                  onToggleFavorite={(id) => toggleFavorite(id)}
                  onToggleRevision={(id) => toggleRevision(id)}
                  onSaveNotes={(id, notes) => savePersonalNotes(id, notes)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Learning paths</h2>
            <p className="text-xs text-muted-foreground">Open a track to manage questions, links, notes, status, revision, and favorites.</p>
          </div>
          {overviewStats.inProgress > 0 && (
            <span className="hidden rounded-full border border-info/20 bg-info/10 px-3 py-1 text-xs font-medium text-info sm:inline-flex">
              {overviewStats.inProgress} in progress
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTracks.map((track) => {
            const stats = trackStats[track.id] ?? { total: 0, completed: 0, inRevision: 0 };
            return (
              <TrackCard
                key={track.id}
                track={track}
                total={stats.total}
                completed={stats.completed}
                inRevision={stats.inRevision}
                onClick={() => setSelectedTrackId(track.id)}
                onArchive={auth.user ? (archived) => archiveTrack(track.id, archived) : undefined}
              />
            );
          })}

          {/* Special: Cheat Sheets */}
          <button onClick={() => setActiveSpecialView("cheatsheets")}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:scale-[0.98]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),transparent_50%)]" />
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 mb-3">
                <BookMarked className="size-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Cheat Sheets</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Company-specific quick-reference notes for interview prep
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronLeft className="size-3 rotate-180" />
              </span>
            </div>
          </button>

          {/* Special: Behavioral STAR */}
          <button onClick={() => setActiveSpecialView("behavioral")}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:scale-[0.98]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(236,72,153,0.08),transparent_50%)]" />
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 mb-3">
                <MessageSquareText className="size-5 text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Behavioral STAR</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Situation, Task, Action, Result — bank of behavioral answers
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronLeft className="size-3 rotate-180" />
              </span>
            </div>
          </button>

          {/* Special: System Design */}
          <button onClick={() => setActiveSpecialView("systemdesign")}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:scale-[0.98]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),transparent_50%)]" />
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 mb-3">
                <svg className="size-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 7.5v9.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">System Design</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Architecture deep-dives, data models, and design deep-dive notes
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronLeft className="size-3 rotate-180" />
              </span>
            </div>
          </button>

          {/* Special: Mock Test */}
          <button onClick={() => setActiveSpecialView("mocktest")}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/90 p-5 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:scale-[0.98]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),transparent_50%)]" />
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 mb-3">
                <Timer className="size-5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Mock Test</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Timed technical interviews with configurable difficulty and topics
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronLeft className="size-3 rotate-180" />
              </span>
            </div>
          </button>
        </div>

        {visibleTracks.length === 0 && !loading && showArchived && (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-card/60 px-4 py-16 text-center shadow-sm">
            <BookOpen className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No archived tracks</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Tracks you archive will appear here</p>
          </div>
        )}
        </>)}
      </div>

      <ManageTracksDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        tracks={tracks}
        onAdd={addTrack}
        onUpdate={updateTrack}
        onDelete={handleDeleteTrack}
        onMerge={mergeTracks}
        trackResourceCounts={trackResourceCounts}
      />
    </AppShell>
  );
};

export default TracksPage;

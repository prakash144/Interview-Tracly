"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Plus, RotateCcw, ChevronDown, Search, ArrowUpDown, FolderKanban, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ResourceCard from "./ResourceCard";
import ResourceDialog from "./ResourceDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { getTrack } from "@/lib/interviewTracks";
import type { TrackId } from "@/lib/interviewTracks";
import type { DifficultyLevel, ResourceLink, ResourceStatus, KnowledgeResource } from "@/lib/knowledgeBase";
import { COMPANIES, STATUS_LABELS } from "@/lib/knowledgeBase";
import { useAuth } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";
import { useResourceProgress } from "@/hooks/useResourceProgress";
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

const TrackDetailView = () => {
  const params = useParams();
  const trackId = params.trackId as string;
  const track = getTrack(trackId);
  const auth = useAuth();

  if (!track) notFound();

  const { resources, addResource, updateResource, deleteResource } = useResources(auth.user?.uid, trackId as TrackId);
  const { progressMap, setStatus, toggleRevision, savePersonalNotes } = useResourceProgress(auth.user?.uid);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"" | DifficultyLevel>("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ResourceStatus>("");
  const [showRevisionOnly, setShowRevisionOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("askedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const PAGE_SIZE = 20;
  const [resourcePage, setResourcePage] = useState(0);

  // Dialog state
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
    title: string;
    company: string;
    difficulty: DifficultyLevel;
    tags: string[];
    resourceLinks: ResourceLink[];
    askedAt: string;
    notes: string;
  }) => {
    if (editingResource) {
      updateResource(editingResource.id, data);
    } else {
      addResource({ ...data, track: trackId as TrackId });
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
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (difficultyFilter) {
      result = result.filter((r) => r.difficulty === difficultyFilter);
    }

    if (companyFilter) {
      result = result.filter((r) => r.company === companyFilter);
    }

    if (showRevisionOnly) {
      result = result.filter((r) => progressMap[r.id]?.inRevisionList);
    }

    if (statusFilter) {
      result = result.filter(
        (r) => (progressMap[r.id]?.status ?? "not-started") === statusFilter
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "askedAt") {
        cmp = (a.askedAt || "").localeCompare(b.askedAt || "");
      } else if (sortField === "createdAt") {
        cmp = a.createdAt - b.createdAt;
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === "company") {
        cmp = a.company.localeCompare(b.company);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [resources, searchTerm, difficultyFilter, companyFilter, statusFilter, showRevisionOnly, sortField, sortDir, progressMap]);

  const hasActiveFilters = Boolean(searchTerm || difficultyFilter || companyFilter || statusFilter || showRevisionOnly);

  const paginatedResources = useMemo(() => {
    return filteredResources.slice(resourcePage * PAGE_SIZE, (resourcePage + 1) * PAGE_SIZE);
  }, [filteredResources, resourcePage]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));

  const resetFilters = () => {
    setSearchTerm("");
    setDifficultyFilter("");
    setCompanyFilter("");
    setStatusFilter("");
    setShowRevisionOnly(false);
    setResourcePage(0);
  };

  useEffect(() => {
    setResourcePage(0);
  }, [searchTerm, difficultyFilter, companyFilter, statusFilter, showRevisionOnly, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
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

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow={`${track.icon} ${track.name}`}
        title={track.name}
        description={track.description}
        actions={
          <Button
            onClick={handleAdd}
            className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md"
          >
            <Plus className="size-3.5 mr-1" />
            Add Resource
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10">
        <Link
          href="/tracks"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-3.5" />
          All Tracks
        </Link>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Company filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                {companyFilter || "Company"} <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground max-h-60 overflow-y-auto">
              <DropdownMenuItem className="hover:bg-accent cursor-pointer text-xs" onClick={() => setCompanyFilter("")}>
                {!companyFilter && <span className="mr-2">✅</span>}All
              </DropdownMenuItem>
              {companiesUsed.map((c) => (
                <DropdownMenuItem
                  key={c}
                  className={`hover:bg-accent cursor-pointer text-xs ${companyFilter === c ? "bg-secondary font-semibold text-success" : ""}`}
                  onClick={() => setCompanyFilter(companyFilter === c ? "" : c)}
                >
                  {companyFilter === c && <span className="mr-2">✅</span>}{c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Difficulty filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                {difficultyFilter || "Difficulty"} <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              {["", "Easy", "Medium", "Hard"].map((d) => (
                <DropdownMenuItem
                  key={d || "all"}
                  className={`hover:bg-accent cursor-pointer text-xs ${difficultyFilter === d ? "bg-secondary font-semibold text-success" : ""}`}
                  onClick={() => setDifficultyFilter(d as "" | DifficultyLevel)}
                >
                  {difficultyFilter === d && <span className="mr-2">✅</span>}{d || "All"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                {statusFilter ? STATUS_LABELS[statusFilter] : "Status"} <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              <DropdownMenuItem className="hover:bg-accent cursor-pointer text-xs" onClick={() => setStatusFilter("")}>
                {!statusFilter && <span className="mr-2">✅</span>}All
              </DropdownMenuItem>
              {(["not-started", "in-progress", "completed"] as ResourceStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  className={`hover:bg-accent cursor-pointer text-xs ${statusFilter === s ? "bg-secondary font-semibold text-success" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                >
                  {statusFilter === s && <span className="mr-2">✅</span>}{STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Revision filter */}
          <Button
            variant="outline"
            onClick={() => setShowRevisionOnly(!showRevisionOnly)}
            className={`h-8 text-xs cursor-pointer rounded-md ${
              showRevisionOnly
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "text-foreground border-border bg-secondary hover:bg-accent"
            }`}
          >
            <RotateCcw className="size-3 mr-1" />
            Revision
          </Button>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
                <ArrowUpDown className="size-3 mr-1" />
                {sortField === "askedAt" ? "Date Asked" : sortField === "createdAt" ? "Added" : sortField === "title" ? "Title" : "Company"}
                {sortDir === "asc" ? " ↑" : " ↓"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground">
              {[
                { field: "askedAt" as SortField, label: "Date Asked" },
                { field: "createdAt" as SortField, label: "Date Added" },
                { field: "title" as SortField, label: "Title" },
                { field: "company" as SortField, label: "Company" },
              ].map(({ field, label }) => (
                <DropdownMenuItem
                  key={field}
                  className={`hover:bg-accent cursor-pointer text-xs ${sortField === field ? "bg-secondary font-semibold text-success" : ""}`}
                  onClick={() => toggleSort(field)}
                >
                  {sortField === field && <span className="mr-2">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters} className="h-8 text-xs text-foreground border-border bg-secondary hover:bg-accent cursor-pointer rounded-md">
              Clear
            </Button>
          )}
        </div>

        {/* Stats bar */}
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

        {/* Resource Grid */}
        <div className="mt-1">
          {filteredResources.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {paginatedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    progress={progressMap[resource.id]}
                    progressEnabled={Boolean(auth.user)}
                    onRequireAuth={auth.login}
                    onStatusChange={setStatus}
                    onToggleRevision={toggleRevision}
                    onSaveNotes={savePersonalNotes}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
              {filteredResources.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-muted-foreground">
                    Showing {resourcePage * PAGE_SIZE + 1}–{Math.min((resourcePage + 1) * PAGE_SIZE, filteredResources.length)} of{" "}
                    {filteredResources.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={resourcePage === 0}
                      onClick={() => setResourcePage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={resourcePage >= totalPages - 1}
                      onClick={() => setResourcePage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/70 px-4 py-16 text-center">
              <div className="flex justify-center mb-3">
                {trackId === "dsa" ? (
                  <BookOpen className="size-10 text-muted-foreground/30" />
                ) : (
                  <FolderKanban className="size-10 text-muted-foreground/30" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No questions match the current filters."
                  : "No questions yet. Add your first interview question!"}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Track interview questions by company, difficulty, and topic.
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleAdd} className="mt-4 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer rounded-md">
                  <Plus className="size-3 mr-1" />
                  Add Resource
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={
          editingResource
            ? {
                id: editingResource.id,
                title: editingResource.title,
                company: editingResource.company,
                difficulty: editingResource.difficulty,
                tags: editingResource.tags,
                resourceLinks: editingResource.resourceLinks,
                askedAt: editingResource.askedAt,
                notes: editingResource.notes,
              }
            : undefined
        }
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
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
    </AppShell>
  );
};

export default TrackDetailView;

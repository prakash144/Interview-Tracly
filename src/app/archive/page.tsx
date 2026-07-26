"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw, Trash2, Briefcase, BookOpen, Layers } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSprints } from "@/hooks/useSprints";
import { useTracks } from "@/hooks/useTracks";
import { useResources } from "@/hooks/useResources";
import type { Sprint } from "@/lib/sprints";
import type { Track } from "@/lib/tracks";
import type { KnowledgeResource } from "@/lib/knowledgeBase";
import { MOCK_TYPE_LABELS } from "@/lib/mockTest";

type ArchivedItemType = "all" | "sprints" | "tracks" | "resources";

interface ArchiveEntry {
  id: string;
  type: ArchivedItemType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  archivedAt: number;
  original: Sprint | Track | KnowledgeResource;
  href?: string;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export default function ArchivePage() {
  const auth = useAuth();
  const { sprints, loading: sprintsLoading, restoreSprint, deleteSprint } = useSprints(auth.user?.uid);
  const { tracks, loading: tracksLoading, archiveTrack: trackArchive, deleteTrack } = useTracks(auth.user?.uid);
  const { resources, loading: resourcesLoading, restoreResource, deleteResource } = useResources(auth.user?.uid);

  const ARCHIVE_PAGE_SIZE = 15;
  const [filterType, setFilterType] = useState<ArchivedItemType>("all");
  const [archivePage, setArchivePage] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<ArchivedItemType | null>(null);

  const isLoading = sprintsLoading || tracksLoading || resourcesLoading;

  const archivedSprints = useMemo(
    () => sprints.filter((s): s is Sprint & { archivedAt: number } => !!s.archivedAt),
    [sprints]
  );

  const archivedTracks = useMemo(
    () => tracks.filter((t): t is Track => !!t.archived),
    [tracks]
  );

  const archivedResources = useMemo(
    () => resources.filter((r): r is KnowledgeResource & { archivedAt: number } => !!r.archivedAt),
    [resources]
  );

  const entries = useMemo((): ArchiveEntry[] => {
    const result: ArchiveEntry[] = [];

    archivedSprints.forEach((s) => {
      result.push({
        id: s.id,
        type: "sprints",
        title: s.name,
        subtitle: `${s.type} sprint${s.company ? ` · ${s.company}` : ""}`,
        icon: <Briefcase className="size-4 text-cyan-500" />,
        archivedAt: s.archivedAt,
        original: s,
        href: "/sprints",
      });
    });

    archivedTracks.forEach((t) => {
      result.push({
        id: t.id,
        type: "tracks",
        title: t.name,
        subtitle: t.shortDescription,
        icon: <Layers className="size-4 text-purple-500" />,
        archivedAt: t.updatedAt,
        original: t,
        href: "/tracks",
      });
    });

    archivedResources.forEach((r) => {
      result.push({
        id: r.id,
        type: "resources",
        title: r.title,
        subtitle: `${r.company} · ${r.difficulty}${r.track ? ` · ${MOCK_TYPE_LABELS[r.track as keyof typeof MOCK_TYPE_LABELS] ?? r.track}` : ""}`,
        icon: <BookOpen className="size-4 text-amber-500" />,
        archivedAt: r.archivedAt,
        original: r,
      });
    });

    result.sort((a, b) => b.archivedAt - a.archivedAt);
    return result;
  }, [archivedSprints, archivedTracks, archivedResources]);

  const filtered = useMemo(
    () => (filterType === "all" ? entries : entries.filter((e) => e.type === filterType)),
    [entries, filterType]
  );

  useEffect(() => {
    setArchivePage(0);
  }, [filterType]);

  const paginated = useMemo(() => {
    return filtered.slice(archivePage * ARCHIVE_PAGE_SIZE, (archivePage + 1) * ARCHIVE_PAGE_SIZE);
  }, [filtered, archivePage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARCHIVE_PAGE_SIZE));

  const handleRestore = async (entry: ArchiveEntry) => {
    if (entry.type === "sprints") await restoreSprint(entry.id);
    else if (entry.type === "tracks") await trackArchive(entry.id, false);
    else if (entry.type === "resources") await restoreResource(entry.id);
  };

  const handleDelete = async (entry: ArchiveEntry) => {
    setConfirmId(entry.id);
    setConfirmType(entry.type);
  };

  const handleConfirmDelete = async () => {
    if (!confirmId || !confirmType) return;
    if (confirmType === "sprints") await deleteSprint(confirmId);
    else if (confirmType === "tracks") await deleteTrack(confirmId);
    else if (confirmType === "resources") await deleteResource(confirmId);
    setConfirmId(null);
    setConfirmType(null);
  };

  const counts = { all: entries.length, sprints: archivedSprints.length, tracks: archivedTracks.length, resources: archivedResources.length };

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Trash & Archive"
        title="Archive"
        description="View and manage all your archived items"
      />

      <div className="mx-auto max-w-4xl px-4 pb-10 space-y-6">
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground mt-3">Loading archive...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(["all", "sprints", "tracks", "resources"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    filterType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">({counts[type]})</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
                <Archive className="mx-auto size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No archived items</p>
                <p className="text-xs text-muted-foreground/50">
                  {filterType === "all"
                    ? "Archive sprints, tracks, or resources to see them here"
                    : `No archived ${filterType} found`}
                </p>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-border/50 rounded-xl border border-border bg-card">
                {paginated.map((entry) => (
                  <div key={`${entry.type}-${entry.id}`} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="size-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center shrink-0">
                      {entry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {entry.type === "sprints" ? "Sprint" : entry.type === "tracks" ? "Track" : "Resource"} · Archived {formatDate(entry.archivedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestore(entry)}
                        className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Restore"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filtered.length > ARCHIVE_PAGE_SIZE && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Showing {archivePage * ARCHIVE_PAGE_SIZE + 1}–{Math.min((archivePage + 1) * ARCHIVE_PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={archivePage === 0} onClick={() => setArchivePage((p) => Math.max(0, p - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={archivePage >= totalPages - 1} onClick={() => setArchivePage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Permanently"
        message={`This will permanently delete this ${confirmType === "sprints" ? "sprint (including all its tasks)" : confirmType === "tracks" ? "track" : "resource"}. This action cannot be undone.`}
        confirmLabel="Delete Forever"
        variant="destructive"
      />
    </AppShell>
  );
}

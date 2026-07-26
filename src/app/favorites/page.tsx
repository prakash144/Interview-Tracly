"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Heart, Plus, ArrowLeft } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ResourceCard from "@/app/components/tracks/ResourceCard";
import ResourceDialog from "@/app/components/tracks/ResourceDialog";
import { useAuth } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";
import { useResourceProgress } from "@/hooks/useResourceProgress";
import { useTracks } from "@/hooks/useTracks";
import { Button } from "@/components/ui/button";
import type { KnowledgeResource, DifficultyLevel, ResourceLink } from "@/lib/knowledgeBase";

export default function FavoritesPage() {
  const auth = useAuth();
  const { resources, addResource, updateResource, deleteResource, loading: resourcesLoading, error: resourcesError } = useResources(auth.user?.uid);
  const { progressMap, setStatus, toggleRevision, toggleFavorite, savePersonalNotes, loading: progressLoading } = useResourceProgress(auth.user?.uid);
  const { tracks, loading: tracksLoading } = useTracks(auth.user?.uid);
  const isLoading = resourcesLoading || progressLoading || tracksLoading;
  const hasError = resourcesError;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);
  const [addToTrack, setAddToTrack] = useState<string | null>(null);

  const trackIcons = useMemo(() => {
    const icons: Record<string, string> = {};
    for (const t of tracks) icons[t.id] = t.icon;
    return icons;
  }, [tracks]);

  const favorites = useMemo(
    () => resources.filter((r) => progressMap[r.id]?.favorited),
    [resources, progressMap]
  );

  const grouped = useMemo(() => {
    const g: Record<string, typeof favorites> = {};
    for (const r of favorites) {
      const key = r.track;
      if (!g[key]) g[key] = [];
      g[key].push(r);
    }
    return g;
  }, [favorites]);

  const handleAdd = (trackId: string) => {
    setAddToTrack(trackId);
    setEditingResource(null);
    setDialogOpen(true);
  };

  const handleEdit = (resource: KnowledgeResource) => {
    setAddToTrack(null);
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleDelete = (resourceId: string) => {
    deleteResource(resourceId);
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
    } else if (addToTrack) {
      addResource({ ...data, track: addToTrack });
    }
    setDialogOpen(false);
    setEditingResource(null);
    setAddToTrack(null);
  };

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow={
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3" />
            Dashboard
          </Link>
        }
        title="Favorites"
        description={`${favorites.length} favorited resources`}
      />

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/70 bg-card/90 p-4 h-32 animate-pulse" />
            ))}
          </div>
        )}

        {hasError && !isLoading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center">
            <p className="text-sm text-destructive">Failed to load favorites. Please try again.</p>
          </div>
        )}

        {!isLoading && !hasError && favorites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-16 text-center">
            <Heart className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No favorites yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Click the <Heart className="size-3 inline" /> icon on any resource to favorite it for quick access
            </p>
          </div>
        ) : !isLoading && !hasError && favorites.length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([trackId, items]) => (
              <div key={trackId}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{trackIcons[trackId] ?? "📌"}</span>
                  <h3 className="text-sm font-semibold text-foreground">
                    {tracks.find((t) => t.id === trackId)?.name ?? trackId}
                  </h3>
                  <span className="text-[10px] text-muted-foreground/60">{items.length}</span>
                  <div className="flex-1" />
                  {auth.user && (
                    <Button
                      onClick={() => handleAdd(trackId)}
                      variant="outline"
                      className="h-7 text-[10px] border-border bg-secondary hover:bg-accent cursor-pointer rounded-md"
                    >
                      <Plus className="size-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((r) => (
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
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingResource ? { id: editingResource.id, title: editingResource.title, company: editingResource.company, difficulty: editingResource.difficulty, tags: editingResource.tags, resourceLinks: editingResource.resourceLinks, askedAt: editingResource.askedAt, notes: editingResource.notes } : undefined}
        onSave={handleSave}
      />
    </AppShell>
  );
}

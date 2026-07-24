"use client";

import { memo, useState } from "react";
import { Calendar, Clock, EllipsisVertical, Eye, Heart, Link as LinkIcon, PencilLine, Star, Trash2 } from "lucide-react";
import type { KnowledgeResource, ResourceStatus, UserResourceProgress } from "@/lib/knowledgeBase";
import { STATUS_COLORS, STATUS_LABELS, LINK_TYPE_ICONS, LINK_LABELS } from "@/lib/knowledgeBase";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import CompanyBadge from "@/components/data-display/CompanyBadge";
import ResourceNotesDialog from "./ResourceNotesDialog";
import ContentViewerDialog from "./ContentViewerDialog";

interface ResourceCardProps {
  resource: KnowledgeResource;
  progress?: UserResourceProgress;
  progressEnabled?: boolean;
  onRequireAuth?: () => void;
  onStatusChange?: (resourceId: string, status: ResourceStatus) => void;
  onToggleRevision?: (resourceId: string) => void;
  onToggleFavorite?: (resourceId: string) => void;
  onSaveNotes?: (resourceId: string, notes: string) => void;
  onEdit?: (resource: KnowledgeResource) => void;
  onDelete?: (resourceId: string) => void;
}

const statusOptions: { value: ResourceStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const estimateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / 200));
};

const ResourceCard = ({
  resource,
  progress,
  progressEnabled = false,
  onRequireAuth,
  onStatusChange,
  onToggleRevision,
  onToggleFavorite,
  onSaveNotes,
  onEdit,
  onDelete,
}: ResourceCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const currentStatus = progress?.status ?? "not-started";
  const inRevision = Boolean(progress?.inRevisionList);
  const isFavorited = Boolean(progress?.favorited);
  const personalNotes = progress?.personalNotes ?? "";
  const readingTime = estimateReadingTime(resource.notes || resource.title);

  const hasLinks = resource.resourceLinks.length > 0;

  const handleStatusClick = () => {
    if (!progressEnabled) { onRequireAuth?.(); return; }
    const idx = statusOptions.findIndex((o) => o.value === currentStatus);
    const next = statusOptions[(idx + 1) % statusOptions.length].value;
    onStatusChange?.(resource.id, next);
  };

  const handleCopyLink = () => {
    const firstLink = resource.resourceLinks[0]?.url;
    if (firstLink) {
      navigator.clipboard.writeText(firstLink).catch(() => {});
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div className="group relative rounded-xl border border-border/70 bg-card/90 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
        {/* Actions Menu Button */}
        {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 180)}
              className="size-7 flex items-center justify-center rounded-lg bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Actions"
            >
              <EllipsisVertical className="size-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg py-1 z-20">
                <button
                  type="button"
                  onMouseDown={() => { setViewerOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                >
                  <Eye className="size-3.5" />
                  View
                </button>
                {onEdit && (
                  <button
                    type="button"
                    onMouseDown={() => { onEdit(resource); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <PencilLine className="size-3.5" />
                    Edit
                  </button>
                )}
                {hasLinks && (
                  <button
                    type="button"
                    onMouseDown={handleCopyLink}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <LinkIcon className="size-3.5" />
                    Copy Link
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="border-t border-border/50 my-1" />
                    <button
                      type="button"
                      onMouseDown={() => { onDelete(resource.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content — clickable to open viewer */}
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="w-full text-left p-4 pb-3"
        >
          <div className="flex items-start gap-3">
            <CompanyBadge company={resource.company} size="md" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-5 text-foreground truncate pr-6">
                {resource.title}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <DifficultyBadge difficulty={resource.difficulty} size="sm" />
                {resource.askedAt && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded-full">
                    <Calendar className="size-2.5" />
                    {resource.askedAt}
                  </span>
                )}
                {readingTime > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded-full">
                    <Clock className="size-2.5" />
                    {readingTime}m
                  </span>
                )}
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
                    {tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground/50">+{resource.tags.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Notes preview */}
        {resource.notes && (
          <div className="px-4 pb-2" onClick={() => setViewerOpen(true)}>
            <p className="rounded-md border-l-2 border-info/30 bg-secondary/35 py-1.5 pr-2 pl-2.5 text-[11px] leading-relaxed text-muted-foreground/75 line-clamp-2 cursor-pointer">
              {resource.notes}
            </p>
          </div>
        )}

        {/* Resource Links */}
        {hasLinks && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {resource.resourceLinks.slice(0, 2).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-secondary/80 hover:bg-accent text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                title={link.label}
              >
                <span>{LINK_TYPE_ICONS[link.type]}</span>
                <span>{link.label || LINK_LABELS[link.type]}</span>
              </a>
            ))}
            {resource.resourceLinks.length > 2 && (
              <span className="text-[10px] text-muted-foreground/50 self-center">+{resource.resourceLinks.length - 2}</span>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-1 border-t border-border/60 bg-secondary/35 px-4 py-2 rounded-b-xl">
          <button
            type="button"
            onClick={handleStatusClick}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${STATUS_COLORS[currentStatus]}`}
            title="Click to cycle status"
          >
            {STATUS_LABELS[currentStatus]}
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => { if (!progressEnabled) { onRequireAuth?.(); return; } onToggleFavorite?.(resource.id); }}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              isFavorited
                ? "bg-rose-500/20 text-rose-400"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`size-3 ${isFavorited ? "fill-rose-400" : ""}`} />
            {isFavorited ? "Favorited" : "Favorite"}
          </button>

          <button
            type="button"
            onClick={() => { if (!progressEnabled) { onRequireAuth?.(); return; } onToggleRevision?.(resource.id); }}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              inRevision
                ? "bg-amber-500/20 text-amber-400"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            title={inRevision ? "Remove from review list" : "Add to review list"}
          >
            <Star className={`size-3 ${inRevision ? "fill-amber-400" : ""}`} />
          </button>

          <ResourceNotesDialog
            resourceId={resource.id}
            resourceTitle={resource.title}
            notes={personalNotes}
            disabled={!progressEnabled}
            onRequireAuth={onRequireAuth}
            onSave={onSaveNotes ?? (() => {})}
          />
        </div>
      </div>

      {/* Content Viewer */}
      <ContentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        resource={resource}
        progress={progress}
        onEdit={onEdit}
        onToggleFavorite={progressEnabled ? onToggleFavorite : undefined}
      />
    </>
  );
};

export default memo(ResourceCard);

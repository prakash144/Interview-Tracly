"use client";

import { memo, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Clock, ExternalLink, Heart, PencilLine, Trash2, X,
} from "lucide-react";
import type { KnowledgeResource, UserResourceProgress } from "@/lib/knowledgeBase";
import { LINK_TYPE_ICONS, LINK_LABELS } from "@/lib/knowledgeBase";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import CompanyBadge from "@/components/data-display/CompanyBadge";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

interface ContentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: KnowledgeResource;
  progress?: UserResourceProgress;
  onEdit?: (resource: KnowledgeResource) => void;
  onDelete?: (resourceId: string) => void;
  onToggleFavorite?: (resourceId: string) => void;
}

const estimateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

const ContentViewerDialog = ({
  open,
  onOpenChange,
  resource,
  progress,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ContentViewerDialogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFavorited = Boolean(progress?.favorited);
  const readingTime = estimateReadingTime(resource.notes || resource.title);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo(0, 0);
  }, [open, resource.id]);

  const hasContent = resource.notes || resource.resourceLinks.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 max-h-[88vh] w-[calc(100vw-2rem)] max-w-3xl bg-card border border-border text-foreground rounded-2xl shadow-2xl -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col">
          {/* Sticky Header */}
          <div className="shrink-0 border-b border-border/60 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <CompanyBadge company={resource.company} size="md" />
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-lg font-semibold text-foreground leading-snug">
                    {resource.title}
                  </Dialog.Title>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <DifficultyBadge difficulty={resource.difficulty} />
                    {resource.askedAt && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">
                        {resource.askedAt}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">
                      <Clock className="size-3" />
                      {readingTime} min read
                    </span>
                  </div>
                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(resource.id)}
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`size-4 ${isFavorited ? "fill-rose-400 text-rose-400" : ""}`} />
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => { onOpenChange(false); onEdit(resource); }}
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Edit"
                  >
                    <PencilLine className="size-4" />
                  </button>
                )}
                {onDelete && !resource.id.startsWith("sample-") && (
                  <button
                    type="button"
                    onClick={() => { onOpenChange(false); onDelete(resource.id); }}
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
            {!hasContent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary mb-3">
                  <Clock className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No content yet for this resource.</p>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => { onOpenChange(false); onEdit(resource); }}
                    className="mt-3 text-xs text-info hover:text-info/80 underline underline-offset-2"
                  >
                    Add notes and links
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Notes / Key Points — rendered as markdown */}
                {resource.notes && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={resource.notes} />
                  </div>
                )}

                {/* Resource Links */}
                {resource.resourceLinks.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Resources & References
                    </h4>
                    <div className="space-y-2">
                      {resource.resourceLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border/50 bg-card/50 hover:bg-accent transition-colors group"
                        >
                          <span className="text-base shrink-0">{LINK_TYPE_ICONS[link.type]}</span>
                          <span className="flex-1 text-xs font-medium text-foreground truncate">
                            {link.label || LINK_LABELS[link.type]}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">{LINK_LABELS[link.type]}</span>
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border/60 px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground/60">
            <span>{readingTime} min read</span>
            <span>
              {resource.company} · {resource.difficulty}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default memo(ContentViewerDialog);

"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search, BookOpen, ListChecks, Kanban, Layers, BookMarked, Heart,
  LayoutDashboard, BarChart3, CalendarDays, Crosshair, Timer, Settings,
  Plus, FilePlus, Star, Sparkles, ArrowRight, Clock, ChevronRight,
  Loader2, Lightbulb, Archive, type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import { useResources } from "@/hooks/useResources";
import { useTracks } from "@/hooks/useTracks";
import { useSprints } from "@/hooks/useSprints";
import { useCustomLists } from "@/hooks/useCustomLists";
import { useProblemProgress } from "@/hooks/useProblemProgress";
import { fetchUnifiedProblems } from "@/app/services/fetchUnifiedProblems";
import { cn } from "@/lib/utils";
import {
  NAV_ITEMS, QUICK_ACTIONS, fuzzyMatch, saveRecentItem,
  loadRecentItems, type RecentItem, type CmdResult,
} from "@/lib/commandCenter";
import type { Problem } from "@/lib/progressTypes";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, ListChecks, Kanban, Layers, BarChart3,
  CalendarDays, Crosshair, Timer, BookMarked, Heart, Settings,
  BookOpen, Plus, FilePlus, Star, Sparkles, ArrowRight, Clock,
  Search, Lightbulb, Archive,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const LucidIcon = ICON_MAP[name];
  if (!LucidIcon) return <BookOpen className={className} />;
  return <LucidIcon className={className} />;
}

const PAGE_GROUP = "Pages";
const ACTION_GROUP = "Quick Actions";
const RESOURCE_GROUP = "Resources";
const PROBLEM_GROUP = "Problems";
const SPRINT_GROUP = "Sprints";
const COLLECTION_GROUP = "Collections";

interface CommandCenterProps {
  uid?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "empty" | "results" | "no-results" | "loading";

export default function CommandCenter({ uid, open, onOpenChange }: CommandCenterProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const { resources, loading: resourcesLoading } = useResources(uid ?? undefined);
  const { tracks } = useTracks(uid);
  const { sprints, loading: sprintsLoading } = useSprints(uid);
  const { lists, loading: listsLoading } = useCustomLists(uid);
  const { progressMap } = useProblemProgress(uid);

  const isLoading = resourcesLoading || sprintsLoading || listsLoading || problemsLoading;

  const trackNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const t of tracks) names[t.id] = t.name;
    return names;
  }, [tracks]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setRecentItems(loadRecentItems());
      setTimeout(() => inputRef.current?.focus(), 50);
      if (problems.length === 0) {
        setProblemsLoading(true);
        fetchUnifiedProblems()
          .then((data) => { setProblems(data); setProblemsLoading(false); })
          .catch(() => { setProblemsLoading(false); });
      }
    }
  }, [open, problems.length]);

  const navigate = useCallback((href: string) => {
    onOpenChange(false);
    router.push(href);
  }, [onOpenChange, router]);

  const trackName = useCallback((tid: string) => trackNames[tid] ?? tid, [trackNames]);

  const flatResults = useMemo((): CmdResult[] => {
    if (!query.trim()) return [];

    const q = query.trim();
    const results: CmdResult[] = [];

    const addIf = (condition: boolean, item: CmdResult) => {
      if (condition) results.push(item);
    };

    let idx = 0;

    for (const nav of NAV_ITEMS) {
      addIf(
        fuzzyMatch(nav.label, q) || nav.keywords.some((k) => fuzzyMatch(k, q)),
        {
          id: `nav-${nav.href}`,
          title: `Go to ${nav.label}`,
          subtitle: nav.href === "/" ? "Home" : nav.href.slice(1).replace(/\//g, " › "),
          icon: nav.icon,
          group: PAGE_GROUP,
          priority: idx++,
          onSelect: () => { saveRecentItem({ id: `nav-${nav.href}`, title: nav.label, icon: nav.icon, href: nav.href }); navigate(nav.href); },
        },
      );
    }

    for (const action of QUICK_ACTIONS) {
      addIf(
        fuzzyMatch(action.label, q) || action.keywords.some((k) => fuzzyMatch(k, q)),
        {
          id: action.id,
          title: action.label,
          subtitle: action.description,
          icon: action.icon,
          group: ACTION_GROUP,
          priority: idx++,
          onSelect: () => { onOpenChange(false); action.onSelect(); },
        },
      );
    }

    const showAll = q.length < 2;

    for (const spr of sprints) {
      addIf(
        fuzzyMatch(spr.name, q) || fuzzyMatch(spr.goal || "", q) || fuzzyMatch(spr.company || "", q),
        {
          id: `sprint-${spr.id}`,
          title: spr.name,
          subtitle: `${spr.status} · ${spr.type}${spr.company ? ` · ${spr.company}` : ""}`,
          icon: "Kanban",
          group: SPRINT_GROUP,
          priority: idx++,
          onSelect: () => { saveRecentItem({ id: `sprint-${spr.id}`, title: spr.name, subtitle: spr.type, icon: "Kanban" }); navigate(`/sprints`); },
        },
      );
    }

    for (const list of lists) {
      addIf(
        fuzzyMatch(list.name, q) || fuzzyMatch(list.description || "", q),
        {
          id: `col-${list.id}`,
          title: list.name,
          subtitle: `${list.problemIds?.length || 0} problems${list.description ? ` · ${list.description}` : ""}`,
          icon: "BookMarked",
          group: COLLECTION_GROUP,
          priority: idx++,
          onSelect: () => { saveRecentItem({ id: `col-${list.id}`, title: list.name, icon: "BookMarked" }); navigate(`/collections`); },
        },
      );
    }

    const matchedResources = showAll ? resources.slice(0, 8) : resources.filter(
      (r) => fuzzyMatch(r.title, q) || fuzzyMatch(r.company, q) || r.tags.some((t) => fuzzyMatch(t, q)),
    ).slice(0, 12);

    for (const r of matchedResources) {
      results.push({
        id: `res-${r.id}`,
        title: r.title,
        subtitle: `${trackName(r.track)}${r.company !== "General" ? ` · ${r.company}` : ""}`,
        icon: "BookOpen",
        group: RESOURCE_GROUP,
        priority: idx++,
        onSelect: () => { saveRecentItem({ id: `res-${r.id}`, title: r.title, subtitle: trackName(r.track), icon: "BookOpen" }); navigate(`/tracks/${r.track}`); },
      });
    }

    const matchedProblems = showAll ? problems.slice(0, 5) : problems.filter(
      (p) => fuzzyMatch(p.title, q) || fuzzyMatch(p.company, q) || p.topics.some((t) => fuzzyMatch(t, q)),
    ).slice(0, 8);

    for (const p of matchedProblems) {
      const prog = progressMap[p.problemId];
      results.push({
        id: `prob-${p.problemId}`,
        title: p.title,
        subtitle: `${p.company}${prog?.solved ? " · Solved" : prog?.attempted ? " · Attempted" : ""}`,
        icon: "ListChecks",
        group: PROBLEM_GROUP,
        priority: idx++,
        onSelect: () => { saveRecentItem({ id: `prob-${p.problemId}`, title: p.title, icon: "ListChecks" }); navigate(`/problems`); },
      });
    }

    return results;
  }, [query, resources, problems, progressMap, sprints, lists, trackName, navigate, onOpenChange]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: CmdResult[] }[] = [];
    const order = [PAGE_GROUP, ACTION_GROUP, RESOURCE_GROUP, PROBLEM_GROUP, SPRINT_GROUP, COLLECTION_GROUP];
    const map = new Map<string, CmdResult[]>();
    for (const r of flatResults) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    for (const key of order) {
      const items = map.get(key);
      if (items && items.length > 0) groups.push({ label: key, items });
    }
    return groups;
  }, [flatResults]);

  const phase: Phase = isLoading ? "loading" : query.trim() && flatResults.length === 0 ? "no-results" : query.trim() ? "results" : "empty";

  const totalItems = flatResults.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === "Enter" && flatResults[activeIndex]) {
      e.preventDefault();
      flatResults[activeIndex].onSelect();
    }
  }, [totalItems, activeIndex, flatResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current && totalItems > 0) {
      const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (active) active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, totalItems]);

  const renderItem = (item: CmdResult, index: number) => {
    const isActive = index === activeIndex;
    const isProblem = item.group === PROBLEM_GROUP;
    return (
      <button
        key={item.id}
        data-index={index}
        type="button"
        onClick={item.onSelect}
        onMouseEnter={() => setActiveIndex(index)}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-all",
          isActive ? "bg-accent text-foreground shadow-sm" : "hover:bg-accent/50 text-foreground/80",
        )}
      >
        <span className={cn(
          "flex size-7 items-center justify-center rounded-md shrink-0",
          isActive ? "bg-primary/10 text-primary" : "bg-secondary/70 text-muted-foreground",
        )}>
          <Icon name={item.icon} className="size-3.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-medium truncate">{item.title}</span>
          {item.subtitle && (
            <span className="block text-[10px] text-muted-foreground/60 truncate mt-0.5">{item.subtitle}</span>
          )}
        </span>
        {isProblem && (
          <DifficultyBadge difficulty={item.subtitle?.includes("Easy") ? "Easy" : item.subtitle?.includes("Medium") ? "Medium" : item.subtitle?.includes("Hard") ? "Hard" : "Medium"} />
        )}
        <ChevronRight className={cn("size-3 shrink-0 transition-opacity", isActive ? "opacity-60" : "opacity-0")} />
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Command Center</DialogTitle>

        <div className="flex items-center border-b border-border px-4" onKeyDown={handleKeyDown}>
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            placeholder="Search problems, resources, sprints, pages, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent h-12 text-sm focus-visible:ring-0 px-3 placeholder:text-muted-foreground/40"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/80 bg-secondary/50 px-1.5 font-mono text-[10px] text-muted-foreground/50">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[min(60vh,480px)] overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {phase === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          )}

          {phase === "no-results" && (
            <div className="py-12 text-center space-y-2">
              <Search className="mx-auto size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground/50">Try a different search term or browse pages using the navigation above</p>
            </div>
          )}

          {phase === "empty" && (
            <div className="space-y-4 py-2">
              {recentItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                    <Clock className="size-3" />
                    Recent
                  </div>
                  <div className="space-y-0.5">
                    {recentItems.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { if (item.href) navigate(item.href); }}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-accent/50 transition-colors"
                      >
                        <span className="flex size-7 items-center justify-center rounded-md bg-secondary/70 text-muted-foreground shrink-0">
                          <Icon name={item.icon} className="size-3.5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-foreground/80 truncate">{item.title}</span>
                          {item.subtitle && <span className="block text-[10px] text-muted-foreground/50 truncate">{item.subtitle}</span>}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground/30" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                  <Sparkles className="size-3" />
                  Quick Navigation
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {NAV_ITEMS.slice(0, 8).map((nav) => (
                    <button
                      key={nav.href}
                      type="button"
                      onClick={() => navigate(nav.href)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex size-6 items-center justify-center rounded-md bg-secondary/70 text-muted-foreground shrink-0">
                        <Icon name={nav.icon} className="size-3" />
                      </span>
                      <span className="font-medium text-foreground/80">{nav.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 py-1.5 text-[10px] text-muted-foreground/40">
                Type to search across all entities, or use <kbd className="mx-0.5 inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">↑</kbd><kbd className="mx-0.5 inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">↓</kbd> to navigate and <kbd className="mx-0.5 inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">Enter</kbd> to select
              </div>
            </div>
          )}

          {phase === "results" && (
            <div className="space-y-1">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                    <span>{group.label}</span>
                    <span className="text-[9px] text-muted-foreground/30">{group.items.length}</span>
                  </div>
                  {group.items.map((item) => {
                    const globalIndex = flatResults.indexOf(item);
                    return renderItem(item, globalIndex);
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground/40 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">↑</kbd>
            <kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">Enter</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-secondary/40 px-1 font-mono text-[9px]">Esc</kbd>
            Close
          </span>
          {problems.length > 0 && (
            <>
              <span className="w-px h-3 bg-border/50" />
              <span>{problems.length} problems indexed</span>
            </>
          )}
          {resources.length > 0 && (
            <>
              <span className="w-px h-3 bg-border/50" />
              <span>{resources.length} resources</span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

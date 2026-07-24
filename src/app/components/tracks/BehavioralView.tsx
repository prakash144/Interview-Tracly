"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, Plus, Pencil, Trash2, Search, X, MessageSquareText, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadEntries, saveEntry, deleteEntry, generateEntryId, getCompetencies, toggleEntryFavorite, seedSampleEntries } from "@/lib/behavioral";
import type { BehavioralEntry } from "@/lib/behavioral";

export function BehavioralView({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<BehavioralEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<BehavioralEntry | null>(null);
  const [viewing, setViewing] = useState<BehavioralEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({ question: "", situation: "", task: "", action: "", result: "", tags: "", company: "" });

  const COMPETENCIES = useMemo(() => getCompetencies(), []);

  useEffect(() => {
    seedSampleEntries();
    setEntries(loadEntries());
  }, []);

  const refresh = useCallback(() => setEntries(loadEntries()), []);

  const handleToggleFav = (id: string) => {
    toggleEntryFavorite(id);
    refresh();
    if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, favorited: !prev.favorited } : null);
  };

  const openNew = () => {
    setEditing(null);
    setDraft({ question: "", situation: "", task: "", action: "", result: "", tags: "", company: "" });
    setDialogOpen(true);
  };

  const openEdit = (e: BehavioralEntry) => {
    setEditing(e);
    setDraft({
      question: e.question, situation: e.situation, task: e.task, action: e.action, result: e.result,
      tags: e.tags.join(", "), company: e.company,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const entry: BehavioralEntry = {
      id: editing?.id ?? generateEntryId(),
      question: draft.question, situation: draft.situation, task: draft.task, action: draft.action, result: draft.result,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean), company: draft.company,
      favorited: editing?.favorited ?? false,
      createdAt: editing?.createdAt ?? Date.now(), updatedAt: Date.now(),
    };
    saveEntry(entry);
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (viewing?.id === id) setViewing(null);
    deleteEntry(id);
    refresh();
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.question.toLowerCase().includes(q) || e.situation.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) || e.result.toLowerCase().includes(q) || e.company.toLowerCase().includes(q)
      );
    }
    if (filterTag) result = result.filter((e) => e.tags.includes(filterTag!));
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, search, filterTag]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ChevronLeft className="size-3" /> All Tracks
          </button>
          <span className="text-xs text-muted-foreground/50">|</span>
          <div>
            <h2 className="text-lg font-semibold">Behavioral STAR Prep</h2>
            <p className="text-xs text-muted-foreground">{entries.length} answers</p>
          </div>
        </div>
        <Button onClick={openNew} variant="outline" size="sm" className="h-8 text-xs">
          <Plus className="size-3.5 mr-1" /> New Answer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions, answers, companies..." className="h-8 pl-8 text-xs" />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                filterTag === tag ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}>
              {tag}
              {filterTag === tag && <X className="size-2.5" />}
            </button>
          ))}
          {filterTag && (
            <button onClick={() => setFilterTag(null)} className="text-[10px] text-muted-foreground hover:text-foreground px-1">Clear</button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <MessageSquareText className="size-10" />
          <p className="text-sm">{entries.length === 0 ? "No answers yet — use the STAR method" : "No matches"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border bg-card p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-xs">{entry.question}</h3>
                    <button onClick={() => handleToggleFav(entry.id)}
                      className={`shrink-0 transition-colors ${entry.favorited ? "text-rose-400" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                      <Heart className={`size-3 ${entry.favorited ? "fill-rose-400" : ""}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {entry.company && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{entry.company}</span>}
                    {entry.tags.map((t) => (
                      <button key={t} onClick={() => setFilterTag(t)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors">{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => setViewing(entry)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-all">
                    <Eye className="size-3" />
                  </button>
                  <button onClick={() => openEdit(entry)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-all">
                    <Pencil className="size-3" />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                <div className="rounded bg-muted/40 p-2">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Situation</p>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{entry.situation}</p>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Task</p>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{entry.task}</p>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Action</p>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{entry.action}</p>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Result</p>
                  <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{entry.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog.Root open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-w-2xl w-full bg-card border border-border text-foreground p-0 rounded-lg -translate-x-1/2 -translate-y-1/2 z-50 max-h-[85vh] flex flex-col">
            {viewing && (
              <>
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-5 py-3 rounded-t-lg gap-3">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-sm font-semibold leading-snug">{viewing.question}</Dialog.Title>
                    <div className="flex items-center gap-2 mt-1">
                      {viewing.company && <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{viewing.company}</span>}
                      {viewing.tags.map((t) => (
                        <span key={t} className="text-[10px] text-muted-foreground">{t}</span>
                      ))}
                      <button onClick={() => handleToggleFav(viewing.id)}
                        className={`ml-auto ${viewing.favorited ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"}`}>
                        <Heart className={`size-3.5 ${viewing.favorited ? "fill-rose-400" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setViewing(null); openEdit(viewing); }} className="size-7 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors" title="Edit">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => handleDelete(viewing.id)} className="size-7 flex items-center justify-center hover:text-destructive text-muted-foreground transition-colors" title="Delete">
                      <Trash2 className="size-3.5" />
                    </button>
                    <Dialog.Close asChild>
                      <button className="size-7 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors">
                        <X className="size-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
                <div className="overflow-y-auto p-5 space-y-4">
                  <div className="rounded-lg border-l-4 border-blue-400 bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Situation</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{viewing.situation}</p>
                  </div>
                  <div className="rounded-lg border-l-4 border-orange-400 bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1">Task</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{viewing.task}</p>
                  </div>
                  <div className="rounded-lg border-l-4 border-purple-400 bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Action</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{viewing.action}</p>
                  </div>
                  <div className="rounded-lg border-l-4 border-green-400 bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">Result</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{viewing.result}</p>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit/Create Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-w-2xl w-full bg-card border border-border text-foreground p-6 rounded-lg -translate-x-1/2 -translate-y-1/2 z-50 max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">{editing ? "Edit Answer" : "New STAR Answer"}</Dialog.Title>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Question *</label>
                <Input value={draft.question} onChange={(e) => setDraft((p) => ({ ...p, question: e.target.value }))} placeholder="Tell me about a time when..." className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Company</label>
                  <Input value={draft.company} onChange={(e) => setDraft((p) => ({ ...p, company: e.target.value }))} placeholder="Amazon, Meta..." className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Tags (comma-sep)</label>
                  <Input value={draft.tags} onChange={(e) => setDraft((p) => ({ ...p, tags: e.target.value }))} placeholder="Leadership, Conflict" className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {COMPETENCIES.map((c) => (
                  <button key={c} type="button" onClick={() => setDraft((p) => {
                    const current = p.tags ? p.tags.split(",").map((t) => t.trim()) : [];
                    const idx = current.indexOf(c);
                    if (idx >= 0) current.splice(idx, 1);
                    else current.push(c);
                    return { ...p, tags: current.join(", ") };
                  })}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      draft.tags.split(",").map((t) => t.trim()).includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                    }`}>{c}</button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-blue-500">Situation</label>
                <textarea value={draft.situation} onChange={(e) => setDraft((p) => ({ ...p, situation: e.target.value }))}
                  className="w-full h-16 resize-none rounded-md border border-border bg-secondary p-2 text-xs focus:outline-none" placeholder="Context..." />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-orange-500">Task</label>
                <textarea value={draft.task} onChange={(e) => setDraft((p) => ({ ...p, task: e.target.value }))}
                  className="w-full h-16 resize-none rounded-md border border-border bg-secondary p-2 text-xs focus:outline-none" placeholder="Responsibility..." />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-purple-500">Action</label>
                <textarea value={draft.action} onChange={(e) => setDraft((p) => ({ ...p, action: e.target.value }))}
                  className="w-full h-16 resize-none rounded-md border border-border bg-secondary p-2 text-xs focus:outline-none" placeholder="What you did..." />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-green-500">Result</label>
                <textarea value={draft.result} onChange={(e) => setDraft((p) => ({ ...p, result: e.target.value }))}
                  className="w-full h-16 resize-none rounded-md border border-border bg-secondary p-2 text-xs focus:outline-none" placeholder="Outcome..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <Button variant="outline" className="text-xs h-8">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSave} className="text-xs h-8" disabled={!draft.question.trim()}>
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

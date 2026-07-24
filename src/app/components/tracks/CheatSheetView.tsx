"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, Plus, Pencil, Trash2, BookOpen, Heart, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { loadCheatSheets, saveCheatSheet, deleteCheatSheet, generateCheatSheetId, toggleCheatSheetFavorite, seedSampleCheatSheets } from "@/lib/cheatSheets";
import type { CheatSheet } from "@/lib/cheatSheets";

const INLINE_COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Uber", "Airbnb",
  "Stripe", "Shopify", "Bloomberg", "Goldman Sachs", "JPMorgan", "Palantir",
  "Databricks", "Snowflake", "Coinbase", "LinkedIn", "Twitter",
];

export function CheatSheetView({ onBack }: { onBack: () => void }) {
  const [sheets, setSheets] = useState<CheatSheet[]>([]);
  const [editing, setEditing] = useState<CheatSheet | null>(null);
  const [viewing, setViewing] = useState<CheatSheet | null>(null);
  const [draft, setDraft] = useState({ title: "", company: "", content: "", topics: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    seedSampleCheatSheets();
    setSheets(loadCheatSheets());
  }, []);

  const refresh = useCallback(() => setSheets(loadCheatSheets()), []);

  const handleToggleFav = (id: string) => {
    toggleCheatSheetFavorite(id);
    refresh();
    if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, favorited: !prev.favorited } : null);
  };

  const openNew = () => {
    setEditing(null);
    setDraft({ title: "", company: "", content: "", topics: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: CheatSheet) => {
    setEditing(s);
    setDraft({ title: s.title, company: s.company, content: s.content, topics: s.topics.join(", ") });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const sheet: CheatSheet = {
      id: editing?.id ?? generateCheatSheetId(),
      title: draft.title,
      company: draft.company,
      content: draft.content,
      topics: draft.topics.split(",").map((t) => t.trim()).filter(Boolean),
      favorited: editing?.favorited ?? false,
      createdAt: editing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    saveCheatSheet(sheet);
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (viewing?.id === id) setViewing(null);
    deleteCheatSheet(id);
    refresh();
  };

  const grouped = Object.groupBy(sheets, (s) => s.company);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ChevronLeft className="size-3" /> All Tracks
          </button>
          <span className="text-xs text-muted-foreground/50">|</span>
          <div>
            <h2 className="text-lg font-semibold">Company Cheat Sheets</h2>
            <p className="text-xs text-muted-foreground">{sheets.length} sheets</p>
          </div>
        </div>
        <Button onClick={openNew} variant="outline" size="sm" className="h-8 text-xs">
          <Plus className="size-3.5 mr-1" /> New Sheet
        </Button>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <BookOpen className="size-10" />
          <p className="text-sm">No cheat sheets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(grouped).map(([company, companySheets]) => (
            <div key={company}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{company}</h3>
              {companySheets!.map((sheet) => (
                <div key={sheet.id} className="rounded-lg border border-border bg-card p-3 mb-1.5 group relative">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-xs truncate">{sheet.title}</h4>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => handleToggleFav(sheet.id)}
                        className={`size-6 flex items-center justify-center transition-colors ${sheet.favorited ? "text-rose-400" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                        <Heart className={`size-3 ${sheet.favorited ? "fill-rose-400" : ""}`} />
                      </button>
                      <button onClick={() => setViewing(sheet)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-all">
                        <Eye className="size-3" />
                      </button>
                      <button onClick={() => openEdit(sheet)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-all">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => handleDelete(sheet.id)} className="size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                  {sheet.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sheet.topics.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 rounded-md bg-muted/50 p-2 text-xs text-foreground/70 line-clamp-3 leading-relaxed">
                    <MarkdownRenderer content={sheet.content.slice(0, 250)} />
                  </div>
                  <button onClick={() => setViewing(sheet)} className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    View full sheet &rarr;
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog.Root open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-w-3xl w-full bg-card border border-border text-foreground p-0 rounded-lg -translate-x-1/2 -translate-y-1/2 z-50 max-h-[85vh] flex flex-col">
            {viewing && (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3 rounded-t-lg">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Dialog.Title className="text-base font-semibold truncate">{viewing.title}</Dialog.Title>
                      <button onClick={() => handleToggleFav(viewing.id)}
                        className={`shrink-0 ${viewing.favorited ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"}`}>
                        <Heart className={`size-4 ${viewing.favorited ? "fill-rose-400" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{viewing.company}</span>
                      {viewing.topics.map((t) => (
                        <span key={t} className="text-[10px] text-muted-foreground">{t}</span>
                      ))}
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
                <div className="overflow-y-auto p-5">
                  <MarkdownRenderer content={viewing.content} />
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
            <Dialog.Title className="text-lg font-semibold mb-4">{editing ? "Edit Cheat Sheet" : "New Cheat Sheet"}</Dialog.Title>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Company</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {INLINE_COMPANIES.map((c) => (
                    <button key={c} type="button" onClick={() => setDraft((p) => ({ ...p, company: c }))}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        draft.company === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                      }`}>{c}</button>
                  ))}
                </div>
                <Input value={draft.company} onChange={(e) => setDraft((p) => ({ ...p, company: e.target.value }))} placeholder="Custom..." className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Title</label>
                <Input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. System Design Quick Ref" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Topics (comma-separated)</label>
                <Input value={draft.topics} onChange={(e) => setDraft((p) => ({ ...p, topics: e.target.value }))} placeholder="Arrays, Trees, DP" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Content (markdown)</label>
                <textarea value={draft.content} onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
                  className="w-full h-40 resize-none rounded-md border border-border bg-secondary p-2.5 text-xs font-mono focus:outline-none" placeholder="Write in markdown..." />
              </div>
              {draft.content && (
                <div className="rounded-md border border-border bg-muted/30 p-3 max-h-40 overflow-y-auto">
                  <p className="text-[10px] text-muted-foreground mb-1">Preview</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_*]:text-xs">
                    <MarkdownRenderer content={draft.content} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <Button variant="outline" className="text-xs h-8">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSave} className="text-xs h-8" disabled={!draft.title.trim() || !draft.content.trim()}>
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

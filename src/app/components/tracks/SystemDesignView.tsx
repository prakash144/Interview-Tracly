"use client";

import { useEffect, useState } from "react";
import {
  SystemDesignNote,
  loadNotes,
  saveNote,
  deleteNote,
  toggleNoteFavorite,
  generateNoteId,
  seedSampleNotes,
} from "@/lib/systemDesign";
import { Search, Star, Edit3, Trash2, Plus } from "lucide-react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

export default function SystemDesignView() {
  const [notes, setNotes] = useState<SystemDesignNote[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SystemDesignNote | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    seedSampleNotes();
    setNotes(loadNotes());
  }, []);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.company.toLowerCase().includes(search.toLowerCase())
  );

  function handleNew() {
    const note: SystemDesignNote = {
      id: generateNoteId(),
      title: "",
      company: "",
      topic: "System Design",
      content: "",
      sections: [],
      favorited: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditForm(note);
    setEditing(note.id);
  }

  function handleEdit(note: SystemDesignNote) {
    setEditForm({ ...note });
    setEditing(note.id);
  }

  function handleSave() {
    if (!editForm || !editForm.title.trim()) return;
    saveNote(editForm);
    setNotes(loadNotes());
    setEditing(null);
    setEditForm(null);
  }

  function handleDelete(id: string) {
    deleteNote(id);
    setNotes(loadNotes());
    if (viewing === id) setViewing(null);
  }

  function handleToggleFavorite(id: string) {
    toggleNoteFavorite(id);
    setNotes(loadNotes());
  }

  function addSection() {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      sections: [...editForm.sections, { name: "", body: "" }],
    });
  }

  function removeSection(idx: number) {
    if (!editForm) return;
    const s = editForm.sections.filter((_, i) => i !== idx);
    setEditForm({ ...editForm, sections: s });
  }

  function updateSection(idx: number, field: "name" | "body", val: string) {
    if (!editForm) return;
    const s = [...editForm.sections];
    s[idx] = { ...s[idx], [field]: val };
    setEditForm({ ...editForm, sections: s });
  }

  if (editing && editForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {editForm.id.startsWith("sd_sample") ? "View Note" : editForm.title || "New System Design Note"}
          </h3>
          <button onClick={() => { setEditing(null); setEditForm(null); }} className="text-sm text-gray-400 hover:text-white">Close</button>
        </div>
        <input className="w-full rounded bg-gray-800 p-2 text-sm text-white placeholder-gray-500 border border-gray-700"
          placeholder="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        <input className="w-full rounded bg-gray-800 p-2 text-sm text-white placeholder-gray-500 border border-gray-700"
          placeholder="Company (e.g. Meta, Uber, General)" value={editForm.company}
          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
        <textarea className="w-full rounded bg-gray-800 p-2 text-sm text-white placeholder-gray-500 border border-gray-700 min-h-[80px]"
          placeholder="Brief description / prompt" value={editForm.content}
          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Sections</span>
            <button onClick={addSection} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={14} /> Section
            </button>
          </div>
          {editForm.sections.map((sec, i) => (
            <div key={i} className="rounded border border-gray-700 bg-gray-800/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input className="flex-1 rounded bg-gray-800 p-1 text-sm text-white placeholder-gray-500 border border-gray-700"
                  placeholder="Section name (e.g. Requirements, Deep Dive)" value={sec.name}
                  onChange={(e) => updateSection(i, "name", e.target.value)} />
                <button onClick={() => removeSection(i)} className="ml-2 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
              <textarea className="w-full rounded bg-gray-800 p-2 text-sm text-white placeholder-gray-500 border border-gray-700 min-h-[100px] font-mono"
                placeholder="Markdown content..." value={sec.body}
                onChange={(e) => updateSection(i, "body", e.target.value)} />
              <div className="rounded bg-gray-900 p-2 text-xs text-gray-300 border border-gray-700">
                <MarkdownRenderer content={sec.body || "*preview*"} />
              </div>
            </div>
          ))}
          {editForm.sections.length === 0 && (
            <p className="text-xs text-gray-500 italic">No sections yet. Add requirements, estimation, data model, deep dive, etc.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => { setEditing(null); setEditForm(null); }} className="rounded bg-gray-700 px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-500">Save</button>
        </div>
      </div>
    );
  }

  const viewNote = viewing ? notes.find((n) => n.id === viewing) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="w-full rounded-lg bg-gray-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 border border-gray-700"
            placeholder="Search notes by title or company..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 whitespace-nowrap">
          <Plus size={16} /> New Note
        </button>
      </div>

      {viewNote ? (
        <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-white">{viewNote.title}</h4>
              <p className="text-xs text-gray-400">{viewNote.company} &middot; {new Date(viewNote.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleToggleFavorite(viewNote.id)}
                className={`p-1.5 rounded ${viewNote.favorited ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"}`}>
                <Star size={16} fill={viewNote.favorited ? "currentColor" : "none"} />
              </button>
              <button onClick={() => { setViewing(null); handleEdit(viewNote); }}
                className="p-1.5 rounded text-gray-400 hover:text-white"><Edit3 size={16} /></button>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded text-gray-400 hover:text-white text-sm">Close</button>
            </div>
          </div>
          {viewNote.content && (
            <div className="rounded bg-gray-900 p-3 text-sm text-gray-300 border border-gray-700">
              <MarkdownRenderer content={viewNote.content} />
            </div>
          )}
          <div className="space-y-3">
            {viewNote.sections.map((sec, i) => (
              <details key={i} className="rounded border border-gray-700 bg-gray-900/50" open>
                <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                  {sec.name || `Section ${i + 1}`}
                </summary>
                <div className="px-3 pb-3 text-sm text-gray-300">
                  <MarkdownRenderer content={sec.body} />
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-8">No system design notes yet. Create one!</p>
          )}
          {filtered.map((note) => (
            <div key={note.id}
              className="group flex items-start justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-3 hover:border-indigo-600/50 cursor-pointer transition-colors"
              onClick={() => setViewing(note.id)}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{note.title || "Untitled"}</h4>
                  {note.favorited && <Star size={12} className="shrink-0 text-yellow-400" fill="currentColor" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{note.company} &middot; {note.sections.length} sections</p>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(note.id); }}
                  className={`p-1.5 rounded ${note.favorited ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"}`}>
                  <Star size={14} fill={note.favorited ? "currentColor" : "none"} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(note); }}
                  className="p-1.5 rounded text-gray-400 hover:text-white"><Edit3 size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                  className="p-1.5 rounded text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { ChevronLeft, Code, Layers, Server, Users, Crown, Brain, Settings2, X, Search, GripVertical, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MockInterviewConfig, MockSection, MockInterviewType } from "@/lib/mockTest";
import { MOCK_TYPE_LABELS, generateSectionId } from "@/lib/mockTest";

const TYPE_ICONS: Record<MockInterviewType, LucideIcon> = {
  dsa: Code, "system-design": Layers, backend: Server, behavioral: Users, leadership: Crown, "ai-ml": Brain, custom: Settings2,
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

const SECTION_PRESETS: { type: MockInterviewType; count: number; title: string }[] = [
  { type: "dsa", count: 3, title: "Coding Problems" },
  { type: "system-design", count: 1, title: "System Design" },
  { type: "behavioral", count: 2, title: "Behavioral Questions" },
  { type: "backend", count: 2, title: "Backend Deep Dive" },
  { type: "leadership", count: 2, title: "Leadership Principles" },
  { type: "ai-ml", count: 2, title: "AI/ML Questions" },
];

interface WizardStepSectionsProps {
  config: MockInterviewConfig;
  setConfig: React.Dispatch<React.SetStateAction<MockInterviewConfig>>;
  availableTopics: string[];
  topicSearch: Record<string, string>;
  setTopicSearch: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onNext: () => void;
}

export default function WizardStepSections({
  config, setConfig, availableTopics, topicSearch, setTopicSearch, onBack, onNext,
}: WizardStepSectionsProps) {
  const addSection = (type: MockInterviewType) => {
    const preset = SECTION_PRESETS.find((p) => p.type === type);
    const section: MockSection = {
      id: generateSectionId(),
      type,
      title: preset?.title ?? MOCK_TYPE_LABELS[type],
      problemCount: preset?.count ?? 3,
      difficulties: ["Easy", "Medium"],
      topics: [],
      tags: [],
      customQuestions: [],
    };
    setConfig((prev) => ({ ...prev, sections: [...prev.sections, section] }));
  };

  const removeSection = (id: string) => {
    setConfig((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  };

  const updateSection = (id: string, patch: Partial<MockSection>) => {
    setConfig((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    setConfig((prev) => {
      const sections = [...prev.sections];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  };

  const addCustomQuestion = (sectionId: string, question: string) => {
    if (!question.trim()) return;
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, customQuestions: [...(s.customQuestions ?? []), question.trim()] }
          : s
      ),
    }));
  };

  const removeCustomQuestion = (sectionId: string, index: number) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId && s.customQuestions
          ? { ...s, customQuestions: s.customQuestions.filter((_, i) => i !== index) }
          : s
      ),
    }));
  };

  const totalQuestions = config.sections.reduce((s, sec) => s + sec.problemCount, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold">Sections</h3>
          <p className="text-xs text-muted-foreground mt-1">Add interview rounds by type. Each section can have its own difficulty and topics.</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SECTION_PRESETS.map((preset) => {
            const Icon = TYPE_ICONS[preset.type];
            const exists = config.sections.some((s) => s.type === preset.type);
            return (
              <button
                key={preset.type}
                onClick={() => addSection(preset.type)}
                disabled={exists}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                  exists
                    ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                    : "border-border hover:bg-accent hover:text-foreground text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" /> {preset.type === "dsa" ? "DSA" : MOCK_TYPE_LABELS[preset.type]}
              </button>
            );
          })}
        </div>
      </div>

      {config.sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <Settings2 className="mx-auto size-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No sections yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Click a section type above to add it to your interview.</p>
        </div>
      )}

      <div className="space-y-3">
        {config.sections.map((section, index) => {
          const Icon = TYPE_ICONS[section.type];
          const searchKey = topicSearch[section.id] ?? "";
          const filteredTopics = searchKey
            ? availableTopics.filter((t) => t.toLowerCase().includes(searchKey.toLowerCase()))
            : availableTopics;
          const isFirst = index === 0;
          const isLast = index === config.sections.length - 1;

          return (
            <div key={section.id} className="rounded-xl border border-border bg-secondary/20 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground/30">
                    <GripVertical className="size-3.5" />
                  </div>
                  <div className="size-8 rounded-lg bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="h-8 text-sm font-medium px-2 py-0 border-0 bg-transparent focus:bg-secondary hover:bg-secondary/50 rounded w-full"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-md bg-secondary border border-border shrink-0">
                    {MOCK_TYPE_LABELS[section.type]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSection(index, "up")}
                    disabled={isFirst}
                    className="size-7 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 shrink-0"
                    title="Move up"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    onClick={() => moveSection(index, "down")}
                    disabled={isLast}
                    className="size-7 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 shrink-0"
                    title="Move down"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="size-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {section.type !== "dsa" && (
                <CustomQuestionsEditor
                  questions={section.customQuestions ?? []}
                  onAdd={(q) => addCustomQuestion(section.id, q)}
                  onRemove={(i) => removeCustomQuestion(section.id, i)}
                  problemCount={section.problemCount}
                />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Questions</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSection(section.id, { problemCount: Math.max(1, section.problemCount - 1) })}
                      className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold tabular-nums">{section.problemCount}</span>
                    <button
                      onClick={() => updateSection(section.id, { problemCount: Math.min(20, section.problemCount + 1) })}
                      className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Difficulty</label>
                  <div className="flex gap-1.5">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          updateSection(section.id, {
                            difficulties: section.difficulties.includes(d)
                              ? section.difficulties.filter((x) => x !== d)
                              : [...section.difficulties, d],
                          })
                        }
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                          section.difficulties.includes(d)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {section.type === "dsa" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-medium text-muted-foreground">Topics</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                      <input
                        type="text"
                        value={searchKey}
                        onChange={(e) => setTopicSearch((p) => ({ ...p, [section.id]: e.target.value }))}
                        placeholder="Search topics..."
                        className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-border bg-secondary text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-border/50 rounded-lg p-2.5 bg-secondary/10 space-y-1">
                      {section.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pb-2 mb-1 border-b border-border/30">
                          {section.topics.map((t) => (
                            <button
                              key={t}
                              onClick={() => updateSection(section.id, { topics: section.topics.filter((x) => x !== t) })}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-colors"
                            >
                              {t} <X className="size-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {filteredTopics.length === 0 && (
                          <span className="text-[11px] text-muted-foreground/50 px-1 py-1">No topics match</span>
                        )}
                        {filteredTopics.map((t) => {
                          if (section.topics.includes(t)) return null;
                          return (
                            <button
                              key={t}
                              onClick={() => updateSection(section.id, { topics: [...section.topics, t] })}
                              className="text-[11px] px-2 py-0.5 rounded-full border border-border hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="size-3.5 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} across {config.sections.length} section{config.sections.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" disabled={config.sections.length === 0} onClick={onNext}>
            Next: Review
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomQuestionsEditor({
  questions,
  onAdd,
  onRemove,
  problemCount,
}: {
  questions: string[];
  onAdd: (question: string) => void;
  onRemove: (index: number) => void;
  problemCount: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">
          Custom Questions ({questions.length}/{problemCount})
        </label>
      </div>
      <div className="space-y-1.5">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[11px] text-muted-foreground/50 mt-1.5 shrink-0 w-4">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">{q}</p>
            </div>
            <button
              onClick={() => onRemove(i)}
              className="size-5 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      {questions.length < problemCount && (
        <AddQuestionInput onAdd={onAdd} />
      )}
    </div>
  );
}

function AddQuestionInput({ onAdd }: { onAdd: (q: string) => void }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        placeholder="Type a question and press Enter..."
        className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-border bg-secondary text-foreground outline-none placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className="size-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 shrink-0"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

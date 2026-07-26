"use client";

import { type LucideIcon, Code, Layers, Server, Users, Crown, Brain, Settings2, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MockInterviewConfig, MockSection, MockInterviewType } from "@/lib/mockTest";
import { MOCK_TYPE_LABELS, LEVELS, generateSectionId } from "@/lib/mockTest";

const TYPE_ICONS: Record<MockInterviewType, LucideIcon> = {
  dsa: Code,
  "system-design": Layers,
  backend: Server,
  behavioral: Users,
  leadership: Crown,
  "ai-ml": Brain,
  custom: Settings2,
};

const DURATIONS = [15, 30, 45, 60];
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const SECTION_PRESETS: { type: MockInterviewType; count: number; title: string }[] = [
  { type: "dsa", count: 3, title: "Coding Problems" },
  { type: "system-design", count: 1, title: "System Design" },
  { type: "behavioral", count: 2, title: "Behavioral Questions" },
  { type: "backend", count: 2, title: "Backend Deep Dive" },
  { type: "leadership", count: 2, title: "Leadership Principles" },
  { type: "ai-ml", count: 2, title: "AI/ML Questions" },
];

interface MockTestConfigProps {
  config: MockInterviewConfig;
  onChange: (config: MockInterviewConfig) => void;
  onStart: () => void;
  availableTopics: string[];
  companies: string[];
  isLoading: boolean;
  hasQuestions: boolean;
  hasNoMatch: boolean;
  hasError: boolean;
}

export default function MockTestConfig({
  config,
  onChange,
  onStart,
  availableTopics,
  companies,
  isLoading,
  hasQuestions,
  hasNoMatch,
  hasError,
}: MockTestConfigProps) {
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
    };
    onChange({ ...config, sections: [...config.sections, section] });
  };

  const removeSection = (id: string) => {
    onChange({ ...config, sections: config.sections.filter((s) => s.id !== id) });
  };

  const updateSection = (id: string, patch: Partial<MockSection>) => {
    onChange({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 space-y-6">
      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        </div>
      )}

      {!isLoading && !hasQuestions && !hasError && (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">No questions loaded</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Go to <strong>Settings</strong> and select a company &amp; problem list to load questions.
          </p>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">Failed to load questions. Check Settings &gt; Company/List selection.</p>
        </div>
      )}

      {!isLoading && hasQuestions && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Interview Details</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {config.sections.reduce((s, sec) => s + sec.problemCount, 0)} total questions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <select
                value={config.company}
                onChange={(e) => onChange({ ...config, company: e.target.value })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="">Any</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <Input
                value={config.role}
                onChange={(e) => onChange({ ...config, role: e.target.value })}
                placeholder="e.g. SDE II"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Level</label>
              <select
                value={config.level}
                onChange={(e) => onChange({ ...config, level: e.target.value })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="">Any</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
              <div className="flex gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => onChange({ ...config, durationMinutes: d })}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                      config.durationMinutes === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && hasQuestions && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sections</h3>
            <div className="flex gap-1.5 flex-wrap">
              {SECTION_PRESETS.map((preset) => {
                const Icon = TYPE_ICONS[preset.type];
                const exists = config.sections.some((s) => s.type === preset.type);
                return (
                  <button
                    key={preset.type}
                    onClick={() => addSection(preset.type)}
                    disabled={exists}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-colors ${
                      exists
                        ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                        : "border-border hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-3" />
                    {preset.type === "dsa" ? "DSA" : MOCK_TYPE_LABELS[preset.type]}
                  </button>
                );
              })}
            </div>
          </div>

          {config.sections.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
              <Settings2 className="mx-auto size-6 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                Add at least one section to start a mock interview
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Choose from DSA, System Design, Backend, Behavioral, Leadership, AI/ML, or Custom
              </p>
            </div>
          )}

          <div className="space-y-3">
            {config.sections.map((section) => {
              const Icon = TYPE_ICONS[section.type];
              return (
                <div
                  key={section.id}
                  className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="h-7 text-xs font-medium px-2 py-0 border-0 bg-transparent focus:bg-secondary hover:bg-secondary/50 rounded"
                      />
                      <span className="text-[10px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-secondary border border-border">
                        {MOCK_TYPE_LABELS[section.type]}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="size-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Questions</label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={section.problemCount}
                        onChange={(e) =>
                          updateSection(section.id, {
                            problemCount: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                          })
                        }
                        className="h-7 text-xs w-full"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-muted-foreground">Difficulty</label>
                      <div className="flex gap-1">
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
                            className={`flex-1 px-1.5 py-1 text-[10px] rounded-md border transition-colors ${
                              section.difficulties.includes(d)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {section.type === "dsa" && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Topics</label>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {availableTopics.map((t) => (
                            <button
                              key={t}
                              onClick={() =>
                                updateSection(section.id, {
                                  topics: section.topics.includes(t)
                                    ? section.topics.filter((x) => x !== t)
                                    : [...section.topics, t],
                                })
                              }
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                                section.topics.includes(t)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && hasQuestions && config.sections.length > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={onStart} className="flex-1 h-10 text-sm">
            <Play className="size-4 mr-1.5" /> Start Interview
          </Button>
          {hasNoMatch && (
            <p className="text-xs text-warning">
              No problems match filters. Try broader criteria.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

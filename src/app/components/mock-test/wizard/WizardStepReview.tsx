"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, Code, Layers, Server, Users, Crown, Brain, Settings2, Play, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import type { MockInterviewConfig, MockInterviewType } from "@/lib/mockTest";
import { MOCK_TYPE_LABELS } from "@/lib/mockTest";

const TYPE_ICONS: Record<MockInterviewType, LucideIcon> = {
  dsa: Code, "system-design": Layers, backend: Server, behavioral: Users, leadership: Crown, "ai-ml": Brain, custom: Settings2,
};

interface WizardStepReviewProps {
  config: MockInterviewConfig;
  allQuestions: { difficulty: string; topicTag?: string; topics?: string[]; company?: string }[];
  onBack: () => void;
  onStart: () => void;
}

export default function WizardStepReview({ config, allQuestions, onBack, onStart }: WizardStepReviewProps) {
  const previewProblems = useMemo(() => {
    const results: { title: string; difficulty: string; topic: string; sectionTitle: string; sectionType: MockInterviewType; isCustom: boolean }[] = [];

    config.sections.forEach((section) => {
      if (section.type === "dsa") {
        const pool = allQuestions.filter((q) => {
          if (section.difficulties.length && !section.difficulties.some((d) => d.toUpperCase() === q.difficulty.toUpperCase())) return false;
          if (section.topics.length && !section.topics.some((t) => q.topicTag === t || q.topics?.includes(t))) return false;
          if (config.company && q.company !== config.company) return false;
          return true;
        });
        const sample = pool.slice(0, section.problemCount);
        sample.forEach((q) => {
          results.push({
            title: q.difficulty,
            difficulty: q.difficulty,
            topic: q.topicTag || "",
            sectionTitle: section.title,
            sectionType: section.type,
            isCustom: false,
          });
        });
        const remaining = section.problemCount - sample.length;
        for (let i = 0; i < remaining; i++) {
          results.push({
            title: section.difficulties[0] || "Medium",
            difficulty: section.difficulties[i % section.difficulties.length] || "Medium",
            topic: section.topics[i % section.topics.length] || "",
            sectionTitle: section.title,
            sectionType: section.type,
            isCustom: false,
          });
        }
      } else {
        for (let i = 0; i < section.problemCount; i++) {
          const customQ = section.customQuestions?.[i];
          results.push({
            title: customQ || `${section.title} — Q${i + 1}`,
            difficulty: section.difficulties[0] || "Medium",
            topic: section.topics[0] || "",
            sectionTitle: section.title,
            sectionType: section.type,
            isCustom: !!customQ,
          });
        }
      }
    });

    return results;
  }, [config, allQuestions]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Review &amp; Launch</h3>
        <p className="text-xs text-muted-foreground mt-1">Confirm your interview configuration before starting.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{config.company || "Any"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Company</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{config.role || "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Role</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{config.level || "Any"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Level</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{config.durationMinutes}m</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Duration</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sections ({config.sections.length})
        </h4>
        <div className="space-y-2">
          {config.sections.map((sec) => {
            const Icon = TYPE_ICONS[sec.type];
            const secProblems = previewProblems.filter((p) => p.sectionTitle === sec.title);
            return (
              <div key={sec.id} className="rounded-lg border border-border bg-secondary/20 px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {sec.problemCount} question{sec.problemCount !== 1 ? "s" : ""} · {sec.difficulties.join(", ")}
                      {sec.topics.length > 0 && ` · ${sec.topics.length} topic${sec.topics.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-md bg-secondary border border-border shrink-0">
                    {MOCK_TYPE_LABELS[sec.type]}
                  </span>
                </div>
                {secProblems.length > 0 && (
                  <div className="border-t border-border/40 pt-2 space-y-1">
                    {secProblems.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                        <span className="flex-1 truncate">
                          {p.isCustom ? (
                            <span className="flex items-center gap-1">
                              <HelpCircle className="size-3 text-primary/60 shrink-0" />
                              {p.title}
                            </span>
                          ) : (
                            p.title
                          )}
                        </span>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="size-3.5 mr-1" /> Back
        </Button>
        <Button size="lg" onClick={onStart} className="px-8">
          <Play className="size-4 mr-2" /> Start Interview
        </Button>
      </div>
    </div>
  );
}

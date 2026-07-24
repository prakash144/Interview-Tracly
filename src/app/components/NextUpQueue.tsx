"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import { SectionHeader } from "@/components/ui/premium";
import type { Problem } from "@/lib/progressTypes";

interface NextUpQueueProps {
  problems: Problem[];
}

export function NextUpQueue({ problems }: NextUpQueueProps) {
  if (problems.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
      <SectionHeader
        eyebrow="Smart Pick"
        title="Next Up"
        icon={Sparkles}
        action={
          problems.length > 0 && (
            <Link
              href="/problems"
              className="inline-flex items-center gap-1 text-xs text-info hover:text-info/80 transition-colors"
            >
              All problems <ArrowRight className="size-3" />
            </Link>
          )
        }
        className="mb-3"
      />
      <div className="space-y-2">
        {problems.map((p) => (
          <a
            key={p.problemId}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/70 px-3 py-2 transition-colors hover:bg-accent"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate">{p.topics.slice(0, 2).join(", ")}</p>
            </div>
            <DifficultyBadge difficulty={p.difficulty} size="sm" />
          </a>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Trophy, Flame, BookOpen, Zap, Medal, Star } from "lucide-react";
import type { Sprint } from "@/lib/sprints";

interface CareerMilestonesProps {
  currentStreak: number;
  totalSolved: number;
  sprints: Sprint[];
  completedCollections: number;
}

interface Milestone {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  color: string;
  bgColor: string;
}

export function CareerMilestones({
  currentStreak,
  totalSolved,
  sprints,
  completedCollections,
}: CareerMilestonesProps) {
  const milestones = useMemo((): Milestone[] => {
    const completedSprints = sprints.filter((s) => s.status === "completed").length;

    const list: Milestone[] = [];

    if (totalSolved >= 100) {
      list.push({
        icon: Trophy,
        label: "Century Club",
        value: `${totalSolved} solved`,
        subtext: "100+ problems mastered",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      });
    } else if (totalSolved >= 50) {
      list.push({
        icon: Medal,
        label: "Half Century",
        value: `${totalSolved} solved`,
        subtext: "50+ problems solved",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      });
    } else if (totalSolved >= 10) {
      list.push({
        icon: Star,
        label: "Getting Started",
        value: `${totalSolved} solved`,
        subtext: "First 10 problems down",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      });
    }

    if (currentStreak >= 30) {
      list.push({
        icon: Flame,
        label: "Monthly Master",
        value: `${currentStreak}-day streak`,
        subtext: "Unstoppable momentum",
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
      });
    } else if (currentStreak >= 7) {
      list.push({
        icon: Flame,
        label: "Weekly Warrior",
        value: `${currentStreak}-day streak`,
        subtext: "7+ day consistency",
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
      });
    }

    if (completedSprints >= 3) {
      list.push({
        icon: Zap,
        label: "Sprint Machine",
        value: `${completedSprints} completed`,
        subtext: "3+ sprints finished",
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
      });
    } else if (completedSprints >= 1) {
      list.push({
        icon: Zap,
        label: "First Sprint",
        value: `${completedSprints} completed`,
        subtext: "Sprint completed",
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
      });
    }

    if (completedCollections > 0) {
      list.push({
        icon: BookOpen,
        label: "Collection Complete",
        value: `${completedCollections} done`,
        subtext: "Completed collections",
        color: "text-cyan-400",
        bgColor: "bg-cyan-400/10",
      });
    }

    return list;
  }, [currentStreak, totalSolved, sprints, completedCollections]);

  if (milestones.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Trophy className="size-4 text-warning" />
          Milestones
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`flex items-center gap-3 rounded-lg ${m.bgColor} px-3 py-2.5 transition-colors`}
              >
                <div className={`flex size-8 items-center justify-center rounded-full ${m.bgColor}`}>
                  <Icon className={`size-4 ${m.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.value} · {m.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

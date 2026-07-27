"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MockInterviewConfig } from "@/lib/mockTest";
import { LEVELS } from "@/lib/mockTest";
import CompanyCombobox from "./CompanyCombobox";

const DURATIONS = [15, 30, 45, 60] as const;

interface WizardStepDetailsProps {
  config: MockInterviewConfig;
  setConfig: React.Dispatch<React.SetStateAction<MockInterviewConfig>>;
  companies: string[];
  onNext: () => void;
  onCancel: () => void;
}

export default function WizardStepDetails({ config, setConfig, companies, onNext, onCancel }: WizardStepDetailsProps) {
  const [customDuration, setCustomDuration] = useState("");

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Interview Details</h3>
        <p className="text-xs text-muted-foreground mt-1">Basic information about the role you&apos;re preparing for.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Target Company</label>
          <CompanyCombobox
            value={config.company}
            companies={companies}
            onChange={(company) => setConfig((p) => ({ ...p, company }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <Input
            value={config.role}
            onChange={(e) => setConfig((p) => ({ ...p, role: e.target.value }))}
            placeholder="e.g. SDE II"
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Level</label>
          <select
            value={config.level}
            onChange={(e) => setConfig((p) => ({ ...p, level: e.target.value }))}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Any Level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Duration</label>
          <div className="flex gap-1.5 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { setConfig((p) => ({ ...p, durationMinutes: d })); setCustomDuration(""); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  config.durationMinutes === d && !customDuration
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent text-muted-foreground"
                }`}
              >
                {d}m
              </button>
            ))}
            <div className="relative flex-1 min-w-[70px]">
              <input
                type="number"
                min={1}
                max={180}
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  const v = parseInt(e.target.value);
                  if (v > 0) setConfig((p) => ({ ...p, durationMinutes: v }));
                }}
                placeholder="Custom"
                className="w-full h-7 px-2 text-xs rounded-lg border border-border bg-secondary text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            {config.durationMinutes} minute{config.durationMinutes !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onNext}>Next: Sections</Button>
      </div>
    </div>
  );
}

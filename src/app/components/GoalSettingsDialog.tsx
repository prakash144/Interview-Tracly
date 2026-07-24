"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { GoalSettings } from "@/hooks/useGoals";

interface GoalSettingsDialogProps {
  open: boolean;
  settings: GoalSettings;
  onSave: (s: GoalSettings) => void;
  onClose: () => void;
}

const FIELDS: { key: keyof GoalSettings; label: string; min: number; max: number; isDate?: boolean }[] = [
  { key: "dailyTarget", label: "Daily Problems", min: 1, max: 50 },
  { key: "mediumTarget", label: "Medium Problems", min: 0, max: 20 },
  { key: "companyTarget", label: "Company Problems", min: 0, max: 20 },
  { key: "revisionTarget", label: "Revision Problems", min: 0, max: 20 },
  { key: "targetTotal", label: "Target Total Problems", min: 1, max: 1000 },
  { key: "weeklyTarget", label: "Weekly Goal", min: 1, max: 100 },
  { key: "monthlyTarget", label: "Monthly Goal", min: 1, max: 500 },
  { key: "targetDate", label: "Target Interview Date", min: 0, max: 0, isDate: true },
];

const GoalSettingsDialog = ({ open, settings, onSave, onClose }: GoalSettingsDialogProps) => {
  const [draft, setDraft] = useState(() => ({ ...settings }));
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    if (open) {
      setDraft({ ...settings });
      setDialogKey((k) => k + 1);
    }
  }, [open, settings]);

  if (!open) return null;

  const handleChange = (key: keyof GoalSettings, raw: string) => {
    if (raw === "") return;
    const num = Number(raw);
    if (!isNaN(num)) {
      setDraft((prev) => ({ ...prev, [key]: Math.max(0, num) }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div key={dialogKey} className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Goal Settings</h2>
          <button type="button" onClick={onClose} className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{field.label}</label>
              <input
                type={field.isDate ? "date" : "number"}
                min={field.min}
                max={field.max}
                value={draft[field.key] as string | number}
                onChange={(e) => {
                  if (field.isDate) {
                    setDraft((prev) => ({ ...prev, [field.key]: e.target.value }));
                  } else {
                    handleChange(field.key, e.target.value);
                  }
                }}
                className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-success transition-shadow"
              />
            </div>
          ))}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.reminderEnabled}
                onChange={(e) => setDraft((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                className="rounded border-border" />
              <span className="text-xs text-muted-foreground">Send browser notification if behind daily pace</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onSave(draft); onClose(); }}
            className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-success-foreground hover:brightness-110 transition-all"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalSettingsDialog;

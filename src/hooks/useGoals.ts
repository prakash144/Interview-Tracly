"use client";

import { useState, useCallback } from "react";

export interface GoalSettings {
  dailyTarget: number;
  mediumTarget: number;
  companyTarget: number;
  revisionTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  targetDate: string;
  targetTotal: number;
  reminderEnabled: boolean;
}

const STORAGE_KEY = "goal-settings";

const DEFAULT_SETTINGS: GoalSettings = {
  dailyTarget: 3,
  mediumTarget: 1,
  companyTarget: 1,
  revisionTarget: 1,
  weeklyTarget: 10,
  monthlyTarget: 30,
  targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  targetTotal: 150,
  reminderEnabled: false,
};

function loadSettings(): GoalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: GoalSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function useGoals() {
  const [settings, setSettings] = useState<GoalSettings>(loadSettings);

  const update = useCallback((next: GoalSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset };
}

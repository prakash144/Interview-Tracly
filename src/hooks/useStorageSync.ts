"use client";

import { useEffect, useState } from "react";
import type { CodingPrefs } from "@/lib/codingPreferences";

const PREFS_KEY = "coding-preferences";

export function useStorageSync() {
  const [prefs, setPrefsState] = useState<CodingPrefs | null>(null);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PREFS_KEY && e.newValue) {
        try {
          setPrefsState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { syncedPrefs: prefs };
}

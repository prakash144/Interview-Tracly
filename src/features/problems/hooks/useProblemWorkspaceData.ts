"use client";

import { useEffect, useState } from "react";
import useFetchQuestions from "@/app/services/fetchQuestions";
import { fetchLastUpdated } from "@/app/services/fetchLastUpdated";
import { fetchUnifiedProblems } from "@/app/services/fetchUnifiedProblems";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProblemProgress } from "@/hooks/useProblemProgress";
import { useStorageSync } from "@/hooks/useStorageSync";
import { loadCodingPrefs } from "@/lib/codingPreferences";
import { useProblemFilters } from "./useProblemFilters";
import type { Problem } from "@/lib/progressTypes";

export const useProblemWorkspaceData = () => {
  const [selectedCompany, setSelectedCompany] = useState(() => (loadCodingPrefs()?.company ?? "Google"));
  const [selectedList, setSelectedList] = useState(() => (loadCodingPrefs()?.sheet ?? "5. All.csv"));

  const { syncedPrefs } = useStorageSync();
  useEffect(() => {
    if (syncedPrefs) {
      setSelectedCompany(syncedPrefs.company);
      setSelectedList(syncedPrefs.sheet);
    }
  }, [syncedPrefs]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [unifiedProblems, setUnifiedProblems] = useState<Problem[]>([]);
  const [unifiedLoading, setUnifiedLoading] = useState(true);
  const [unifiedError, setUnifiedError] = useState<string>("");

  const filters = useProblemFilters();
  const debouncedSearchQuery = useDebouncedValue(filters.searchTerm, 500);
  const auth = useAuth();

  const csvUrl = `https://raw.githubusercontent.com/prakash144/leetcode-company-wise-problems/main/${selectedCompany}/${selectedList}`;
  const questionsState = useFetchQuestions(csvUrl, {
    company: selectedCompany,
    list: selectedList,
  });
  const progress = useProblemProgress(auth.user?.uid);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUnifiedLoading(true);
      setUnifiedError("");
      try {
        const problems = await fetchUnifiedProblems();
        if (!cancelled) setUnifiedProblems(problems);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        if (!cancelled) setUnifiedError(msg);
        console.error("Failed to fetch unified problems:", msg);
      }
      if (!cancelled) setUnifiedLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLastUpdated = async () => {
      setLastUpdated(null);
      const date = await fetchLastUpdated(selectedCompany, selectedList);

      if (!cancelled) {
        setLastUpdated(date);
      }
    };

    loadLastUpdated();

    return () => {
      cancelled = true;
    };
  }, [selectedCompany, selectedList]);

  return {
    auth,
    csvUrl,
    debouncedSearchQuery,
    filters,
    lastUpdated,
    progress,
    questionsState,
    unifiedProblems,
    unifiedLoading,
    unifiedError,
    selectedCompany,
    selectedList,
    setSelectedCompany,
    setSelectedList,
  };
};

export type ProblemWorkspaceData = ReturnType<typeof useProblemWorkspaceData>;

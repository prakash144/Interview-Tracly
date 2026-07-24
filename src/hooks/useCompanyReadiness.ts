"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Problem, ProgressMap } from "@/lib/progressTypes";
import { getProblemId } from "@/lib/problemId";

interface CsvItem {
  Title: string;
  Link: string;
  Difficulty: string;
  Topics: string;
  Frequency: string;
  "Acceptance Rate": string;
}

export interface CompanyStat {
  company: string;
  total: number;
  solved: number;
  loading: boolean;
  error?: string;
}

export interface TopicBreakdown {
  topic: string;
  total: number;
  solved: number;
}

export interface DifficultyBreakdown {
  Easy: number;
  Medium: number;
  Hard: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

async function fetchCSVText(url: string): Promise<string> {
  const cacheKey = `interviewtracly:csv:${url}`;
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const text = await res.text();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(cacheKey, text);
  }
  return text;
}

async function parseCSV(text: string): Promise<Problem[]> {
  const Papa = await import("papaparse");
  const result = Papa.parse<CsvItem>(text, { header: true, skipEmptyLines: true });
  return result.data.map((item) => ({
    problemId: getProblemId(item.Link || "", item.Title || ""),
    title: item.Title || "",
    link: item.Link || "",
    difficulty: item.Difficulty || "",
    topicTag: item.Topics || "",
    topics: (item.Topics || "").split(",").map((t) => t.trim()).filter(Boolean),
    company: "",
    list: "",
    frequency: item.Frequency || "",
    acceptanceRate: item["Acceptance Rate"] || "",
  }));
}

export function useCompanyReadiness(progressMap: ProgressMap) {
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [companyData, setCompanyData] = useState<Map<string, { stat: CompanyStat; problems: Problem[] }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [fetchingCompany, setFetchingCompany] = useState<string | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { fetchCompanyList } = await import("../app/services/fetchCompanies");
        const list = await fetchCompanyList();
        if (!cancelled) setAllCompanies(list);
      } catch (err) {
        if (!cancelled) {
          setAllCompanies(["Google", "Amazon", "Microsoft", "Meta", "Apple"]);
          console.warn("Failed to fetch company list, using defaults:", err);
        }
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const loadCompanyData = useCallback(async (company: string) => {
    if (fetchedRef.current.has(company)) return;
    fetchedRef.current.add(company);
    setFetchingCompany(company);
    try {
      const url = `https://raw.githubusercontent.com/prakash144/leetcode-company-wise-problems/main/${encodeURIComponent(company)}/5.%20All.csv`;
      const text = await fetchCSVText(url);
      const problems = await parseCSV(text);
      const solved = problems.filter((p) => progressMap[p.problemId]?.solved).length;
      setCompanyData((prev) => {
        const next = new Map(prev);
        next.set(company, {
          stat: { company, total: problems.length, solved, loading: false },
          problems,
        });
        return next;
      });
    } catch {
      setCompanyData((prev) => {
        const next = new Map(prev);
        next.set(company, {
          stat: { company, total: 0, solved: 0, loading: false, error: "Failed to load" },
          problems: [],
        });
        return next;
      });
    }
    setFetchingCompany(null);
  }, [progressMap]);

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyData(selectedCompany);
    }
  }, [selectedCompany, loadCompanyData]);

  const selectCompany = useCallback((company: string | null) => {
    setSelectedCompany(company);
  }, []);

  const stats = useMemo(() => {
    return Array.from(companyData.values()).map((d) => d.stat);
  }, [companyData]);

  const allProblems = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const [company, data] of companyData) {
      map.set(company, data.problems);
    }
    return map;
  }, [companyData]);

  const selectedProblems = selectedCompany ? allProblems.get(selectedCompany) ?? null : null;

  const difficultyBreakdown = useMemo((): DifficultyBreakdown | null => {
    if (!selectedProblems) return null;
    const breakdown = { Easy: 0, Medium: 0, Hard: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
    for (const p of selectedProblems) {
      const d = p.difficulty as string;
      if (d === "Easy") { breakdown.Easy++; if (progressMap[p.problemId]?.solved) breakdown.easySolved++; }
      else if (d === "Medium") { breakdown.Medium++; if (progressMap[p.problemId]?.solved) breakdown.mediumSolved++; }
      else if (d === "Hard") { breakdown.Hard++; if (progressMap[p.problemId]?.solved) breakdown.hardSolved++; }
    }
    return breakdown;
  }, [selectedProblems, progressMap]);

  const topicBreakdown = useMemo((): TopicBreakdown[] | null => {
    if (!selectedProblems) return null;
    const map = new Map<string, { total: number; solved: number }>();
    for (const p of selectedProblems) {
      for (const topic of p.topics) {
        if (!topic) continue;
        const entry = map.get(topic) ?? { total: 0, solved: 0 };
        entry.total++;
        if (progressMap[p.problemId]?.solved) entry.solved++;
        map.set(topic, entry);
      }
    }
    return Array.from(map.entries())
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [selectedProblems, progressMap]);

  const solvedSet = useMemo(() => {
    const set = new Set<string>();
    for (const [id, p] of Object.entries(progressMap)) {
      if (p.solved) set.add(id);
    }
    return set;
  }, [progressMap]);

  return {
    allCompanies,
    stats,
    loading,
    selectedCompany,
    selectCompany,
    selectedProblems,
    difficultyBreakdown,
    topicBreakdown,
    solvedSet,
    loadCompanyData,
    fetchingCompany,
  };
}

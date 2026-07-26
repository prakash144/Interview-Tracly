"use client";

export interface CodingPrefs {
  company: string;
  sheet: string;
  sorting: string;
  pageSize: number;
}

export const COMPANIES = [
  "Google", "Microsoft", "Apple", "Amazon", "Meta", "Tesla", "IBM", "Intel", "Oracle", "Samsung",
  "Stripe", "Airbnb", "OpenAI", "Notion", "Figma", "Duolingo", "Canva", "Plaid", "Gusto", "Razorpay",
  "McKinsey", "BCG", "Bain", "Deloitte", "PwC", "EY", "KPMG", "Accenture", "ZS Associates", "Capgemini",
  "Spotify", "Slack", "Reddit", "Zoom", "Pinterest", "Atlassian", "Salesforce", "Cisco", "Twilio", "Shopify",
];

export const SHEET_OPTIONS = [
  { label: "Last 30 Days", value: "1. Thirty Days.csv" },
  { label: "Last 3 Months", value: "2. Three Months.csv" },
  { label: "Last 6 Months", value: "3. Six Months.csv" },
  { label: "More Than 6 Months", value: "4. More Than Six Months.csv" },
  { label: "All Time", value: "5. All.csv" },
] as const;

export const SORT_OPTIONS = ["Frequency", "Acceptance Rate"] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const PREFS_KEY = "coding-preferences";

const DEFAULTS: CodingPrefs = {
  company: "Google",
  sheet: "5. All.csv",
  sorting: "Frequency",
  pageSize: 25,
};

function normalizeSheet(sheet: string): string {
  if (sheet === "All.csv") return "5. All.csv";
  return sheet;
}

export function loadCodingPrefs(): CodingPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULTS, ...parsed };
    merged.sheet = normalizeSheet(merged.sheet);
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export function saveCodingPrefs(prefs: CodingPrefs) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* localStorage unavailable */ }
}

export function mapSortingToState(sorting: string): { sortBy: "frequency" | "acceptanceRate" | null; sortDirection: "asc" | "desc" } {
  switch (sorting) {
    case "Frequency":
      return { sortBy: "frequency", sortDirection: "desc" };
    case "Acceptance Rate":
      return { sortBy: "acceptanceRate", sortDirection: "desc" };
    default:
      return { sortBy: null, sortDirection: "asc" };
  }
}

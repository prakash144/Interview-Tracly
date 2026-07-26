export interface CmdResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  group: string;
  priority: number;
  onSelect: () => void;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  onSelect: () => void;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  keywords: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard", keywords: ["home", "overview", "stats", "main"] },
  { label: "Problems", href: "/problems", icon: "ListChecks", keywords: ["questions", "leetcode", "coding", "algorithms"] },
  { label: "Sprints", href: "/sprints", icon: "Kanban", keywords: ["planning", "timebox", "focus", "interview prep"] },
  { label: "Tracks", href: "/tracks", icon: "Layers", keywords: ["learning paths", "resources", "topics", "dsa", "system design"] },
  { label: "Progress", href: "/progress", icon: "BarChart3", keywords: ["charts", "stats", "history", "analytics"] },
  { label: "Activity", href: "/activity", icon: "CalendarDays", keywords: ["calendar", "heatmap", "daily", "streak"] },
  { label: "Readiness", href: "/readiness", icon: "Crosshair", keywords: ["score", "preparation", "company", "interview ready"] },
  { label: "Mock Test", href: "/mock-test", icon: "Timer", keywords: ["practice", "timed", "simulation", "exam"] },
  { label: "Archive", href: "/archive", icon: "Archive", keywords: ["trash", "deleted", "archived", "restore", "history"] },
  { label: "Collections", href: "/collections", icon: "BookMarked", keywords: ["lists", "custom", "saved", "organized"] },
  { label: "Favorites", href: "/favorites", icon: "Heart", keywords: ["bookmarked", "saved", "pinned"] },
  { label: "Settings", href: "/settings", icon: "Settings", keywords: ["preferences", "config", "theme", "account"] },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "nav-sprints", label: "Go to Sprints", description: "Open sprint planning", icon: "Kanban", keywords: ["sprints", "planning", "timebox"], onSelect: () => window.location.href = "/sprints" },
  { id: "nav-problems", label: "Go to Problems", description: "Browse coding problems", icon: "ListChecks", keywords: ["problems", "questions", "coding"], onSelect: () => window.location.href = "/problems" },
  { id: "nav-readiness", label: "Go to Readiness", description: "Check interview readiness", icon: "Crosshair", keywords: ["readiness", "score", "preparedness"], onSelect: () => window.location.href = "/readiness" },
  { id: "nav-mock", label: "Start Mock Test", description: "Simulate timed interview", icon: "Timer", keywords: ["mock", "test", "practice", "timed", "interview"], onSelect: () => window.location.href = "/mock-test" },
  { id: "nav-archive", label: "Go to Archive", description: "View archived items", icon: "Archive", keywords: ["archive", "trash", "deleted", "restore"], onSelect: () => window.location.href = "/archive" },
  { id: "nav-activity", label: "View Activity", description: "Check your daily progress", icon: "CalendarDays", keywords: ["activity", "calendar", "heatmap", "streak"], onSelect: () => window.location.href = "/activity" },
  { id: "nav-tracks", label: "Open Tracks", description: "Browse learning tracks", icon: "Layers", keywords: ["tracks", "learning", "resources", "topics"], onSelect: () => window.location.href = "/tracks" },
];

export const RECENT_ITEMS_KEY = "interviewtracly:recent-items";

export interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  href?: string;
  timestamp: number;
}

export function loadRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_ITEMS_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentItem(item: Omit<RecentItem, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const items = loadRecentItems().filter((i) => i.id !== item.id);
    items.unshift({ ...item, timestamp: Date.now() });
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items.slice(0, 20)));
  } catch {
    /* localStorage unavailable */
  }
}

export function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const words = q.split(/\s+/);
  const lower = text.toLowerCase();
  return words.every((w) => lower.includes(w));
}

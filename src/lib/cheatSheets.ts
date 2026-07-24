export interface CheatSheet {
  id: string;
  company: string;
  title: string;
  content: string;
  topics: string[];
  favorited: boolean;
  createdAt: number;
  updatedAt: number;
}

export function toggleCheatSheetFavorite(id: string): CheatSheet | null {
  const all = loadCheatSheets();
  const sheet = all.find((s) => s.id === id);
  if (!sheet) return null;
  sheet.favorited = !sheet.favorited;
  sheet.updatedAt = Date.now();
  saveCheatSheet(sheet);
  return sheet;
}

const STORAGE_KEY = "cheat-sheets";

export function loadCheatSheets(): CheatSheet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCheatSheet(sheet: CheatSheet) {
  if (typeof window === "undefined") return;
  const all = loadCheatSheets();
  const idx = all.findIndex((s) => s.id === sheet.id);
  if (idx >= 0) all[idx] = sheet;
  else all.push(sheet);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function deleteCheatSheet(id: string) {
  if (typeof window === "undefined") return;
  const all = loadCheatSheets().filter((s) => s.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function generateCheatSheetId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const SAMPLE_SEED_KEY = "cheat-sheets-seeded";

const SAMPLE_SHEETS: CheatSheet[] = [
  {
    id: "cs_sample_1",
    company: "Google",
    title: "System Design Quick Ref",
    content: `## Key Design Principles\n- **Scalability**: Horizontal scaling, sharding, caching\n- **Availability**: Redundancy, failover, health checks\n- **Consistency**: Strong vs eventual, CAP theorem\n\n## Common Patterns\n- **Read-heavy**: CDN, cache (Redis), read replicas\n- **Write-heavy**: Queue (Kafka), batch processing\n- **Real-time**: WebSocket, SSE, polling\n\n## Estimation Guidelines\n| Resource | Capacity |\n|----------|----------|\n| QPS per server | ~10K |\n| DB connections | ~5K |\n| Cache hit ratio | >95% |`,
    topics: ["System Design", "Scalability", "Architecture"],
    favorited: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "cs_sample_2",
    company: "Meta",
    title: "Frontend Interview Prep",
    content: `## Core Concepts\n- **Component Lifecycle**: Mount → Update → Unmount\n- **State Management**: Lifting state, context, reducers\n- **Performance**: Memoization, virtualization, code splitting\n\n## Common Topics\n- Debouncing / Throttling\n- Event delegation\n- CSS layout (Flexbox, Grid)\n- Web vitals (LCP, FID, CLS)\n\n## React Patterns\n\`\`\`tsx\nconst useDebounce = (value: string, delay: number) => {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n};\n\`\`\``,
    topics: ["Frontend", "React", "JavaScript"],
    favorited: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "cs_sample_3",
    company: "Amazon",
    title: "Leadership Principles Cheat Sheet",
    content: `## Core LPs\n1. **Customer Obsession** — Start with the customer and work backward\n2. **Ownership** — Never say "that's not my job"\n3. **Invent and Simplify** — Seek simple solutions\n4. **Are Right, A Lot** — Strong judgment, open to new data\n5. **Learn and Be Curious** — Never stop learning\n6. **Hire and Develop the Best** — Raise the bar\n7. **Insist on the Highest Standards** — Continually raise the bar\n8. **Think Big** — A small vision is a disease\n9. **Bias for Action** — Speed matters\n10. **Frugality** — Do more with less\n\n## STAR Examples for Each\n| LP | Situation |\n|----|-----------|\n| Customer Obsession | Reduced bug resolution time by 40% |\n| Ownership | Spearheaded migration with no downtime |`,
    topics: ["Leadership", "Behavioral", "Amazon"],
    favorited: false,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "cs_sample_4",
    company: "General",
    title: "DSA Time Complexities",
    content: `## Arrays & Strings\n| Operation | Time |\n|-----------|------|\n| Access | O(1) |\n| Search (unsorted) | O(n) |\n| Insert/Delete (end) | O(1) |\n| Insert/Delete (middle) | O(n) |\n\n## Trees\n| Operation | BST (balanced) |\n|-----------|---------------|\n| Search | O(log n) |\n| Insert | O(log n) |\n| Delete | O(log n) |\n\n## Graphs\n| Algorithm | Time |\n|-----------|------|\n| BFS/DFS | O(V + E) |\n| Dijkstra | O(E log V) |\n| Floyd-Warshall | O(V³) |\n\n## Key Techniques\n- **Two Pointers**: O(n) for sorted arrays\n- **Sliding Window**: O(n) for subarray problems\n- **Binary Search**: O(log n) for monotonic data\n- **Dynamic Programming**: O(n²) typical`,
    topics: ["Algorithms", "Data Structures", "Cheat Sheet"],
    favorited: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 4,
  },
];

export function seedSampleCheatSheets() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SAMPLE_SEED_KEY)) return;
  const existing = loadCheatSheets();
  if (existing.length > 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SHEETS));
    localStorage.setItem(SAMPLE_SEED_KEY, "true");
  } catch {}
}

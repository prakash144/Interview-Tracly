export interface BehavioralEntry {
  id: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  company: string;
  favorited: boolean;
  createdAt: number;
  updatedAt: number;
}

export function toggleEntryFavorite(id: string): BehavioralEntry | null {
  const all = loadEntries();
  const entry = all.find((e) => e.id === id);
  if (!entry) return null;
  entry.favorited = !entry.favorited;
  entry.updatedAt = Date.now();
  saveEntry(entry);
  return entry;
}

const STORAGE_KEY = "behavioral-entries";

const COMPETENCIES = [
  "Leadership", "Conflict Resolution", "Communication", "Problem Solving",
  "Teamwork", "Initiative", "Adaptability", "Technical Decision",
  "Failure/Setback", "Mentorship", "Cross-functional", "Ambiguity",
];

export function getCompetencies() { return COMPETENCIES; }

export function loadEntries(): BehavioralEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveEntry(entry: BehavioralEntry) {
  if (typeof window === "undefined") return;
  const all = loadEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function deleteEntry(id: string) {
  if (typeof window === "undefined") return;
  const all = loadEntries().filter((e) => e.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function generateEntryId(): string {
  return `beh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const SAMPLE_SEED_KEY = "behavioral-seeded";

const SAMPLE_ENTRIES: BehavioralEntry[] = [
  {
    id: "beh_sample_1",
    question: "Tell me about a time you led a team through a difficult project",
    situation: "Our team was tasked with migrating a monolith to microservices within 3 months, but we were already 2 weeks behind schedule due to unclear requirements.",
    task: "As tech lead, I needed to reorganize the team, clarify requirements with stakeholders, and deliver the core migration on time.",
    action: "I split the team into 3 squads (API, Data, DevOps), set up daily standups with clear owners, created a dependency map, and negotiated a phased rollout instead of big-bang. I also paired junior engineers with seniors for knowledge transfer.",
    result: "We delivered the core migration in 10 weeks (2 weeks ahead of revised schedule). Production incidents dropped 60% post-migration. Two juniors were promoted to mid-level the next quarter.",
    tags: ["Leadership", "Technical Decision", "Communication"],
    company: "Google",
    favorited: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "beh_sample_2",
    question: "Tell me about a time you disagreed with a manager or peer",
    situation: "My product manager wanted to ship a feature with known performance issues to meet a quarterly OKR deadline.",
    task: "I needed to push back without damaging the relationship, and find a solution that satisfied both business and technical requirements.",
    action: "I built a quick benchmark showing the feature would degrade p95 latency by 200ms. I proposed shipping it behind a feature flag for 10% of users first, with a 2-week follow-up to optimize. I also offered to work weekends to accelerate the fix.",
    result: "The PM agreed to the phased rollout. The feature launched on time, we caught the perf issues in canary, and fixed them before full rollout. The PM later thanked me and we established a 'flag-first' policy for future features.",
    tags: ["Conflict Resolution", "Communication", "Initiative"],
    company: "Meta",
    favorited: false,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: "beh_sample_3",
    question: "Tell me about a time you failed and what you learned",
    situation: "I proposed and led a rewrite of our authentication service using a new framework, expecting it to be faster and more maintainable.",
    task: "I was responsible for the technical design, implementation, and migration of 12 services that depended on the auth service.",
    action: "I spent 3 weeks on the rewrite without sufficient testing. When we cut over, 3 edge cases I hadn't accounted for caused login failures for ~5% of users. I had to roll back within 2 hours.",
    result: "I learned to prototype before committing to rewrites, write integration tests first, and do incremental migrations. I later re-architected the auth service piece by piece with 99.99% uptime during migration. The experience taught me the value of 'strangler fig' pattern over big-bang rewrites.",
    tags: ["Failure/Setback", "Technical Decision", "Problem Solving"],
    company: "Amazon",
    favorited: false,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "beh_sample_4",
    question: "Describe a time you had to explain a complex technical concept to a non-technical audience",
    situation: "Our executive team was considering switching cloud providers, and I was asked to explain why our current architecture was locked in and what migration would cost.",
    task: "I needed to explain cloud lock-in, API dependencies, and migration risk to VPs with no engineering background in under 15 minutes.",
    action: "I built a simple analogy comparing our cloud setup to 'moving a house while living in it.' I created a one-page visual showing dependencies as colored blocks, cost implications as simple tiers, and proposed a 3-phase migration with clear go/no-go gates.",
    result: "The execs understood the tradeoffs clearly. They opted for a hybrid approach instead of full migration, saving 18 months of engineering time. The VP of Product later asked me to present at the all-hands on technical strategy monthly.",
    tags: ["Communication", "Leadership", "Adaptability"],
    company: "Stripe",
    favorited: false,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "beh_sample_5",
    question: "Tell me about a time you went above and beyond your role",
    situation: "Our team's on-call rotation was burning people out — engineers were getting paged 3-4 times a night, leading to low morale and attrition.",
    task: "No one owned the on-call experience. I took the initiative to fix it even though it wasn't in my sprint.",
    action: "I analyzed 6 months of pager data, identified the top 3 noise sources, automated responses for 2 of them (auto-acknowledge known false alarms), wrote runbooks for the third, and proposed a 'follow-the-sun' rotation using our India office.",
    result: "Pages dropped 70%, on-call satisfaction scores went from 2.1/5 to 4.3/5. I presented the approach at company-wide engineering review and it was adopted by 3 other teams. I was promoted to Senior Engineer the next cycle.",
    tags: ["Initiative", "Problem Solving", "Leadership"],
    company: "Uber",
    favorited: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

export function seedSampleEntries() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SAMPLE_SEED_KEY)) return;
  const existing = loadEntries();
  if (existing.length > 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ENTRIES));
    localStorage.setItem(SAMPLE_SEED_KEY, "true");
  } catch {}
}

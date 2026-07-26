import type { TrackId } from "./interviewTracks";
import type { Timestamp } from "firebase/firestore";

export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type ResourceStatus = "not-started" | "in-progress" | "completed";

export type LinkType = "youtube" | "blog" | "website" | "github" | "article" | "course" | "other";

export interface ResourceLink {
  type: LinkType;
  url: string;
  label: string;
}

export const LINK_TYPE_ICONS: Record<LinkType, string> = {
  youtube: "🎥",
  blog: "📝",
  website: "🌐",
  github: "🐙",
  article: "📄",
  course: "🎓",
  other: "🔗",
};

export const LINK_LABELS: Record<LinkType, string> = {
  youtube: "YouTube",
  blog: "Blog",
  website: "Website",
  github: "GitHub",
  article: "Article",
  course: "Course",
  other: "Other",
};

export const STATUS_LABELS: Record<ResourceStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed": "Completed",
};

export const STATUS_COLORS: Record<ResourceStatus, string> = {
  "not-started": "text-muted-foreground bg-secondary border-border",
  "in-progress": "text-info bg-info/10 border-info/20",
  "completed": "text-success bg-success/10 border-success/20",
};

export interface KnowledgeResource {
  id: string;
  title: string;
  company: string;
  track: TrackId;
  difficulty: DifficultyLevel;
  tags: string[];
  resourceLinks: ResourceLink[];
  askedAt: string;
  notes: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeResourceInput {
  title: string;
  company?: string;
  track: TrackId;
  difficulty?: DifficultyLevel;
  tags?: string[];
  resourceLinks?: ResourceLink[];
  askedAt?: string;
  notes?: string;
}

export interface UserResourceProgress {
  resourceId: string;
  status: ResourceStatus;
  inRevisionList: boolean;
  favorited: boolean;
  personalNotes: string;
  statusChangedAt: Timestamp | null;
  revisionAddedAt: Timestamp | null;
  favoritedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export type ResourceProgressMap = Record<string, UserResourceProgress>;

export const RESOURCES_COLLECTION = "resources";

export const COMPANIES = [
  "Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Uber",
  "Twitter/X", "ByteDance", "Stripe", "Airbnb", "Spotify", "LinkedIn",
  "Coinbase", "Pinterest", "Slack", "Snapchat", "Reddit", "Dropbox",
  "Palantir", "Databricks", "Confluent", "Salesforce", "Oracle",
  "General", "Atlassian", "Zoom", "Robinhood", "Nvidia", "Tesla",
];

export const DSA_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "Sliding Window Pattern",
    company: "General",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Sliding Window", "Array", "Two Pointers"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=sliding-window", label: "Sliding Window Masterclass" },
      { type: "blog", url: "https://blog.example.com/sliding-window-patterns", label: "Common Sliding Window Patterns" },
    ],
    askedAt: "2024-05",
    notes: "Fixed-size and variable-size windows. Used for subarray/substring problems. Key insight: when expanding/shrinking window, maintain a condition invariant. Template: while expanding, while condition violated shrink.",
  },
  {
    title: "Fast & Slow Pointers (Floyd's Algorithm)",
    company: "Amazon",
    track: "dsa",
    difficulty: "Easy",
    tags: ["Linked List", "Two Pointers", "Cycle Detection"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=floyd-cycle", label: "Floyd's Cycle Detection" },
    ],
    askedAt: "2024-05",
    notes: "Detect cycle in linked list, find middle element, find start of cycle. Tortoise and hare pointer technique. O(n) time, O(1) space.",
  },
  {
    title: "Binary Search on Answer",
    company: "Meta",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Binary Search", "Searching", "Optimization"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/binary-search-on-answer", label: "Binary Search on Answer Pattern" },
    ],
    askedAt: "2024-04",
    notes: "When answer space is monotonic, binary search the answer. Common in 'minimize max' or 'maximize min' problems. Identify feasible() function that can be checked in O(n).",
  },
  {
    title: "Dynamic Programming Patterns",
    company: "Google",
    track: "dsa",
    difficulty: "Hard",
    tags: ["DP", "Optimization", "Memoization"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=dp-patterns", label: "DP Patterns Deep Dive" },
      { type: "blog", url: "https://blog.example.com/dp-patterns", label: "5 Essential DP Patterns" },
    ],
    askedAt: "2024-03",
    notes: "Top-down vs bottom-up. Common patterns: 0/1 Knapsack, Unbounded Knapsack, Fibonacci-style, LCS, LIS, Palindromic. Identify state (dp[i][j]) and recurrence relation.",
  },
  {
    title: "Graph Traversal: BFS & DFS",
    company: "Microsoft",
    track: "dsa",
    difficulty: "Easy",
    tags: ["Graph", "BFS", "DFS", "Traversal"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=graph-bfs-dfs", label: "BFS & DFS Visualized" },
    ],
    askedAt: "2024-04",
    notes: "BFS uses queue — shortest path in unweighted graphs. DFS uses stack/recursion — topological sort, connected components. BFS space is O(width), DFS space is O(depth).",
  },
  {
    title: "Trie (Prefix Tree)",
    company: "Uber",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Trie", "String", "Prefix"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/trie-data-structure", label: "Trie Implementation Guide" },
    ],
    askedAt: "2024-03",
    notes: "O(L) search/insert/prefix lookup. Used in autocomplete, spell check, IP routing. Node has children map and isEnd flag. Can compress with radix tree for memory.",
  },
  {
    title: "Union-Find / Disjoint Set Union",
    company: "Netflix",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Union Find", "DSU", "Graph", "Connectivity"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=union-find", label: "Union Find Explained" },
    ],
    askedAt: "2024-02",
    notes: "Path compression + union by rank/size = near O(1). Used for dynamic connectivity, Kruskal's MST, number of islands (with grid mapping), detecting cycles in undirected graph.",
  },
  {
    title: "Segment Tree / Fenwick Tree",
    company: "Google",
    track: "dsa",
    difficulty: "Hard",
    tags: ["Segment Tree", "Range Query", "BIT", "Fenwick"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/segment-tree", label: "Segment Tree from Scratch" },
      { type: "article", url: "https://blog.example.com/fenwick-tree", label: "Fenwick Tree vs Segment Tree" },
    ],
    askedAt: "2024-01",
    notes: "Range sum/update in O(log n). Segment tree: 4n array, recursive build/query/update. Fenwick: n+1 array, i += i&-i for update, i -= i&-i for query. Fenwick simpler but limited to prefix operations.",
  },
  {
    title: "Topological Sort (Kahn's Algorithm)",
    company: "ByteDance",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Topological Sort", "Graph", "DAG", "Kahn"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=topological-sort", label: "Topological Sort Tutorial" },
    ],
    askedAt: "2024-02",
    notes: "In-degree based BFS. Process nodes with in-degree 0, decrement neighbors. If queue empties before all nodes processed → cycle exists. Alternative: DFS with post-order reversal.",
  },
  {
    title: "Monotonic Stack / Queue",
    company: "Amazon",
    track: "dsa",
    difficulty: "Medium",
    tags: ["Stack", "Monotonic", "Next Greater Element"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/monotonic-stack", label: "Monotonic Stack Pattern" },
    ],
    askedAt: "2024-05",
    notes: "Next greater/smaller element, largest rectangle in histogram, sliding window maximum (deque). Maintain increasing/decreasing order — pop while condition violated. O(n) time.",
  },
];

export const SYSTEM_DESIGN_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "Design Google Pay / Payment System",
    company: "Google",
    track: "system-design",
    difficulty: "Hard",
    tags: ["Payment", "Fintech", "Distributed Transactions", "Idempotency"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=payment-system-design", label: "Payment System Deep Dive" },
      { type: "blog", url: "https://blog.example.com/payment-system", label: "Building Reliable Payment Systems" },
    ],
    askedAt: "2024-03",
    notes: "Key aspects: idempotency keys, two-phase commit, ledger service, payment reconciliation, handling duplicate requests, eventual consistency",
  },
  {
    title: "Design Uber/Lyft Ride Hailing",
    company: "Uber",
    track: "system-design",
    difficulty: "Hard",
    tags: ["Real-time", "Matching", "Geolocation", "GPS"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=uber-design", label: "Uber System Design" },
      { type: "blog", url: "https://blog.example.com/uber-architecture", label: "Uber's Real-time Architecture" },
    ],
    askedAt: "2024-02",
    notes: "FourSquare grid for geohashing, Kafka for real-time location streaming, surge pricing algorithm, ETA calculation, driver-rider matching",
  },
  {
    title: "Design WhatsApp / Messenger",
    company: "Meta",
    track: "system-design",
    difficulty: "Hard",
    tags: ["Chat", "WebSocket", "Real-time", "End-to-End Encryption"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=whatsapp-design", label: "WhatsApp Architecture" },
      { type: "article", url: "https://blog.example.com/whatsapp-encryption", label: "End-to-End Encryption Explained" },
    ],
    askedAt: "2024-01",
    notes: "WebSocket persistent connections, message ordering, last-seen presence, typing indicators, end-to-end encryption with Signal protocol, group chats",
  },
  {
    title: "Design TikTok / Video Feed",
    company: "ByteDance",
    track: "system-design",
    difficulty: "Medium",
    tags: ["Feed", "Recommendation", "Content Delivery", "CDN"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=tiktok-design", label: "TikTok Recommendation System" },
    ],
    askedAt: "2024-04",
    notes: "For-you feed algorithm, content-based recommendations, user embedding vectors, CDN for video delivery, pre-fetching, watch time tracking",
  },
  {
    title: "Design Netflix / Video Streaming",
    company: "Netflix",
    track: "system-design",
    difficulty: "Hard",
    tags: ["CDN", "Streaming", "Content Delivery", "Recommendation"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/netflix-cdn", label: "Netflix CDN Architecture" },
      { type: "youtube", url: "https://youtube.com/watch?v=netflix-design", label: "Netflix System Design" },
    ],
    askedAt: "2023-11",
    notes: "Adaptive bitrate streaming, Open Connect CDN, recommendation engine, content encoding pipeline, fault tolerance across regions",
  },
  {
    title: "Design Twitter / News Feed",
    company: "Twitter/X",
    track: "system-design",
    difficulty: "Medium",
    tags: ["Feed", "News Feed", "Caching", "Fan-out"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/twitter-feed", label: "Twitter Feed Architecture" },
    ],
    askedAt: "2023-09",
    notes: "Fan-out on write vs read, pull vs push models, timeline generation, tweet indexing, trending topics with Storm/Kafka, caching hot users",
  },
  {
    title: "Design URL Shortener",
    company: "Google",
    track: "system-design",
    difficulty: "Easy",
    tags: ["Caching", "Redis", "Sharding", "Base62"],
    resourceLinks: [
      { type: "youtube", url: "https://youtu.be/fMZMm_0kKvU", label: "URL Shortener Design" },
      { type: "article", url: "https://blog.example.com/url-shortener", label: "Building a URL Shortener" },
    ],
    askedAt: "2024-05",
    notes: "Base62 encoding for short URLs, Redis caching for hot URLs, database sharding by hash, redirect tracking with 301/302, expiration policies",
  },
  {
    title: "Design Rate Limiter",
    company: "Amazon",
    track: "system-design",
    difficulty: "Easy",
    tags: ["Rate Limiting", "Token Bucket", "Sliding Window", "Redis"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=rate-limiter", label: "Rate Limiter Algorithms" },
    ],
    askedAt: "2024-06",
    notes: "Token bucket vs sliding window vs leaky bucket algorithms, distributed rate limiting with Redis, per-user vs per-API throttling",
  },
  {
    title: "Design Distributed Cache",
    company: "Meta",
    track: "system-design",
    difficulty: "Medium",
    tags: ["Caching", "Distributed Systems", "Consistent Hashing", "Redis"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/distributed-cache", label: "Distributed Caching Patterns" },
    ],
    askedAt: "2024-02",
    notes: "Consistent hashing for node distribution, LRU eviction, cache-aside vs write-through, replication for fault tolerance, cache invalidation strategies",
  },
  {
    title: "Design Parking Lot System",
    company: "Amazon",
    track: "system-design",
    difficulty: "Easy",
    tags: ["OOD", "Real-time", "Sensors"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=parking-lot", label: "Parking Lot OOD" },
    ],
    askedAt: "2023-08",
    notes: "Object-oriented design, parking spot allocation, real-time availability tracking, pricing model, entry/exit gates",
  },
];

export const BACKEND_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "Design API Gateway",
    company: "Amazon",
    track: "backend",
    difficulty: "Medium",
    tags: ["API Gateway", "Microservices", "Rate Limiting", "Authentication"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/api-gateway", label: "API Gateway Patterns" },
    ],
    askedAt: "2024-03",
    notes: "Request routing, rate limiting per client, authentication/authorization, request/response transformation, circuit breaker pattern",
  },
  {
    title: "Database Sharding Strategies",
    company: "Meta",
    track: "backend",
    difficulty: "Hard",
    tags: ["Sharding", "Database", "Scaling", "Partitioning"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=sharding", label: "Database Sharding Explained" },
    ],
    askedAt: "2024-01",
    notes: "Horizontal vs vertical sharding, hash-based sharding, range-based sharding, consistent hashing, rebalancing, cross-shard queries",
  },
  {
    title: "Design Message Queue System",
    company: "Confluent",
    track: "backend",
    difficulty: "Hard",
    tags: ["Message Queue", "Kafka", "Pub/Sub", "Distributed Systems"],
    resourceLinks: [
      { type: "course", url: "https://course.example.com/kafka", label: "Kafka Deep Dive Course" },
    ],
    askedAt: "2024-04",
    notes: "Topic partitioning, consumer groups, exactly-once semantics, message ordering, retention policies, replication, leader election",
  },
  {
    title: "Implement Distributed Rate Limiting",
    company: "Stripe",
    track: "backend",
    difficulty: "Medium",
    tags: ["Rate Limiting", "Redis", "Distributed Systems"],
    resourceLinks: [
      { type: "github", url: "https://github.com/example/rate-limiter", label: "Rate Limiter Implementation" },
    ],
    askedAt: "2024-05",
    notes: "Redis Sorted Sets for sliding window, Lua scripting for atomic operations, multi-region considerations, fallback mechanisms",
  },
  {
    title: "Design Microservices Architecture",
    company: "Netflix",
    track: "backend",
    difficulty: "Medium",
    tags: ["Microservices", "Service Discovery", "Containerization"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=microservices", label: "Microservices Patterns" },
    ],
    askedAt: "2023-12",
    notes: "Service discovery with Eureka/Consul, API gateway pattern, circuit breaker with Hystrix, event-driven communication, saga pattern for distributed transactions",
  },
  {
    title: "Design a Key-Value Store",
    company: "Amazon",
    track: "backend",
    difficulty: "Hard",
    tags: ["Distributed Systems", "Storage", "Consistency", "Dynamo"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/dynamo-paper", label: "DynamoDB Paper Analysis" },
    ],
    askedAt: "2023-10",
    notes: "Consistent hashing, quorum-based replication, vector clocks for conflict resolution, gossip protocol for membership, hinted handoff",
  },
  {
    title: "SQL vs NoSQL Trade-offs",
    company: "General",
    track: "backend",
    difficulty: "Easy",
    tags: ["Databases", "SQL", "NoSQL", "Architecture"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/sql-vs-nosql", label: "SQL vs NoSQL Guide" },
    ],
    askedAt: "2024-06",
    notes: "ACID vs BASE, when to use relational vs document vs columnar vs graph databases, consistency models, scaling approaches",
  },
  {
    title: "Design a Distributed Lock Service",
    company: "Google",
    track: "backend",
    difficulty: "Medium",
    tags: ["Distributed Systems", "Locking", "Consensus", "ZooKeeper"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=distributed-locks", label: "Distributed Locking" },
    ],
    askedAt: "2024-02",
    notes: "Redis Redlock algorithm, ZooKeeper ephemeral sequential nodes, lease-based locks, fencing tokens, split-brain prevention",
  },
];

export const BEHAVIORAL_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "Tell me about a time you had a conflict with a teammate",
    company: "General",
    track: "behavioral",
    difficulty: "Easy",
    tags: ["Conflict Resolution", "Teamwork", "Communication"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=star-method", label: "STAR Method Explained" },
    ],
    askedAt: "2024-04",
    notes: "Use STAR: Situation (project deadline conflict), Task (align on approach), Action (listened, proposed compromise), Result (delivered on time, stronger relationship)",
  },
  {
    title: "Describe a challenging project and how you handled it",
    company: "Google",
    track: "behavioral",
    difficulty: "Medium",
    tags: ["Leadership", "Problem Solving", "Resilience"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/behavioral-prep", label: "Behavioral Interview Prep" },
    ],
    askedAt: "2024-03",
    notes: "Focus on technical challenges with ambiguous requirements, how you broke down the problem, collaborated across teams, and delivered results under constraints",
  },
  {
    title: "Why do you want to work here?",
    company: "General",
    track: "behavioral",
    difficulty: "Easy",
    tags: ["Motivation", "Company Research", "Culture Fit"],
    resourceLinks: [],
    askedAt: "2024-05",
    notes: "Research the company's products, engineering blog, tech stack, and culture. Connect your experience and values to their mission. Be specific about what excites you.",
  },
  {
    title: "Tell me about a time you failed",
    company: "Meta",
    track: "behavioral",
    difficulty: "Easy",
    tags: ["Failure", "Growth", "Accountability"],
    resourceLinks: [],
    askedAt: "2024-02",
    notes: "Be honest about a real failure, take ownership, explain what you learned, and describe how you changed your approach. Shows self-awareness and growth mindset.",
  },
  {
    title: "How do you handle tight deadlines?",
    company: "Amazon",
    track: "behavioral",
    difficulty: "Medium",
    tags: ["Time Management", "Prioritization", "Pressure"],
    resourceLinks: [],
    askedAt: "2024-01",
    notes: "Prioritization frameworks, communicating trade-offs early, breaking down work into MVPs, knowing when to ask for help, maintaining quality under pressure",
  },
  {
    title: "Tell me about a time you improved team processes",
    company: "Stripe",
    track: "behavioral",
    difficulty: "Medium",
    tags: ["Process Improvement", "Initiative", "Impact"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/process-improvement", label: "Driving Process Change" },
    ],
    askedAt: "2024-06",
    notes: "Identify pain point, propose solution with metrics, get buy-in, measure results. Examples: CI/CD pipeline, code review process, on-call rotation, documentation culture.",
  },
  {
    title: "Describe a time you disagreed with a decision",
    company: "Apple",
    track: "behavioral",
    difficulty: "Medium",
    tags: ["Disagreement", "Communication", "Professionalism"],
    resourceLinks: [],
    askedAt: "2024-06",
    notes: "Disagree respectfully using data. Propose alternatives rather than just criticizing. Know when to escalate vs accept. Demonstrate compromise and alignment with team goals.",
  },
  {
    title: "How do you stay updated with industry trends?",
    company: "General",
    track: "behavioral",
    difficulty: "Easy",
    tags: ["Learning", "Growth", "Self-Improvement"],
    resourceLinks: [],
    askedAt: "2024-07",
    notes: "Engineering blogs, conference talks, side projects, open source contributions, paper readings. Show genuine curiosity and structured approach to continuous learning.",
  },
];

export const LEADERSHIP_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "How do you mentor junior engineers?",
    company: "Microsoft",
    track: "leadership",
    difficulty: "Medium",
    tags: ["Mentorship", "Growth", "Delegation"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/mentoring", label: "Engineering Mentorship Guide" },
    ],
    askedAt: "2024-03",
    notes: "Pair programming, code reviews as teaching moments, gradually increasing ownership, creating psychological safety, setting clear expectations",
  },
  {
    title: "Describe a time you influenced without authority",
    company: "Google",
    track: "leadership",
    difficulty: "Hard",
    tags: ["Influence", "Stakeholder Management", "Communication"],
    resourceLinks: [],
    askedAt: "2024-04",
    notes: "Building relationships, data-driven arguments, finding allies, understanding incentives, persistence without being pushy, leading by example",
  },
  {
    title: "How do you prioritize technical debt vs new features?",
    company: "Amazon",
    track: "leadership",
    difficulty: "Medium",
    tags: ["Technical Debt", "Strategy", "Decision Making"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/tech-debt", label: "Managing Technical Debt" },
    ],
    askedAt: "2024-02",
    notes: "Quantify debt in terms of velocity impact, allocate percentage of capacity for cleanup, tie improvements to feature work, make incremental progress",
  },
  {
    title: "Tell me about a time you made a difficult technical decision",
    company: "Netflix",
    track: "leadership",
    difficulty: "Hard",
    tags: ["Decision Making", "Trade-offs", "Architecture"],
    resourceLinks: [],
    askedAt: "2024-05",
    notes: "Framework: gather data, list options with pros/cons, consult stakeholders, make decision with rationale, measure outcomes, retrospect. Be decisive but data-driven.",
  },
  {
    title: "How do you build engineering culture?",
    company: "Stripe",
    track: "leadership",
    difficulty: "Easy",
    tags: ["Culture", "Process", "Team Building"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=eng-culture", label: "Building Engineering Culture" },
    ],
    askedAt: "2024-01",
    notes: "Psychological safety, blameless postmortems, knowledge sharing through tech talks, written documentation culture, investing in developer tooling",
  },
  {
    title: "How do you handle a failing project?",
    company: "Uber",
    track: "leadership",
    difficulty: "Hard",
    tags: ["Crisis Management", "Accountability", "Turnaround"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/project-turnaround", label: "Turning Around Failing Projects" },
    ],
    askedAt: "2024-06",
    notes: "Assess the situation honestly, identify root causes, create a recovery plan with clear milestones, communicate transparently with stakeholders, protect team morale, know when to escalate.",
  },
  {
    title: "Describe your approach to quarterly planning",
    company: "Stripe",
    track: "leadership",
    difficulty: "Medium",
    tags: ["Planning", "Strategy", "OKRs"],
    resourceLinks: [],
    askedAt: "2024-07",
    notes: "Top-down vision meets bottom-up estimates. Set OKRs, break into projects, scope ruthlessly, allocate resources, define success metrics. Balance innovation vs maintenance vs tech debt.",
  },
  {
    title: "How do you handle underperformance on your team?",
    company: "Meta",
    track: "leadership",
    difficulty: "Hard",
    tags: ["Performance", "Management", "Coaching"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/managing-underperformance", label: "Performance Management Guide" },
    ],
    askedAt: "2024-05",
    notes: "Timely and direct feedback, understand root causes (skill vs will gap), create improvement plan with clear expectations and support, document progress, PIP as last resort. Fair but firm.",
  },
];

export const INTERVIEW_EXPERIENCE_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "Google L4 — Phone Screen + Onsite",
    company: "Google",
    track: "interview-experience",
    difficulty: "Hard",
    tags: ["Google", "L4", "Phone Screen", "Onsite", "System Design", "Behavioral"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=google-l4-interview", label: "Google L4 Interview Breakdown" },
      { type: "blog", url: "https://blog.example.com/google-l4-experience", label: "Full Google L4 Experience" },
    ],
    askedAt: "2024-06",
    notes: "Phone screen: medium LC on arrays + strings. Onsite: 1) System design — design YouTube, 2) LC hard on graphs, 3) LC medium on DP, 4) Behavioral — STAR-based. Got offer after 3 weeks.",
  },
  {
    title: "Amazon SDE2 — Leadership Principles Focus",
    company: "Amazon",
    track: "interview-experience",
    difficulty: "Medium",
    tags: ["Amazon", "SDE2", "Leadership Principles", "LP", "Onsite"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/amazon-sde2-loop", label: "Amazon SDE2 Interview Loop" },
    ],
    askedAt: "2024-05",
    notes: "Phone screen: LC medium on trees. Onsite: 4 rounds — 2 coding (LC medium + hard), 1 system design (design Amazon cart), 1 LP round with 6+ STAR stories. Every round had LP questions woven in. Prepare 10+ strong STAR stories.",
  },
  {
    title: "Meta E5 — Product Engineering",
    company: "Meta",
    track: "interview-experience",
    difficulty: "Hard",
    tags: ["Meta", "E5", "Product Engineering", "React", "System Design"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=meta-e5-prep", label: "Meta E5 Interview Guide" },
    ],
    askedAt: "2024-04",
    notes: "Two phone screens: 1) LC medium on hashmaps, 2) React coding — build a typeahead. Onsite: 1) System design — design Facebook News Feed (focus on product trade-offs), 2) LC hard on DP with bitmask, 3) Behavioral — dive deep into past projects with cross-team impact, 4) Product sense — how would you improve Messenger.",
  },
  {
    title: "Microsoft L62 — Azure Team",
    company: "Microsoft",
    track: "interview-experience",
    difficulty: "Medium",
    tags: ["Microsoft", "L62", "Azure", "Cloud", "Design"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/microsoft-l62-experience", label: "Microsoft L62 Interview Experience" },
    ],
    askedAt: "2024-03",
    notes: "Phone screen: LC medium on string manipulation. Onsite: 4 rounds — 1) Design a distributed task scheduler (Azure-focused), 2) LC medium on LRU cache variations, 3) Deep dive on past project with scalability focus — lots of follow-up questions, 4) Hiring manager — culture fit and team structure. Offer after 1 week.",
  },
  {
    title: "Stripe — Backend Engineer",
    company: "Stripe",
    track: "interview-experience",
    difficulty: "Hard",
    tags: ["Stripe", "Backend", "API Design", "Distributed Systems", "Coding"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/stripe-interview-process", label: "Stripe Interview Process Deep Dive" },
    ],
    askedAt: "2024-07",
    notes: "Online assessment: 2 LC mediums with a focus on correctness. Onsite (virtual): 1) API design — design a payment reconciliation API, 2) Debugging — find and fix a race condition in a distributed counter, 3) System design — design a real-time fraud detection system, 4) Engineering values — deep dive on a past incident and how you handled it. Stripe values written communication — all design docs done in shared doc.",
  },
  {
    title: "Uber — Senior Backend (L5a)",
    company: "Uber",
    track: "interview-experience",
    difficulty: "Hard",
    tags: ["Uber", "Senior", "L5a", "Backend", "Microservices"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=uber-senior-interview", label: "Uber Senior Backend Interview" },
    ],
    askedAt: "2024-06",
    notes: "Phone screen: LC medium on graph traversal. Onsite: 1) System design — design Uber Eats order dispatch (focus on geospatial + real-time), 2) Coding — design a pub-sub system from scratch with concurrency, 3) Architecture deep dive — present a past system you built and discuss trade-offs in detail, 4) Manager round — leadership, conflict resolution, ownership. Heavy emphasis on ownership and bias for action.",
  },
  {
    title: "Netflix — Senior Software Engineer",
    company: "Netflix",
    track: "interview-experience",
    difficulty: "Hard",
    tags: ["Netflix", "Senior", "Streaming", "CDN", "Freedom & Responsibility"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/netflix-senior-interview", label: "Netflix Senior SE Interview" },
    ],
    askedAt: "2024-02",
    notes: "Phone screen: culture fit + LC medium on arrays. Onsite: 1) System design — design Netflix content recommendation pipeline (focus on data + ML infra), 2) Coding — implement a video transcoding scheduler with priority queues, 3) Architectural decision — review a design doc for a new microservice and provide feedback, 4) Cultural — discuss a time you made a high-risk decision with incomplete data. Netflix values candor and judgment over everything.",
  },
  {
    title: "Apple — Software Engineer (Special Projects Group)",
    company: "Apple",
    track: "interview-experience",
    difficulty: "Medium",
    tags: ["Apple", "SPG", "Embedded", "C++", "Hardware-Software"],
    resourceLinks: [],
    askedAt: "2024-01",
    notes: "Phone screen: C++ memory management and LC medium on linked lists. Onsite: 7 rounds (!) — 1-2) Coding in C++ (low-level systems programming, concurrency), 3) System design — design a sensor data pipeline with real-time constraints, 4) Hardware-software co-design discussion, 5) Past project presentation to the team, 6-7) Manager + director behavioral. Secrecy was emphasized — no details about the specific product.",
  },
  {
    title: "Atlassian — Senior Backend (P50)",
    company: "Atlassian",
    track: "interview-experience",
    difficulty: "Easy",
    tags: ["Atlassian", "P50", "Backend", "Java", "Team Culture"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/atlassian-interview", label: "Atlassian Interview Tips" },
    ],
    askedAt: "2024-05",
    notes: "Phone screen with recruiter then hiring manager: project deep dive. Technical: 1) pair programming — implement a distributed rate limiter in Java, 2) System design — design Jira's notification system at scale, 3) Values round — 'Play as a team' and 'Build with heart and balance' scenarios. Very culture-focused. Offer experience: fast and transparent.",
  },
  {
    title: "Coinbase — Backend Engineer (IC4)",
    company: "Coinbase",
    track: "interview-experience",
    difficulty: "Medium",
    tags: ["Coinbase", "IC4", "Blockchain", "Backend", "Cryptography"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=coinbase-interview", label: "Coinbase Engineering Interview" },
    ],
    askedAt: "2024-04",
    notes: "Online assessment: LC medium on DP + SQL. Onsite: 1) System design — design a crypto wallet with multi-sig support, 2) Coding — implement a Merkle tree verification, 3) Debugging — fix a concurrency bug in a blockchain indexing service, 4) Behavioral — crypto mission alignment, 'secure by default' mindset. Strong emphasis on mission alignment with 'crypto-first' ethos.",
  },
];

export const AI_ML_SAMPLE: KnowledgeResourceInput[] = [
  {
    title: "ML System Design — Recommendation System",
    company: "Netflix",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["ML System Design", "Recommendation", "Collaborative Filtering", "Embeddings"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=ml-rec-sys", label: "ML RecSys Design" },
      { type: "blog", url: "https://blog.example.com/netflix-recommendation", label: "Netflix Recommendation Architecture" },
    ],
    askedAt: "2024-06",
    notes: "Two-tower model for user/item embeddings, candidate generation via ANN (HNSW), ranking with deep neural network, real-time features with Kafka, A/B testing framework, cold start handling with content-based features.",
  },
  {
    title: "LLM Application Design — RAG Pipeline",
    company: "OpenAI",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["LLM", "RAG", "Vector Search", "Prompt Engineering"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/rag-pipeline-design", label: "Designing RAG Systems" },
    ],
    askedAt: "2024-07",
    notes: "Document chunking strategies, embedding model selection, vector DB (Pinecone/Weaviate), hybrid search (dense + sparse), reranking, prompt template management, caching with Redis, evaluation with LLM-as-judge.",
  },
  {
    title: "ML Feature Store Design",
    company: "Uber",
    track: "ai-ml",
    difficulty: "Medium",
    tags: ["Feature Store", "ML Infrastructure", "Real-time Features", "Feature Engineering"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=feature-store", label: "Feature Store Deep Dive" },
    ],
    askedAt: "2024-05",
    notes: "Online vs offline feature serving, point-in-time correctness, feature validation, feature registry, serving with low-latency KV stores, batch features via Spark, streaming features via Flink, feature drift monitoring.",
  },
  {
    title: "ML Model Training & Serving Infrastructure",
    company: "Meta",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["ML Infrastructure", "Training", "Serving", "Distributed Training"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/ml-infra-meta", label: "Meta's ML Infrastructure" },
    ],
    askedAt: "2024-04",
    notes: "Distributed training with PyTorch DDP/FSDP, GPU cluster scheduling, data parallelism vs model parallelism, model versioning, A/B testing framework, canary deployments, monitoring with prediction drift detection.",
  },
  {
    title: "Prompt Engineering & LLMOps",
    company: "Anthropic",
    track: "ai-ml",
    difficulty: "Easy",
    tags: ["Prompt Engineering", "LLM", "LLMOps", "Evaluation"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=prompt-engineering", label: "Advanced Prompt Engineering" },
      { type: "article", url: "https://blog.example.com/llmops-guide", label: "LLMOps Best Practices" },
    ],
    askedAt: "2024-08",
    notes: "Chain-of-thought prompting, few-shot examples, structured output (JSON mode), prompt versioning, evaluation datasets, regression testing prompts, cost optimization with prompt compression, caching strategies.",
  },
  {
    title: "ML Model Monitoring & Observability",
    company: "DoorDash",
    track: "ai-ml",
    difficulty: "Medium",
    tags: ["ML Monitoring", "Observability", "Drift Detection", "Data Quality"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/ml-monitoring", label: "ML Monitoring at Scale" },
    ],
    askedAt: "2024-03",
    notes: "Data drift vs concept drift detection, statistical tests (KS, PSI), prediction monitoring, feature importance tracking, model degradation alerts, golden dataset evaluation, retraining triggers, data quality dashboards.",
  },
  {
    title: "Design a Real-time Fraud Detection System",
    company: "Stripe",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["ML System Design", "Fraud Detection", "Real-time", "Risk"],
    resourceLinks: [
      { type: "youtube", url: "https://youtube.com/watch?v=fraud-detection", label: "Fraud Detection ML Design" },
    ],
    askedAt: "2024-02",
    notes: "Real-time feature computation with Flink, gradient-boosted tree models, graph neural networks for merchant-user relationships, ensemble of models, decision latency <100ms, explainable AI for compliance, simulated adversarial training.",
  },
  {
    title: "AI Product Sense — Evaluating Model Quality",
    company: "Google",
    track: "ai-ml",
    difficulty: "Medium",
    tags: ["AI Product", "Evaluation", "Metrics", "A/B Testing"],
    resourceLinks: [],
    askedAt: "2024-06",
    notes: "Offline metrics (precision, recall, NDCG) vs online metrics (user engagement, revenue). Population stability index, counterfactual evaluation, interleaved experiments, guardrail metrics, statistical significance with sequential testing. Know when NOT to use ML.",
  },
  {
    title: "Deep Learning at Scale — Distributed Training",
    company: "Nvidia",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["Deep Learning", "Distributed Training", "GPU", "HPC"],
    resourceLinks: [
      { type: "article", url: "https://blog.example.com/distributed-training", label: "Distributed Deep Learning Guide" },
    ],
    askedAt: "2024-01",
    notes: "Data parallel, model parallel, pipeline parallel, tensor parallel. All-reduce vs all-gather, gradient accumulation, mixed precision training (FP16/BF16), activation checkpointing, sequence parallelism for LLMs, 3D parallelism used in Megatron-LM.",
  },
  {
    title: "ML Platform Design — End to End",
    company: "Airbnb",
    track: "ai-ml",
    difficulty: "Hard",
    tags: ["ML Platform", "MLOps", "Infrastructure", "Feature Engineering"],
    resourceLinks: [
      { type: "blog", url: "https://blog.example.com/ml-platform", label: "Building an ML Platform" },
    ],
    askedAt: "2024-05",
    notes: "Feature platform, training platform, serving platform, model registry, experiment tracking (MLflow), orchestration (Airflow), CI/CD for ML pipelines, data versioning (DVC), model governance, lineage tracking, cost attribution per model.",
  },
];

export const SAMPLE_RESOURCES_BY_TRACK: Record<TrackId, KnowledgeResourceInput[]> = {
  "dsa": DSA_SAMPLE,
  "system-design": SYSTEM_DESIGN_SAMPLE,
  "backend": BACKEND_SAMPLE,
  "behavioral": BEHAVIORAL_SAMPLE,
  "leadership": LEADERSHIP_SAMPLE,
  "interview-experience": INTERVIEW_EXPERIENCE_SAMPLE,
  "ai-ml": AI_ML_SAMPLE,
};

export interface SystemDesignNote {
  id: string;
  title: string;
  company: string;
  topic: string;
  content: string;
  sections: { name: string; body: string }[];
  favorited: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "system-design-notes";

export function loadNotes(): SystemDesignNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveNote(note: SystemDesignNote) {
  if (typeof window === "undefined") return;
  const all = loadNotes();
  const idx = all.findIndex((n) => n.id === note.id);
  if (idx >= 0) all[idx] = note;
  else all.push(note);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function deleteNote(id: string) {
  if (typeof window === "undefined") return;
  const all = loadNotes().filter((n) => n.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function toggleNoteFavorite(id: string): SystemDesignNote | null {
  const all = loadNotes();
  const note = all.find((n) => n.id === id);
  if (!note) return null;
  note.favorited = !note.favorited;
  note.updatedAt = Date.now();
  saveNote(note);
  return note;
}

export function generateNoteId(): string {
  return `sd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const SAMPLE_SEED_KEY = "system-design-seeded";

const SAMPLE_NOTES: SystemDesignNote[] = [
  {
    id: "sd_sample_1",
    title: "Design URL Shortener",
    company: "General",
    topic: "System Design",
    content: "Design a service like TinyURL that takes long URLs and generates short, unique aliases.",
    sections: [
      { name: "Requirements", body: "**Functional**: Generate & resolve short URLs, custom aliases, analytics (click count, referrer).\n**Non-functional**: 99.9% uptime, <10ms resolve latency, 1B URLs/month, high read-to-write ratio (100:1)." },
      { name: "Estimation", body: "| Metric | Value |\n|--------|-------|\n| Writes | 400 URLs/sec |\n| Reads | 40K requests/sec |\n| Storage (5yr) | ~30TB |\n| Cache (80% hit) | ~64GB RAM needed |" },
      { name: "Data Model", body: "```\nURL {\n  shortKey: VARCHAR(7) PK\n  longUrl: TEXT\n  userId: FK\n  createdAt: TIMESTAMP\n  expiresAt: TIMESTAMP (optional)\n}\nClick {\n  id: BIGINT PK\n  shortKey: FK\n  clickedAt: TIMESTAMP\n  referrer: VARCHAR\n  userAgent: TEXT\n}\n```" },
      { name: "API Design", body: "`POST /shorten` — body: `{ longUrl, customAlias?, expiresAt? }` → `{ shortUrl }`\n`GET /{shortKey}` — 301 redirect to longUrl\n`GET /{shortKey}/stats` — click analytics" },
      { name: "Deep Dive", body: "**Key generation**: Base62 encode MD5 hash (or Snowflake ID). For collision, append a salt and re-hash.\n**Caching**: Redis cluster with LRU eviction, 80% target hit rate. Write-through on new URL creation.\n**DB Sharding**: Hash-based sharding on shortKey across 4 MySQL instances.\n**Rate limiting**: Token bucket per user IP, 100 writes/min." },
    ],
    favorited: false,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "sd_sample_2",
    title: "Design WhatsApp / Chat System",
    company: "Meta",
    topic: "System Design",
    content: "Design a real-time messaging system supporting 1-on-1 and group chats with media sharing.",
    sections: [
      { name: "Requirements", body: "**Functional**: 1-on-1 chat, group chat (up to 256), media/images, read receipts, online status, push notifications.\n**Non-functional**: <100ms delivery, 500M DAU, 10B messages/day, offline support, end-to-end encryption." },
      { name: "Estimation", body: "| Metric | Value |\n|--------|-------|\n| Messages/day | 10B |\n| Messages/sec (peak) | 500K |\n| Storage (5yr) | ~100PB messages + media |\n| Bandwidth | ~20Gbps |" },
      { name: "Data Model", body: "```\nMessage {\n  msgId: UUID PK\n  chatId: UUID\n  senderId: UUID\n  type: TEXT\n  content: TEXT\n  mediaUrl: TEXT (nullable)\n  createdAt: TIMESTAMP\n}\nChat {\n  chatId: UUID PK\n  type: 'one-to-one' | 'group'\n  participants: []UUID\n  lastMsgPreview: TEXT\n  updatedAt: TIMESTAMP\n}\n```" },
      { name: "Deep Dive", body: "**Real-time delivery**: WebSocket persistent connection to chat service. Each user connected to one chat server via consistent hashing (user_id → server).\n**Offline messages**: Stored in Cassandra by recipient_id, delivered on reconnect. 30-day retention.\n**Group messaging**: Fan-out on write for small groups (<50). Fan-out on read (pull model) for large groups.\n**Media**: Dedicated media service with CDN (Akamai/CloudFront). Images resized to multiple resolutions async.\n**Encryption**: Signal protocol — each message has unique ephemeral key. Server never sees plaintext." },
    ],
    favorited: false,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: "sd_sample_3",
    title: "Design Uber / Ride Hailing",
    company: "Uber",
    topic: "System Design",
    content: "Design a ride-sharing platform connecting riders with nearby drivers.",
    sections: [
      { name: "Requirements", body: "**Functional**: Rider requests ride → matches nearby driver → real-time tracking → payment → rating.\n**Non-functional**: <5s driver matching, 99.99% availability, 100M daily trips, handle flash crowds (NYE)." },
      { name: "Estimation", body: "| Metric | Value |\n|--------|-------|\n| Daily trips | 100M |\n| Active drivers (peak) | 5M |\n| Location updates/sec | 10M |\n| Matching latency target | <5s |" },
      { name: "Data Model", body: "```\nTrip {\n  tripId: UUID PK\n  riderId: UUID\n  driverId: UUID\n  status: ENUM\n  pickup: GEO\n  dropoff: GEO\n  fare: DECIMAL\n  createdAt: TIMESTAMP\n}\nDriver {\n  driverId: UUID PK\n  status: ONLINE/OFFLINE\n  currentLoc: GEO\n  vehicleType: ENUM\n  rating: FLOAT\n}\n```" },
      { name: "Deep Dive", body: "**Geospatial indexing**: QuadTree or Google S2 cells. Each region tracked separately. Driver locations updated every 3s via WebSocket.\n**Matching**: When rider requests, query all drivers in same S2 cell + adjacent cells, filter by criteria, use reputation score + ETA to rank top 5, send to rider for confirmation.\n**Surge pricing**: When demand > supply in a region, multiply fare by dynamic factor (1.2x–5x). Recalculated every 5 minutes.\n**Real-time tracking**: Kafka stream for location updates → Flink/Spark for ETA recalculation → WebSocket push to rider app." },
    ],
    favorited: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 4,
  },
];

export function seedSampleNotes() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SAMPLE_SEED_KEY)) return;
  const existing = loadNotes();
  if (existing.length > 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_NOTES));
    localStorage.setItem(SAMPLE_SEED_KEY, "true");
  } catch {}
}

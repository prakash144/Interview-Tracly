# Interview Tracly

Master coding interviews with structured Sprints, focused Tracks, and real-time readiness tracking.

Track your journey. Crack your dream company.

## Quick Start

1. **Sign in** with Google (top-right corner)
2. **Load problems** via Settings → select a Company + List
3. **Create a Sprint** (Learning for general prep, Interview for a specific target)
4. **Solve problems**, log progress, and track readiness

---

## Core Concepts

### Problems
LeetCode-style problems from top companies (Google, Amazon, Microsoft, Meta, Apple, etc.) loaded from community-maintained CSV datasets. Filter by company, topic, difficulty, status; add notes, bookmark, track solved/attempted.

### Sprints
Timeboxed preparation cycles — the heart of the app:
- **Learning Sprint** — master topics at your own pace
- **Interview Sprint** — prep for a scheduled interview with countdown + focus mode
- **Certification Sprint** — earn a credential
- **Custom Sprint** — define your own focus

Each sprint has a Kanban board (Backlog → To Do → In Progress → Review → Done), analytics, and a retrospective.

### Tracks
7 built-in prep tracks (DSA, System Design, Backend, Behavioral, Leadership, Interview Experience, AI/ML) plus custom tracks. Each track contains Knowledge Resources with status tracking, revision lists, and personal notes.

### Readiness
Real-time score (0–100%) computed from company coverage, topic coverage, difficulty balance, revision completion, consistency, and streak. Filter by company to see targeted readiness.

---

## Step-by-Step Usage Guide

### First Time

| Step | Where | What |
|---|---|---|
| 1 | **Settings** | Select a company (e.g., Google) and problem list (e.g., Top 100) |
| 2 | **Problems** | Browse loaded problems, filter by difficulty/topic, solve a few |
| 3 | **Sprints** | Create a "Learning" sprint using a template (e.g., Algorithm Mastery) |
| 4 | **Sprints** | Start the sprint, move tasks to In Progress as you work |
| 5 | **Dashboard** | Monitor your progress, daily mission, and activity heatmap |

### Before an Interview

| Step | Where | What |
|---|---|---|
| 1 | **Sprints** | Create an **Interview Sprint** — select the company, role, interview date |
| 2 | **Sprints** | Starting it auto-suspends any active Learning Sprint (Focus Mode) |
| 3 | **Sprints** | See countdown, company template, and daily pace in the card |
| 4 | **Tracks** | Review company-specific topics (e.g., Google → Graphs, DP, System Design) |
| 5 | **Readiness** | Check your company-specific readiness score |
| 6 | **Mock Interview** | Simulate timed interview with configurable sections and types |
| 7 | **Sprints** | After the interview, complete the sprint → choose to resume/archive the suspended sprint |

### Daily Routine

| Step | Where | What |
|---|---|---|
| 1 | **Dashboard** | Check your Daily Mission (auto-picked tasks from active sprint) |
| 2 | **Activity** | Review calendar, streak, and today's focus items |
| 3 | **Problems** | Solve 1–2 problems, mark as solved/attempted |
| 4 | **Sprints** | Update task status on the Kanban board |
| 5 | **Tracks** | Review a Knowledge Resource, mark progress |

---

## Features

### Dashboard (`/`)
- Overall stats, difficulty breakdown, activity heatmap
- Active Sprint widget with quick task toggle
- Daily Mission (auto-picked focus tasks)
- Company progress, recent solves, study timer
- Quick actions: random problem, continue solving, my lists

### Problems (`/problems`)
- Full workspace: search, filter, sort by all dimensions
- Inline notes, bookmark toggle, solved/attempted status
- Custom list management (create, rename, add/remove problems)
- Pagination (10/25/50 per page), card or table view

### Sprints (`/sprints`)
- **Adaptive Sprint System** — 4 sprint types with different workflows
- **Focus Mode** — Interview Sprint auto-suspends other active sprints
- **Kanban board** — 5 columns with drag-and-drop (Backlog → Done)
- **Sprint Dashboard** — stat cards, progress bar, track breakdown
- **Analytics** — burndown chart, estimated vs actual hours
- **Retrospective** — rating, weaknesses, action items
- **Interview Complete Dialog** — outcome tracking, resume/archive choices
- **Sprint Timeline** — visual transition history

### Tracks (`/tracks`)
- 7 built-in tracks + unlimited custom tracks
- Knowledge resources per track with status (Not Started → Mastered)
- Revision list, favorites, personal notes
- Cheat Sheets, System Design Notes, Behavioral STAR entries
- Global search (Cmd+K) across all tracks and problems

### Mock Interview (`/mock-test`)
- Multi-section mock interview supporting 7 types: DSA, System Design, Backend, Behavioral, Leadership, AI/ML, Custom
- Configurable company, role, level, duration, and per-section settings (count, difficulty, topics)
- Mix multiple sections in a single interview (e.g., DSA + System Design + Behavioral)
- Per-problem: solved, partially solved, skip, use hint (3 hints per test)
- Section progress tabs with per-section completion tracking
- Full review: score ring, difficulty breakdown, section-by-section cards, strengths/weaknesses
- AI-ready recommendations, suggested revision topics, and next practice plan
- Interview history with localStorage persistence

### Readiness (`/readiness`)
- Company selector (Overall + 9 companies)
- Hero score card with level, remaining problems, estimated time
- 6-factor breakdown: Company, Topics, Difficulty, Revision, Consistency, Streak
- Action plan with prioritized tasks
- Weak areas (topics, patterns, difficulty)
- Company progress comparison table

### Activity (`/activity`)
- Annual heatmap, monthly submission trends
- Daily mission, revision queue
- Sprint timeline events
- Calendar insights, streak tracking

### Settings (`/settings`)
- Theme: Light / Dark / System
- Accent color: Green / Blue / Purple / Orange
- Company & problem list selection
- Account management, data reset

---

## Best Practices

| Goal | Approach |
|---|---|
| **Long-term skill building** | Use **Learning Sprints** (7–14 days) with templates. Stack them weekly. |
| **Interview crunch** | Create an **Interview Sprint** 3–4 weeks before the date. Let Focus Mode suspend other work. |
| **Track weak areas** | Check **Readiness** page weekly. Use the Action Plan for specific next steps. |
| **Retain knowledge** | Add resources to your **Revision List** in Tracks. The daily mission pulls from it. |
| **Simulate pressure** | Use **Mock Test** weekly as the interview approaches. Vary difficulty and topics. |
| **Stay consistent** | Use **Dashboard** daily. The streak tracker and heatmap keep you accountable. |
| **Review and adapt** | Complete **Sprint Retrospectives** to identify weaknesses and adjust your approach. |

---

## Constraints

| What's NOT possible | Reason / Alternative |
|---|---|
| **Real-time collaboration** | No multi-user sprint sharing (single-player focused) |
| **AI-generated plans** | Templates are hand-crafted; AI sprint generation is future-ready but not implemented |
| **Calendar sync** | No Google Calendar / Outlook integration (dates are manual) |
| **Offline mode** | Static export works after first load but no service worker yet |
| **Anonymous sign-in** | Google-only auth; no email/password or anonymous mode |
| **Data export/import** | No JSON export/import yet (Firestore data only) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, static export) |
| State | React 19 hooks + context |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data | Firebase Auth + Firestore (user progress) |
| Problems | GitHub-hosted CSVs (community-maintained) |
| Charts | Custom SVG (ProgressRing, DonutChart, Heatmap) |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit |
| Toasts | Sonner |
| Deployment | GitHub Pages |

---

## Firebase Setup

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firestore stores only user-specific data (progress, sprints, tracks, resources, activity). Problem metadata comes from GitHub CSVs. Deploy `firestore.rules` to protect per-user data.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Data model, component tree, gap analysis |
| [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) | Phased feature roadmap |

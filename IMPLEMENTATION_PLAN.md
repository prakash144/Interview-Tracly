# Implementation Plan

> **Status:** Phase 25b complete. All known gaps resolved.

## Latest: Phase 25b — Production Readiness Fixes — ✅

### Goal
End-to-end production polish: replace legacy browser APIs with proper UI components, fix accessibility gaps, ensure build is clean.

### Changes Made

| Fix | Files | Detail |
|---|---|---|
| `window.confirm` → `ConfirmDialog` | `sprints/page.tsx` | Destructive action confirmation with proper dialog |
| `alert()` → `toast.error` | `mock-test/page.tsx` | Error feedback using Sonner toast |
| Toast dedup IDs | 5 hooks (44+ calls) | Unique `id` on every `toast.success`/`toast.error`/`toast()` call across `useSprints.ts`, `useTracks.ts`, `useResources.ts`, `useCustomLists.ts`, `useResourceProgress.ts` |
| `aria-label` on delete button | Sprint detail view | Accessibility for icon-only button |
| Emoji → SVG in error boundary | `error.tsx` | `AlertTriangle` icon replaces emoji |
| `prefers-reduced-motion` | Global CSS | `.stagger-group` animation disabled for accessibility |
| `updateTask` catch bug | `useSprints.ts` | Fixed `sprintsRef` → `tasksRef` in rollback |

### Validation
- `npm run build` — **23 static routes, 0 errors, 0 warnings**, 102KB shared JS
- `npm run lint` — 0 errors (only pre-existing CompanyLogo warning)
- Light + Dark mode consistent

---

## Phase 25 — Premium Focus Mode UX — ✅

### Goal
Refine focus mode for Interview Sprints: better labels, completion dialog, timeline visualization, and enhanced empty states.

### Changes Made

#### SprintCard
- "Paused" → "Suspended" with reason text (e.g., "Suspended by Interview Prep")
- Visual indicator that sprint is suspended

#### SprintDashboardHeader
- Focus Mode banner with reassurance: "You're in Focus Mode. Stay on track."
- Action buttons: resume suspended sprint, view interview details

#### InterviewCompleteDialog (new)
- Opens when user completes an Interview Sprint
- Outcome selection: Selected / Rejected / No response / Withdrew
- Post-interview actions: Resume suspended sprint, archive completed sprint
- Wired into `sprints/page.tsx` sprint completion flow

#### SprintTimeline (new)
- Visual component showing sprint transitions (planned → active → completed/suspended)
- Displays timeline events with dates and status changes

#### Dashboard Enhanced
- Suspended sprint card shown on main sprints page
- Empty state CTA: "Ready for an interview? Create an Interview Sprint"

#### Files
| File | Change |
|---|---|
| `src/app/components/sprints/InterviewCompleteDialog.tsx` | New |
| `src/app/components/sprints/SprintTimeline.tsx` | New |
| `src/app/components/sprints/SprintCard.tsx` | Suspended label |
| `src/app/components/sprints/SprintDashboardHeader.tsx` | Focus Mode banner |
| `src/app/sprints/page.tsx` | ConfirmDialog + InterviewComplete + suspended card + CTA |

### Design Principles
- Reassuring language in Focus Mode (not punitive)
- Clear visual distinction between active, suspended, and completed states
- Sprint Timeline provides historical context for sprint transitions

---

## Phase 24 — Adaptive Sprint System — ✅

### Goal
Redesign the Sprint module to support multiple sprint types (learning, interview, certification, custom) with company templates and focus mode.

### Changes Made

#### Sprint Data Model
- `SprintType`: `"learning" | "interview" | "certification" | "custom"` added to `Sprint` interface
- Interview-specific fields: `company`, `role`, `interviewDate`, `targetLevel`, `stages`, `template`
- Focus mode: `pausedSprintId?` tracks the sprint auto-paused when activating a new one

#### Company Templates
- `COMPANY_TEMPLATES` in `src/lib/sprints.ts`: Google, Microsoft, Amazon, Meta, Apple, Netflix
- Each template: `requiredTopics[]`, `optionalTopics[]`, `difficultyBreakdown`, `typicalStages[]`, `preparationWeeks`

#### SprintDialog
- Type selector (Learning / Interview / Certification / Custom)
- Company template dropdown (shown for Interview type)
- Conditional fields: company, role, interview date, target level, stages

#### Focus Mode
- `activateSprint` auto-pauses any other active sprint, storing reference in `pausedSprintId`
- Only one sprint active at a time
- Resuming a sprint does not re-activate the one that suspended it

#### Files
| File | Change |
|---|---|
| `src/lib/sprints.ts` | SprintType, interview fields, COMPANY_TEMPLATES |
| `src/app/components/sprints/SprintDialog.tsx` | Type selector, templates, interview fields |
| `src/hooks/useSprints.ts` | Focus mode pause/resume |

### Design Principles
- Interview Sprint is the "special" type with the most additional fields
- Templates provide curated starting points without forcing any prep plan
- Focus Mode is a constraint (one active sprint at a time) that feels like a feature

---

## Previous: Phase 23 — Final Polish & Problem Workspace Revert — ✅

### Goal
Production-quality polish across the entire app: theme consistency, accessibility, performance, micro-interactions, and reverting the Problem Workspace page to pre-collections UI/UX.

### Changes Made

#### Phase 23a — Theme Color Audit
- Converted 32+ hardcoded hex/utility colors to CSS variables across: `Heatmap.tsx`, `CompanyBadge.tsx`, `ErrorState.tsx`, `page.tsx`, `progress/page.tsx`, `PracticeCalendar.tsx`, `Footer.tsx`, `ProgressRingChart.tsx`.

#### Phase 23b — Loading/Error States
- Added loading and error states to **readiness**, **collections**, and **settings** pages.

#### Phase 23c — Bug Fixes
- Fixed `weeklySolved` always showing 0 — now uses real `useMemo` count.
- Wired dead mobile "New" button on collections page (`window.prompt` + `createCollection`).
- No `console.log` statements found.

#### Phase 23d — Accessibility
- Added skip-to-content link to `AppShell`.
- Added ARIA attributes (`role="progressbar"`, `aria-valuenow/min/max`, `aria-label`) to dashboard overall/difficulty/company bars and progress page monthly bars.

#### Phase 23e — Performance
- Fixed `useMemo` dependency (`selectedTopics.length` → `selectedTopics`) in `useProblemFilters.ts`.
- Consolidated 3 duplicate `progressMap` iteration pairs in progress page (currentStreak+maxStreak, solvedThisWeek+solvedThisMonth, avgDaily+avgWeekly).
- Skipped React.memo on rows/cards (negligible gain at current scale).

#### Phase 23f — Micro-interactions
- Button press animation: `active:scale-[0.97]` on `Button` component, `active:scale-[0.98]` on quick action cards.
- Hover shadows (`transition-shadow duration-200 hover:shadow-md`) on all card sections across dashboard, progress, settings, Heatmap, readiness.

#### Phase 23g — Card/Table Polish
- Standardized card padding (`p-4`→`p-5` for progress sidebar).
- Backgrounds (`bg-card`→`bg-card/80` for readiness components and `CollectionView`).
- Table row hover (`hover:bg-secondary/50`→`hover:bg-accent/40` with `transition-colors duration-150`) on progress page to match `QuestionTable`.

#### Phase 23h — Page Headers & Max-Widths
- Normalized `max-w-7xl` + `pb-10` across all pages.
- Added `PageHeader` to readiness (with `actions` slot for `CompanySelector`), collections, activity pages.
- All `PageHeader`s now siblings before content div (not nested).
- Fixed progress and settings pages from `pb-12` → `pb-10`.

#### Phase 23i — Problem Workspace Revert
- **Reverted** `ProblemWorkspace.tsx`, `FilterBar.tsx`, `QuestionTable.tsx` to pre-collections state (commit `6403f4a`).
- **Restored** `AddToListDialog.tsx` (deleted in `d914907`) — replaces `AddToCollectionDialog`.
- Problem Workspace now uses `useCustomLists` instead of `useCollections`.
- `FilterBar` no longer has collection filter dropdown.
- `QuestionTable` renders `AddToListDialog` for custom list management.

#### Phase 23j — Validation
- Build passes: **11/11 pages, 0 errors**, 1 pre-existing warning (`CompanyLogo.tsx` img tag).
- No type errors.
- No lint errors.

### Data Flow (Post-Revert)

```
ProblemWorkspace
  ├── useCustomLists(auth.user?.uid)
  │     └── → { lists, addProblem, removeProblem, create, isProblemInAnyList, ... }
  ├── FilterBar — no collection props
  └── QuestionTable
        ├── customLists prop (passed through)
        └── AddToListDialog per row
```

### Design Principles
- All colors use CSS variables (no hardcoded hex) for light/dark theme compatibility.
- Page headers are consistently `PageHeader` component as sibling before content div.
- All content pages use `max-w-7xl` wrapper + `pb-10` bottom padding.
- Table rows use `hover:bg-accent/40` with `transition-colors duration-150` for consistent interaction.
- Buttons use `active:scale-[0.97]` for press feedback.
- Cards use `transition-shadow duration-200 hover:shadow-md` for depth.

### Validation
- `npm run build` ✅
- `npm run lint` ✅ (only pre-existing CompanyLogo warning)
- Light + Dark mode consistent

---

## Previous: Phase 22 — Readiness Page Redesign — ✅

### Goal

Redesign the `/readiness` page into a focused, productivity-driven workspace that answers:

> **"Am I ready for my target company's coding interview, and what should I do next?"**

Remove duplication, simplify information architecture, improve UI/UX, and make the page actionable.

---

### Analysis & Design Decisions

#### Issues Identified in Current Implementation

| Issue | Detail |
|---|---|
| **Duplicated company data** | Mini company cards in `InterviewReadiness.tsx` duplicate the company list from `CompanyReadiness.tsx` |
| **Low-value Achievements** | Deterministic emoji badges add visual noise without actionable insight; belong on Profile page |
| **Broken Weekly Review** | `weeklySolved = 0` hardcoded in page, making goal completion and solved count always zero |
| **Dense/scattered layout** | 5+ competing sections with no clear hierarchy; weak topics, weak difficulties, patterns, company scores all separate |
| **No company selector** | No top-level filter to contextualize all metrics for a target company |
| **Recommendations not actionable** | "Smart Recommendations" is a bullet list without structure or prioritization |
| **PatternCoverage is imprecise** | Keyword matching (30 rules) is an approximation; merge into Weak Areas instead |
| **Excessive scrolling** | Full-width Achievements, large company drill-down, and scattered sections create long pages |

#### Information Architecture (Before → After)

```
BEFORE:                              AFTER:
┌─────────────────────────────┐      ┌─────────────────────────────┐
│ InterviewReadiness          │      │ Company Selector            │
│  ├─ Score Ring + Level     │      ├─ Hero Card                  │
│  ├─ 6 Factor Bars          │      │  ├─ Score Ring + Level     │
│  ├─ Company Scores (mini)  │      │  ├─ Remaining Problems     │
│  ├─ Weak Topics            │      │  └─ Estimated Time / Status │
│  ├─ Weak Difficulties      │      ├─ Readiness Breakdown       │
│  ├─ Smart Recommendations  │      │  ├─ Company Coverage       │
│  └─ Weekly Review          │      │  ├─ Topic Coverage         │
│ CompanyReadiness           │      │  ├─ Difficulty Balance     │
│  ├─ Company Grid           │      │  ├─ Revision Completion    │
│  └─ Drill-down (detail)    │      │  └─ Consistency            │
│ PatternCoverage            │      ├─ Action Plan               │
│ MockInterviewReadiness     │      │  ├─ Solve N Topic problems │
│ Achievements               │      │  ├─ Revise Problem X       │
└─────────────────────────────┘      │  └─ Practice Pattern Y    │
                                     ├─ Weak Areas               │
                                     │  ├─ Topics                │
                                     │  ├─ Patterns              │
                                     │  ├─ Difficulty            │
                                     │  └─ Quick Practice action │
                                     ├─ Company Progress         │
                                     │  └─ Clickable table       │
                                     └─ Mock Interview           │
                                       └─ Single summary card    │
```

#### What Was Removed

- **Weekly Review** → Belongs on Activity page (moved)
- **Achievements** → Belongs on Profile page (moved)
- **PatternCoverage as separate section** → Merged into Weak Areas
- **Duplicate company cards** in InterviewReadiness → Removed (replaced by Company Progress section)
- **CompanyReadiness drill-down** → Company Progress is clickable to filter, no deep drill-down
- **Smart Recommendations** → Replaced by structured Action Plan

---

### Changes

#### Modified Files

- **`src/hooks/useInterviewReadiness.ts`** — Extended result with:
  - `remainingProblems: number`
  - `estimatedTime: string` (e.g., "12 Days")
  - `actionPlan: ActionItem[]` — structured actions with explanation
  - Accept optional `selectedCompany` parameter for company-filtered computations

- **`src/app/readiness/page.tsx`** — Complete layout restructure:
  - Top-level company selector
  - Single-column focused layout with clear visual hierarchy
  - New components replacing all old sections
  - Removed: Achievements, PatternCoverage, CompanyReadiness drill-down, Weekly Review

#### New Files

- **`src/app/components/readiness/CompanySelector.tsx`** — Prominent company dropdown at page top
  - Options: Overall + 9 companies (Google, Amazon, Microsoft, Meta, Apple, Uber, Agoda, Atlassian, Netflix)
  - Updates all page data via callback
  - Premium styling with chevron, company logos

- **`src/app/components/readiness/HeroCard.tsx`** — Premium single hero card
  - Overall Readiness Score (large animated ring)
  - Current Level (color-coded badge)
  - Remaining Problems count
  - Estimated Time / Interview Status
  - Gradient background, hover effects

- **`src/app/components/readiness/ReadinessBreakdown.tsx`** — Compact factor breakdown
  - 5 progress bars with labels (Company Coverage, Topic Coverage, Difficulty Balance, Revision Completion, Consistency)
  - Brief description per factor
  - Expandable details via click
  - Color-coded progress (green/yellow/red)

- **`src/app/components/readiness/ActionPlan.tsx`** — Structured action plan
  - "Today's Action Plan" header
  - Numbered action items with checkboxes
  - Each item has: action type icon, description, explanation
  - Derived from weak topics, revision queue, company gaps

- **`src/app/components/readiness/WeakAreas.tsx`** — Merged weak areas
  - Three grouped columns: Topics, Patterns, Difficulty
  - Shows weakest items first (sorted by completion %)
  - "Practice Now" button linking to problems page with relevant filters

- **`src/app/components/readiness/CompanyProgress.tsx`** — Compact comparison table
  - All 9 companies with logos, progress bars, percentage
  - Clicking a company updates the page filter
  - Highlighted if selected
  - Avoids duplicating the Company Readiness drill-down

- **`src/app/components/readiness/MockInterviewSection.tsx`** — Concise readiness summary
  - Single card (not per-company)
  - Metrics: Coding, Revision, Topics, Confidence, Overall Status
  - Progress ring for overall, compact bars for sub-metrics

#### Removed from Readiness Page

- ✅ `Achievements.tsx` — moved to Profile responsibility
- ✅ `PatternCoverage.tsx` — merged into WeakAreas
- ✅ `CompanyReadiness.tsx` — replaced by CompanyProgress + page-level filter
- ✅ `InterviewReadiness.tsx` — replaced by new component suite

---

### Data Flow

```
Page State:
  selectedCompany: string | null  (null = Overall)

useCompanyReadiness(progressMap)
  → stats, loading, selectedProblems, etc.
  (reused as-is)

useInterviewReadiness(..., selectedCompany)
  → Computes overall/company-specific scores
  → Adds remainingProblems, estimatedTime, actionPlan

Components receive filtered data based on selectedCompany
```

When `selectedCompany` is set:
- Hero shows company-specific score
- Breakdown adjusts company completion factor
- Action plan includes company-specific items
- Weak areas filter to company-relevant topics
- Mock interview shows selected company status

---

### Design Principles

- **Visual hierarchy**: Hero → Breakdown → Action → Weak Areas → Company → Mock (top to bottom priority)
- **Card grouping**: Related content in unified containers with subtle borders and shadows
- **Typography**: Clear heading sizes (text-lg → text-xs), consistent tracking
- **Spacing**: Generous padding (p-5/p-6), consistent gap system (gap-4/gap-5)
- **Icons**: lucide-react throughout, tinted icon containers per section
- **Progress indicators**: Gradient progress bars, animated SVG rings
- **Hover effects**: Scale transforms, color transitions, shadow elevation
- **Empty states**: Centered contextual messages with icons
- **Loading states**: Skeleton cards matching final layout dimensions
- **Responsive**: Single column on mobile, compact on tablet, full on desktop

### Validation

- `npm run build` — must pass
- `npm run lint` — must pass (only pre-existing CompanyLogo warning)
- Light + Dark mode — must be consistent
- Responsive at desktop, tablet, mobile — must maintain clean layout

---

### Scoring Algorithm (Unchanged)

- **Company Completion (25%)**: Average solved% across loaded companies
- **Topic Coverage (20%)**: % of topics with at least one solved problem
- **Difficulty Balance (15%)**: Average difficulty completion % minus spread
- **Revision Completion (15%)**: % of revision tasks marked as reviewed
- **Consistency (15%)**: Active days / 30 (capped at 100)
- **Current Streak (10%)**: Streak / 30 (capped at 100)

---

## Previous Phases

## Previous: Phase 21 — Interview Readiness Dashboard — ✅

### Goal
Transform the `/readiness` page into a premium analytics dashboard that answers: "Can I confidently clear my next coding interview?" Fix layout truncation issues, add Pattern Coverage, Mock Interview Readiness, and Achievements sections, and restructure to a two-column layout.

### Changes Made

#### New Files
- **`src/app/components/PatternCoverage.tsx`** — Section showing top 10 interview patterns (Sliding Window, DFS, DP, etc.) with completion progress bars, solved/total counts, and color-coded status. Derived from topic-to-pattern keyword matching.
- **`src/app/components/MockInterviewReadiness.tsx`** — Per-company readiness cards showing Coding, Revision, and Topic subscores with an overall readiness label (Ready/Almost/Needs Work/Not Ready) and combined progress bar.
- **`src/app/components/Achievements.tsx`** — Badge row showing unlocked achievements (streak, problem count, company ready, topic master, revision ace) with emoji icons and locked achievement placeholders.

#### Modified Files
- **`src/hooks/useInterviewReadiness.ts`** — Extended `InterviewReadinessResult` with:
  - `PatternCoverage[]` — 30 interview patterns mapped from topics via keyword matching (Array, String, Two Pointers, Sliding Window, Binary Search, DFS, BFS, DP, etc.)
  - `MockInterviewItem[]` — Per-company readiness (coding 50% + revision 25% + topics 25%)
  - `Achievement[]` — 10 achievements across solved count, streaks, company readiness, topic mastery, revision accuracy
  - `level` string — Beginner / Improving / Interview Ready / Strong Candidate / Excellent
- **`src/app/components/InterviewReadiness.tsx`** — Fixed FactorBar label truncation (w-24 → w-28 + title attribute). Fixed Weekly Review grid (7-col → 4-col, added titles). Enhanced hero section with level label and subtitle. Removed weight column from factor bars. Added "Practice weak topics" link. Improved recommendation layout with reason inline.
- **`src/app/components/CompanyReadiness.tsx`** — Added `title` attribute to company card name to prevent truncation of long names. Added `min-w-0` to flex container.
- **`src/app/readiness/page.tsx`** — Restructured to premium two-column layout:
  - Left column: InterviewReadiness (score ring, level, factor bars, company scores, weak areas, recommendations, weekly review)
  - Right column: CompanyReadiness (company grid with full drill-down)
  - Below: PatternCoverage | MockInterviewReadiness (side by side)
  - Bottom: Achievements (full width badge row)
  - Improved header title/subtitle

### Validation
- `npm run build` ✅
- `npm run lint` ✅ (only pre-existing CompanyLogo warning)
- Light + Dark mode consistent
- Responsive at desktop, tablet, mobile

---

## Previous: Phase 19 — Interview Readiness — ✅

### Changes Made
- **`src/hooks/useInterviewReadiness.ts`** — Hook that computes an overall readiness score (0–100%) from 6 weighted factors: Company Completion (25%), Topic Coverage (20%), Difficulty Balance (15%), Revision Completion (15%), Consistency (15%), Current Streak (10%). Also computes company-specific scores, weak topics (sorted by completion % + days since last practice), weak difficulties, smart recommendations (1–3 problems per weak topic with reason), and a weekly review summary.
- **`src/app/components/InterviewReadiness.tsx`** — Full section component with: animated SVG score ring, 6 factor bars with weights, company score grid (3–5 columns), weak topics + weak difficulties cards, smart recommendations callout with bullet list + reasoning, and 7-metric weekly review grid (Solved, Acceptance, Best Day, Missed Days, Top Topic, Weak Topic, Goal %).
- **`src/app/activity/page.tsx`** — Replaced Interview Readiness placeholder with live component. No remaining "Soon" placeholders.

## Previous: Phase 17 — Company Readiness — ✅

### Changes Made
- **`src/hooks/useCompanyReadiness.ts`** — New hook that fetches CSV data for 9 companies (Google, Amazon, Microsoft, Meta, Uber, Atlassian, Agoda, Netflix, Apple) in parallel using `Promise.allSettled`. Parses each CSV with `papaparse`, extracts `problemId` via `getProblemId`, cross-references with `progressMap` for solved counts. Returns per-company stats, difficulty/topic breakdown, and a `solvedSet` for fast lookup. CSVs cached in `sessionStorage` (existing cache key pattern).
- **`src/app/components/CompanyReadiness.tsx`** — Section component with two views

## Previous: Phase 16 — Daily Mission & Goal Tracking — ✅
Added daily mission widget with sub-goals, weekly/monthly progress bars, and configurable goal settings via localStorage.

## Previous: Activity Page — Productivity Workspace Redesign — ✅
Redesigned `/activity` from a statistics dashboard into a productivity-focused daily workspace.

## Previous Phases
[Phases 1-15: Heatmap Redesign, Progress Page Enhancement, Dashboard Enhancement, Global Optimization, Navigation Update, Visual Consistency, Production Theme System, Notes Editor, GitHub Pages Favicon, Activity Page & Calendar, Practice Calendar & Progress Tracking, Production Readiness Review]

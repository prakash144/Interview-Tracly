# Implementation Plan

> *Last updated: July 2026*

This document outlines the phased implementation roadmap for Interview Tracly. Each phase is self-contained, builds on previous phases, and includes validation criteria.

---

## Phase Overview

| Phase | Title | Effort | Status |
|---|---|---|---|
| I | Core Gap Fixes | 2-3h | ✅ Done |
| II | Sprint Planning Overhaul | 8-12h | ✅ Done |
| III | Critical Infrastructure Fixes | 3h | ✅ Done |
| IV | Smart Daily Mission | 3-4h | ✅ Done |
| V | Real-Time Firestore Listeners | 2-3h | ✅ Done |
| 24 | Adaptive Sprint System | 2-3h | ✅ Done |
| 25 | Premium Focus Mode UX | 3-4h | ✅ Done |
| 25b | Production Readiness Fixes | 2-3h | ✅ Done |
| VI | Track Merge / Archive | 2-3h | ⬜ Future |
| VII | Problem ↔ Resource Linking | 3-4h | ⬜ Future |
| VIII | AI Sprint Suggestions | 4-6h | ⬜ Future |
| IX | PWA / Offline Support | 3-4h | ⬜ Future |
| X | Data Export / Import | 2-3h | ⬜ Future |
| XI | Collaborative Sprints | 6-8h | ⬜ Future |

---

## Phase I — Core Gap Fixes ✅ DONE

**Goal**: Fix the critical and moderate issues identified in the architecture review without breaking existing functionality.

### I.1 — Add `order` field to SprintTask interface
**Status**: ✅ Complete — `src/lib/sprints.ts`

### I.2 — Optimistic updates for customLists
**Status**: ✅ Complete — `src/hooks/useCustomLists.ts`

### I.3 — Cascade track delete
**Status**: ✅ Complete — `src/hooks/useTracks.ts`, `trackService.ts`, `ManageTracksDialog.tsx`

### I.4 — Add problems to Global Search
**Status**: ✅ Complete — `src/components/layout/GlobalSearch.tsx`

---

## Phase II — Sprint Planning Overhaul ✅ DONE

**Goal**: Transform the sprint section from a simple Kanban into a full Sprint Planning module.

### II.1 — Data Model Expansion
**Status**: ✅ Complete — `SprintTaskV2` (20+ fields), `SprintV2` with `capacityHours`

### II.2 — Sprint Dashboard Header
**Status**: ✅ Complete — `SprintDashboardHeader.tsx`

### II.3 — Five-Column Kanban Board
**Status**: ✅ Complete — Backlog / To Do / In Progress / Review / Done with `@dnd-kit`

### II.4 — Rich Task Cards
**Status**: ✅ Complete — Priority badge, track chip, difficulty, est hours, tags, company, edit/delete

### II.5 — Filter + Search
**Status**: ✅ Complete — 6 filter dimensions + clear

### II.6 — Task Detail Dialog
**Status**: ✅ Complete — Full editor with all SprintTaskV2 fields

### II.7 — Sprint Analytics
**Status**: ✅ Complete — Completed vs remaining, estimated vs actual, track breakdown

### II.8 — Dashboard Integration
**Status**: ✅ Complete — Quick task status toggle, progress ring

### II.9 — Activity Timeline Integration
**Status**: ✅ Complete — `activityService.ts`

### II.10 — Backlog Management
**Status**: ✅ Complete — Backlog column in board

---

## Phase III — Critical Infrastructure Fixes ✅ DONE

**Goal**: Fix remaining critical issues that cause runtime failures or poor UX as data grows.

### III.1 — Firestore Indexes Configuration
**Status**: ✅ Complete — `firestore.indexes.json` with 5 compound indexes (sprints createdAt desc, tasks order asc, activity timestamp desc, tracks createdAt asc, resources track asc)

### III.2 — Cascade Delete for Sprint Tasks
**Status**: ✅ Complete — `deleteSprint()` batch-deletes tasks subcollection

### III.3 — Offline Persistence
**Status**: ✅ Complete — `enableMultiTabIndexedDbPersistence()` in `src/lib/firebase.ts`

### III.4 — Toast Notification System
**Status**: ✅ Complete — Sonner integrated in all data hooks with unique dedup IDs

### III.5 — Fix Task Query Ordering
**Status**: ✅ Complete — `orderBy("addedAt")` → `orderBy("order")` in `fetchSprintTasks()` / `subscribeSprintTasks()`

### Validation
```bash
npm run build      # 0 errors
npm run lint       # 0 warnings
```

---

## Phase IV — Smart Daily Mission ✅ DONE

**Goal**: A widget that picks the most relevant tasks for today from the active sprint.

### IV.1 — Mission Algorithm
**Status**: ✅ Complete — `src/lib/mission.ts` with `computeDailyMission()`

Logic:
1. Pick 1 task from active sprint "In Progress" (highest priority first)
2. Pick 1 task from "To Do" that is due soonest or highest priority
3. Pick 1 resource from revision list (spaced repetition — longest since last review)
4. Return as "Today's Focus" items

### IV.2 — Dashboard / Activity Integration
**Status**: ✅ Complete — DailyMissionWidget on Dashboard and Activity page

### Files
| File | Change |
|---|---|
| `src/lib/mission.ts` | New — mission algorithm |
| `src/app/components/DailyMission.tsx` | New — widget component |
| `src/app/page.tsx` | Added DailyMissionWidget + revision tracker |
| `src/app/activity/page.tsx` | Added DailyMissionWidget + revision items |

---

## Phase V — Real-Time Firestore Listeners ✅ DONE

**Goal**: Switch from one-shot `getDocs()` to `onSnapshot()` for live updates.

### Files Modified

| File | Change |
|---|---|
| `src/services/firebase/sprintService.ts` | Added `subscribeSprints`, `subscribeTasks` |
| `src/services/firebase/resourceService.ts` | Added `subscribeResources`, `subscribeResourceProgress` |
| `src/services/firebase/trackService.ts` | Added `subscribeTracks` |
| `src/services/firebase/customListService.ts` | Added `subscribeCustomLists` |
| `src/services/firebase/progressService.ts` | Added `subscribeProgress` |
| `src/hooks/useSprints.ts` | Switched to `onSnapshot` |
| `src/hooks/useResources.ts` | Switched to `onSnapshot` with sample merge |
| `src/hooks/useTracks.ts` | Switched to `onSnapshot` |
| `src/hooks/useCustomLists.ts` | Switched to `onSnapshot`, removed `reload()` |
| `src/hooks/useResourceProgress.ts` | Switched to `onSnapshot` |

---

## Phase 24 — Adaptive Sprint System ✅ DONE

**Goal**: Support multiple sprint types with company templates and focus mode.

### Changes

#### Sprint Data Model
- Added `SprintType`: `"learning" | "interview" | "certification" | "custom"` to `Sprint` interface
- New interview fields: `company`, `role`, `interviewDate`, `targetLevel`, `stages`, `template`
- Focus mode field: `pausedSprintId?` — tracks the sprint auto-paused when activating a new one

#### Company Templates
- `COMPANY_TEMPLATES` in `src/lib/sprints.ts`: Google, Microsoft, Amazon, Meta, Apple, Netflix
- Each template defines: `name`, `requiredTopics[]`, `optionalTopics[]`, `difficultyBreakdown`, `typicalStages[]`, `preparationWeeks`

#### SprintDialog Enhancements
- Type selector (Learning/Interview/Certification/Custom)
- Company template dropdown for Interview Sprints
- Conditional interview fields (company, role, interview date, target level, stages)

#### Focus Mode
- `activateSprint` auto-pauses any other active sprint, storing reference in `pausedSprintId`
- Only one sprint can be active at a time

### Files Changed
| File | Change |
|---|---|
| `src/lib/sprints.ts` | SprintType, interview fields, COMPANY_TEMPLATES |
| `src/app/components/sprints/SprintDialog.tsx` | Type selector, templates, interview fields |
| `src/hooks/useSprints.ts` | Focus mode pause/resume logic |

---

## Phase 25 — Premium Focus Mode UX ✅ DONE

**Goal**: Refine the focus mode experience with better labels, dialogs, and timeline.

### Changes

#### SprintCard
- "Paused" → "Suspended" with reason text (e.g., "Suspended by Interview Prep")
- Visual indicator that sprint is suspended

#### SprintDashboardHeader
- Focus Mode banner with reassurance message: "You're in Focus Mode. Stay on track."
- Action buttons: resume suspended sprint, view interview details

#### InterviewCompleteDialog (new)
- Opens when user completes an Interview Sprint
- Outcome selection: "Selected" / "Rejected" / "No response" / "Withdrew"
- Post-interview actions: Resume suspended sprint, archive completed sprint
- Wired into `sprints/page.tsx` sprint completion flow

#### SprintTimeline (new)
- Visual component showing sprint transitions (planned → active → completed/suspended)
- Displays timeline events with dates and status changes

#### Dashboard Enhanced
- Suspended sprint card shown on main sprints page
- Empty state CTA: "Ready for an interview? Create an Interview Sprint"

### Files
| File | Change |
|---|---|
| `src/app/components/sprints/InterviewCompleteDialog.tsx` | New — interview outcome + resume/archive |
| `src/app/components/sprints/SprintTimeline.tsx` | New — transition timeline |
| `src/app/components/sprints/SprintCard.tsx` | Suspended label with reason |
| `src/app/components/sprints/SprintDashboardHeader.tsx` | Focus Mode banner |
| `src/app/sprints/page.tsx` | ConfirmDialog + InterviewComplete flow + suspended card + empty CTA |

---

## Phase 25b — Production Readiness Fixes ✅ DONE

**Goal**: End-to-end production polish before documentation update.

### Changes

| Fix | Files | Detail |
|---|---|---|
| `window.confirm` → `ConfirmDialog` | `sprints/page.tsx` | Destructive action confirmation with proper dialog |
| `alert()` → `toast.error` | `mock-test/page.tsx` | Error feedback using Sonner toast |
| Toast dedup IDs | 5 hooks (44+ calls) | Unique `id` on every `toast.success`/`toast.error`/`toast()` call |
| `aria-label` on delete button | Sprint detail view | Accessibility for icon-only button |
| Emoji → SVG in error boundary | `error.tsx` | `AlertTriangle` icon replaces emoji |
| `prefers-reduced-motion` | Global CSS | `.stagger-group` animation disabled for accessibility |
| `updateTask` catch bug | `useSprints.ts` | Fixed `sprintsRef` → `tasksRef` in rollback |

### Validation
```bash
npm run build      # 0 errors, 0 warnings
npm run lint       # 0 errors (only pre-existing CompanyLogo warning)
```

---

## Phase VI — Track Merge / Archive (⬜ Future)

**Goal**: Full lifecycle management for tracks.

### VI.1 — Cascade Delete
When deleting a track, user chooses:
- "Delete track only" — resources become "unassigned"
- "Delete track and all resources" — cascade delete from Firestore

### VI.2 — Merge Tracks
Dialog with source track + target track selector. All resources from source get `track` field updated to target. Source track is deleted.

### VI.3 — Archive
Toggle on track card. Archived tracks hidden from main listing but visible in a "Show Archived" toggle. Their resources still appear in search.

---

## Phase VII — Problem ↔ Resource Linking (⬜ Future)

**Goal**: Bridge the two parallel data systems.

### VII.1 — Link Problem to Resource
In `ResourceDialog`: "Linked Problems" section that searches the problem workspace and stores `problemId` references.

### VII.2 — Link Resource to Problem
In `NotesDialog` on problems: "Linked Resources" section.

### VII.3 — Display
On Problem cards, show linked resources as chips. On Resource cards, show linked problems as chips. Click navigates to the linked item.

---

## Phase VIII — AI Sprint Suggestions (⬜ Future)

**Goal**: After completing a sprint retro, suggest the next sprint based on weaknesses.

### VIII.1 — Weakness → Task Mapping
Build a static mapping of weaknesses to suggested tasks/resources.

### VIII.2 — Next Sprint Generator
After retro, analyze weaknesses + unfinished tasks + low-completion tracks and auto-generate sprint name, goal, and pre-populated task list.

---

## Phase IX — PWA / Offline Support (⬜ Future)

### IX.1 — Service Worker
Cache static assets on first load. Cache-first for static assets, Network-first for Firestore data.

### IX.2 — Offline Fallback
Show cached pages + "You're offline" banner + queue Firestore writes for later sync.

---

## Phase X — Data Export / Import (⬜ Future)

### X.1 — Export
Settings → "Export My Data" → Downloads JSON with all Firestore collections.

### X.2 — Import
"Import Data" → File upload → Validate JSON → Merge or Replace option.

---

## Phase XI — Collaborative Sprints (⬜ Future)

**Goal**: Share a sprint with another user.

### XI.1 — Sprint Sharing
Generate share link → recipient sees sprint in "Shared with me" → can view/add tasks.

### XI.2 — Task Assignment
Tasks have an `assignedTo` field (UID). Filter by assignee.

### XI.3 — Real-Time Collaboration
Using Firestore `onSnapshot`, multiple users see task status changes in real-time.

---

## Appendix — Effort Estimation

| Phase | Files Changed | New Components | Risk | Effort |
|---|---|---|---|---|
| I | 5-7 | 0 | Low | 2-3h ✅ |
| II | 10-15 | 8-10 | Medium | 8-12h ✅ |
| III | 4-5 | 0 | Low | 3h ✅ |
| IV | 3-4 | 1-2 | Low | 3-4h ✅ |
| V | 8-10 | 0 | Medium | 2-3h ✅ |
| 24 | 3-4 | 0 | Low | 2-3h ✅ |
| 25 | 4-5 | 2 | Low | 3-4h ✅ |
| 25b | 6-8 | 0 | Low | 2-3h ✅ |
| VI | 4-5 | 1 | Low | 2-3h |
| VII | 4-5 | 1-2 | Low | 3-4h |
| VIII | 2-3 | 1 | Medium | 4-6h |
| IX | 3-4 | 0 | High | 3-4h |
| X | 2-3 | 0 | Low | 2-3h |
| XI | 5-7 | 2-3 | High | 6-8h |

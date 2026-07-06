# CLAUDE.md — Timeline

Guidance for Claude Code (and humans) working in this repository.

## What this is

**Timeline** is a project & task‑timeline app for a small startup team. It answers four questions
at a glance: *where do we stand, who is doing what, what is done, and what is stuck?* See
[`docs/PRD.md`](docs/PRD.md) for the full product spec and the origin notes in [`Rough_Idea/`](Rough_Idea/).

The headline differentiator vs. a generic to‑do app: a **project lifecycle** (Phase → Milestone →
Task with automatic roll‑ups), **timelines**, and **loud blockers** (stuck work is escalated and
impossible to miss). Plan‑ahead (Planner + recurring tasks) and a **deadline‑change approval** flow
round out v1.1.

**Hierarchy:** `Project ─< Phase ─< Milestone ─< Task`. A milestone is done when its tasks are done;
a phase when its milestones are done; a project ships when its phases are done. Completed phases stay
as history — `advanceProject()` appends the next lifecycle phase.

## Tech stack

- **Vite + React 18 + TypeScript** — fast SPA, instant dev server.
- **Tailwind CSS v4** — styling (config-light, via `@tailwindcss/vite`).
- **React Router v6** — client routing.
- **Zustand** + `persist` middleware — single app store, **persisted to `localStorage`** (this is the
  v1 "backend"; see *Data layer* below).
- **lucide-react** — icons. **date-fns** — date math.
- No backend server in v1. Data is seeded + local‑first.

## Commands

```bash
npm install      # install deps
npm run dev      # start dev server (http://localhost:5173)
npm run build    # typecheck (tsc --noEmit) + production build
npm run preview  # preview the production build
npm run typecheck # tsc --noEmit only
```

Always run `npm run build` before claiming a change compiles — it runs `tsc --noEmit` and will catch
type errors that the dev server tolerates.

## Architecture & where things live

```
src/
  main.tsx              # app entry, router
  index.css             # Tailwind + design tokens (CSS variables)
  lib/
    types.ts            # ALL domain types (Project, Task, Member, Note, Milestone, enums)
    store.ts            # Zustand store + actions  ← the ONLY place that mutates data
    seed.ts             # realistic seed data (the team's real-ish projects)
    selectors.ts        # derived/computed reads (stats, deadline status, durations)
    utils.ts            # cn(), date + formatting helpers
  components/
    layout/             # AppShell, Sidebar, Topbar
    ui/                 # primitives: Button, Card, Badge, Input, Select, Modal, Progress…
    tasks/              # TaskTable, TaskRow, TaskForm, StatusBadge, DeadlinePill
    timeline/           # TimelineTrack, MilestoneDot
    dashboard/          # StatCard, BlockedPanel, ...
  pages/
    Dashboard.tsx  MyDay.tsx  AllTasks.tsx  MyTasks.tsx  Planner.tsx
    Timeline.tsx   Deadlines.tsx  Targets.tsx  Projects.tsx  ProjectDetail.tsx  Activity.tsx
```

`ProjectDetail.tsx` renders the interactive Phase → Milestone → Task hierarchy; `Planner.tsx` is the
plan‑ahead week view; `MyDay.tsx` is the personal daily digest; `Activity.tsx` is the event feed
(component in `components/activity/`). Task modals live in `components/tasks/` (form, detail, blocker,
reschedule, change‑request, completion). Project creation: `NewProjectModal` (+ **templates** from
`lib/templates.ts`) and `IdeaPlanModal` (idea→plan; real AI generation deferred to the Supabase phase).

### Data layer (important)

- **All state lives in the Zustand store** (`src/lib/store.ts`) and is persisted to `localStorage`
  under the key `timeline-store`. Treat the store actions as the data API.
- **UI never mutates state directly** — it calls store actions (`addTask`, `updateTask`,
  `setBlocker`, `escalateTask`, `completeTask`, `addNote`, …).
- **Reads that compute things** (counts, deadline colour, "where we reached" %) live in
  `selectors.ts`, not inline in components, so they stay consistent and testable.
- To migrate to a real backend (Supabase/Postgres), reimplement the store actions against the API and
  swap `seed.ts` for a fetch — **the components should not need to change.** See `docs/ROADMAP.md`.

### Domain rules to preserve

- **Deadline colour** is derived, never stored: 🔴 overdue/at‑risk, 🟡 due ≤ 3 days, 🟢 comfortable,
  done = neutral. Logic lives once in `selectors.ts` (`deadlineStatus`).
- **A blocked task that "blocks product completion"** bubbles up: it shows on the project, on the
  dashboard Blocked panel, and as a red stop on the timeline.
- **Escalation** bumps priority to `urgent` and timestamps it; surfaces on the dashboard.
- **No silent slips:** changing a due date past the original requires a reason note; the task becomes
  `delayed` and the change is recorded. **Members request** deadline changes with a justification;
  **admins approve** (dashboard Approvals card / task), which auto‑applies the reschedule.
- **Roll‑ups are derived, not stored as truth:** the store's `recompute()` recalculates
  milestone/phase/project completion after *every* mutation. Don't set completion flags by hand —
  change task status and let `recompute()` propagate.
- **Completing a task** captures an optional work‑done note; recurring tasks spawn their next
  occurrence on completion.
- **Activity is centralized:** every meaningful mutation emits an `ActivityEvent` from the store
  (don't append to `activity` from components). `recompute()`'s diff auto‑logs roll‑up completions.
- **Dependencies auto‑shift:** moving a deadline later cascades the same delta to transitive
  `dependsOn` dependents (cycle‑guarded) — see `cascadeShift()` in the store.

## Conventions

- TypeScript strict. No `any` in domain code; model with the enums/types in `types.ts`.
- Tailwind utility classes; shared visual decisions go through design tokens (CSS vars in
  `index.css`) and the `ui/` primitives — don't hand‑roll one‑off button styles.
- Use the `cn()` helper for conditional classes.
- Keep pages thin: pages compose components + selectors; logic lives in store/selectors.
- IDs are string (`crypto.randomUUID()`), dates are ISO strings in the store.
- Match the surrounding code's style; prefer editing existing primitives over adding new ones.

## Status & roadmap

v1 = local‑first, seeded, fully clickable. Auth, real DB, notifications, and Zoho hooks are in
[`docs/ROADMAP.md`](docs/ROADMAP.md). Data shapes are in [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md);
the visual system is in [`docs/UI_SPEC.md`](docs/UI_SPEC.md).

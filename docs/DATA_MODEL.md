# Data Model

The single source of truth is [`src/lib/types.ts`](../src/lib/types.ts). This doc explains the shapes
and the relationships; keep it in sync when the types change.

## Hierarchy

```
Project ──< Phase ──< Milestone ──< Task ──< Note
                                      │
                                      ├─ Blocker        (0..1)
                                      └─ ChangeRequest  (0..1, deadline-change approval)

Member ──< Task (assignee) ; Member owns Projects
```

- A **Project** has an ordered list of **Phases** (lifecycle stages).
- A **Phase** has **Milestones**. A milestone is **done** when all its tasks are done; a phase is
  **done** when all its milestones are done; a project **ships** when all phases are done.
- A **Task** belongs to one Project and (optionally) one Milestone, is assigned to one Member, has
  many Notes, an optional Blocker, and an optional ChangeRequest.
- All roll-up status/dates are **derived in the store's `recompute()`** after every change — see
  `src/lib/store.ts`. Read-only views use `src/lib/selectors.ts`.

`TimelineData` is flat: `{ members, projects, phases, milestones, tasks }`. This keeps store updates
simple (no deep nesting); the hierarchy is expressed through ids.

## Enums

```ts
type Role          = 'admin' | 'member'
type TaskStatus    = 'todo' | 'in_progress' | 'blocked' | 'delayed' | 'done'
type Priority      = 'low' | 'normal' | 'high' | 'urgent'
type Recurrence    = 'none' | 'daily' | 'weekly'
type ProjectStatus = 'planning' | 'active' | 'blocked' | 'on_hold' | 'completed'
type PhaseKind     = 'prototype' | 'testing' | 'pilot' | 'feedback' | 'refine' | 'shipped'
type RollupStatus  = 'todo' | 'in_progress' | 'blocked' | 'done'   // derived (milestone & phase)
type DeadlineState = 'overdue' | 'due_soon' | 'comfortable' | 'none' // derived (selectors)
type NoteKind      = 'comment' | 'delay_reason' | 'status' | 'completion'
type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'
```

## Phase  *(lifecycle stage; ordered per project)*

| field | type | notes |
|---|---|---|
| `id` / `projectId` | string | |
| `kind` | PhaseKind | prototype → testing → pilot → feedback → refine → shipped |
| `label` | string | display name |
| `order` | number | sort within the project |
| `startedDate` | ISO date \| null | set when first task in the phase starts |
| `completedDate` | ISO date \| null | set when all its milestones complete (kept as history) |

A completed phase is **never removed** — `advanceProject()` appends the next phase so the prototype
stays as history while Testing/Pilot/Feedback/Refine continue.

## Milestone  *(a named group of tasks)*

| field | type | notes |
|---|---|---|
| `id` / `projectId` / `phaseId` | string | |
| `label` | string | e.g. "QA pass" |
| `order` | number | sort within the phase |
| `targetDate` | ISO date \| null | optional target |
| `completedDate` | ISO date \| null | set when **all its tasks** are done |

**Derived:** `milestoneProgress()` → `{ done, total, percent, status }`.

## Task

| field | type | notes |
|---|---|---|
| `id` / `projectId` | string | |
| `milestoneId` | string \| null | null = unsorted / general |
| `title` / `description` | string | |
| `assigneeId` | string | the accountable **owner** ("allotted to") |
| `participantIds` | string[] | others **also involved** (meeting attendees, shared todos) — not accountable |
| `status` | TaskStatus | |
| `priority` | Priority | `urgent` after escalation |
| `createdDate` | ISO date | |
| `scheduledFor` | ISO date \| null | **plan-ahead** date (future tasks / Planner) |
| `dueDate` | ISO date \| null | drives deadline colour |
| `originalDueDate` | ISO date \| null | kept when delayed |
| `recurrence` | Recurrence | on completion, the next occurrence is auto-created |
| `startedAt` / `completedAt` | ISO datetime \| null | "Start" / "End" → duration |
| `completionNote` | string \| null | **work-done summary** captured at completion |
| `escalatedAt` | ISO datetime \| null | |
| `blocker` | Blocker \| null | |
| `changeRequest` | ChangeRequest \| null | active/last deadline-change request |
| `dependsOn` | string[] | predecessor task ids — drives **dependency auto-shift** |
| `notes` | Note[] | |

When a task's deadline moves *later* (reschedule or approved request), the store cascades the same
day-delta to all transitive `dependsOn` dependents that aren't done (cycle-guarded), each logged.

## ChangeRequest  *(deadline-change approval flow)*

| field | type | notes |
|---|---|---|
| `id` / `taskId` | string | |
| `requestedById` | string | the member asking |
| `currentDueDate` | ISO date \| null | deadline at request time |
| `requestedDueDate` | ISO date | proposed new deadline |
| `justification` | string | why |
| `status` | ChangeRequestStatus | pending → approved / rejected |
| `decidedById` / `decidedAt` / `decisionNote` | | set by the approving admin |
| `createdAt` | ISO datetime | |

On **approve**, the store applies the reschedule automatically (task → `delayed`, deadline updated,
a note recorded). Members request; admins approve from the dashboard **Approvals** card or the task.

## Blocker / Note

`Blocker` = `{ reason, blocksCompletion, raisedById, raisedAt, waitingOnId }`. A
completion-blocking blocker bubbles to the project + dashboard. `Note` =
`{ id, authorId, body, createdAt, kind }`; `kind: 'completion'` marks a work-done summary,
`'delay_reason'` a slip/approval reason.

## ActivityEvent  *(append-only feed — "what we did")*

| field | type | notes |
|---|---|---|
| `id` / `at` | string | `at` = ISO datetime |
| `actorId` | string | who did it |
| `kind` | ActivityKind | task/milestone/phase/project + change events (see `types.ts`) |
| `projectId` / `taskId` / `milestoneId` / `phaseId` | string \| null | references |
| `summary` / `detail` | string | one-line summary + optional detail (e.g. completion note) |

Events are emitted centrally inside store actions; `recompute()`'s diff auto-emits
`milestone_completed` / `phase_completed` / `project_shipped` when those roll-ups flip to done.
Powers the **Activity** page (global + per-project) and **My Day**'s "since yesterday".

## Persistence

The whole graph (`{ members, projects, phases, milestones, tasks, activity }`) lives in the Zustand
store, serialized to `localStorage` under `timeline-store`
(`version: SEED_VERSION`). A version bump migrates by reseeding (keeps theme). `seed.ts` provides the
initial graph; "Reset demo data" restores it.

# Timeline — Product Requirements Document (PRD)

> A project & task **timeline** system for a small startup team, so the founder and
> the builder always know **where we stand, who is doing what, what is done, and what is stuck.**

- **Status:** Draft v1 (from founder's handwritten notes, `Rough_Idea/`)
- **Owner:** Durgesh (Full‑stack Dev + Product Manager + Researcher + DevOps)
- **Last updated:** 2026-06-22

---

## 1. Background & Problem

The team is a small counselling‑business startup. One person ("the builder") wears every
hat — full‑stack developer, product manager, researcher, and DevOps — and uses Claude Code
to ship prototypes fast. The founders feed in ideas; some work is outsourced to freelancer
friends. Work spans several products at once (app prototypes, a website redesign, a Zoho CRM
integration, etc.).

**The core pain (in the founder's words):**

> "I worked for 3 months and I and my team don't know where we stand, what the progress is,
> and what work we completed. There is no system to capture this progress where we can see the
> full timeline. We just *think* we are moving but we really don't know. No one in the team
> (founder and me) knows who is doing what, how much is going on in parallel, and how much is done."

**Why work silently stalls:** tasks block on other people. Examples from the notes:

- A website redesign is built, but **deployment is blocked** because the founder still needs to
  verify the website copy/content.
- A Zoho CRM integration is **blocked** on someone preparing the old customer data sheet.

These blockers are invisible today, so a "stuck" task can quietly hold up an entire product's
completion for weeks.

### Problem statement

> The team has **no shared source of truth for progress over time.** They cannot see the timeline
> of a product, cannot tell who owns what, and cannot see which blocked task is holding a product
> back — so things stall without anyone noticing.

---

## 2. Goals & Non‑Goals

### Goals

1. **Make progress visible over time** — a literal timeline per product, from start to "where we
   reached today," including history of old/finished work.
2. **Assign & track work** — write daily tasks, allot them to members, set deadlines, track status.
3. **Surface blockers loudly** — when a task is stuck (especially if it blocks product completion),
   the system **flags it** and lets it be **escalated to urgent.**
4. **Account for reality** — when a task can't finish on time, the owner records a **reason note**,
   and the system **adjusts** downstream dates instead of silently slipping.
5. **One‑glance answers** — a dashboard answering: *What's done? What's pending? What's due today?
   Where have we reached? What is blocking us?*

### Non‑Goals (v1)

- Not a full Jira/Asana replacement (no custom workflows, sprints, story points).
- No billing/time‑tracking invoicing (Zoho Books handles finance separately).
- No deep Zoho CRM sync in v1 (tracked as a roadmap item, not a launch feature).
- No native mobile app (responsive web only).

---

## 3. Users & Roles

| Role | Who | Can do |
|---|---|---|
| **Admin / Builder** | Durgesh, Founder | Create projects, set project deadlines, create & assign tasks to anyone, mark blockers, escalate, enter historical work, see everything. |
| **Member** | Freelancer friends, counsellors | See their assigned tasks, update status, log start/end, **add notes** (incl. reason for delay), raise a blocker, request more time. |

> v1 ships with role‑aware UI but a lightweight auth model (see Roadmap → Auth). The data model
> already carries `assigneeId` / `role` so real auth slots in cleanly.

---

## 4. Key Concepts (domain language)

- **Project (a.k.a. Product)** — a body of work with an outcome, e.g. *"Counselling Website Redesign"*,
  *"Zoho CRM Integration"*, *"Mobile App Prototype ABC"*. Has a start date, deadline, owner, members,
  status, a working link, and a timeline of milestones.
- **Task** — a unit of work inside a project. Has an assignee, dates (start/due/done), a status, a
  priority, a colour‑coded deadline, notes, and an optional **blocker**.
- **Blocker** — the reason a task can't proceed (e.g. "waiting on founder to verify copy"). A blocker
  can be marked as **blocking product completion**, which bubbles up to the project and the dashboard.
- **Milestone / Timeline event** — a dated point on a project's timeline ("Redesign started",
  "Handed to founder for review", "Deployed"). Drives the **My Timeline / Where we reached** views.
- **Target** — a per‑product summary lens: tasks done, tasks remaining, delayed tasks, and the timeline.
- **Note** — a timestamped comment on a task (reason for delay, status update, hand‑off).

---

## 5. Functional Requirements

### 5.1 Dashboard (`/`)
From the sketch: a command center answering the founder's questions at a glance.

- **Stat cards:** Tasks Done · Pending Tasks · Today's Tasks · Completed Tasks.
- **"Where we reached"** — overall progress across active projects (progress bars / %).
- **Blocked & Urgent panel** — every flagged/escalated task, most urgent first. *This is the
  headline feature: stuck work must be impossible to miss.*
- **Today's tasks** — what's due today, across the team.
- **Mini calendar / progress** — month view with task density and deadlines.

### 5.2 All Tasks (`/tasks`)
- Table of every task across all projects.
- **Filters:** by date (incl. "Today"), status, assignee, project, priority.
- **Columns:** Task · Project · Status · Deadline (colour‑coded) · Notes · Assigned to.
- Create / edit task; assign to a member; set deadline & priority; add a blocker.

### 5.3 My Tasks (`/my-tasks`)
- Same data scoped to the current user.
- **Filters:** date ("Today"), status.
- **Columns:** Task · Status · Start · End · **Duration** · Notes.
- Inline: start a task (sets start time), complete it (sets end + computes duration), add a note,
  raise a blocker / request more time.

### 5.4 Timeline (`/timeline`)
- Per‑project horizontal timeline: start → milestones → today → deadline.
- Shows **where we reached**, what's done, and where a blocker stopped progress.
- Visual marker when a blocked task is **holding up completion.**
- Toggle to include **historical / completed projects** (the "old work" entry requirement).

### 5.5 Projects (`/projects`)
From the "is there a Project 1/2/3…" sketch.

- List + detail per project: **Started on** · Deadline · Status · **Working link** · **People involved**
  · **Total days** · % complete.
- Task list within a project (Task · Date · Assigned to · Status).
- "Project completed" state with completion date and total days taken.
- **Enter historical work** — backfill old projects & tasks so the team sees past work too.

### 5.6 Deadlines (`/deadlines`)
- All upcoming/overdue deadlines, **colour‑coded**:
  - 🟢 **Green** — comfortable (due in > 3 days).
  - 🟡 **Yellow** — due soon (today / next 1–3 days).
  - 🔴 **Red** — overdue or due today & not started.
- Group by Overdue / Today / This week / Later.

### 5.7 Targets (`/targets`)
From the "For Prod ABC" sketch — a per‑product scorecard.

- Per product: **Tasks done · Tasks remaining · Delayed tasks · Timeline** progress.
- Quick read on whether a product is on track.

### 5.8 Cross‑cutting: Blockers, Escalation & Deadline Adjustment
- Any task can be marked **Blocked** with a reason and "blocks product completion" flag.
- A blocked/late task can be **escalated to Urgent** (priority bumps, surfaces on dashboard).
- When a deadline can't be met, the owner adds a **reason note** and a **new proposed date**; the
  task moves to a "Delayed" state and the project timeline reflects the slip (no silent slipping).

### 5.9 Lifecycle, planning & approvals (v1.1)

Added after first review — these refine how work is structured and tracked.

- **Project lifecycle (Phase → Milestone → Task).** Each project moves through ordered **phases**:
  Prototype → Testing → Pilot → Feedback → Refine → Shipped. A phase holds **milestones**; a
  milestone holds **tasks**. A milestone completes when all its tasks are done; a phase completes when
  all its milestones are done; the project ships when all phases are done. **Completed phases stay as
  history** — when the prototype is done you *advance* the project (add the Testing/Pilot/Feedback
  phase) and keep working without losing the past. Roll-ups are automatic.
- **Plan ahead (Planner).** A week view to drop tasks onto **future days** (`scheduledFor`) so you
  batch-plan instead of adding work daily. Tasks can **recur** (daily/weekly) — completing one
  auto-creates the next occurrence.
- **Deadline-change approvals.** A member can't silently move a deadline they were given — they
  **request** a new date with a **justification**. Admins see an **Approvals** inbox (dashboard +
  on the task); on **approve**, the system applies the change automatically and records it. Admins
  can still reschedule directly.
- **Completion summary.** Marking a task done prompts for a short **"what did you get done?"** note,
  stored on the task and shown in its history.

---

## 6. Non‑Functional Requirements

- **Runs instantly:** `npm install && npm run dev` — no external services needed for v1
  (local‑first store, seeded with realistic data).
- **Beautiful & calm UI:** modern, uncluttered, fast; colour used meaningfully (deadline status).
- **Responsive:** works on laptop and phone.
- **Accessible:** keyboard navigable, sufficient contrast, semantic markup.
- **Swappable backend:** all data access goes through one store/repository layer so it can move to
  Supabase/Postgres without touching UI.

---

## 7. Success Metrics

- Founder can answer "where do we stand?" in **< 10 seconds** on the dashboard.
- **0 invisible blockers** — every stuck task is visible and attributable.
- Every product has a viewable **timeline from start to now**.
- Historical projects are entered so nothing from the last 3 months is "lost".

---

## 8. UI Map (from the sketches)

```
Sidebar:  Dashboard · All Tasks · My Tasks · Timeline · Deadlines · Targets · Projects
Dashboard:  [Tasks Done] [Pending] [Today] [Completed]
            [Where we reached / progress]  [Blocked & Urgent]
            [Today's tasks]                [Calendar / progress]
All Tasks:  filter(date, status, assignee) → table(Task, Status, Notes, Assigned to)
My Tasks:   filter(date, status) → table(Task, Status, Start, End, Duration, Notes)
Targets:    per product → tasks done · remaining · delayed · timeline
Projects:   Project N → started, tasks(date, assignee, status), completed, link, people, total days
```

See `docs/UI_SPEC.md` for the visual system and `docs/DATA_MODEL.md` for entities.

---

## 9. Open Questions

1. Real auth & multi‑device sync — Supabase vs. simple email magic‑link? (Roadmap)
2. Should freelancers see *all* projects or only ones they're on? (Default: only theirs.)
3. Zoho CRM: one‑way push of project status, or full sync? (Out of scope for v1.)
4. Notifications (email / WhatsApp) when a task is escalated — needed for v2?

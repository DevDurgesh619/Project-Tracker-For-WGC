# Roadmap

## v1 — Local‑first MVP (this build)
Fully clickable, seeded, no backend. Delivers the founder's core ask: visible timelines + loud blockers.

- [x] Domain model, store, seed data
- [x] App shell (sidebar, topbar, theme, user switcher)
- [x] Dashboard (4 stat cards, "where we reached", Blocked & Urgent panel, today, calendar)
- [x] All Tasks (filter + table, create/edit, assign, deadline, blocker)
- [x] My Tasks (start/complete with duration, notes, raise blocker)
- [x] Timeline (per‑project track, milestones, blocker stop, historical toggle)
- [x] Projects + detail (started, link, people, total days, completion)
- [x] Deadlines (colour‑coded buckets)
- [x] Targets (per‑product scorecard: done / remaining / delayed / timeline)

## v1.1 — Lifecycle, planning & approvals (done)
From the first review round.

- [x] **Project lifecycle**: Phase → Milestone → Task with automatic roll‑ups; advance through
      Prototype → Testing → Pilot → Feedback → Refine → Shipped, keeping completed phases as history
- [x] **Planner** week view + `scheduledFor` (plan future tasks) and **recurring** tasks
- [x] **Deadline‑change approvals**: members request w/ justification → admin approves → auto‑applied
- [x] **Completion summary** captured when a task is marked done

## v1.2 — Tracking & speed (done)
From the second review round.

- [x] **Activity feed** ("what we did") — append‑only event log, global page + per‑project, filters;
      roll‑up completions (milestone/phase/project) auto‑logged
- [x] **My Day** digest — personal focus today, overdue, starts‑today, waiting‑on‑you, recently
      finished, and "since yesterday" from the feed
- [x] **Task dependencies + auto‑shift** — `dependsOn`; when a deadline moves out, transitive
      dependents shift by the same delta (cycle‑guarded), logged
- [x] **Project templates** — Website Redesign / CRM / App Prototype / Content Engine seed milestones
      + starter tasks
- [x] **Idea → plan** UI — paste an idea + outline → drafted milestones/tasks (deterministic parser
      now; real AI generation deferred to the Supabase phase via a server proxy)

## v2 — Real backend & multi‑user
Swap the store's actions to talk to a real API; UI stays the same (see `CLAUDE.md` → Data layer).
**Includes the real AI idea→plan generation** (server‑side Claude call, so no API key in the browser).

- [ ] **Supabase** (Postgres + Auth + Row Level Security). Tables mirror `docs/DATA_MODEL.md`.
- [ ] Email magic‑link / OAuth login; real `Member` accounts and roles.
- [ ] Realtime sync so founder + freelancers see updates live.
- [ ] Per‑role visibility (members see only their projects by default).
- [ ] Activity log / audit of status & deadline changes.

## v3 — Workflow & notifications
- [ ] Notifications when a task is **escalated to urgent** or a blocker is raised (email; WhatsApp via
      provider). The "waiting on" person gets pinged.
- [ ] Recurring/daily tasks; templates for repeated project types (e.g. "new website redesign").
- [ ] Smart deadline adjustment: when a task slips, propose shifted downstream dates to approve.
- [ ] @mentions in notes.

## v4 — Integrations
- [ ] **Zoho CRM** — push project/product status; link a project to a CRM record. (Origin note: the
      team is integrating Zoho.)
- [ ] **Zoho Books / Projects** — optional sync of billable work.
- [ ] Calendar sync (Google Calendar) for deadlines.
- [ ] Public read‑only "status link" per project for the founder to share.

## Tech debt / hardening (ongoing)
- [ ] Unit tests for `selectors.ts` (deadline state, durations, completion blocking).
- [ ] E2E happy paths (create task → assign → block → escalate → complete).
- [ ] Optimistic updates + error toasts once networked.

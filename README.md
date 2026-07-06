# Timeline

A project & task **timeline** for a small startup team — so the founder and the builder always know
**where we stand, who's doing what, what's done, and what's stuck.**

Built because "we worked for 3 months and didn't know where we stood." Timeline makes progress
visible over time and makes **blocked work impossible to miss.**

![pages](https://img.shields.io/badge/pages-7-4f46e5) ![stack](https://img.shields.io/badge/Vite%20%2B%20React%20%2B%20TS%20%2B%20Tailwind-informational)

## Features

- **Dashboard** — Tasks done / pending / today / completed, "where we reached" progress, and a loud
  **Blocked & Urgent** panel.
- **All Tasks** — filterable table (date, status, assignee, project) with colour‑coded deadlines.
- **My Tasks** — start/complete tasks (auto‑duration), add notes, raise blockers.
- **Timeline** — per‑project rail from start → milestones → today → deadline, with a red stop where a
  blocker halts progress. Includes historical/old projects.
- **Projects** — started date, working link, people involved, total days, % complete, completion.
- **Deadlines** — 🔴 overdue · 🟡 due soon · 🟢 comfortable, grouped into buckets.
- **Targets** — per‑product scorecard: tasks done · remaining · delayed · timeline.

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
```

The app ships with realistic **seeded data** (website redesign, Zoho CRM integration, app prototype,
plus completed historical work) so every screen is populated immediately. Use the **user switcher**
in the sidebar to view as the admin or a member. "Reset demo data" restores the seed.

```bash
npm run build    # typecheck + production build
npm run preview  # serve the build
```

## How it works (v1)

No backend required. All data lives in a single **Zustand** store persisted to `localStorage`. This
keeps the prototype instant and offline, and the data layer is isolated so it can be swapped for
**Supabase/Postgres** later without changing the UI — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Docs

| Doc | What |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, goals, user stories |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Entities & relationships |
| [`docs/UI_SPEC.md`](docs/UI_SPEC.md) | Visual system & components |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What's next (backend, notifications, Zoho) |
| [`CLAUDE.md`](CLAUDE.md) | Guide for Claude Code / contributors |

Original concept notes: [`Rough_Idea/`](Rough_Idea/).

## Tech stack

Vite · React 18 · TypeScript · Tailwind CSS v4 · React Router · Zustand · lucide-react · date-fns.

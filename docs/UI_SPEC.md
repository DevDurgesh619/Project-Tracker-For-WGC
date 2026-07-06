# UI Spec — visual system

Goal: **calm, modern, fast.** Information‑dense where it matters (tables, timeline) but never noisy.
Colour is used *meaningfully* — mostly to signal deadline/blocker state, not decoration.

## Design tokens (CSS variables in `src/index.css`)

Light + dark theme. Tokens are referenced by Tailwind utilities and the `ui/` primitives.

| token | light | role |
|---|---|---|
| `--bg` | near‑white `#f8fafc` | app background |
| `--surface` | `#ffffff` | cards, panels |
| `--border` | `#e7e9ee` | hairlines |
| `--text` | `#0f172a` | primary text |
| `--muted` | `#64748b` | secondary text |
| `--brand` | indigo `#4f46e5` | primary actions, active nav |
| `--brand-soft` | indigo 50/950 | active backgrounds |

**Status palette** (the "colourful deadline" requirement):

| state | colour | meaning |
|---|---|---|
| 🔴 `danger` | red `#ef4444` | overdue / blocked / urgent |
| 🟡 `warn` | amber `#f59e0b` | due soon / delayed |
| 🟢 `ok` | emerald `#10b981` | done / on track / comfortable |
| 🔵 `info` | blue `#3b82f6` | in progress |
| ⚪ `neutral` | slate | todo / planning |

## Layout

- **Persistent left sidebar** (collapsible on mobile): brand, then nav —
  Dashboard · All Tasks · My Tasks · Timeline · Deadlines · Targets · Projects. Footer: current user
  switcher + theme toggle.
- **Topbar:** page title + contextual actions (search, "New task", filters), and a "Today" date chip.
- **Content:** max‑width container, generous spacing, 8px grid.

## Components (`src/components/ui`)

- **Button** — variants: `primary | secondary | ghost | danger`; sizes `sm | md`.
- **Card** — surface + border + subtle shadow; `CardHeader / CardTitle / CardContent`.
- **Badge / Pill** — status & priority chips using the status palette.
- **DeadlinePill** — colour‑coded date chip (red/amber/green) — the signature element.
- **Avatar** — initials on `member.avatarColor`.
- **Progress** — thin rounded bar, brand fill; used for "% complete" / "where we reached".
- **Input / Textarea / Select** — form controls.
- **Modal / Sheet** — task create/edit, blocker dialog.
- **Tabs, Tooltip, EmptyState**.

## Signature views

- **StatCard** — big number + label + delta/sparkline; the four dashboard counters.
- **BlockedPanel** — red‑accented list of blocked/urgent tasks with reason + "waiting on"; the most
  prominent block on the dashboard.
- **TimelineTrack** — horizontal rail per project: start dot → milestone dots → "today" marker →
  deadline; a red stop dot where a blocker halts progress. Hover shows the milestone label/date.
- **TaskTable** — dense, sortable, filterable; deadline column uses `DeadlinePill`; assignee column
  uses `Avatar`; status uses `StatusBadge`.
- **Calendar** — month grid with per‑day dots sized by task count; deadlines coloured by state.

## Motion & polish

- Subtle 150ms transitions on hover/active; no gratuitous animation.
- Skeleton/empty states for every list.
- Fully keyboard navigable; visible focus rings using `--brand`.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.

## Responsiveness

- ≥1024px: sidebar + multi‑column dashboard.
- <1024px: sidebar collapses to a drawer; dashboard stacks; tables scroll horizontally with the key
  columns pinned.

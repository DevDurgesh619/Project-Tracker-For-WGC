import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  FolderPlus,
  Play,
  Plus,
  Rocket,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { Avatar, EmptyState } from '@/components/ui'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData } from '@/lib/hooks'
import { memberById } from '@/lib/selectors'
import { fmtDate, fmtRelative, toDate } from '@/lib/utils'
import type { ActivityEvent, ActivityKind } from '@/lib/types'
import { format } from 'date-fns'

const META: Record<ActivityKind, { icon: typeof Check; color: string }> = {
  project_created: { icon: FolderPlus, color: 'var(--info)' },
  project_shipped: { icon: Rocket, color: 'var(--ok)' },
  project_deleted: { icon: Trash2, color: 'var(--danger)' },
  phase_added: { icon: Plus, color: 'var(--brand)' },
  phase_completed: { icon: CheckCircle2, color: 'var(--ok)' },
  milestone_added: { icon: Plus, color: 'var(--brand)' },
  milestone_completed: { icon: Target, color: 'var(--ok)' },
  task_created: { icon: Plus, color: 'var(--muted)' },
  task_started: { icon: Play, color: 'var(--info)' },
  task_completed: { icon: CheckCircle2, color: 'var(--ok)' },
  task_blocked: { icon: Ban, color: 'var(--danger)' },
  task_unblocked: { icon: Check, color: 'var(--ok)' },
  task_escalated: { icon: AlertTriangle, color: 'var(--danger)' },
  task_rescheduled: { icon: CalendarClock, color: 'var(--warn)' },
  task_autoshifted: { icon: ArrowRight, color: 'var(--warn)' },
  change_requested: { icon: CalendarClock, color: 'var(--warn)' },
  change_approved: { icon: Check, color: 'var(--ok)' },
  change_rejected: { icon: X, color: 'var(--danger)' },
}

export function ActivityList({ events }: { events: ActivityEvent[] }) {
  const data = useData()
  const [openId, setOpenId] = useState<string | null>(null)

  if (events.length === 0) {
    return <EmptyState title="No activity yet" description="Changes will show up here as the team works." />
  }

  // group by calendar day
  const groups: { day: string; items: ActivityEvent[] }[] = []
  for (const e of events) {
    const day = format(toDate(e.at), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(e)
    else groups.push({ day, items: [e] })
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.day}>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--faint)] mb-2">
              {dayLabel(g.day)}
            </div>
            <ul className="relative space-y-1 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border)]">
              {g.items.map((e) => {
                const m = META[e.kind]
                const Icon = m.icon
                const actor = memberById(data, e.actorId)
                const clickable = !!e.taskId
                return (
                  <li
                    key={e.id}
                    onClick={() => e.taskId && setOpenId(e.taskId)}
                    className={`relative flex items-start gap-3 rounded-lg px-2 py-2 ${clickable ? 'cursor-pointer hover:bg-[var(--surface-2)]' : ''}`}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full ring-4 ring-[var(--bg)] shrink-0 z-10"
                      style={{ backgroundColor: `color-mix(in srgb, ${m.color} 15%, transparent)`, color: m.color }}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm">
                        <span className="font-medium">{actor?.name ?? 'Someone'}</span>{' '}
                        <span className="text-[var(--text)]">{stripActor(e.summary, actor?.name)}</span>
                      </p>
                      {e.detail && <p className="text-[13px] text-[var(--muted)] italic mt-0.5">“{e.detail}”</p>}
                      <p className="text-[12px] text-[var(--faint)] mt-0.5">{fmtRelative(e.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function dayLabel(dayISO: string): string {
  const d = toDate(dayISO)
  const today = format(new Date(), 'yyyy-MM-dd')
  const yest = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
  if (dayISO === today) return 'Today'
  if (dayISO === yest) return 'Yesterday'
  return fmtDate(d, 'EEEE, MMM d')
}

// summaries are phrased without the actor name; keep as-is (defensive trim)
function stripActor(summary: string, _name?: string): string {
  return summary
}

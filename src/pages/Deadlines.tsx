import { useState } from 'react'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Badge, Card, CardContent, DeadlinePill, EmptyState } from '@/components/ui'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData } from '@/lib/hooks'
import { deadlineStatus, memberById, projectById } from '@/lib/selectors'
import { cn, daysFromToday } from '@/lib/utils'
import type { Task } from '@/lib/types'

type BucketKey = 'overdue' | 'today' | 'week' | 'later'

const BUCKETS: { key: BucketKey; label: string; color: string; hint: string }[] = [
  { key: 'overdue', label: 'Overdue', color: 'var(--danger)', hint: 'Past deadline' },
  { key: 'today', label: 'Due today', color: 'var(--warn)', hint: 'Needs to land today' },
  { key: 'week', label: 'This week', color: 'var(--info)', hint: 'Next 7 days' },
  { key: 'later', label: 'Later', color: 'var(--ok)', hint: 'More than a week out' },
]

export function Deadlines() {
  const data = useData()
  const [openId, setOpenId] = useState<string | null>(null)

  const active = data.tasks.filter((t) => t.status !== 'done' && t.dueDate)
  const grouped: Record<BucketKey, Task[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  }
  for (const t of active) {
    const d = daysFromToday(t.dueDate) ?? 0
    if (d < 0) grouped.overdue.push(t)
    else if (d === 0) grouped.today.push(t)
    else if (d <= 7) grouped.week.push(t)
    else grouped.later.push(t)
  }
  for (const k of Object.keys(grouped) as BucketKey[]) {
    grouped[k].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  }

  return (
    <>
      <PageHeader
        title="Deadlines"
        subtitle="Colour-coded so nothing slips quietly. 🔴 overdue · 🟡 due soon · 🟢 comfortable."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {BUCKETS.map((b) => (
          <Card key={b.key}>
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
              <h3 className="font-semibold">{b.label}</h3>
              <Badge tone="neutral" className="ml-0.5">
                {grouped[b.key].length}
              </Badge>
              <span className="text-[12px] text-[var(--faint)] ml-auto">{b.hint}</span>
            </div>
            <CardContent className="pt-2">
              {grouped[b.key].length === 0 ? (
                <p className="text-[13px] text-[var(--faint)] py-4 text-center">
                  Nothing here.
                </p>
              ) : (
                <ul className="space-y-1">
                  {grouped[b.key].map((t) => (
                    <DeadlineRow key={t.id} task={t} onOpen={() => setOpenId(t.id)} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {active.length === 0 && (
        <Card className="mt-5">
          <EmptyState
            icon={<CheckCircle2 size={22} className="text-[var(--ok)]" />}
            title="No open deadlines"
            description="Every task with a deadline is done. Nice."
          />
        </Card>
      )}

      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function DeadlineRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const data = useData()
  const project = projectById(data, task.projectId)
  const assignee = memberById(data, task.assigneeId)
  return (
    <li
      onClick={onOpen}
      className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
    >
      <span
        className="h-7 w-1 rounded-full shrink-0"
        style={{ backgroundColor: project?.color ?? 'var(--border)' }}
      />
      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-medium truncate')}>{task.title}</div>
        <div className="text-[12px] text-[var(--faint)] truncate">{project?.name}</div>
      </div>
      <Avatar member={assignee} size="xs" />
      <CalendarClock size={14} className="text-[var(--faint)] hidden sm:block" />
      <DeadlinePill date={task.dueDate} state={deadlineStatus(task)} />
    </li>
  )
}

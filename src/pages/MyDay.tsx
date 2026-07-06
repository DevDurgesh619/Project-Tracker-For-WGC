import { useState } from 'react'
import { subDays } from 'date-fns'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  PlayCircle,
  Sun,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, CardContent, CardHeader, DeadlinePill, EmptyState, StatusBadge } from '@/components/ui'
import { ActivityList } from '@/components/activity/ActivityList'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData, useCurrentUser } from '@/lib/hooks'
import { activitySince, deadlineStatus, memberById, myDay, projectById } from '@/lib/selectors'
import { fmtRelative } from '@/lib/utils'
import type { Task } from '@/lib/types'

export function MyDay() {
  const data = useData()
  const me = useCurrentUser()
  const [openId, setOpenId] = useState<string | null>(null)

  const since1d = subDays(new Date(), 1).toISOString()
  const since2d = subDays(new Date(), 2).toISOString()
  const day = me ? myDay(data, me.id, since2d) : null
  const recentActivity = activitySince(data, since1d)

  if (!me || !day) return null

  return (
    <>
      <PageHeader
        title={`Good day, ${me.name.split(' ')[0]} 👋`}
        subtitle="Your personal focus for today — everything that needs you, in one place."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: what to do */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Focus today" subtitle="Due or planned for today" icon={<Sun size={18} className="text-[var(--warn)]" />} />
            <CardContent>
              <TaskList tasks={day.focus} emptyTitle="Nothing due today" emptyDesc="Pull something forward from the Planner, or enjoy the space." onOpen={setOpenId} />
            </CardContent>
          </Card>

          {day.overdue.length > 0 && (
            <Card>
              <CardHeader title="Overdue" subtitle="Past deadline — clear these first" icon={<Clock size={18} className="text-[var(--danger)]" />} />
              <CardContent>
                <TaskList tasks={day.overdue} onOpen={setOpenId} />
              </CardContent>
            </Card>
          )}

          {day.startsToday.length > 0 && (
            <Card>
              <CardHeader title="Starts today" subtitle="Planned to begin now" icon={<PlayCircle size={18} className="text-[var(--info)]" />} />
              <CardContent>
                <TaskList tasks={day.startsToday} onOpen={setOpenId} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: who needs you + what changed */}
        <div className="space-y-5">
          {day.waitingOnMe.length > 0 && (
            <Card>
              <CardHeader title="Waiting on you" subtitle="Others are blocked on these" icon={<UserCheck size={18} className="text-[var(--danger)]" />} />
              <CardContent>
                <ul className="space-y-2">
                  {day.waitingOnMe.map((t) => {
                    const raiser = memberById(data, t.blocker?.raisedById ?? '')
                    return (
                      <li
                        key={t.id}
                        onClick={() => setOpenId(t.id)}
                        className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3 cursor-pointer"
                      >
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-[12.5px] text-[var(--muted)] mt-0.5">{t.blocker?.reason}</div>
                        {raiser && <div className="text-[12px] text-[var(--faint)] mt-1">raised by {raiser.name} · {fmtRelative(t.blocker?.raisedAt ?? null)}</div>}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {day.recentlyDone.length > 0 && (
            <Card>
              <CardHeader title="You recently finished" subtitle="Last 48 hours" icon={<CheckCircle2 size={18} className="text-[var(--ok)]" />} />
              <CardContent>
                <ul className="space-y-1">
                  {day.recentlyDone.map((t) => (
                    <li key={t.id} onClick={() => setOpenId(t.id)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 cursor-pointer hover:bg-[var(--surface-2)]">
                      <CheckCircle2 size={14} className="text-[var(--ok)] shrink-0" />
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      <span className="text-[12px] text-[var(--faint)]">{fmtRelative(t.completedAt)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Since yesterday" subtitle="What changed across the team" icon={<History size={18} />} />
            <CardContent className="pt-2">
              {recentActivity.length === 0 ? (
                <p className="text-[13px] text-[var(--faint)] py-2">Quiet so far.</p>
              ) : (
                <ActivityList events={recentActivity.slice(0, 12)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function TaskList({
  tasks,
  emptyTitle,
  emptyDesc,
  onOpen,
}: {
  tasks: Task[]
  emptyTitle?: string
  emptyDesc?: string
  onOpen: (id: string) => void
}) {
  const data = useData()
  if (tasks.length === 0) {
    return <EmptyState icon={<CalendarClock size={20} className="text-[var(--ok)]" />} title={emptyTitle ?? 'Nothing here'} description={emptyDesc} />
  }
  return (
    <ul className="space-y-1">
      {tasks.map((t) => {
        const project = projectById(data, t.projectId)
        return (
          <li
            key={t.id}
            onClick={() => onOpen(t.id)}
            className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="h-7 w-1 rounded-full shrink-0" style={{ backgroundColor: project?.color ?? 'var(--border)' }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{t.title}</div>
              <div className="text-[12px] text-[var(--faint)] truncate">{project?.name}</div>
            </div>
            {t.priority === 'urgent' && <Badge tone="danger">Urgent</Badge>}
            <StatusBadge status={t.status} />
            <DeadlinePill date={t.dueDate} state={deadlineStatus(t)} />
          </li>
        )
      })}
    </ul>
  )
}

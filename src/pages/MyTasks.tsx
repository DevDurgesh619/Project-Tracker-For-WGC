import { useMemo, useState } from 'react'
import { ListTodo } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Card, EmptyState, Select } from '@/components/ui'
import { TaskTable } from '@/components/tasks/TaskTable'
import { useData, useCurrentUser } from '@/lib/hooks'
import { isOverdue, tasksInvolvingMember } from '@/lib/selectors'
import { daysFromToday } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

export function MyTasks() {
  const data = useData()
  const me = useCurrentUser()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [when, setWhen] = useState<'all' | 'today'>('all')

  const all = me ? tasksInvolvingMember(data, me.id) : []
  const tasks = useMemo(() => {
    return all
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => (when === 'today' ? daysFromToday(t.dueDate) === 0 : true))
      .sort((a, b) => {
        const ra = a.status === 'done' ? 1 : 0
        const rb = b.status === 'done' ? 1 : 0
        if (ra !== rb) return ra - rb
        return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
      })
  }, [all, status, when])

  const counts = {
    open: all.filter((t) => t.status !== 'done').length,
    overdue: all.filter((t) => isOverdue(t)).length,
    done: all.filter((t) => t.status === 'done').length,
  }

  return (
    <>
      <PageHeader
        title="My Tasks"
        subtitle="Track your own work — start, finish, and log time."
        actions={
          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5">
            <Avatar member={me} size="sm" />
            <span className="text-sm font-medium">{me?.name}</span>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <MiniStat label="Open" value={counts.open} color="var(--info)" />
        <MiniStat label="Overdue" value={counts.overdue} color="var(--danger)" />
        <MiniStat label="Completed" value={counts.done} color="var(--ok)" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={when} onChange={(e) => setWhen(e.target.value as typeof when)} className="w-auto">
          <option value="all">Any date</option>
          <option value="today">Due today</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-auto">
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="delayed">Delayed</option>
          <option value="done">Done</option>
        </Select>
      </div>

      <Card className="p-2">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={22} />}
            title="No tasks here"
            description="Nothing assigned to you under this filter."
          />
        ) : (
          <TaskTable tasks={tasks} variant="mine" />
        )}
      </Card>
    </>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="text-[26px] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[13px] text-[var(--muted)] mt-1.5">{label}</div>
    </Card>
  )
}

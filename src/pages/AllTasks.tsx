import { useMemo, useState } from 'react'
import { ListChecks, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, EmptyState, Select } from '@/components/ui'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { useData } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { isOverdue } from '@/lib/selectors'
import { daysFromToday } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

export function AllTasks() {
  const data = useData()
  const canEdit = useCanEdit()
  const [showNew, setShowNew] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TaskStatus | 'all' | 'attention'>('all')
  const [assignee, setAssignee] = useState('all')
  const [project, setProject] = useState('all')
  const [when, setWhen] = useState<'all' | 'today' | 'overdue'>('all')

  const tasks = useMemo(() => {
    return data.tasks
      .filter((t) => (q ? t.title.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((t) =>
        status === 'all'
          ? true
          : status === 'attention'
            ? t.status === 'blocked' || t.priority === 'urgent' || isOverdue(t)
            : t.status === status,
      )
      .filter((t) => (assignee === 'all' ? true : t.assigneeId === assignee))
      .filter((t) => (project === 'all' ? true : t.projectId === project))
      .filter((t) =>
        when === 'all'
          ? true
          : when === 'today'
            ? daysFromToday(t.dueDate) === 0
            : isOverdue(t),
      )
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  }, [data.tasks, q, status, assignee, project, when])

  return (
    <>
      <PageHeader
        title="All Tasks"
        subtitle={`${tasks.length} of ${data.tasks.length} tasks`}
        actions={
          canEdit && (
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus size={16} /> New task
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks…"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus-visible:outline-none"
          />
        </div>
        <Select value={when} onChange={(e) => setWhen(e.target.value as typeof when)} className="w-auto">
          <option value="all">Any date</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-auto">
          <option value="all">All statuses</option>
          <option value="attention">Needs attention</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="delayed">Delayed</option>
          <option value="done">Done</option>
        </Select>
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-auto">
          <option value="all">Everyone</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select value={project} onChange={(e) => setProject(e.target.value)} className="w-auto">
          <option value="all">All projects</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-2">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={22} />}
            title="No tasks match"
            description="Try clearing a filter, or create a new task."
            action={
              canEdit ? (
                <Button variant="primary" onClick={() => setShowNew(true)}>
                  <Plus size={16} /> New task
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TaskTable tasks={tasks} variant="all" />
        )}
      </Card>

      <TaskFormModal open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

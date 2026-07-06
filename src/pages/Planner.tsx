import { useState } from 'react'
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from 'date-fns'
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Button, StatusBadge } from '@/components/ui'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { memberById, projectById } from '@/lib/selectors'
import { cn, toDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

export function Planner() {
  const data = useData()
  const canEdit = useCanEdit()
  const [weekOffset, setWeekOffset] = useState(0)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [addDate, setAddDate] = useState<string | null>(null)

  const base = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(base, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(base, { weekStartsOn: 1 }) })

  function tasksForDay(day: Date): Task[] {
    return data.tasks
      .filter((t) => {
        const d = t.scheduledFor ?? t.dueDate
        return d && isSameDay(toDate(d), day)
      })
      .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  }

  return (
    <>
      <PageHeader
        title="Planner"
        subtitle="Schedule work ahead — drop tasks on future days so you're not adding them daily."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
              This week
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
              <ChevronRight size={16} />
            </Button>
          </div>
        }
      />

      <div className="text-sm text-[var(--muted)] mb-3 inline-flex items-center gap-1.5">
        <CalendarRange size={15} />
        {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-start">
        {days.map((day) => {
          const dayTasks = tasksForDay(day)
          const openCount = dayTasks.filter((t) => t.status !== 'done').length
          const today = isToday(day)
          const iso = format(day, 'yyyy-MM-dd')
          return (
            <div
              key={iso}
              className={cn(
                'rounded-2xl border bg-[var(--surface)] flex flex-col',
                today ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]' : 'border-[var(--border)]',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-t-2xl',
                  today && 'bg-[var(--brand-soft)]',
                )}
              >
                <div>
                  <div className="text-[11px] uppercase text-[var(--faint)] font-medium">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn('text-sm font-semibold', today && 'text-[var(--brand)]')}>
                    {format(day, 'MMM d')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {openCount > 0 && (
                    <span className="rounded-full bg-[var(--surface-2)] px-1.5 text-[11px] font-semibold text-[var(--muted)] tabular-nums">
                      {openCount}
                    </span>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setAddDate(iso)}
                      className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--brand)]"
                      aria-label={`Add task for ${iso}`}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2 space-y-2">
                {dayTasks.length === 0 ? (
                  canEdit ? (
                    <button
                      onClick={() => setAddDate(iso)}
                      className="w-full min-h-[64px] rounded-xl border border-dashed border-[var(--border)] text-[12px] text-[var(--faint)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                    >
                      + Plan something
                    </button>
                  ) : (
                    <div className="min-h-[48px] grid place-items-center text-[12px] text-[var(--faint)]">—</div>
                  )
                ) : (
                  dayTasks.map((t) => <PlannerCard key={t.id} task={t} onOpen={() => setOpenTaskId(t.id)} />)
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
      {addDate && (
        <TaskFormModal open onClose={() => setAddDate(null)} defaultScheduledFor={addDate} />
      )}
    </>
  )
}

function PlannerCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const data = useData()
  const project = projectById(data, task.projectId)
  const assignee = memberById(data, task.assigneeId)
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 hover:shadow-[var(--shadow)] transition-shadow"
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project?.color }} />
        <span className={cn('text-[13px] font-medium leading-snug line-clamp-2', task.status === 'done' && 'line-through text-[var(--muted)]')}>
          {task.title}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1.5 mt-2">
        <Avatar member={assignee} size="xs" />
        <StatusBadge status={task.status} />
        {task.recurrence !== 'none' && <Repeat size={12} className="text-[var(--brand)]" />}
        {task.estimateHours != null && (
          <span className="text-[11px] text-[var(--faint)] tabular-nums">{task.estimateHours}h</span>
        )}
      </div>
    </button>
  )
}

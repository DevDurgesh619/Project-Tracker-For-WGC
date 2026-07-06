import { useState } from 'react'
import { CheckCircle2, MessageSquare, Play } from 'lucide-react'
import {
  Avatar,
  DeadlinePill,
  PriorityBadge,
  StatusBadge,
} from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { useCanEdit } from '@/lib/auth'
import { deadlineStatus, memberById, projectById } from '@/lib/selectors'
import { cn, fmtDate, fmtDuration } from '@/lib/utils'
import type { Task } from '@/lib/types'
import { TaskDetailModal } from './TaskDetailModal'

export function TaskTable({
  tasks,
  variant = 'all',
}: {
  tasks: Task[]
  variant?: 'all' | 'mine'
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--faint)]">
              <th className="font-medium px-3 py-2.5">Task</th>
              {variant === 'all' && <th className="font-medium px-3 py-2.5">Assignee</th>}
              <th className="font-medium px-3 py-2.5">Status</th>
              {variant === 'all' && <th className="font-medium px-3 py-2.5">Deadline</th>}
              {variant === 'mine' && <th className="font-medium px-3 py-2.5">Start</th>}
              {variant === 'mine' && <th className="font-medium px-3 py-2.5">End</th>}
              {variant === 'mine' && <th className="font-medium px-3 py-2.5">Duration</th>}
              <th className="font-medium px-3 py-2.5 text-right">{variant === 'mine' ? '' : 'Notes'}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <Row key={t.id} task={t} variant={variant} onOpen={() => setOpenId(t.id)} />
            ))}
          </tbody>
        </table>
      </div>
      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function Row({
  task,
  variant,
  onOpen,
}: {
  task: Task
  variant: 'all' | 'mine'
  onOpen: () => void
}) {
  const data = useData()
  const startTask = useStore((s) => s.startTask)
  const completeTask = useStore((s) => s.completeTask)
  const canEdit = useCanEdit()
  const project = projectById(data, task.projectId)
  const assignee = memberById(data, task.assigneeId)
  const isDone = task.status === 'done'

  return (
    <tr
      onClick={onOpen}
      className="group border-t border-[var(--border)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
    >
      <td className="px-3 py-3 max-w-[360px]">
        <div className="flex items-center gap-2.5">
          <span
            className="h-7 w-1 rounded-full shrink-0"
            style={{ backgroundColor: project?.color ?? 'var(--border)' }}
          />
          <div className="min-w-0">
            <div className={cn('font-medium truncate', isDone && 'text-[var(--muted)] line-through')}>
              {task.title}
            </div>
            <div className="text-[12px] text-[var(--faint)] truncate">{project?.name}</div>
          </div>
          {task.priority === 'urgent' && !isDone && (
            <span className="shrink-0">
              <PriorityBadge priority={task.priority} />
            </span>
          )}
        </div>
      </td>

      {variant === 'all' && (
        <td className="px-3 py-3">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Avatar member={assignee} size="xs" />
            <span className="text-[13px] text-[var(--muted)]">{assignee?.name}</span>
            {task.participantIds.length > 0 && (
              <span className="inline-flex -space-x-1.5 ml-0.5">
                {task.participantIds.map((id) => (
                  <Avatar key={id} member={memberById(data, id)} size="xs" />
                ))}
              </span>
            )}
          </span>
        </td>
      )}

      <td className="px-3 py-3">
        <StatusBadge status={task.status} />
      </td>

      {variant === 'all' && (
        <td className="px-3 py-3">
          <DeadlinePill date={task.dueDate} state={deadlineStatus(task)} />
        </td>
      )}

      {variant === 'mine' && (
        <td className="px-3 py-3 text-[13px] text-[var(--muted)] whitespace-nowrap">
          {task.startedAt ? fmtDate(task.startedAt, 'MMM d, HH:mm') : '—'}
        </td>
      )}
      {variant === 'mine' && (
        <td className="px-3 py-3 text-[13px] text-[var(--muted)] whitespace-nowrap">
          {task.completedAt ? fmtDate(task.completedAt, 'MMM d, HH:mm') : '—'}
        </td>
      )}
      {variant === 'mine' && (
        <td className="px-3 py-3 text-[13px] font-medium whitespace-nowrap">
          {fmtDuration(task.startedAt, task.completedAt)}
        </td>
      )}

      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        {variant === 'mine' && !isDone && canEdit ? (
          <div className="flex justify-end gap-1.5">
            {!task.startedAt && (
              <button
                onClick={() => startTask(task.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-[var(--info)] hover:bg-[var(--info-soft)]"
              >
                <Play size={13} /> Start
              </button>
            )}
            <button
              onClick={() => completeTask(task.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-[var(--ok)] hover:bg-[var(--ok-soft)]"
            >
              <CheckCircle2 size={13} /> Done
            </button>
          </div>
        ) : (
          task.notes.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--faint)]">
              <MessageSquare size={13} /> {task.notes.length}
            </span>
          )
        )}
      </td>
    </tr>
  )
}

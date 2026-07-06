import { useState } from 'react'
import { AlertTriangle, Ban, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Avatar, Badge, Button, EmptyState } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { useCanEdit } from '@/lib/auth'
import { attentionTasks, isOverdue, memberById, projectById } from '@/lib/selectors'
import { fmtRelative } from '@/lib/utils'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

export function BlockedPanel() {
  const data = useData()
  const escalate = useStore((s) => s.escalateTask)
  const canEdit = useCanEdit()
  const [openId, setOpenId] = useState<string | null>(null)
  const tasks = attentionTasks(data)

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={22} className="text-[var(--ok)]" />}
        title="Nothing is stuck"
        description="No blocked, urgent, or overdue work right now. Smooth sailing."
      />
    )
  }

  return (
    <>
      <ul className="divide-y divide-[var(--border)]">
        {tasks.map((t) => {
          const project = projectById(data, t.projectId)
          const assignee = memberById(data, t.assigneeId)
          const waitingOn = t.blocker?.waitingOnId
            ? memberById(data, t.blocker.waitingOnId)
            : null
          return (
            <li
              key={t.id}
              className="flex items-start gap-3 py-3 cursor-pointer hover:bg-[var(--surface-2)] -mx-2 px-2 rounded-lg transition-colors"
              onClick={() => setOpenId(t.id)}
            >
              <span className="mt-0.5 shrink-0">
                {t.blocker ? (
                  <Ban size={16} className="text-[var(--danger)]" />
                ) : (
                  <AlertTriangle size={16} className="text-[var(--warn)]" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{t.title}</span>
                  {t.blocker?.blocksCompletion && (
                    <Badge tone="danger">
                      <ShieldAlert size={11} /> Blocks product
                    </Badge>
                  )}
                  {t.priority === 'urgent' && <Badge tone="danger">Urgent</Badge>}
                  {isOverdue(t) && !t.blocker && <Badge tone="warn">Overdue</Badge>}
                </div>
                <div className="text-[12.5px] text-[var(--muted)] mt-0.5 truncate">
                  {t.blocker?.reason ?? `${project?.name} · due ${fmtRelative(t.dueDate)}`}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[var(--faint)]">
                  <Avatar member={assignee} size="xs" />
                  <span>{assignee?.name}</span>
                  {waitingOn && (
                    <>
                      <span>·</span>
                      <span>waiting on {waitingOn.name}</span>
                    </>
                  )}
                </div>
              </div>
              {canEdit && t.priority !== 'urgent' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-[var(--danger)]"
                  onClick={(e) => {
                    e.stopPropagation()
                    escalate(t.id)
                  }}
                >
                  Escalate
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

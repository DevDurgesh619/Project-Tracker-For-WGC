import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  CornerUpLeft,
  Link2 as LinkIcon,
  Pencil,
  Play,
  Repeat,
  Send,
  ShieldAlert,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  DeadlinePill,
  Modal,
  PriorityBadge,
  StatusBadge,
} from '@/components/ui'
import { useData, useCurrentUser } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { useStore } from '@/lib/store'
import {
  blockedBy,
  blocksTasks,
  deadlineStatus,
  hasOpenPredecessor,
  memberById,
  projectById,
} from '@/lib/selectors'
import { fmtDateLong, fmtDuration, fmtRelative } from '@/lib/utils'
import type { Task } from '@/lib/types'
import { BlockerModal } from './BlockerModal'
import { RescheduleModal } from './RescheduleModal'
import { ChangeRequestModal } from './ChangeRequestModal'
import { CompletionModal } from './CompletionModal'
import { TaskFormModal } from './TaskFormModal'

export function TaskDetailModal({
  taskId,
  onClose,
}: {
  taskId: string | null
  onClose: () => void
}) {
  const data = useData()
  const me = useCurrentUser()
  const canEdit = useCanEdit()
  const isAdmin = me?.role === 'admin' && canEdit
  const startTask = useStore((s) => s.startTask)
  const setStatus = useStore((s) => s.setStatus)
  const updateTask = useStore((s) => s.updateTask)
  const escalateTask = useStore((s) => s.escalateTask)
  const deEscalateTask = useStore((s) => s.deEscalateTask)
  const clearBlocker = useStore((s) => s.clearBlocker)
  const addNote = useStore((s) => s.addNote)
  const deleteTask = useStore((s) => s.deleteTask)
  const approveChangeRequest = useStore((s) => s.approveChangeRequest)
  const rejectChangeRequest = useStore((s) => s.rejectChangeRequest)

  const [noteText, setNoteText] = useState('')
  const [showBlocker, setShowBlocker] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const task = data.tasks.find((t) => t.id === taskId)
  if (!taskId || !task) return null

  const project = projectById(data, task.projectId)
  const milestone = data.milestones.find((m) => m.id === task.milestoneId)
  const assignee = memberById(data, task.assigneeId)
  const isDone = task.status === 'done'
  const cr = task.changeRequest

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(task!.id, noteText.trim())
    setNoteText('')
  }

  return (
    <>
      <Modal open onClose={onClose} title={task.title} width="max-w-2xl">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <DeadlinePill date={task.dueDate} state={deadlineStatus(task)} />
          {task.recurrence !== 'none' && (
            <Badge tone="brand" icon={<Repeat size={11} />}>
              {task.recurrence}
            </Badge>
          )}
          {project && (
            <Badge tone="neutral">
              <span className="inline-block h-2 w-2 rounded-full mr-0.5" style={{ backgroundColor: project.color }} />
              {project.name}
            </Badge>
          )}
          {milestone && (
            <Badge tone="neutral" icon={<Target size={11} />}>
              {milestone.label}
            </Badge>
          )}
        </div>

        {/* Pending change request (admin can act) */}
        {cr?.status === 'pending' && (
          <div className="rounded-xl border border-[var(--warn)]/40 bg-[var(--warn-soft)] p-3.5">
            <div className="flex items-center gap-2 text-[var(--warn)] font-semibold text-sm">
              <CalendarClock size={16} /> Deadline change requested
            </div>
            <p className="text-sm mt-1.5">
              {memberById(data, cr.requestedById)?.name} wants to move the deadline to{' '}
              <strong>{fmtDateLong(cr.requestedDueDate)}</strong>.
            </p>
            <p className="text-[13px] text-[var(--muted)] mt-1 italic">“{cr.justification}”</p>
            {isAdmin ? (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="primary" onClick={() => approveChangeRequest(task.id)}>
                  <Check size={14} /> Approve &amp; apply
                </Button>
                <Button size="sm" variant="secondary" onClick={() => rejectChangeRequest(task.id)}>
                  <X size={14} /> Reject
                </Button>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--faint)] mt-2">Waiting for an admin to approve.</p>
            )}
          </div>
        )}

        {/* Blocker banner */}
        {task.blocker && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3.5">
            <div className="flex items-center gap-2 text-[var(--danger)] font-semibold text-sm">
              <Ban size={16} />
              Blocked
              {task.blocker.blocksCompletion && (
                <Badge tone="danger" className="ml-1">
                  <ShieldAlert size={11} /> Holding up the product
                </Badge>
              )}
            </div>
            <p className="text-sm mt-1.5">{task.blocker.reason}</p>
            {task.blocker.waitingOnId && (
              <p className="text-[13px] text-[var(--muted)] mt-1.5">
                Waiting on{' '}
                <strong className="text-[var(--text)]">{memberById(data, task.blocker.waitingOnId)?.name}</strong>{' '}
                · raised {fmtRelative(task.blocker.raisedAt)}
              </p>
            )}
          </div>
        )}

        {task.description && (
          <p className="text-sm leading-relaxed text-[var(--text)]">{task.description}</p>
        )}

        {/* Dependencies */}
        {(blockedBy(data, task).length > 0 || blocksTasks(data, task).length > 0) && (
          <div className="rounded-xl border border-[var(--border)] p-3.5 space-y-2">
            {blockedBy(data, task).length > 0 && (
              <div>
                <div className="text-[12px] font-semibold text-[var(--muted)] mb-1 flex items-center gap-1.5">
                  <LinkIcon size={13} /> Waits on
                  {hasOpenPredecessor(data, task) && <Badge tone="warn">not ready</Badge>}
                </div>
                <ul className="space-y-1">
                  {blockedBy(data, task).map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-[13px]">
                      <StatusBadge status={p.status} />
                      <span className={p.status === 'done' ? 'text-[var(--muted)]' : ''}>{p.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {blocksTasks(data, task).length > 0 && (
              <div>
                <div className="text-[12px] font-semibold text-[var(--muted)] mb-1">Blocks</div>
                <ul className="space-y-1">
                  {blocksTasks(data, task).map((p) => (
                    <li key={p.id} className="text-[13px] text-[var(--text)]">{p.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Completion summary */}
        {isDone && task.completionNote && (
          <div className="rounded-xl border border-[var(--ok)]/30 bg-[var(--ok-soft)] p-3.5">
            <div className="flex items-center gap-2 text-[var(--ok)] font-semibold text-sm">
              <CheckCircle2 size={16} /> Work done
            </div>
            <p className="text-sm mt-1.5">{task.completionNote}</p>
          </div>
        )}

        {/* Facts grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-[var(--surface-2)] p-4 text-sm">
          <Fact label="Owner">
            <span className="inline-flex items-center gap-1.5">
              <Avatar member={assignee} size="xs" />
              {assignee?.name ?? 'Unassigned'}
            </span>
          </Fact>
          <Fact label="Deadline">{fmtDateLong(task.dueDate)}</Fact>
          {task.participantIds.length > 0 && (
            <Fact label="Also involved">
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                {task.participantIds.map((id) => {
                  const p = memberById(data, id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5">
                      <Avatar member={p} size="xs" />
                      {p?.name}
                    </span>
                  )
                })}
              </span>
            </Fact>
          )}
          {task.scheduledFor && <Fact label="Planned start">{fmtDateLong(task.scheduledFor)}</Fact>}
          <Fact label="Started">{task.startedAt ? fmtRelative(task.startedAt) : '—'}</Fact>
          <Fact label="Completed">{task.completedAt ? fmtRelative(task.completedAt) : '—'}</Fact>
          <Fact label="Estimate">{task.estimateHours != null ? `${task.estimateHours}h` : '—'}</Fact>
          <Fact label="Actual time">{fmtDuration(task.startedAt, task.completedAt)}</Fact>
          {task.originalDueDate && task.originalDueDate !== task.dueDate && (
            <Fact label="Original deadline">{fmtDateLong(task.originalDueDate)}</Fact>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
        <div className="flex flex-wrap gap-2">
          {!isDone && !task.startedAt && (
            <Button size="sm" variant="subtle" onClick={() => startTask(task.id)}>
              <Play size={14} /> Start
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateTask(task.id, { status: 'todo', startedAt: null })}
              title="Undo start — move back to To-do"
            >
              <CornerUpLeft size={14} /> Back to To-do
            </Button>
          )}
          {!isDone ? (
            <Button size="sm" variant="primary" onClick={() => setShowComplete(true)}>
              <CheckCircle2 size={14} /> Mark done
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setStatus(task.id, 'in_progress')}>
              <CornerUpLeft size={14} /> Reopen
            </Button>
          )}
          {task.blocker ? (
            <Button size="sm" variant="secondary" onClick={() => clearBlocker(task.id)}>
              <CheckCircle2 size={14} /> Resolve blocker
            </Button>
          ) : (
            !isDone && (
              <Button size="sm" variant="secondary" onClick={() => setShowBlocker(true)}>
                <Ban size={14} /> Block
              </Button>
            )
          )}
          {!isDone &&
            (task.priority === 'urgent' ? (
              <Button size="sm" variant="ghost" onClick={() => deEscalateTask(task.id)}>
                Remove urgent
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => escalateTask(task.id)}>
                <AlertTriangle size={14} /> Escalate
              </Button>
            ))}
          {!isDone &&
            (isAdmin ? (
              <Button size="sm" variant="ghost" onClick={() => setShowReschedule(true)}>
                <CalendarClock size={14} /> Reschedule
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowRequest(true)} disabled={cr?.status === 'pending'}>
                <CalendarClock size={14} /> Request new deadline
              </Button>
            ))}
        </div>
        )}

        {/* Notes */}
        <div>
          <h4 className="text-[13px] font-semibold text-[var(--muted)] mb-2">Notes &amp; updates</h4>
          <div className="space-y-2.5">
            {task.notes.length === 0 && <p className="text-[13px] text-[var(--faint)]">No notes yet.</p>}
            {task.notes.map((n) => {
              const author = memberById(data, n.authorId)
              return (
                <div key={n.id} className="flex gap-2.5">
                  <Avatar member={author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{author?.name}</span>
                      {n.kind === 'delay_reason' && <Badge tone="warn">delay reason</Badge>}
                      {n.kind === 'completion' && <Badge tone="ok">work done</Badge>}
                      <span className="text-xs text-[var(--faint)]">{fmtRelative(n.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{n.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {canEdit && (
            <div className="mt-3 flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note or update…"
                className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm placeholder:text-[var(--faint)] focus:border-[var(--brand)] focus-visible:outline-none"
              />
              <Button variant="primary" size="icon" onClick={handleAddNote} aria-label="Add note">
                <Send size={16} />
              </Button>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 -mb-1">
            <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
              onClick={() => {
                if (confirm('Delete this task?')) {
                  deleteTask(task.id)
                  onClose()
                }
              }}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </Modal>

      {showBlocker && <BlockerModal open task={task} onClose={() => setShowBlocker(false)} />}
      {showReschedule && <RescheduleModal open task={task} onClose={() => setShowReschedule(false)} />}
      {showRequest && <ChangeRequestModal open task={task} onClose={() => setShowRequest(false)} />}
      {showComplete && <CompletionModal open task={task} onClose={() => setShowComplete(false)} />}
      {showEdit && <TaskFormModal open task={task} onClose={() => setShowEdit(false)} />}
    </>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wide text-[var(--faint)] font-medium">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

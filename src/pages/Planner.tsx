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
import { CalendarRange, ChevronLeft, ChevronRight, Palmtree, Plus, Repeat, StickyNote, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Button, Input, Modal, Select, StatusBadge, Textarea } from '@/components/ui'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { dayNotesForDate, memberById, projectById } from '@/lib/selectors'
import { cn, toDate } from '@/lib/utils'
import type { DayNote, Task } from '@/lib/types'

export function Planner() {
  const data = useData()
  const canEdit = useCanEdit()
  const [weekOffset, setWeekOffset] = useState(0)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [addDate, setAddDate] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ note?: DayNote; date: string } | null>(null)

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
          const notes = dayNotesForDate(data, iso)
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
                      onClick={() => setNoteModal({ date: iso })}
                      className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--brand)]"
                      aria-label={`Add a day note for ${iso}`}
                      title="Add a note (holiday / context)"
                    >
                      <StickyNote size={15} />
                    </button>
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
                {notes.map((n) => (
                  <DayNotePill key={n.id} note={n} onOpen={() => setNoteModal({ note: n, date: n.date })} />
                ))}
                {dayTasks.length === 0 ? (
                  notes.length > 0 ? null : canEdit ? (
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
      {noteModal && (
        <DayNoteModal
          note={noteModal.note}
          date={noteModal.date}
          canEdit={canEdit}
          onClose={() => setNoteModal(null)}
        />
      )}
    </>
  )
}

const NOTE_STYLE: Record<DayNote['kind'], { icon: typeof StickyNote; label: string; cls: string }> = {
  holiday: { icon: Palmtree, label: 'Holiday', cls: 'bg-[var(--warn-soft)] text-[var(--warn)]' },
  note: { icon: StickyNote, label: 'Note', cls: 'bg-[var(--surface-2)] text-[var(--muted)]' },
}

function DayNotePill({ note, onOpen }: { note: DayNote; onOpen: () => void }) {
  const s = NOTE_STYLE[note.kind]
  const Icon = s.icon
  return (
    <button
      onClick={onOpen}
      title={note.body}
      className={cn('w-full text-left rounded-xl px-2.5 py-2 flex items-start gap-1.5', s.cls)}
    >
      <Icon size={13} className="mt-0.5 shrink-0" />
      <span className="text-[12px] font-medium leading-snug line-clamp-2">{note.body}</span>
    </button>
  )
}

function DayNoteModal({
  note,
  date,
  canEdit,
  onClose,
}: {
  note?: DayNote
  date: string
  canEdit: boolean
  onClose: () => void
}) {
  const addDayNote = useStore((s) => s.addDayNote)
  const updateDayNote = useStore((s) => s.updateDayNote)
  const deleteDayNote = useStore((s) => s.deleteDayNote)

  const [kind, setKind] = useState<DayNote['kind']>(note?.kind ?? 'holiday')
  const [start, setStart] = useState(note?.date ?? date)
  const [end, setEnd] = useState(note?.endDate ?? '')
  const [body, setBody] = useState(note?.body ?? '')

  // Read-only view for viewers.
  if (!canEdit) {
    const s = NOTE_STYLE[note?.kind ?? 'note']
    return (
      <Modal open onClose={onClose} title={s.label} width="max-w-md">
        <p className="text-sm whitespace-pre-wrap">{note?.body}</p>
      </Modal>
    )
  }

  function save() {
    if (!body.trim()) return
    if (note) updateDayNote(note.id, { kind, date: start, endDate: end || null, body })
    else addDayNote({ kind, date: start, endDate: end || null, body })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={note ? 'Edit day note' : 'Add a day note'}
      width="max-w-md"
      footer={
        <div className="flex items-center gap-2">
          {note && (
            <Button
              variant="ghost"
              className="text-[var(--danger)] mr-auto"
              onClick={() => {
                deleteDayNote(note.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!body.trim()} onClick={save}>
            {note ? 'Save' : 'Add note'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-[var(--faint)]">Type</label>
          <Select value={kind} onChange={(e) => setKind(e.target.value as DayNote['kind'])}>
            <option value="holiday">🌴 Holiday / day off</option>
            <option value="note">🗒 Note / context</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] text-[var(--faint)]">Date</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-[12px] text-[var(--faint)]">Until (optional)</label>
            <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-[12px] text-[var(--faint)]">Note</label>
          <Textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Holiday — Gurugram, chilling with friends."
          />
        </div>
      </div>
    </Modal>
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

import { useState } from 'react'
import { Avatar, Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { milestonesForProject, phasesForProject } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import type { Priority, Recurrence, Task } from '@/lib/types'

export function TaskFormModal({
  open,
  onClose,
  task,
  defaultProjectId,
  defaultMilestoneId,
  defaultScheduledFor,
}: {
  open: boolean
  onClose: () => void
  /** when provided, the form edits this task */
  task?: Task
  defaultProjectId?: string
  defaultMilestoneId?: string
  defaultScheduledFor?: string
}) {
  const data = useData()
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [projectId, setProjectId] = useState(
    task?.projectId ?? defaultProjectId ?? data.projects[0]?.id ?? '',
  )
  const [milestoneId, setMilestoneId] = useState(task?.milestoneId ?? defaultMilestoneId ?? '')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? data.members[0]?.id ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'normal')
  const [scheduledFor, setScheduledFor] = useState(task?.scheduledFor ?? defaultScheduledFor ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [estimateHours, setEstimateHours] = useState(task?.estimateHours != null ? String(task.estimateHours) : '')
  const [recurrence, setRecurrence] = useState<Recurrence>(task?.recurrence ?? 'none')
  const [dependsOn, setDependsOn] = useState<string[]>(task?.dependsOn ?? [])
  const [participantIds, setParticipantIds] = useState<string[]>(task?.participantIds ?? [])

  const participantOptions = data.members.filter((m) => m.id !== assigneeId)
  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const predecessorOptions = data.tasks.filter((t) => t.projectId === projectId && t.id !== task?.id)
  function toggleDep(id: string) {
    setDependsOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const phases = phasesForProject(data, projectId)
  const milestones = milestonesForProject(data, projectId)
  const phaseLabel = (phaseId: string) => phases.find((p) => p.id === phaseId)?.label ?? ''

  const canSave = title.trim() && projectId && assigneeId

  function handleSave() {
    if (!canSave) return
    const payload = {
      title: title.trim(),
      description: description.trim(),
      projectId,
      milestoneId: milestoneId || null,
      assigneeId,
      priority,
      scheduledFor: scheduledFor || null,
      dueDate: dueDate || null,
      estimateHours: estimateHours.trim() === '' ? null : Number(estimateHours),
      recurrence,
      participantIds: participantIds.filter((p) => p !== assigneeId),
      dependsOn: dependsOn.filter((d) => predecessorOptions.some((p) => p.id === d)),
    }
    if (isEdit && task) updateTask(task.id, payload)
    else addTask(payload)
    onClose()
  }

  return (
    <Modal
      key={task?.id ?? 'new'}
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <Field label="Task title">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Verify website copy with founder"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to be done?"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project">
          <Select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value)
              setMilestoneId('')
              setDependsOn([])
            }}
          >
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Milestone">
          <Select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
            <option value="">— No milestone —</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {phaseLabel(m.phaseId)} · {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assign to">
          <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
        <Field label="Planned start" hint="Day you plan to begin — optional, separate from the deadline">
          <Input type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        </Field>
        <Field label="Deadline" hint="When it’s due">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Estimate (hours)" hint="How long you think it’ll take — compared to actual">
          <Input
            type="number"
            min="0"
            step="0.5"
            value={estimateHours}
            onChange={(e) => setEstimateHours(e.target.value)}
            placeholder="e.g. 4"
          />
        </Field>
        <Field label="Repeat" hint="Auto-creates the next one when done">
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </Select>
        </Field>
      </div>

      <Field label="Also involved" hint="Others in this meeting / task besides the owner — they’ll see it in their tasks too.">
        <div className="flex flex-wrap gap-2">
          {participantOptions.map((m) => {
            const on = participantIds.includes(m.id)
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggleParticipant(m.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] transition-colors',
                  on
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]',
                )}
              >
                <Avatar member={m} size="xs" />
                {m.name}
              </button>
            )
          })}
        </div>
      </Field>

      {predecessorOptions.length > 0 && (
        <Field label="Depends on" hint="If a predecessor's deadline moves later, this task auto-shifts too.">
          <div className="max-h-32 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {predecessorOptions.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--surface-2)]">
                <input
                  type="checkbox"
                  checked={dependsOn.includes(p.id)}
                  onChange={() => toggleDep(p.id)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                <span className="text-[13px] truncate">{p.title}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
    </Modal>
  )
}

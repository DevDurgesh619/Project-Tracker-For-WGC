import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button, Field, Input, Modal, Textarea } from '@/components/ui'
import { useStore } from '@/lib/store'
import { fmtDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

export function RescheduleModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task: Task
}) {
  const reschedule = useStore((s) => s.rescheduleTask)
  const [newDate, setNewDate] = useState(task.dueDate ?? '')
  const [reason, setReason] = useState('')

  const canSave = newDate && reason.trim()

  function handleSave() {
    if (!canSave) return
    reschedule(task.id, newDate, reason.trim())
    onClose()
  }

  return (
    <Modal
      key={task.id}
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2 text-[var(--warn)]">
          <CalendarClock size={18} /> Adjust deadline
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Save new deadline
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)] -mt-1">
        No silent slips — moving the deadline records the reason and marks the task as
        delayed. Current deadline:{' '}
        <strong className="text-[var(--text)]">{fmtDate(task.dueDate, 'MMM d, yyyy')}</strong>.
      </p>
      <Field label="New deadline">
        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
      </Field>
      <Field label="Reason for the change">
        <Textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Old data spread across multiple sheets — needs two more days to consolidate."
        />
      </Field>
    </Modal>
  )
}

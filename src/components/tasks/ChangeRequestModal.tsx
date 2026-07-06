import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button, Field, Input, Modal, Textarea } from '@/components/ui'
import { useStore } from '@/lib/store'
import { fmtDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

/** Member-facing: request a deadline change with justification (needs admin approval). */
export function ChangeRequestModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task: Task
}) {
  const requestReschedule = useStore((s) => s.requestReschedule)
  const [newDate, setNewDate] = useState(task.dueDate ?? '')
  const [justification, setJustification] = useState('')

  const canSend = newDate && justification.trim()

  function send() {
    if (!canSend) return
    requestReschedule(task.id, newDate, justification.trim())
    onClose()
  }

  return (
    <Modal
      key={task.id}
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2 text-[var(--warn)]">
          <CalendarClock size={18} /> Request a deadline change
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={send} disabled={!canSend}>
            Send request
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)] -mt-1">
        This goes to an admin for approval. If approved, the deadline updates automatically.
        Current deadline:{' '}
        <strong className="text-[var(--text)]">{fmtDate(task.dueDate, 'MMM d, yyyy')}</strong>.
      </p>
      <Field label="Proposed new deadline">
        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
      </Field>
      <Field label="Justification" hint="Why is the change needed? Be specific.">
        <Textarea
          autoFocus
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="e.g. Two test devices are unavailable until the weekend — need 3 more days to cover Android."
        />
      </Field>
    </Modal>
  )
}

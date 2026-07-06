import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button, Field, Modal, Textarea } from '@/components/ui'
import { useStore } from '@/lib/store'
import type { Task } from '@/lib/types'

export function CompletionModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task: Task
}) {
  const completeTask = useStore((s) => s.completeTask)
  const [note, setNote] = useState('')

  function finish() {
    completeTask(task.id, note.trim() || undefined)
    onClose()
  }

  return (
    <Modal
      key={task.id}
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2 text-[var(--ok)]">
          <CheckCircle2 size={18} /> Mark complete
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={finish}>
            Skip &amp; complete
          </Button>
          <Button variant="primary" onClick={finish}>
            <CheckCircle2 size={16} /> Complete
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)] -mt-1">
        Completing <strong className="text-[var(--text)]">{task.title}</strong>.
        {task.recurrence !== 'none' && (
          <span> The next {task.recurrence} occurrence will be created automatically.</span>
        )}
      </p>
      <Field label="What did you get done? (optional)" hint="A short summary of the work — kept on the task for the record.">
        <Textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Built and tested the booking flow; works on iOS + Android web."
        />
      </Field>
    </Modal>
  )
}

import { useState } from 'react'
import { Ban } from 'lucide-react'
import { Button, Field, Modal, Select, Textarea } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import type { Task } from '@/lib/types'

export function BlockerModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task: Task
}) {
  const data = useData()
  const setBlocker = useStore((s) => s.setBlocker)
  const currentUserId = useStore((s) => s.currentUserId)

  const [reason, setReason] = useState(task.blocker?.reason ?? '')
  const [waitingOnId, setWaitingOnId] = useState(task.blocker?.waitingOnId ?? '')
  const [blocksCompletion, setBlocksCompletion] = useState(
    task.blocker?.blocksCompletion ?? false,
  )

  function handleSave() {
    if (!reason.trim()) return
    setBlocker(task.id, {
      reason: reason.trim(),
      blocksCompletion,
      waitingOnId: waitingOnId || null,
      raisedById: currentUserId,
    })
    onClose()
  }

  return (
    <Modal
      key={task.id}
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2 text-[var(--danger)]">
          <Ban size={18} /> Raise a blocker
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSave} disabled={!reason.trim()}>
            Mark blocked
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)] -mt-1">
        Make it visible why <strong className="text-[var(--text)]">{task.title}</strong>{' '}
        can&apos;t move forward.
      </p>
      <Field label="What's blocking this?">
        <Textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Waiting on founder to verify the website copy before deploy."
        />
      </Field>
      <Field label="Waiting on (optional)">
        <Select value={waitingOnId} onChange={(e) => setWaitingOnId(e.target.value)}>
          <option value="">— Nobody specific —</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--danger-soft)] p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={blocksCompletion}
          onChange={(e) => setBlocksCompletion(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--danger)]"
        />
        <span className="text-sm">
          <span className="font-medium text-[var(--danger)]">
            This is holding up the whole product
          </span>
          <span className="block text-[13px] text-[var(--muted)] mt-0.5">
            Flags the project as blocked and surfaces it loudly on the dashboard.
          </span>
        </span>
      </label>
    </Modal>
  )
}

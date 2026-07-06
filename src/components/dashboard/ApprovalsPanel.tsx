import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { memberById, pendingChangeRequests } from '@/lib/selectors'
import { fmtDate } from '@/lib/utils'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

export function ApprovalsPanel() {
  const data = useData()
  const approve = useStore((s) => s.approveChangeRequest)
  const reject = useStore((s) => s.rejectChangeRequest)
  const [openId, setOpenId] = useState<string | null>(null)

  const tasks = pendingChangeRequests(data)
  if (tasks.length === 0) return null

  return (
    <>
      <ul className="space-y-3">
        {tasks.map((t) => {
          const cr = t.changeRequest!
          const who = memberById(data, cr.requestedById)
          return (
            <li key={t.id} className="rounded-xl border border-[var(--warn)]/30 bg-[var(--warn-soft)] p-3">
              <button onClick={() => setOpenId(t.id)} className="text-left w-full">
                <div className="font-medium text-sm">{t.title}</div>
                <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)] mt-1">
                  <Avatar member={who} size="xs" />
                  {who?.name} wants{' '}
                  <strong className="text-[var(--text)]">{fmtDate(cr.requestedDueDate)}</strong>
                  {cr.currentDueDate && <span>(was {fmtDate(cr.currentDueDate)})</span>}
                </div>
                <p className="text-[12.5px] italic text-[var(--muted)] mt-1.5">“{cr.justification}”</p>
              </button>
              <div className="flex gap-2 mt-2.5">
                <Button size="sm" variant="primary" onClick={() => approve(t.id)}>
                  <Check size={14} /> Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => reject(t.id)}>
                  <X size={14} /> Reject
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      <TaskDetailModal taskId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

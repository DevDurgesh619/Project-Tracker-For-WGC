import type { ReactNode } from 'react'
import { AlertTriangle, Ban, CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react'
import type { DeadlineState, Priority, TaskStatus } from '@/lib/types'
import { cn, daysFromToday, fmtDate } from '@/lib/utils'

type Tone = 'neutral' | 'info' | 'ok' | 'warn' | 'danger' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]',
  info: 'bg-[var(--info-soft)] text-[var(--info)] border-transparent',
  ok: 'bg-[var(--ok-soft)] text-[var(--ok)] border-transparent',
  warn: 'bg-[var(--warn-soft)] text-[var(--warn)] border-transparent',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border-transparent',
  brand: 'bg-[var(--brand-soft)] text-[var(--brand)] border-transparent',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: Tone; icon: ReactNode }
> = {
  todo: { label: 'To do', tone: 'neutral', icon: <Circle size={12} /> },
  in_progress: { label: 'In progress', tone: 'info', icon: <Loader2 size={12} /> },
  blocked: { label: 'Blocked', tone: 'danger', icon: <Ban size={12} /> },
  delayed: { label: 'Delayed', tone: 'warn', icon: <Clock size={12} /> },
  done: { label: 'Done', tone: 'ok', icon: <CheckCircle2 size={12} /> },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
    </Badge>
  )
}

const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'neutral' },
  high: { label: 'High', tone: 'warn' },
  urgent: { label: 'Urgent', tone: 'danger' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'normal' || priority === 'low') return null
  const m = PRIORITY_META[priority]
  return (
    <Badge
      tone={m.tone}
      icon={priority === 'urgent' ? <AlertTriangle size={12} /> : undefined}
    >
      {m.label}
    </Badge>
  )
}

const DEADLINE_TONE: Record<DeadlineState, Tone> = {
  overdue: 'danger',
  due_soon: 'warn',
  comfortable: 'ok',
  none: 'neutral',
}

/** The signature colour-coded deadline chip (🔴 / 🟡 / 🟢). */
export function DeadlinePill({
  date,
  state,
}: {
  date: string | null
  state: DeadlineState
}) {
  if (!date) return <span className="text-[var(--faint)] text-sm">—</span>
  const days = daysFromToday(date)
  let suffix = ''
  // Done / no-deadline tasks (state 'none') just show the date — never "late"/"left".
  if (days !== null && state !== 'none') {
    if (days === 0) suffix = ' · today'
    else if (days < 0) suffix = ` · ${Math.abs(days)}d late`
    else if (days <= 3) suffix = ` · ${days}d left`
  }
  return (
    <Badge tone={DEADLINE_TONE[state]} icon={<Clock size={12} />}>
      {fmtDate(date)}
      {suffix}
    </Badge>
  )
}

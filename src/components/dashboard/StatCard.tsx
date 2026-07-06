import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'ok' | 'warn' | 'danger' | 'info'

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  ok: { bg: 'var(--ok-soft)', fg: 'var(--ok)' },
  warn: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  onClick,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: Tone
  hint?: string
  onClick?: () => void
}) {
  const t = toneMap[tone]
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow)] p-4 transition-all',
        onClick && 'hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ backgroundColor: t.bg, color: t.fg }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[28px] font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-[13px] text-[var(--muted)]">{label}</div>
      {hint && <div className="text-[12px] text-[var(--faint)] mt-0.5">{hint}</div>}
    </button>
  )
}

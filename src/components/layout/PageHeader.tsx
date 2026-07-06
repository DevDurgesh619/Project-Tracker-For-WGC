import type { ReactNode } from 'react'
import { format } from 'date-fns'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
          <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--muted)]">
            {format(new Date(), 'EEE, MMM d')}
          </span>
        </div>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  color,
  height = 8,
}: {
  value: number
  className?: string
  color?: string
  height?: number
}) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('w-full rounded-full bg-[var(--surface-2)] overflow-hidden', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${v}%`, backgroundColor: color ?? 'var(--brand)' }}
      />
    </div>
  )
}

/** Circular percentage ring. */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  color,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (v / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? 'var(--brand)'}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[13px] font-semibold">{v}%</span>
    </div>
  )
}

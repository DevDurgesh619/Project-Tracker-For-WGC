import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 active:scale-[0.98]'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--brand)] text-[var(--brand-fg)] shadow-sm hover:brightness-110',
  secondary:
    'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]',
  subtle:
    'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]',
  ghost:
    'bg-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  danger: 'bg-[var(--danger)] text-white shadow-sm hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  icon: 'h-9 w-9',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

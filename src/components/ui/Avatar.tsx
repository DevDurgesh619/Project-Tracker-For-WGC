import type { Member } from '@/lib/types'
import { cn, initials } from '@/lib/utils'

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-[13px]',
}

export function Avatar({
  member,
  size = 'sm',
  className,
}: {
  member: Member | undefined
  size?: keyof typeof sizes
  className?: string
}) {
  if (!member) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--faint)] font-semibold',
          sizes[size],
          className,
        )}
        title="Unassigned"
      >
        ?
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white font-semibold ring-2 ring-[var(--surface)]',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: member.avatarColor }}
      title={member.name}
    >
      {initials(member.name)}
    </span>
  )
}

export function AvatarStack({
  members,
  max = 4,
}: {
  members: Member[]
  max?: number
}) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size="sm" />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--muted)] ring-2 ring-[var(--surface)]">
          +{extra}
        </span>
      )}
    </div>
  )
}

import { Badge } from '@/components/ui'
import type { ProjectStatus } from '@/lib/types'

const META: Record<
  ProjectStatus,
  { label: string; tone: 'neutral' | 'info' | 'ok' | 'warn' | 'danger' | 'brand' }
> = {
  planning: { label: 'Planning', tone: 'neutral' },
  active: { label: 'Active', tone: 'info' },
  blocked: { label: 'Blocked', tone: 'danger' },
  on_hold: { label: 'On hold', tone: 'warn' },
  completed: { label: 'Completed', tone: 'ok' },
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const m = META[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

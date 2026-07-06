import { Ban, Check, CircleDashed, Loader2 } from 'lucide-react'
import type { Project, RollupStatus } from '@/lib/types'
import { useData } from '@/lib/hooks'
import {
  milestoneProgress,
  milestonesForPhase,
  phaseProgress,
  phaseStatus,
  phasesForProject,
} from '@/lib/selectors'
import { cn } from '@/lib/utils'

function statusColor(s: RollupStatus, _accent: string): string {
  if (s === 'done') return 'var(--ok)'
  if (s === 'blocked') return 'var(--danger)'
  if (s === 'in_progress') return 'var(--info)'
  return 'var(--border)'
}

function StatusDot({ status, accent }: { status: RollupStatus; accent: string }) {
  const Icon =
    status === 'done' ? Check : status === 'blocked' ? Ban : status === 'in_progress' ? Loader2 : CircleDashed
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-full text-white shrink-0"
      style={{ backgroundColor: statusColor(status, accent) }}
    >
      <Icon size={12} />
    </span>
  )
}

export function TimelineTrack({ project }: { project: Project }) {
  const data = useData()
  const phases = phasesForProject(data, project.id)

  return (
    <div>
      {/* Phase segment strip */}
      <div className="flex gap-1.5 mb-4">
        {phases.map((ph) => {
          const st = phaseStatus(data, ph)
          const pr = phaseProgress(data, ph)
          return (
            <div key={ph.id} className="flex-1 min-w-0">
              <div
                className="h-2 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${statusColor(st, project.color)} 30%, var(--surface-2))`,
                }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pr.percent}%`, backgroundColor: statusColor(st, project.color) }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[var(--muted)] truncate">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: statusColor(st, project.color) }}
                />
                {ph.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Phase → milestone outline */}
      <div className="space-y-3">
        {phases.map((ph) => {
          const st = phaseStatus(data, ph)
          const milestones = milestonesForPhase(data, ph.id)
          return (
            <div key={ph.id}>
              <div className="flex items-center gap-2">
                <StatusDot status={st} accent={project.color} />
                <span className="font-medium text-sm">{ph.label}</span>
                <span className="text-[12px] text-[var(--faint)]">
                  {st === 'done' ? 'completed' : st === 'blocked' ? 'blocked' : st === 'in_progress' ? 'in progress' : 'upcoming'}
                </span>
              </div>
              {milestones.length > 0 && (
                <ul className="ml-2.5 mt-1.5 border-l border-[var(--border)] pl-4 space-y-1.5">
                  {milestones.map((m) => {
                    const mp = milestoneProgress(data, m)
                    return (
                      <li key={m.id} className="flex items-center gap-2 text-[13px]">
                        <span
                          className="h-2 w-2 rounded-full shrink-0 -ml-[21px] ring-2 ring-[var(--surface)]"
                          style={{ backgroundColor: statusColor(mp.status, project.color) }}
                        />
                        <span className={cn(mp.status === 'blocked' && 'text-[var(--danger)]')}>
                          {m.label}
                        </span>
                        <span className="text-[12px] text-[var(--faint)] tabular-nums">
                          {mp.done}/{mp.total}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

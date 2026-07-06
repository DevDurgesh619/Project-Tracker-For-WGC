import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Ban, CheckCircle2, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, CardContent, Progress } from '@/components/ui'
import { TimelineTrack } from '@/components/timeline/TimelineTrack'
import { useData } from '@/lib/hooks'
import { projectStats } from '@/lib/selectors'
import { daysFromToday } from '@/lib/utils'
import type { Project } from '@/lib/types'

export function Targets() {
  const data = useData()
  const projects = data.projects.filter((p) => !p.isHistorical)

  return (
    <>
      <PageHeader
        title="Targets"
        subtitle="Per-product scorecard — what's done, what's left, what's delayed."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {projects.map((p) => (
          <TargetCard key={p.id} project={p} />
        ))}
      </div>
    </>
  )
}

function TargetCard({ project }: { project: Project }) {
  const data = useData()
  const ps = projectStats(data, project)

  const verdict = getVerdict(project, ps.isBlockingCompletion, ps.delayed)

  return (
    <Card>
      <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: project.color }} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{project.name}</h3>
            <p className="text-[12px] text-[var(--faint)] mt-0.5">
              {project.deadline
                ? deadlineCopy(daysFromToday(project.deadline))
                : 'No deadline set'}
            </p>
          </div>
          <Badge tone={verdict.tone}>
            {verdict.icon} {verdict.label}
          </Badge>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Score label="Done" value={ps.done} color="var(--ok)" />
          <Score label="Remaining" value={ps.remaining} color="var(--info)" />
          <Score label="Delayed" value={ps.delayed} color="var(--warn)" />
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[12.5px] text-[var(--muted)] mb-1.5">
            <span>{ps.percent}% complete</span>
            <span className="tabular-nums">
              {ps.done}/{ps.total}
            </span>
          </div>
          <Progress value={ps.percent} color={project.color} />
        </div>

        {/* Compact timeline */}
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <TimelineTrack project={project} />
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-[13px] text-[var(--brand)] hover:underline mt-4"
        >
          Open project <ArrowRight size={14} />
        </Link>
      </CardContent>
    </Card>
  )
}

function Score({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
      <div className="text-[24px] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[12px] text-[var(--muted)] mt-1.5">{label}</div>
    </div>
  )
}

function getVerdict(
  project: Project,
  blocking: boolean,
  delayed: number,
): { label: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral'; icon: React.ReactNode } {
  if (project.status === 'completed')
    return { label: 'Completed', tone: 'ok', icon: <CheckCircle2 size={11} /> }
  if (blocking) return { label: 'Blocked', tone: 'danger', icon: <Ban size={11} /> }
  if (delayed > 0) return { label: 'At risk', tone: 'warn', icon: <AlertTriangle size={11} /> }
  return { label: 'On track', tone: 'info', icon: <Clock size={11} /> }
}

function deadlineCopy(days: number | null): string {
  if (days === null) return 'No deadline'
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  return `${days} days to deadline`
}

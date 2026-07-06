import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ExternalLink, Plus, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AvatarStack, Badge, Button, Card, CardContent, Progress } from '@/components/ui'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import { IdeaPlanModal } from '@/components/projects/IdeaPlanModal'
import { useData } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { projectStats } from '@/lib/selectors'
import { fmtDate, totalDays } from '@/lib/utils'

export function Projects() {
  const data = useData()
  const canEdit = useCanEdit()
  const [showNew, setShowNew] = useState(false)
  const [showIdea, setShowIdea] = useState(false)

  const active = data.projects.filter((p) => !p.isHistorical)
  const historical = data.projects.filter((p) => p.isHistorical)

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Every product and piece of work, with progress and people."
        actions={
          canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowIdea(true)}>
                <Sparkles size={16} /> New from idea
              </Button>
              <Button variant="primary" onClick={() => setShowNew(true)}>
                <Plus size={16} /> New project
              </Button>
            </div>
          )
        }
      />

      <Section title="Active">
        {active.map((p) => (
          <ProjectCard key={p.id} id={p.id} />
        ))}
      </Section>

      {historical.length > 0 && (
        <Section title="Historical / old work">
          {historical.map((p) => (
            <ProjectCard key={p.id} id={p.id} />
          ))}
        </Section>
      )}

      <NewProjectModal open={showNew} onClose={() => setShowNew(false)} />
      <IdeaPlanModal open={showIdea} onClose={() => setShowIdea(false)} />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--faint)] mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>
    </div>
  )
}

function ProjectCard({ id }: { id: string }) {
  const data = useData()
  const p = data.projects.find((x) => x.id === id)!
  const ps = projectStats(data, p)
  const members = p.memberIds
    .map((mid) => data.members.find((m) => m.id === mid))
    .filter(Boolean) as NonNullable<ReturnType<typeof data.members.find>>[]

  return (
    <Link to={`/projects/${p.id}`} className="block group">
      <Card className="h-full transition-all group-hover:shadow-[var(--shadow-md)] group-hover:-translate-y-0.5">
        <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: p.color }} />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{p.name}</h3>
            <ProjectStatusBadge status={p.status} />
          </div>
          <p className="text-[13px] text-[var(--muted)] mt-1.5 line-clamp-2">{p.description}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12.5px] text-[var(--muted)] mb-1.5">
              <span>{ps.percent}% complete</span>
              <span className="tabular-nums">
                {ps.done}/{ps.total} tasks
              </span>
            </div>
            <Progress value={ps.percent} color={p.color} />
          </div>

          <div className="flex items-center justify-between mt-4">
            <AvatarStack members={members} />
            <div className="flex items-center gap-3 text-[12px] text-[var(--faint)]">
              {ps.delayed > 0 && <Badge tone="warn">{ps.delayed} delayed</Badge>}
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={13} />
                {totalDays(p.startDate, p.completedDate)}d
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] text-[12px] text-[var(--muted)]">
            <span>Started {fmtDate(p.startDate)}</span>
            {p.workingLink && (
              <span
                className="inline-flex items-center gap-1 text-[var(--brand)] ml-auto"
                onClick={(e) => {
                  e.preventDefault()
                  window.open(p.workingLink!, '_blank')
                }}
              >
                <ExternalLink size={12} /> Live
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

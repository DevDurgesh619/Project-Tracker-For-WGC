import { useState } from 'react'
import { ExternalLink, History } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, CardContent, CardHeader } from '@/components/ui'
import { TimelineTrack } from '@/components/timeline/TimelineTrack'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import { useData } from '@/lib/hooks'
import { projectStats } from '@/lib/selectors'
import { totalDays } from '@/lib/utils'

export function Timeline() {
  const data = useData()
  const [showHistorical, setShowHistorical] = useState(false)

  const projects = data.projects
    .filter((p) => (showHistorical ? true : !p.isHistorical))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <>
      <PageHeader
        title="Timeline"
        subtitle="The journey of each product — from kickoff to where we are today."
        actions={
          <button
            onClick={() => setShowHistorical((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-10 text-sm font-medium transition-colors ${
              showHistorical
                ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <History size={16} />
            {showHistorical ? 'Hiding nothing' : 'Show old work'}
          </button>
        }
      />

      <div className="space-y-5">
        {projects.map((p) => {
          const ps = projectStats(data, p)
          return (
            <Card key={p.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {p.name}
                    {p.isHistorical && <Badge tone="neutral">old work</Badge>}
                  </span>
                }
                subtitle={`${ps.done}/${ps.total} tasks · ${ps.percent}% · ${totalDays(
                  p.startDate,
                  p.completedDate,
                )} days`}
                action={
                  <div className="flex items-center gap-2">
                    {p.workingLink && (
                      <a
                        href={p.workingLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[13px] text-[var(--brand)] hover:underline"
                      >
                        <ExternalLink size={13} /> Link
                      </a>
                    )}
                    <ProjectStatusBadge status={p.status} />
                  </div>
                }
              />
              <CardContent>
                <TimelineTrack project={p} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

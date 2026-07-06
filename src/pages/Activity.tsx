import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, Select } from '@/components/ui'
import { ActivityList } from '@/components/activity/ActivityList'
import { useData } from '@/lib/hooks'
import { activityFeed } from '@/lib/selectors'

type Scope = 'all' | 'completions' | 'blockers' | 'deadlines'

const SCOPES: Record<Scope, (kind: string) => boolean> = {
  all: () => true,
  completions: (k) => ['task_completed', 'milestone_completed', 'phase_completed', 'project_shipped'].includes(k),
  blockers: (k) => ['task_blocked', 'task_unblocked', 'task_escalated'].includes(k),
  deadlines: (k) => ['task_rescheduled', 'task_autoshifted', 'change_requested', 'change_approved', 'change_rejected'].includes(k),
}

export function Activity() {
  const data = useData()
  const [project, setProject] = useState('all')
  const [actor, setActor] = useState('all')
  const [scope, setScope] = useState<Scope>('all')

  const events = useMemo(() => {
    return activityFeed(data)
      .filter((e) => (project === 'all' ? true : e.projectId === project))
      .filter((e) => (actor === 'all' ? true : e.actorId === actor))
      .filter((e) => SCOPES[scope](e.kind))
  }, [data, project, actor, scope])

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Everything that happened — the answer to “what did we actually do?”"
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={scope} onChange={(e) => setScope(e.target.value as Scope)} className="w-auto">
          <option value="all">All activity</option>
          <option value="completions">Completions</option>
          <option value="blockers">Blockers &amp; escalations</option>
          <option value="deadlines">Deadline changes</option>
        </Select>
        <Select value={project} onChange={(e) => setProject(e.target.value)} className="w-auto">
          <option value="all">All projects</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select value={actor} onChange={(e) => setActor(e.target.value)} className="w-auto">
          <option value="all">Everyone</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="pt-5">
          <ActivityList events={events} />
        </CardContent>
      </Card>
    </>
  )
}

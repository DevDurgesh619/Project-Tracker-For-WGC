import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Plus,
  ShieldAlert,
  Sun,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, Badge, Button, Card, CardContent, CardHeader, EmptyState, Progress, ProgressRing } from '@/components/ui'
import { StatCard } from '@/components/dashboard/StatCard'
import { BlockedPanel } from '@/components/dashboard/BlockedPanel'
import { ApprovalsPanel } from '@/components/dashboard/ApprovalsPanel'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData, useCurrentUser } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import {
  dashboardStats,
  deadlineStatus,
  pendingChangeRequests,
  projectStats,
  todaysTasks,
} from '@/lib/selectors'
import { DeadlinePill } from '@/components/ui'

export function Dashboard() {
  const data = useData()
  const me = useCurrentUser()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [openTask, setOpenTask] = useState<string | null>(null)

  const stats = dashboardStats(data)
  const today = todaysTasks(data)
  const activeProjects = data.projects.filter((p) => !p.isHistorical)
  const approvals = pendingChangeRequests(data)
  const canEdit = useCanEdit()
  const showApprovals = me?.role === 'admin' && canEdit && approvals.length > 0

  return (
    <>
      <PageHeader
        title={`Hi ${me?.name?.split(' ')[0] ?? 'there'} 👋`}
        subtitle="Here's exactly where we stand today."
        actions={
          canEdit && (
            <Button variant="primary" onClick={() => setShowNew(true)}>
              <Plus size={16} /> New task
            </Button>
          )
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Completed tasks"
          value={stats.completed}
          icon={<CheckCircle2 size={20} />}
          tone="ok"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="Pending tasks"
          value={stats.pending}
          icon={<CircleDashed size={20} />}
          tone="info"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="Due today"
          value={stats.today}
          icon={<Sun size={20} />}
          tone="warn"
          onClick={() => navigate('/deadlines')}
        />
        <StatCard
          label="Need attention"
          value={stats.blocked + stats.urgent}
          icon={<ShieldAlert size={20} />}
          tone="danger"
          hint={`${stats.blocked} blocked · ${stats.urgent} urgent`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Left: progress + today */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Where we reached"
              subtitle="Progress across active products"
              action={
                <div className="flex items-center gap-3">
                  <ProgressRing value={stats.overallPercent} />
                </div>
              }
            />
            <CardContent className="space-y-4">
              {activeProjects.map((p) => {
                const ps = projectStats(data, p)
                return (
                  <div
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        {ps.isBlockingCompletion && (
                          <Badge tone="danger">blocked</Badge>
                        )}
                      </div>
                      <span className="text-[13px] text-[var(--muted)] tabular-nums shrink-0">
                        {ps.done}/{ps.total} · {ps.percent}%
                      </span>
                    </div>
                    <Progress value={ps.percent} color={p.color} />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Today's tasks" subtitle="Due today across the team" icon={<CalendarDays size={18} />} />
            <CardContent>
              {today.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={20} className="text-[var(--ok)]" />}
                  title="Nothing due today"
                  description="Enjoy the breathing room — or pull something forward."
                />
              ) : (
                <ul className="space-y-1">
                  {today.map((t) => (
                    <li
                      key={t.id}
                      onClick={() => setOpenTask(t.id)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-[var(--surface-2)] -mx-2"
                    >
                      <Avatar member={data.members.find((m) => m.id === t.assigneeId)} size="xs" />
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">
                        {t.title}
                      </span>
                      <DeadlinePill date={t.dueDate} state={deadlineStatus(t)} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: approvals + attention + calendar */}
        <div className="space-y-5">
          {showApprovals && (
            <Card>
              <CardHeader
                title="Approvals"
                subtitle={`${approvals.length} deadline-change request${approvals.length > 1 ? 's' : ''}`}
                icon={<CalendarDays size={18} className="text-[var(--warn)]" />}
              />
              <CardContent>
                <ApprovalsPanel />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader
              title="Needs attention"
              subtitle="Blocked, urgent & overdue"
              icon={<ShieldAlert size={18} className="text-[var(--danger)]" />}
            />
            <CardContent>
              <BlockedPanel />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Calendar" />
            <CardContent>
              <MiniCalendar />
              <Legend />
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskFormModal open={showNew} onClose={() => setShowNew(false)} />
      <TaskDetailModal taskId={openTask} onClose={() => setOpenTask(null)} />
    </>
  )
}

function Legend() {
  const items = [
    ['var(--danger)', 'Overdue / blocked'],
    ['var(--warn)', 'Due soon'],
    ['var(--info)', 'Upcoming'],
    ['var(--ok)', 'Done'],
  ] as const
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-[var(--border)]">
      {items.map(([c, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
          {label}
        </span>
      ))}
    </div>
  )
}

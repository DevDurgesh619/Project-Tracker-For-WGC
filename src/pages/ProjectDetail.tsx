import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Check,
  CircleDashed,
  ExternalLink,
  Loader2,
  Plus,
  Target,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  DeadlinePill,
  EmptyState,
  Input,
  Modal,
  ProgressRing,
  StatusBadge,
} from '@/components/ui'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import { ActivityList } from '@/components/activity/ActivityList'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useData, useCurrentUser } from '@/lib/hooks'
import { useCanEdit } from '@/lib/auth'
import { useStore } from '@/lib/store'
import {
  activityForProject,
  currentPhase,
  deadlineStatus,
  memberById,
  milestoneProgress,
  milestonesForPhase,
  phaseProgress,
  phaseStatus,
  phasesForProject,
  projectStats,
  tasksForMilestone,
} from '@/lib/selectors'
import { PHASE_LABEL, PHASE_SEQUENCE } from '@/lib/types'
import type { RollupStatus, Task } from '@/lib/types'
import { fmtDate, totalDays } from '@/lib/utils'

function rollupColor(s: RollupStatus, _accent: string): string {
  if (s === 'done') return 'var(--ok)'
  if (s === 'blocked') return 'var(--danger)'
  if (s === 'in_progress') return 'var(--info)'
  return 'var(--border)'
}

function RollupIcon({ status, accent }: { status: RollupStatus; accent: string }) {
  const Icon =
    status === 'done' ? Check : status === 'blocked' ? Ban : status === 'in_progress' ? Loader2 : CircleDashed
  return (
    <span
      className="grid h-6 w-6 place-items-center rounded-full text-white shrink-0"
      style={{ backgroundColor: rollupColor(status, accent) }}
    >
      <Icon size={13} />
    </span>
  )
}

export function ProjectDetail() {
  const { id = '' } = useParams()
  const data = useData()
  const me = useCurrentUser()
  const canEdit = useCanEdit()
  const isAdmin = me?.role === 'admin' && canEdit
  const addMilestone = useStore((s) => s.addMilestone)
  const advanceProject = useStore((s) => s.advanceProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const navigate = useNavigate()

  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<{ projectId: string; milestoneId?: string } | null>(null)
  const [addingFor, setAddingFor] = useState<string | null>(null) // phaseId
  const [newMilestone, setNewMilestone] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  const project = data.projects.find((p) => p.id === id)
  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been removed."
        action={
          <Link to="/projects">
            <Button variant="primary">Back to projects</Button>
          </Link>
        }
      />
    )
  }

  const ps = projectStats(data, project)
  const phases = phasesForProject(data, project.id)
  const cur = currentPhase(data, project)
  const owner = memberById(data, project.ownerId)
  const members = project.memberIds
    .map((mid) => memberById(data, mid))
    .filter(Boolean) as NonNullable<ReturnType<typeof memberById>>[]
  const unsorted = data.tasks.filter((t) => t.projectId === project.id && !t.milestoneId)

  const lastPhase = phases[phases.length - 1]
  const nextKind = lastPhase ? PHASE_SEQUENCE[PHASE_SEQUENCE.indexOf(lastPhase.kind) + 1] : undefined

  function saveMilestone(phaseId: string) {
    if (!newMilestone.trim()) return
    addMilestone(project!.id, phaseId, newMilestone.trim())
    setNewMilestone('')
    setAddingFor(null)
  }

  return (
    <>
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4">
        <ArrowLeft size={16} /> All projects
      </Link>

      <PageHeader
        title={project.name}
        subtitle={project.description}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && nextKind && (
              <Button variant="secondary" onClick={() => advanceProject(project.id)}>
                <ArrowRight size={16} /> Add {PHASE_LABEL[nextKind]} phase
              </Button>
            )}
            {isAdmin && (
              <Button variant="primary" onClick={() => setTaskForm({ projectId: project.id })}>
                <Plus size={16} /> Add task
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                className="text-[var(--danger)]"
                onClick={() => {
                  setDeleteText('')
                  setConfirmDelete(true)
                }}
              >
                <Trash2 size={16} /> Delete
              </Button>
            )}
          </div>
        }
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete project"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-[var(--danger)] hover:!opacity-90"
              disabled={deleteText.trim() !== project.name}
              onClick={() => {
                deleteProject(project.id)
                setConfirmDelete(false)
                navigate('/projects')
              }}
            >
              <Trash2 size={16} /> Delete forever
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          This permanently removes <strong className="text-[var(--text)]">{project.name}</strong> and all of its
          phases, milestones, and tasks. This cannot be undone.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Type the project name to confirm:
        </p>
        <Input
          className="mt-1.5"
          autoFocus
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
          placeholder={project.name}
        />
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overview */}
        <div className="lg:col-span-1 space-y-5">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={ps.percent}
                size={72}
                stroke={7}
                color={project.status === 'completed' ? 'var(--ok)' : project.color}
              />
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ProjectStatusBadge status={project.status} />
                  {cur && <Badge tone="brand">{cur.label} phase</Badge>}
                </div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  {ps.done} done · {ps.remaining} left
                  {ps.delayed > 0 && <span className="text-[var(--warn)]"> · {ps.delayed} delayed</span>}
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <Meta icon={<CalendarDays size={15} />} label="Started">{fmtDate(project.startDate, 'MMM d, yyyy')}</Meta>
              <Meta icon={<CalendarDays size={15} />} label="Deadline">
                {project.deadline ? fmtDate(project.deadline, 'MMM d, yyyy') : '—'}
              </Meta>
              <Meta icon={<CalendarDays size={15} />} label="Total days">
                {totalDays(project.startDate, project.completedDate)} days
                {project.completedDate && <Badge tone="ok" className="ml-2">shipped {fmtDate(project.completedDate)}</Badge>}
              </Meta>
              <Meta icon={<Avatar member={owner} size="xs" />} label="Owner">{owner?.name}</Meta>
              <Meta icon={<Users size={15} />} label="People">
                <AvatarStack members={members} />
              </Meta>
              {project.workingLink && (
                <Meta icon={<ExternalLink size={15} />} label="Link">
                  <a href={project.workingLink} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline break-all">
                    {project.workingLink.replace(/^https?:\/\//, '')}
                  </a>
                </Meta>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardContent className="pt-1">
            <ActivityList events={activityForProject(data, project.id).slice(0, 8)} />
          </CardContent>
        </Card>
        </div>

        {/* Lifecycle hierarchy */}
        <div className="lg:col-span-2 space-y-4">
          {phases.map((phase) => {
            const st = phaseStatus(data, phase)
            const pp = phaseProgress(data, phase)
            const milestones = milestonesForPhase(data, phase.id)
            return (
              <Card key={phase.id}>
                <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
                  <RollupIcon status={st} accent={project.color} />
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {phase.label} phase
                      <span className="text-[12px] font-normal text-[var(--faint)]">
                        {pp.done}/{pp.total} tasks · {pp.percent}%
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setAddingFor(phase.id)}>
                      <Plus size={14} /> Milestone
                    </Button>
                  )}
                </div>

                <CardContent className="pt-1 space-y-3">
                  {addingFor === phase.id && (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveMilestone(phase.id)}
                        placeholder="Milestone name, e.g. QA pass"
                      />
                      <Button variant="primary" onClick={() => saveMilestone(phase.id)}>Add</Button>
                      <Button variant="ghost" onClick={() => { setAddingFor(null); setNewMilestone('') }}>Cancel</Button>
                    </div>
                  )}

                  {milestones.length === 0 && addingFor !== phase.id && (
                    <p className="text-[13px] text-[var(--faint)] py-1">
                      No milestones yet{isAdmin ? ' — add one to group tasks.' : '.'}
                    </p>
                  )}

                  {milestones.map((m) => {
                    const mp = milestoneProgress(data, m)
                    const tasks = tasksForMilestone(data, m.id).sort((a, b) =>
                      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
                    )
                    return (
                      <div key={m.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                        <div className="flex items-center gap-2 bg-[var(--surface-2)] px-3 py-2">
                          <Target size={14} style={{ color: rollupColor(mp.status, project.color) }} />
                          <span className="font-medium text-[13px]">{m.label}</span>
                          <span className="text-[12px] text-[var(--faint)] tabular-nums">{mp.done}/{mp.total}</span>
                          {mp.status === 'done' && <Badge tone="ok">done</Badge>}
                          {mp.status === 'blocked' && <Badge tone="danger">blocked</Badge>}
                          {isAdmin && (
                            <button
                              onClick={() => setTaskForm({ projectId: project.id, milestoneId: m.id })}
                              className="ml-auto text-[12px] text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                            >
                              <Plus size={12} /> Task
                            </button>
                          )}
                        </div>
                        <div>
                          {tasks.length === 0 ? (
                            <p className="text-[12.5px] text-[var(--faint)] px-3 py-2">No tasks in this milestone yet.</p>
                          ) : (
                            tasks.map((t) => <TaskLine key={t.id} task={t} onOpen={() => setOpenTaskId(t.id)} />)
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}

          {unsorted.length > 0 && (
            <Card>
              <CardHeader title="Unsorted tasks" subtitle="Not assigned to a milestone yet" />
              <CardContent className="pt-0">
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  {unsorted.map((t) => (
                    <TaskLine key={t.id} task={t} onOpen={() => setOpenTaskId(t.id)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
      {taskForm && (
        <TaskFormModal
          open
          onClose={() => setTaskForm(null)}
          defaultProjectId={taskForm.projectId}
          defaultMilestoneId={taskForm.milestoneId}
        />
      )}
    </>
  )
}

function TaskLine({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const data = useData()
  const assignee = memberById(data, task.assigneeId)
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-2.5 px-3 py-2.5 border-t border-[var(--border)] first:border-t-0 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
    >
      <span className="flex-1 min-w-0 truncate text-sm font-medium">{task.title}</span>
      <span className="inline-flex -space-x-1.5 shrink-0">
        <Avatar member={assignee} size="xs" />
        {task.participantIds.map((id) => (
          <Avatar key={id} member={memberById(data, id)} size="xs" />
        ))}
      </span>
      <StatusBadge status={task.status} />
      <DeadlinePill date={task.dueDate} state={deadlineStatus(task)} />
    </div>
  )
}

function Meta({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)] shrink-0">{icon}</span>
      <span className="text-[var(--faint)] w-20 shrink-0 text-[13px]">{label}</span>
      <span className="font-medium flex items-center gap-1.5">{children}</span>
    </div>
  )
}

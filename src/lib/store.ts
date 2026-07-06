import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActivityEvent,
  ActivityKind,
  Blocker,
  ChangeRequest,
  DayNote,
  Milestone,
  Note,
  NoteKind,
  Phase,
  PhaseKind,
  Priority,
  Project,
  Recurrence,
  Task,
  TaskStatus,
  TimelineData,
} from './types'
import { PHASE_LABEL, PHASE_SEQUENCE } from './types'
import type { ProjectTemplate } from './templates'
import { buildSeed, SEED_VERSION } from './seed'
import { recompute } from './rollup'
import { addDaysISO, diffDaysISO, nowISO, todayISO, uid } from './utils'

export type Theme = 'light' | 'dark'

export interface NewTaskInput {
  projectId: string
  milestoneId?: string | null
  title: string
  description?: string
  assigneeId: string
  participantIds?: string[]
  priority?: Priority
  dueDate?: string | null
  scheduledFor?: string | null
  estimateHours?: number | null
  recurrence?: Recurrence
  dependsOn?: string[]
}

export interface NewProjectInput {
  name: string
  description?: string
  startDate: string
  deadline?: string | null
  ownerId: string
  memberIds?: string[]
  workingLink?: string | null
  color?: string
  isHistorical?: boolean
}

interface StoreState {
  data: TimelineData
  currentUserId: string
  theme: Theme

  setCurrentUser: (id: string) => void
  toggleTheme: () => void
  resetDemo: () => void

  // tasks
  addTask: (input: NewTaskInput) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  setStatus: (id: string, status: TaskStatus) => void
  startTask: (id: string) => void
  completeTask: (id: string, completionNote?: string) => void
  escalateTask: (id: string) => void
  deEscalateTask: (id: string) => void

  // blockers & notes
  setBlocker: (id: string, blocker: Omit<Blocker, 'raisedAt'>) => void
  clearBlocker: (id: string) => void
  addNote: (taskId: string, body: string, kind?: NoteKind) => void

  // deadline changes
  rescheduleTask: (id: string, newDueDate: string, reason: string) => void
  requestReschedule: (id: string, newDueDate: string, justification: string) => void
  approveChangeRequest: (id: string, decisionNote?: string) => void
  rejectChangeRequest: (id: string, decisionNote?: string) => void

  // milestones & phases
  addMilestone: (projectId: string, phaseId: string, label: string, targetDate?: string | null) => string
  updateMilestone: (id: string, patch: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  addPhase: (projectId: string, kind: PhaseKind) => string
  deletePhase: (id: string) => void
  advanceProject: (projectId: string) => void

  // projects
  addProject: (input: NewProjectInput) => string
  addProjectFromTemplate: (input: NewProjectInput, template: ProjectTemplate) => string
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void

  // day notes (holidays / context pinned to a date)
  addDayNote: (input: { date: string; endDate?: string | null; kind?: DayNote['kind']; body: string }) => string
  updateDayNote: (id: string, patch: Partial<Pick<DayNote, 'date' | 'endDate' | 'kind' | 'body'>>) => void
  deleteDayNote: (id: string) => void
}

const PALETTE = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#db2777', '#9333ea']

function makeTask(input: NewTaskInput): Task {
  return {
    id: uid(),
    projectId: input.projectId,
    milestoneId: input.milestoneId ?? null,
    title: input.title,
    description: input.description ?? '',
    assigneeId: input.assigneeId,
    participantIds: input.participantIds ?? [],
    status: 'todo',
    priority: input.priority ?? 'normal',
    createdDate: todayISO(),
    scheduledFor: input.scheduledFor ?? null,
    dueDate: input.dueDate ?? null,
    originalDueDate: input.dueDate ?? null,
    estimateHours: input.estimateHours ?? null,
    recurrence: input.recurrence ?? 'none',
    startedAt: null,
    completedAt: null,
    completionNote: null,
    escalatedAt: null,
    blocker: null,
    changeRequest: null,
    dependsOn: input.dependsOn ?? [],
    notes: [],
  }
}

/** Emit events for milestone/phase/project completions that just happened. */
function diffRollups(prev: TimelineData, next: TimelineData, actorId: string): ActivityEvent[] {
  const at = nowISO()
  const mk = (kind: ActivityKind, summary: string, ref: Partial<ActivityEvent>): ActivityEvent => ({
    id: uid(),
    at,
    actorId,
    kind,
    projectId: ref.projectId ?? null,
    taskId: null,
    milestoneId: ref.milestoneId ?? null,
    phaseId: ref.phaseId ?? null,
    summary,
    detail: null,
  })
  const evs: ActivityEvent[] = []
  for (const m of next.milestones) {
    const old = prev.milestones.find((x) => x.id === m.id)
    if (m.completedDate && !old?.completedDate)
      evs.push(mk('milestone_completed', `Milestone “${m.label}” completed`, { projectId: m.projectId, milestoneId: m.id }))
  }
  for (const ph of next.phases) {
    const old = prev.phases.find((x) => x.id === ph.id)
    if (ph.completedDate && !old?.completedDate)
      evs.push(mk('phase_completed', `${ph.label} phase completed`, { projectId: ph.projectId, phaseId: ph.id }))
  }
  for (const p of next.projects) {
    const old = prev.projects.find((x) => x.id === p.id)
    if (p.status === 'completed' && old && old.status !== 'completed')
      evs.push(mk('project_shipped', `“${p.name}” shipped 🚀`, { projectId: p.id }))
  }
  return evs
}

/** Push dependents later by the same delta when a task's deadline moves out. */
function cascadeShift(
  tasks: Task[],
  changedId: string,
  deltaDays: number,
  actorId: string,
): { tasks: Task[]; events: ActivityEvent[] } {
  if (deltaDays <= 0) return { tasks, events: [] }
  const out = tasks.map((t) => ({ ...t }))
  const events: ActivityEvent[] = []
  const visited = new Set<string>([changedId])
  const queue: string[] = [changedId]
  while (queue.length) {
    const cur = queue.shift()!
    for (const dep of out) {
      if (visited.has(dep.id) || dep.status === 'done') continue
      if (!dep.dependsOn.includes(cur)) continue
      visited.add(dep.id)
      if (dep.dueDate) dep.dueDate = addDaysISO(dep.dueDate, deltaDays)
      if (dep.scheduledFor) dep.scheduledFor = addDaysISO(dep.scheduledFor, deltaDays)
      dep.notes = [
        ...dep.notes,
        { id: uid(), authorId: actorId, body: `Auto-shifted ${deltaDays} day(s) because a dependency moved.`, createdAt: nowISO(), kind: 'delay_reason' },
      ]
      events.push({
        id: uid(),
        at: nowISO(),
        actorId,
        kind: 'task_autoshifted',
        projectId: dep.projectId,
        taskId: dep.id,
        milestoneId: null,
        phaseId: null,
        summary: `Auto-shifted “${dep.title}” by ${deltaDays} day(s)`,
        detail: null,
      })
      queue.push(dep.id)
    }
  }
  return { tasks: out, events }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const commit = (next: TimelineData, events: ActivityEvent[] = []) => {
        const prev = get().data
        const data = recompute(next)
        const auto = diffRollups(prev, data, get().currentUserId)
        set({ data: { ...data, activity: [...data.activity, ...events, ...auto] } })
      }
      const evt = (kind: ActivityKind, partial: Partial<ActivityEvent>): ActivityEvent => ({
        id: uid(),
        at: nowISO(),
        actorId: get().currentUserId,
        projectId: null,
        taskId: null,
        milestoneId: null,
        phaseId: null,
        summary: '',
        detail: null,
        ...partial,
        kind,
      })
      const patch = (id: string, fn: (t: Task) => Task, events: ActivityEvent[] = []) =>
        commit({ ...get().data, tasks: get().data.tasks.map((t) => (t.id === id ? fn(t) : t)) }, events)
      const find = (id: string) => get().data.tasks.find((t) => t.id === id)

      return {
        data: buildSeed(),
        currentUserId: 'm-durgesh',
        theme: 'light',

        setCurrentUser: (id) => set({ currentUserId: id }),
        toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
        resetDemo: () => set({ data: buildSeed(), currentUserId: 'm-durgesh' }),

        addTask: (input) => {
          const task = makeTask(input)
          commit({ ...get().data, tasks: [...get().data.tasks, task] }, [
            evt('task_created', { taskId: task.id, projectId: task.projectId, summary: `Created task “${task.title}”` }),
          ])
          return task.id
        },

        updateTask: (id, p) => patch(id, (t) => ({ ...t, ...p })),

        deleteTask: (id) =>
          commit({
            ...get().data,
            tasks: get().data.tasks
              .filter((t) => t.id !== id)
              .map((t) => (t.dependsOn.includes(id) ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) } : t)),
          }),

        setStatus: (id, status) => {
          const t0 = find(id)
          patch(
            id,
            (t) => {
              const next: Task = { ...t, status }
              if (status === 'done') {
                next.completedAt = t.completedAt ?? nowISO()
                next.startedAt = t.startedAt ?? next.completedAt
                next.blocker = null
              }
              if (status === 'in_progress' && !t.startedAt) next.startedAt = nowISO()
              return next
            },
            status === 'done' && t0
              ? [evt('task_completed', { taskId: id, projectId: t0.projectId, summary: `Completed “${t0.title}”` })]
              : [],
          )
        },

        startTask: (id) => {
          const t0 = find(id)
          patch(
            id,
            (t) => ({ ...t, status: t.status === 'blocked' ? 'blocked' : 'in_progress', startedAt: t.startedAt ?? nowISO() }),
            t0 && !t0.startedAt ? [evt('task_started', { taskId: id, projectId: t0.projectId, summary: `Started “${t0.title}”` })] : [],
          )
        },

        completeTask: (id, completionNote) => {
          const task = find(id)
          if (!task) return
          const completedAt = nowISO()
          const notes: Note[] = completionNote?.trim()
            ? [...task.notes, { id: uid(), authorId: get().currentUserId, body: completionNote.trim(), createdAt: completedAt, kind: 'completion' as NoteKind }]
            : task.notes

          let tasks = get().data.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'done' as TaskStatus, startedAt: t.startedAt ?? completedAt, completedAt, completionNote: completionNote?.trim() || t.completionNote, blocker: null, notes }
              : t,
          )

          if (task.recurrence !== 'none') {
            const inc = task.recurrence === 'daily' ? 1 : 7
            const base = task.dueDate ?? task.scheduledFor ?? todayISO()
            const nextTask = makeTask({
              projectId: task.projectId,
              milestoneId: task.milestoneId,
              title: task.title,
              description: task.description,
              assigneeId: task.assigneeId,
              participantIds: task.participantIds,
              priority: task.priority,
              estimateHours: task.estimateHours,
              dueDate: addDaysISO(base, inc),
              scheduledFor: task.scheduledFor ? addDaysISO(task.scheduledFor, inc) : null,
              recurrence: task.recurrence,
            })
            tasks = [...tasks, nextTask]
          }

          commit({ ...get().data, tasks }, [
            evt('task_completed', { taskId: id, projectId: task.projectId, summary: `Completed “${task.title}”`, detail: completionNote?.trim() || null }),
          ])
        },

        escalateTask: (id) => {
          const t0 = find(id)
          patch(
            id,
            (t) => ({ ...t, priority: 'urgent', escalatedAt: t.escalatedAt ?? nowISO() }),
            t0 ? [evt('task_escalated', { taskId: id, projectId: t0.projectId, summary: `Escalated “${t0.title}” to urgent` })] : [],
          )
        },

        deEscalateTask: (id) => patch(id, (t) => ({ ...t, priority: 'normal', escalatedAt: null })),

        setBlocker: (id, blocker) => {
          const t0 = find(id)
          patch(
            id,
            (t) => ({ ...t, status: 'blocked', blocker: { ...blocker, raisedAt: nowISO() } }),
            t0 ? [evt('task_blocked', { taskId: id, projectId: t0.projectId, summary: `Blocked “${t0.title}”`, detail: blocker.reason })] : [],
          )
        },

        clearBlocker: (id) => {
          const t0 = find(id)
          patch(
            id,
            (t) => ({ ...t, status: t.status === 'blocked' ? 'in_progress' : t.status, blocker: null }),
            t0 ? [evt('task_unblocked', { taskId: id, projectId: t0.projectId, summary: `Unblocked “${t0.title}”` })] : [],
          )
        },

        addNote: (taskId, body, kind = 'comment') =>
          patch(taskId, (t) => ({
            ...t,
            notes: [...t.notes, { id: uid(), authorId: get().currentUserId, body, createdAt: nowISO(), kind }],
          })),

        rescheduleTask: (id, newDueDate, reason) => {
          const t0 = find(id)
          if (!t0) return
          const delta = t0.dueDate ? diffDaysISO(t0.dueDate, newDueDate) : 0
          let tasks = get().data.tasks.map((t) =>
            t.id === id
              ? { ...t, originalDueDate: t.originalDueDate ?? t.dueDate, dueDate: newDueDate, status: t.status === 'done' ? t.status : ('delayed' as TaskStatus), notes: [...t.notes, { id: uid(), authorId: get().currentUserId, body: reason, createdAt: nowISO(), kind: 'delay_reason' as NoteKind }] }
              : t,
          )
          const cas = cascadeShift(tasks, id, delta, get().currentUserId)
          tasks = cas.tasks
          commit({ ...get().data, tasks }, [
            evt('task_rescheduled', { taskId: id, projectId: t0.projectId, summary: `Rescheduled “${t0.title}” → ${newDueDate}`, detail: reason }),
            ...cas.events,
          ])
        },

        requestReschedule: (id, newDueDate, justification) => {
          const t0 = find(id)
          patch(
            id,
            (t) => ({
              ...t,
              changeRequest: {
                id: uid(),
                taskId: t.id,
                requestedById: get().currentUserId,
                currentDueDate: t.dueDate,
                requestedDueDate: newDueDate,
                justification,
                status: 'pending',
                decidedById: null,
                decidedAt: null,
                decisionNote: null,
                createdAt: nowISO(),
              } satisfies ChangeRequest,
            }),
            t0 ? [evt('change_requested', { taskId: id, projectId: t0.projectId, summary: `Requested a deadline change on “${t0.title}”`, detail: justification })] : [],
          )
        },

        approveChangeRequest: (id, decisionNote) => {
          const t0 = find(id)
          const cr = t0?.changeRequest
          if (!t0 || !cr) return
          const delta = t0.dueDate ? diffDaysISO(t0.dueDate, cr.requestedDueDate) : 0
          let tasks = get().data.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  originalDueDate: t.originalDueDate ?? t.dueDate,
                  dueDate: cr.requestedDueDate,
                  status: t.status === 'done' ? t.status : ('delayed' as TaskStatus),
                  changeRequest: { ...cr, status: 'approved' as const, decidedById: get().currentUserId, decidedAt: nowISO(), decisionNote: decisionNote ?? null },
                  notes: [...t.notes, { id: uid(), authorId: get().currentUserId, body: `Approved deadline change → ${cr.requestedDueDate}. Reason: ${cr.justification}`, createdAt: nowISO(), kind: 'delay_reason' as NoteKind }],
                }
              : t,
          )
          const cas = cascadeShift(tasks, id, delta, get().currentUserId)
          tasks = cas.tasks
          commit({ ...get().data, tasks }, [
            evt('change_approved', { taskId: id, projectId: t0.projectId, summary: `Approved deadline change on “${t0.title}” → ${cr.requestedDueDate}` }),
            ...cas.events,
          ])
        },

        rejectChangeRequest: (id, decisionNote) => {
          const t0 = find(id)
          patch(
            id,
            (t) =>
              t.changeRequest
                ? { ...t, changeRequest: { ...t.changeRequest, status: 'rejected', decidedById: get().currentUserId, decidedAt: nowISO(), decisionNote: decisionNote ?? null } }
                : t,
            t0 ? [evt('change_rejected', { taskId: id, projectId: t0.projectId, summary: `Rejected deadline change on “${t0.title}”` })] : [],
          )
        },

        addMilestone: (projectId, phaseId, label, targetDate) => {
          const id = uid()
          const order = get().data.milestones.filter((m) => m.phaseId === phaseId).length
          const milestone: Milestone = { id, projectId, phaseId, label, order, targetDate: targetDate ?? null, completedDate: null }
          commit({ ...get().data, milestones: [...get().data.milestones, milestone] }, [
            evt('milestone_added', { projectId, milestoneId: id, summary: `Added milestone “${label}”` }),
          ])
          return id
        },

        updateMilestone: (id, p) =>
          commit({ ...get().data, milestones: get().data.milestones.map((m) => (m.id === id ? { ...m, ...p } : m)) }),

        deleteMilestone: (id) =>
          commit({
            ...get().data,
            milestones: get().data.milestones.filter((m) => m.id !== id),
            tasks: get().data.tasks.map((t) => (t.milestoneId === id ? { ...t, milestoneId: null } : t)),
          }),

        addPhase: (projectId, kind) => {
          const id = uid()
          const order = get().data.phases.filter((p) => p.projectId === projectId).length
          const phase: Phase = { id, projectId, kind, label: PHASE_LABEL[kind], order, startedDate: null, completedDate: null }
          commit({ ...get().data, phases: [...get().data.phases, phase] }, [
            evt('phase_added', { projectId, phaseId: id, summary: `Added ${PHASE_LABEL[kind]} phase` }),
          ])
          return id
        },

        deletePhase: (id) => {
          const data = get().data
          const phase = data.phases.find((p) => p.id === id)
          if (!phase) return
          const msIds = new Set(data.milestones.filter((m) => m.phaseId === id).map((m) => m.id))
          const removed = new Set(
            data.tasks.filter((t) => t.milestoneId && msIds.has(t.milestoneId)).map((t) => t.id),
          )
          commit(
            {
              ...data,
              phases: data.phases.filter((p) => p.id !== id),
              milestones: data.milestones.filter((m) => m.phaseId !== id),
              tasks: data.tasks
                .filter((t) => !removed.has(t.id))
                .map((t) =>
                  t.dependsOn.some((d) => removed.has(d))
                    ? { ...t, dependsOn: t.dependsOn.filter((d) => !removed.has(d)) }
                    : t,
                ),
            },
            [evt('phase_deleted', { projectId: phase.projectId, phaseId: id, summary: `Removed ${phase.label} phase` })],
          )
        },

        advanceProject: (projectId) => {
          const phases = get().data.phases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order)
          const lastKind = phases[phases.length - 1]?.kind
          const idx = lastKind ? PHASE_SEQUENCE.indexOf(lastKind) : -1
          const nextKind = PHASE_SEQUENCE[idx + 1]
          if (!nextKind) return
          get().addPhase(projectId, nextKind)
        },

        addProject: (input) => {
          const id = uid()
          const data = get().data
          const project: Project = {
            id,
            name: input.name,
            description: input.description ?? '',
            status: input.isHistorical ? 'completed' : 'planning',
            startDate: input.startDate,
            deadline: input.deadline ?? null,
            completedDate: input.isHistorical ? input.startDate : null,
            ownerId: input.ownerId,
            memberIds: input.memberIds ?? [input.ownerId],
            workingLink: input.workingLink ?? null,
            color: input.color ?? PALETTE[data.projects.length % PALETTE.length]!,
            isHistorical: input.isHistorical ?? false,
          }
          const phase: Phase = {
            id: uid(),
            projectId: id,
            kind: input.isHistorical ? 'shipped' : 'prototype',
            label: input.isHistorical ? PHASE_LABEL.shipped : PHASE_LABEL.prototype,
            order: 0,
            startedDate: input.startDate,
            completedDate: input.isHistorical ? input.startDate : null,
          }
          commit({ ...data, projects: [...data.projects, project], phases: [...data.phases, phase] }, [
            evt('project_created', { projectId: id, summary: `Created project “${project.name}”` }),
          ])
          return id
        },

        addProjectFromTemplate: (input, template) => {
          const id = uid()
          const data = get().data
          const project: Project = {
            id,
            name: input.name,
            description: input.description ?? template.tagline,
            status: 'planning',
            startDate: input.startDate,
            deadline: input.deadline ?? null,
            completedDate: null,
            ownerId: input.ownerId,
            memberIds: input.memberIds ?? [input.ownerId],
            workingLink: input.workingLink ?? null,
            color: input.color ?? template.color,
            isHistorical: false,
          }
          const phaseId = uid()
          const phase: Phase = {
            id: phaseId,
            projectId: id,
            kind: 'prototype',
            label: PHASE_LABEL.prototype,
            order: 0,
            startedDate: null,
            completedDate: null,
          }
          const msMap: Record<string, string> = {}
          const milestones: Milestone[] = template.milestones.map((m, i) => {
            const mid = uid()
            msMap[m.key] = mid
            return { id: mid, projectId: id, phaseId, label: m.label, order: i, targetDate: null, completedDate: null }
          })
          const tasks: Task[] = template.tasks.map((t) =>
            makeTask({
              projectId: id,
              milestoneId: msMap[t.milestone] ?? null,
              title: t.title,
              description: t.description,
              assigneeId: input.ownerId,
              dueDate: addDaysISO(input.startDate, t.dueOffset),
            }),
          )
          commit(
            {
              ...data,
              projects: [...data.projects, project],
              phases: [...data.phases, phase],
              milestones: [...data.milestones, ...milestones],
              tasks: [...data.tasks, ...tasks],
            },
            [evt('project_created', { projectId: id, summary: `Created project “${project.name}” from the ${template.name} template` })],
          )
          return id
        },

        updateProject: (id, p) =>
          commit({ ...get().data, projects: get().data.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }),

        addDayNote: (input) => {
          const note: DayNote = {
            id: uid(),
            date: input.date,
            endDate: input.endDate ?? null,
            kind: input.kind ?? 'note',
            body: input.body.trim(),
            authorId: get().currentUserId,
            createdAt: nowISO(),
          }
          commit({ ...get().data, dayNotes: [...(get().data.dayNotes ?? []), note] })
          return note.id
        },

        updateDayNote: (id, p) =>
          commit({
            ...get().data,
            dayNotes: (get().data.dayNotes ?? []).map((n) =>
              n.id === id ? { ...n, ...p, body: (p.body ?? n.body).trim() } : n,
            ),
          }),

        deleteDayNote: (id) =>
          commit({ ...get().data, dayNotes: (get().data.dayNotes ?? []).filter((n) => n.id !== id) }),

        deleteProject: (id) => {
          const data = get().data
          const project = data.projects.find((p) => p.id === id)
          if (!project) return
          const removed = new Set(data.tasks.filter((t) => t.projectId === id).map((t) => t.id))
          commit(
            {
              ...data,
              projects: data.projects.filter((p) => p.id !== id),
              phases: data.phases.filter((ph) => ph.projectId !== id),
              milestones: data.milestones.filter((m) => m.projectId !== id),
              tasks: data.tasks
                .filter((t) => t.projectId !== id)
                .map((t) =>
                  t.dependsOn.some((d) => removed.has(d))
                    ? { ...t, dependsOn: t.dependsOn.filter((d) => !removed.has(d)) }
                    : t,
                ),
              // drop activity that pointed at the now-deleted project
              activity: data.activity.filter((a) => a.projectId !== id),
            },
            [evt('project_deleted', { summary: `Deleted project “${project.name}”` })],
          )
        },
      }
    },
    {
      name: 'timeline-store',
      version: SEED_VERSION,
      partialize: (s) => ({ data: s.data, currentUserId: s.currentUserId, theme: s.theme }),
      migrate: (persisted, version) => {
        if (version !== SEED_VERSION) {
          const prev = persisted as { theme?: Theme } | undefined
          return { data: buildSeed(), currentUserId: 'm-durgesh', theme: prev?.theme ?? 'light' }
        }
        return persisted as { data: TimelineData; currentUserId: string; theme: Theme }
      },
    },
  ),
)

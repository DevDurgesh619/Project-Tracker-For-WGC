import type { ProjectStatus, TimelineData } from './types'
import { todayISO } from './utils'

/**
 * Recompute all derived fields after any change (or when seeding):
 *   task status → milestone.completedDate → phase.completedDate/startedDate → project.status.
 * Pure: takes the graph, returns a new graph. Shared by the store and the seed so
 * the initial data is already consistent (the store only recomputes on mutation).
 */
export function recompute(data: TimelineData): TimelineData {
  const today = todayISO()

  const milestones = data.milestones.map((m) => {
    const ts = data.tasks.filter((t) => t.milestoneId === m.id)
    const complete = ts.length > 0 && ts.every((t) => t.status === 'done')
    return { ...m, completedDate: complete ? m.completedDate ?? today : null }
  })

  const phases = data.phases.map((ph) => {
    const ms = milestones.filter((m) => m.phaseId === ph.id)
    const msIds = new Set(ms.map((m) => m.id))
    const phaseTasks = data.tasks.filter((t) => t.milestoneId && msIds.has(t.milestoneId))
    const started = phaseTasks.some((t) => t.startedAt || t.status !== 'todo')
    const complete = ms.length > 0 && ms.every((m) => m.completedDate)
    return {
      ...ph,
      startedDate: started ? ph.startedDate ?? today : ph.startedDate,
      completedDate: complete ? ph.completedDate ?? today : null,
    }
  })

  const projects = data.projects.map((p) => {
    if (p.isHistorical) return p
    const phs = phases.filter((x) => x.projectId === p.id)
    const projTasks = data.tasks.filter((t) => t.projectId === p.id)
    const blocking = projTasks.some((t) => t.blocker?.blocksCompletion && t.status !== 'done')
    const allPhasesDone = phs.length > 0 && phs.every((x) => x.completedDate)
    let status: ProjectStatus
    let completedDate = p.completedDate
    if (allPhasesDone) {
      status = 'completed'
      completedDate = p.completedDate ?? today
    } else {
      completedDate = null
      if (blocking) status = 'blocked'
      else if (projTasks.some((t) => t.status !== 'todo')) status = 'active'
      else status = 'planning'
    }
    return { ...p, status, completedDate }
  })

  return { ...data, milestones, phases, projects }
}

// Derived reads. Keep computation here (not inline in components) so deadline
// colour, durations, roll-ups, and "where we reached" stay consistent. See CLAUDE.md.
import type {
  ActivityEvent,
  DeadlineState,
  Member,
  Milestone,
  Phase,
  Project,
  RollupStatus,
  Task,
  TimelineData,
} from './types'
import { daysFromToday, durationHours, pct, totalDays } from './utils'

/** 🔴 overdue / 🟡 due soon / 🟢 comfortable. Done or no-due → 'none'. */
export function deadlineStatus(task: Task): DeadlineState {
  if (task.status === 'done' || !task.dueDate) return 'none'
  const days = daysFromToday(task.dueDate)
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days <= 3) return 'due_soon'
  return 'comfortable'
}

export function isOverdue(task: Task): boolean {
  return deadlineStatus(task) === 'overdue'
}

export function isActiveStatus(status: Task['status']): boolean {
  return status !== 'done'
}

export function taskDurationHours(task: Task): number | null {
  return durationHours(task.startedAt, task.completedAt)
}

// ── Hierarchy lookups ─────────────────────────────────────────────────────────
export function phasesForProject(data: TimelineData, projectId: string): Phase[] {
  return data.phases
    .filter((p) => p.projectId === projectId)
    .sort((a, b) => a.order - b.order)
}

export function milestonesForPhase(data: TimelineData, phaseId: string): Milestone[] {
  return data.milestones
    .filter((m) => m.phaseId === phaseId)
    .sort((a, b) => a.order - b.order)
}

export function milestonesForProject(data: TimelineData, projectId: string): Milestone[] {
  return data.milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.order - b.order)
}

export function tasksForProject(data: TimelineData, projectId: string): Task[] {
  return data.tasks.filter((t) => t.projectId === projectId)
}

export function tasksForMilestone(data: TimelineData, milestoneId: string): Task[] {
  return data.tasks.filter((t) => t.milestoneId === milestoneId)
}

export function tasksForPhase(data: TimelineData, phaseId: string): Task[] {
  const ms = new Set(milestonesForPhase(data, phaseId).map((m) => m.id))
  return data.tasks.filter((t) => t.milestoneId && ms.has(t.milestoneId))
}

// ── Roll-up status (Task → Milestone → Phase) ─────────────────────────────────
export function rollupOf(tasks: Task[]): RollupStatus {
  if (tasks.length === 0) return 'todo'
  if (tasks.every((t) => t.status === 'done')) return 'done'
  if (tasks.some((t) => t.status === 'blocked')) return 'blocked'
  if (tasks.some((t) => t.status !== 'todo')) return 'in_progress'
  return 'todo'
}

export interface Progress {
  done: number
  total: number
  percent: number
  status: RollupStatus
}

function progressOf(tasks: Task[]): Progress {
  const done = tasks.filter((t) => t.status === 'done').length
  return { done, total: tasks.length, percent: pct(done, tasks.length), status: rollupOf(tasks) }
}

export function milestoneProgress(data: TimelineData, milestone: Milestone): Progress {
  return progressOf(tasksForMilestone(data, milestone.id))
}

export function phaseProgress(data: TimelineData, phase: Phase): Progress {
  return progressOf(tasksForPhase(data, phase.id))
}

/** Phase status derived from its milestones' statuses (matches the mental model). */
export function phaseStatus(data: TimelineData, phase: Phase): RollupStatus {
  const ms = milestonesForPhase(data, phase.id)
  if (ms.length === 0) return 'todo'
  const statuses = ms.map((m) => milestoneProgress(data, m).status)
  if (statuses.every((s) => s === 'done')) return 'done'
  if (statuses.some((s) => s === 'blocked')) return 'blocked'
  if (statuses.some((s) => s !== 'todo')) return 'in_progress'
  return 'todo'
}

/** The first phase that isn't done — i.e. what the project is working on now. */
export function currentPhase(data: TimelineData, project: Project): Phase | null {
  const phases = phasesForProject(data, project.id)
  return phases.find((p) => phaseStatus(data, p) !== 'done') ?? null
}

// ── Project rollups ──────────────────────────────────────────────────────────
export interface ProjectStats {
  total: number
  done: number
  remaining: number
  delayed: number
  blocked: number
  percent: number
  totalDays: number
  /** any task with a completion-blocking blocker */
  isBlockingCompletion: boolean
}

export function projectStats(data: TimelineData, project: Project): ProjectStats {
  const tasks = tasksForProject(data, project.id)
  const done = tasks.filter((t) => t.status === 'done').length
  const delayed = tasks.filter(
    (t) => t.status === 'delayed' || (isActiveStatus(t.status) && isOverdue(t)),
  ).length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  return {
    total: tasks.length,
    done,
    remaining: tasks.length - done,
    delayed,
    blocked,
    percent: pct(done, tasks.length),
    totalDays: totalDays(project.startDate, project.completedDate),
    isBlockingCompletion: tasks.some(
      (t) => t.blocker?.blocksCompletion && t.status !== 'done',
    ),
  }
}

// ── Global dashboard stats ───────────────────────────────────────────────────
export interface DashboardStats {
  done: number
  pending: number
  today: number
  completed: number
  blocked: number
  urgent: number
  overallPercent: number
}

function isToday(dateISO: string | null): boolean {
  if (!dateISO) return false
  return daysFromToday(dateISO) === 0
}

export function dashboardStats(data: TimelineData): DashboardStats {
  const tasks = data.tasks
  const done = tasks.filter((t) => t.status === 'done').length
  const pending = tasks.filter((t) => isActiveStatus(t.status)).length
  const today = tasks.filter(
    (t) => isActiveStatus(t.status) && (isToday(t.dueDate) || isToday(t.scheduledFor)),
  ).length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  const urgent = tasks.filter(
    (t) => t.priority === 'urgent' && isActiveStatus(t.status),
  ).length
  const active = data.projects.filter((p) => !p.isHistorical)
  const percents = active.map((p) => projectStats(data, p).percent)
  const overallPercent = percents.length
    ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
    : 0
  return { done, pending, today, completed: done, blocked, urgent, overallPercent }
}

/** Blocked + urgent tasks, most pressing first — the dashboard headline. */
export function attentionTasks(data: TimelineData): Task[] {
  return data.tasks
    .filter(
      (t) =>
        isActiveStatus(t.status) &&
        (t.status === 'blocked' || t.priority === 'urgent' || isOverdue(t)),
    )
    .sort((a, b) => attentionScore(b) - attentionScore(a))
}

function attentionScore(t: Task): number {
  let s = 0
  if (t.blocker?.blocksCompletion) s += 100
  if (t.priority === 'urgent') s += 50
  if (t.status === 'blocked') s += 30
  if (isOverdue(t)) s += 20
  return s
}

export function todaysTasks(data: TimelineData): Task[] {
  return data.tasks.filter(
    (t) => isActiveStatus(t.status) && (isToday(t.dueDate) || isToday(t.scheduledFor)),
  )
}

/** Tasks with a pending deadline-change request — the admin's approval inbox. */
export function pendingChangeRequests(data: TimelineData): Task[] {
  return data.tasks
    .filter((t) => t.changeRequest?.status === 'pending')
    .sort((a, b) =>
      (b.changeRequest?.createdAt ?? '').localeCompare(a.changeRequest?.createdAt ?? ''),
    )
}

/** Tasks planned (scheduledFor) or due within an inclusive date range. */
export function plannerTasks(
  data: TimelineData,
  fromISO: string,
  toISO: string,
): Task[] {
  return data.tasks.filter((t) => {
    const d = t.scheduledFor ?? t.dueDate
    return d !== null && d >= fromISO && d <= toISO
  })
}

// ── Lookups ──────────────────────────────────────────────────────────────────
export function memberById(data: TimelineData, id: string): Member | undefined {
  return data.members.find((m) => m.id === id)
}

export function projectById(data: TimelineData, id: string): Project | undefined {
  return data.projects.find((p) => p.id === id)
}

export function tasksForMember(data: TimelineData, memberId: string): Task[] {
  return data.tasks.filter((t) => t.assigneeId === memberId)
}

/** Owner or "also involved". */
export function isInvolved(task: Task, memberId: string): boolean {
  return task.assigneeId === memberId || task.participantIds.includes(memberId)
}

/** Tasks a member owns OR is involved in. */
export function tasksInvolvingMember(data: TimelineData, memberId: string): Task[] {
  return data.tasks.filter((t) => isInvolved(t, memberId))
}

/** Everyone on a task — owner first, then the others involved. */
export function involvedMembers(data: TimelineData, task: Task): Member[] {
  const ids = [task.assigneeId, ...task.participantIds]
  return ids.map((id) => memberById(data, id)).filter(Boolean) as Member[]
}

export function taskById(data: TimelineData, id: string): Task | undefined {
  return data.tasks.find((t) => t.id === id)
}

// ── Activity feed ─────────────────────────────────────────────────────────────
export function activityFeed(data: TimelineData): ActivityEvent[] {
  return [...data.activity].sort((a, b) => b.at.localeCompare(a.at))
}

export function activityForProject(data: TimelineData, projectId: string): ActivityEvent[] {
  return activityFeed(data).filter((e) => e.projectId === projectId)
}

export function activitySince(data: TimelineData, sinceISO: string): ActivityEvent[] {
  return activityFeed(data).filter((e) => e.at >= sinceISO)
}

// ── Dependencies ──────────────────────────────────────────────────────────────
/** The tasks this one waits on (its predecessors). */
export function blockedBy(data: TimelineData, task: Task): Task[] {
  return task.dependsOn.map((id) => taskById(data, id)).filter(Boolean) as Task[]
}

/** The tasks that wait on this one (its dependents). */
export function blocksTasks(data: TimelineData, task: Task): Task[] {
  return data.tasks.filter((t) => t.dependsOn.includes(task.id))
}

/** True if any predecessor isn't done yet. */
export function hasOpenPredecessor(data: TimelineData, task: Task): boolean {
  return blockedBy(data, task).some((p) => p.status !== 'done')
}

// ── My Day (per current user) ────────────────────────────────────────────────
function isTodayD(dateISO: string | null): boolean {
  return dateISO ? daysFromToday(dateISO) === 0 : false
}

export interface MyDay {
  focus: Task[]
  overdue: Task[]
  startsToday: Task[]
  waitingOnMe: Task[]
  recentlyDone: Task[]
}

export function myDay(data: TimelineData, memberId: string, sinceISO: string): MyDay {
  const mine = data.tasks.filter((t) => isInvolved(t, memberId))
  return {
    focus: mine.filter(
      (t) => isActiveStatus(t.status) && (isTodayD(t.dueDate) || isTodayD(t.scheduledFor)),
    ),
    overdue: mine.filter((t) => isActiveStatus(t.status) && isOverdue(t)),
    startsToday: mine.filter((t) => isActiveStatus(t.status) && isTodayD(t.scheduledFor) && !t.startedAt),
    // tasks (anyone's) where someone is waiting on me
    waitingOnMe: data.tasks.filter(
      (t) => isActiveStatus(t.status) && t.blocker?.waitingOnId === memberId,
    ),
    recentlyDone: mine
      .filter((t) => t.status === 'done' && t.completedAt && t.completedAt >= sinceISO)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
  }
}

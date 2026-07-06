// Domain model for Timeline. See docs/DATA_MODEL.md.
// Dates are ISO strings (date-only "YYYY-MM-DD" or full ISO datetime, noted per field).
//
// Hierarchy:  Project ─< Phase ─< Milestone ─< Task
//   Phase     = lifecycle stage (prototype → testing → pilot → feedback → refine → shipped)
//   Milestone = a named group of tasks; "done" when all its tasks are done
//   A phase is "done" when all its milestones are done; project ships when all phases are done.

export type Role = 'admin' | 'member'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'delayed' | 'done'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export type Recurrence = 'none' | 'daily' | 'weekly'

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'blocked'
  | 'on_hold'
  | 'completed'

/** Lifecycle phases. Order is the natural progression. */
export type PhaseKind =
  | 'prototype'
  | 'testing'
  | 'pilot'
  | 'feedback'
  | 'refine'
  | 'shipped'

/** Derived roll-up status shared by milestones and phases. */
export type RollupStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

/** Derived, never stored — computed by selectors.deadlineStatus(). */
export type DeadlineState = 'overdue' | 'due_soon' | 'comfortable' | 'none'

export type NoteKind = 'comment' | 'delay_reason' | 'status' | 'completion'

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export type ActivityKind =
  | 'project_created'
  | 'project_shipped'
  | 'project_deleted'
  | 'phase_added'
  | 'phase_completed'
  | 'phase_deleted'
  | 'milestone_added'
  | 'milestone_completed'
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_blocked'
  | 'task_unblocked'
  | 'task_escalated'
  | 'task_rescheduled'
  | 'task_autoshifted'
  | 'change_requested'
  | 'change_approved'
  | 'change_rejected'

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  /** hex used for the avatar chip */
  avatarColor: string
  title?: string
}

export interface Note {
  id: string
  authorId: string
  body: string
  /** ISO datetime */
  createdAt: string
  kind: NoteKind
}

export interface Blocker {
  reason: string
  /** if true, this blocker holds up the whole project's completion */
  blocksCompletion: boolean
  raisedById: string
  /** ISO datetime */
  raisedAt: string
  /** Member the task is waiting on, if any */
  waitingOnId: string | null
}

/** A member's request to move a task's deadline; admin approves → auto-applied. */
export interface ChangeRequest {
  id: string
  taskId: string
  requestedById: string
  currentDueDate: string | null
  requestedDueDate: string
  justification: string
  status: ChangeRequestStatus
  decidedById: string | null
  /** ISO datetime */
  decidedAt: string | null
  decisionNote: string | null
  /** ISO datetime */
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  /** milestone this task belongs to (null = unsorted / general) */
  milestoneId: string | null
  title: string
  description: string
  /** the accountable owner */
  assigneeId: string
  /** others also involved (meeting attendees, shared todos) — not accountable */
  participantIds: string[]
  status: TaskStatus
  priority: Priority
  /** ISO date */
  createdDate: string
  /** ISO date | null — when the work is planned to begin (future tasks) */
  scheduledFor: string | null
  /** ISO date | null */
  dueDate: string | null
  /** first due date, preserved when a task is delayed */
  originalDueDate: string | null
  /** planned effort in hours (your estimate) — compared against actual duration */
  estimateHours: number | null
  /** repeats so you don't re-add daily work by hand */
  recurrence: Recurrence
  /** ISO datetime | null — set when work starts */
  startedAt: string | null
  /** ISO datetime | null — set when completed */
  completedAt: string | null
  /** what was actually done, captured at completion */
  completionNote: string | null
  /** ISO datetime | null — set when escalated to urgent */
  escalatedAt: string | null
  blocker: Blocker | null
  /** active/last deadline-change request */
  changeRequest: ChangeRequest | null
  /** task ids that must finish before this one (drives dependency auto-shift) */
  dependsOn: string[]
  notes: Note[]
}

/** Append-only audit/timeline event — powers the Activity feed and My Day. */
export interface ActivityEvent {
  id: string
  /** ISO datetime */
  at: string
  actorId: string
  kind: ActivityKind
  projectId: string | null
  taskId: string | null
  milestoneId?: string | null
  phaseId?: string | null
  summary: string
  detail?: string | null
}

export interface Milestone {
  id: string
  projectId: string
  phaseId: string
  label: string
  order: number
  /** ISO date | null — optional target for this milestone */
  targetDate: string | null
  /** ISO date | null — set when all its tasks complete */
  completedDate: string | null
}

export interface Phase {
  id: string
  projectId: string
  kind: PhaseKind
  label: string
  order: number
  /** ISO date | null */
  startedDate: string | null
  /** ISO date | null — set when all its milestones complete */
  completedDate: string | null
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  /** ISO date */
  startDate: string
  /** ISO date | null */
  deadline: string | null
  /** ISO date | null — when the whole lifecycle shipped */
  completedDate: string | null
  ownerId: string
  memberIds: string[]
  workingLink: string | null
  /** accent hex shared across cards/timeline */
  color: string
  /** backfilled "old work" so the team sees past projects */
  isHistorical: boolean
}

/** Full persisted graph. */
export interface TimelineData {
  members: Member[]
  projects: Project[]
  phases: Phase[]
  milestones: Milestone[]
  tasks: Task[]
  activity: ActivityEvent[]
  /** Version of the bundled authoritative seed this graph was built from.
   *  Used by cloud sync to detect when the app ships newer canonical data. */
  seedVersion?: number
}

/** Default ordered lifecycle used when advancing a project. */
export const PHASE_SEQUENCE: PhaseKind[] = [
  'prototype',
  'testing',
  'pilot',
  'feedback',
  'refine',
  'shipped',
]

export const PHASE_LABEL: Record<PhaseKind, string> = {
  prototype: 'Prototype',
  testing: 'Testing',
  pilot: 'Pilot',
  feedback: 'Feedback',
  refine: 'Refine',
  shipped: 'Shipped',
}

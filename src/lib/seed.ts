import type {
  ActivityEvent,
  ActivityKind,
  Member,
  Milestone,
  Phase,
  Project,
  Task,
  TimelineData,
} from './types'
import { recompute } from './rollup'
import { todayISO } from './utils'

// ─────────────────────────────────────────────────────────────────────────────
// REAL project data, extracted from Durgesh's notebook (May–Jul 2026).
// Past work is logged as `done` tasks dated to the day it happened (fills the
// Timeline + Activity feed); current stuck points are `blocked` tasks so they're
// loud. Roll-ups (milestone/phase/project status) are derived by recompute().
// ─────────────────────────────────────────────────────────────────────────────

// ── Team ─────────────────────────────────────────────────────────────────────
const members: Member[] = [
  { id: 'm-durgesh', name: 'Durgesh', email: 'durgesh@team.dev', role: 'admin', avatarColor: '#4f46e5', title: 'Full-stack · Product · DevOps' },
  { id: 'm-prashant', name: 'Prashant Bhaiya', email: 'prashant@team.dev', role: 'admin', avatarColor: '#db2777', title: 'Mentor · Strategy' },
  { id: 'm-vivek', name: 'Vivek', email: 'vivek@team.dev', role: 'member', avatarColor: '#0891b2', title: 'Developer · English App' },
  { id: 'm-himanshi', name: 'Himanshi', email: 'himanshi@team.dev', role: 'member', avatarColor: '#7c3aed', title: 'Counsellor · Ops' },
  { id: 'm-heather', name: 'Heather', email: 'heather@team.dev', role: 'member', avatarColor: '#ea580c', title: 'Senior Counsellor · Reviews' },
  { id: 'm-mehak', name: 'Mehak Jain', email: 'mehak@team.dev', role: 'member', avatarColor: '#16a34a', title: 'Counsellor · Application Tracker' },
]

// ── Task factory ─────────────────────────────────────────────────────────────
type TaskSeed = Partial<Task> &
  Pick<Task, 'id' | 'projectId' | 'milestoneId' | 'title' | 'dueDate'>

function task(t: TaskSeed): Task {
  return {
    description: '',
    assigneeId: 'm-durgesh',
    participantIds: [],
    status: 'done',
    priority: 'normal',
    createdDate: t.dueDate ?? todayISO(),
    scheduledFor: null,
    originalDueDate: t.dueDate ?? null,
    estimateHours: null,
    recurrence: 'none',
    startedAt: null,
    completedAt: null,
    completionNote: null,
    escalatedAt: null,
    blocker: null,
    changeRequest: null,
    dependsOn: [],
    notes: [],
    ...t,
  }
}

/** Blocker helper for the "where we're stuck" tasks. */
function blocked(t: TaskSeed & { reason: string; waitingOnId?: string | null }): Task {
  const raisedAt = (t.dueDate ?? todayISO()) + 'T11:00:00.000Z'
  return task({
    ...t,
    status: 'blocked',
    priority: 'urgent',
    escalatedAt: raisedAt,
    blocker: {
      reason: t.reason,
      blocksCompletion: true,
      raisedById: 'm-durgesh',
      waitingOnId: t.waitingOnId ?? null,
      raisedAt,
    },
  })
}

// ── Projects ─────────────────────────────────────────────────────────────────
const projects: Project[] = [
  { id: 'p-esat', name: 'ESAT — Student Assessment App', description: 'Assessment / test-prep app for students with a Question Bank, question ranking and diagnostic. Built, deployed with auth, handed to Heather; now iterating on feedback.', status: 'active', startDate: '2026-05-09', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-heather', 'm-himanshi'], workingLink: null, color: '#4f46e5', isHistorical: false },
  { id: 'p-os', name: 'Counsellor OS Platform', description: 'Internal operating system for counsellors — smart intake, assessment, insight engine and dashboard (4 pillars). Built to ~80%, then put on hold.', status: 'blocked', startDate: '2026-05-06', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-prashant'], workingLink: null, color: '#0891b2', isHistorical: false },
  { id: 'p-web', name: 'Counselling Website Redesign', description: 'Full redesign of the public counselling website — new UI, content, and hosting on Hostinger. In final review / go-live.', status: 'active', startDate: '2026-05-23', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-heather'], workingLink: null, color: '#16a34a', isHistorical: false },
  { id: 'p-social', name: 'Social Media Automation', description: 'Auto-posting pipeline for Instagram / Facebook / LinkedIn with custom APIs. Backend built and tested; blocked on account credentials.', status: 'blocked', startDate: '2026-06-02', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-prashant'], workingLink: null, color: '#d97706', isHistorical: false },
  { id: 'p-vocab', name: 'Vocabulary App', description: 'Vocabulary-building app for current students — 5000 words + assessment, counsellor/admin dashboard. Live; iterating on feedback.', status: 'active', startDate: '2026-06-07', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-prashant', 'm-heather'], workingLink: null, color: '#7c3aed', isHistorical: false },
  { id: 'p-eng', name: 'English App', description: 'CEFR-based English learning app — diagnosis, lesson plans, writing/reading evaluators. Built with Vivek; now working toward V2.', status: 'active', startDate: '2026-06-11', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-vivek', 'm-prashant'], workingLink: null, color: '#db2777', isHistorical: false },
  { id: 'p-crm', name: 'Zoho CRM Integration', description: 'Set up Zoho CRM for the counselling business — schema, lead flows, follow-ups, Zoho Books. Blocked on the real student data sheet.', status: 'blocked', startDate: '2026-06-08', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-prashant', 'm-himanshi', 'm-heather'], workingLink: null, color: '#2563eb', isHistorical: false },
  { id: 'p-apptracker', name: 'College Application Tracker', description: 'Tracker for students’ college applications (from Mehak’s data) — universities, essays, onboarding, safe data pipeline. Nearly complete; blocked on data verification.', status: 'blocked', startDate: '2026-06-13', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-mehak', 'm-heather'], workingLink: null, color: '#0d9488', isHistorical: false },
  { id: 'p-pm', name: 'Project Management App', description: 'This tool — a project & task timeline for the team (Phase → Milestone → Task, blockers, deadlines, approvals). Built from scratch, now loaded with real project data and handed to Prashant for review.', status: 'active', startDate: '2026-06-22', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh', 'm-prashant'], workingLink: 'https://project-tracker-for-wgc.vercel.app', color: '#9333ea', isHistorical: false },
  { id: 'p-general', name: 'General', description: 'Ad-hoc tasks, planning and notes not tied to a specific project.', status: 'active', startDate: '2026-07-05', deadline: null, completedDate: null, ownerId: 'm-durgesh', memberIds: ['m-durgesh'], workingLink: null, color: '#64748b', isHistorical: false },
]

// ── Phases (startedDate/completedDate pre-set so history dates are accurate) ──
const phases: Phase[] = [
  { id: 'ph-esat-proto', projectId: 'p-esat', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-05-09', completedDate: '2026-05-28' },
  { id: 'ph-esat-fb', projectId: 'p-esat', kind: 'feedback', label: 'Feedback', order: 1, startedDate: '2026-06-05', completedDate: null },

  { id: 'ph-os-proto', projectId: 'p-os', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-05-06', completedDate: null },

  { id: 'ph-web-proto', projectId: 'p-web', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-05-23', completedDate: '2026-06-07' },
  { id: 'ph-web-fb', projectId: 'p-web', kind: 'feedback', label: 'Feedback', order: 1, startedDate: '2026-06-02', completedDate: null },

  { id: 'ph-social-proto', projectId: 'p-social', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-02', completedDate: null },

  { id: 'ph-vocab-proto', projectId: 'p-vocab', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-07', completedDate: '2026-06-11' },
  { id: 'ph-vocab-fb', projectId: 'p-vocab', kind: 'feedback', label: 'Feedback', order: 1, startedDate: '2026-07-01', completedDate: null },

  { id: 'ph-eng-proto', projectId: 'p-eng', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-11', completedDate: '2026-06-26' },
  { id: 'ph-eng-refine', projectId: 'p-eng', kind: 'refine', label: 'Refine', order: 1, startedDate: '2026-06-23', completedDate: null },

  { id: 'ph-crm-proto', projectId: 'p-crm', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-08', completedDate: null },

  { id: 'ph-at-proto', projectId: 'p-apptracker', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-13', completedDate: null },

  { id: 'ph-pm-proto', projectId: 'p-pm', kind: 'prototype', label: 'Prototype', order: 0, startedDate: '2026-06-22', completedDate: '2026-06-26' },
  { id: 'ph-pm-fb', projectId: 'p-pm', kind: 'feedback', label: 'Feedback', order: 1, startedDate: '2026-06-30', completedDate: null },
]

// ── Milestones ───────────────────────────────────────────────────────────────
const milestones: Milestone[] = [
  // ESAT
  { id: 'ms-esat-build', projectId: 'p-esat', phaseId: 'ph-esat-proto', label: 'Build', order: 0, targetDate: '2026-05-26', completedDate: '2026-05-26' },
  { id: 'ms-esat-deploy', projectId: 'p-esat', phaseId: 'ph-esat-proto', label: 'Deploy & Handover', order: 1, targetDate: '2026-05-28', completedDate: '2026-05-28' },
  { id: 'ms-esat-fb', projectId: 'p-esat', phaseId: 'ph-esat-fb', label: 'Feedback & Iteration', order: 0, targetDate: null, completedDate: null },
  // OS
  { id: 'ms-os-plan', projectId: 'p-os', phaseId: 'ph-os-proto', label: 'Discovery & Specs', order: 0, targetDate: '2026-05-11', completedDate: '2026-05-11' },
  { id: 'ms-os-build', projectId: 'p-os', phaseId: 'ph-os-proto', label: 'Build', order: 1, targetDate: '2026-05-20', completedDate: null },
  // Website
  { id: 'ms-web-build', projectId: 'p-web', phaseId: 'ph-web-proto', label: 'Build pages', order: 0, targetDate: '2026-06-07', completedDate: '2026-06-07' },
  { id: 'ms-web-content', projectId: 'p-web', phaseId: 'ph-web-fb', label: 'Content & Review', order: 0, targetDate: '2026-06-20', completedDate: null },
  { id: 'ms-web-golive', projectId: 'p-web', phaseId: 'ph-web-fb', label: 'Go-live', order: 1, targetDate: '2026-07-03', completedDate: null },
  // Social
  { id: 'ms-social-build', projectId: 'p-social', phaseId: 'ph-social-proto', label: 'Build & Test', order: 0, targetDate: '2026-06-09', completedDate: null },
  // Vocab
  { id: 'ms-vocab-build', projectId: 'p-vocab', phaseId: 'ph-vocab-proto', label: 'Build & Launch', order: 0, targetDate: '2026-06-11', completedDate: '2026-06-11' },
  { id: 'ms-vocab-fb', projectId: 'p-vocab', phaseId: 'ph-vocab-fb', label: 'Feedback & Iteration', order: 0, targetDate: null, completedDate: null },
  // English
  { id: 'ms-eng-research', projectId: 'p-eng', phaseId: 'ph-eng-proto', label: 'Research & Specs', order: 0, targetDate: '2026-06-16', completedDate: '2026-06-16' },
  { id: 'ms-eng-build', projectId: 'p-eng', phaseId: 'ph-eng-proto', label: 'Build prototype', order: 1, targetDate: '2026-06-26', completedDate: '2026-06-26' },
  { id: 'ms-eng-v2', projectId: 'p-eng', phaseId: 'ph-eng-refine', label: 'Toward V2', order: 0, targetDate: null, completedDate: null },
  // CRM
  { id: 'ms-crm-plan', projectId: 'p-crm', phaseId: 'ph-crm-proto', label: 'Discovery', order: 0, targetDate: '2026-06-11', completedDate: '2026-06-11' },
  { id: 'ms-crm-build', projectId: 'p-crm', phaseId: 'ph-crm-proto', label: 'Build', order: 1, targetDate: '2026-06-19', completedDate: null },
  // Application Tracker
  { id: 'ms-at-build', projectId: 'p-apptracker', phaseId: 'ph-at-proto', label: 'Build', order: 0, targetDate: '2026-06-20', completedDate: null },
  { id: 'ms-at-data', projectId: 'p-apptracker', phaseId: 'ph-at-proto', label: 'Data & Versioning', order: 1, targetDate: '2026-06-21', completedDate: null },
  // Project Management App (this tool)
  { id: 'ms-pm-proto', projectId: 'p-pm', phaseId: 'ph-pm-proto', label: 'Ideate & build prototype', order: 0, targetDate: '2026-06-26', completedDate: '2026-06-26' },
  { id: 'ms-pm-data', projectId: 'p-pm', phaseId: 'ph-pm-fb', label: 'Load real project data', order: 0, targetDate: null, completedDate: null },
]

// ── Tasks ────────────────────────────────────────────────────────────────────
const tasks: Task[] = [
  // ═══ ESAT ═══
  task({ id: 't-esat-1', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Research ESAT & create build plan', dueDate: '2026-05-09' }),
  task({ id: 't-esat-2', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Prepare ESAT documentation', dueDate: '2026-05-10' }),
  task({ id: 't-esat-3', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Half-build ESAT', dueDate: '2026-05-11' }),
  task({ id: 't-esat-4', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Simple build complete (without Question Bank)', dueDate: '2026-05-12' }),
  task({ id: 't-esat-5', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Strategy for Question Rank', dueDate: '2026-05-13' }),
  task({ id: 't-esat-6', projectId: 'p-esat', milestoneId: 'ms-esat-build', title: 'Working with the real Question Bank', dueDate: '2026-05-26' }),
  task({ id: 't-esat-7', projectId: 'p-esat', milestoneId: 'ms-esat-deploy', title: 'Deploy ESAT (auth + admin panel)', dueDate: '2026-05-22' }),
  task({ id: 't-esat-8', projectId: 'p-esat', milestoneId: 'ms-esat-deploy', title: 'Handover ESAT to Heather', dueDate: '2026-05-28', participantIds: ['m-heather'], completionNote: 'Handover done.' }),
  task({ id: 't-esat-9', projectId: 'p-esat', milestoneId: 'ms-esat-fb', title: 'Feedback from Heather on ESAT', dueDate: '2026-06-05' }),
  task({ id: 't-esat-10', projectId: 'p-esat', milestoneId: 'ms-esat-fb', title: 'Corrections from feedback', dueDate: '2026-06-09' }),
  task({ id: 't-esat-11', projectId: 'p-esat', milestoneId: 'ms-esat-fb', title: 'More feedback done + added diagnostic on main page (M1 + optional subjects)', dueDate: '2026-06-16' }),
  task({ id: 't-esat-12', projectId: 'p-esat', milestoneId: 'ms-esat-fb', title: 'Question Bank correction + take SC for ENSAA/NSAA', description: 'Himanshi to finalize the Question Bank correction and complete the SC content for ENSAA and NSAA.', assigneeId: 'm-himanshi', status: 'in_progress', dueDate: '2026-05-18' }),

  // ═══ Counsellor OS Platform ═══
  task({ id: 't-os-1', projectId: 'p-os', milestoneId: 'ms-os-plan', title: 'Discuss OS platform idea with Prashant Bhaiya', dueDate: '2026-05-06', participantIds: ['m-prashant'] }),
  task({ id: 't-os-2', projectId: 'p-os', milestoneId: 'ms-os-plan', title: 'Requirement docs: smart intake, assessment, insight engine, 4 pillars', dueDate: '2026-05-07' }),
  task({ id: 't-os-3', projectId: 'p-os', milestoneId: 'ms-os-plan', title: 'Gap analysis + daily-capture doc', dueDate: '2026-05-09' }),
  task({ id: 't-os-4', projectId: 'p-os', milestoneId: 'ms-os-plan', title: 'Define core pipeline + dashboard features & functionality', dueDate: '2026-05-11' }),
  task({ id: 't-os-5', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'Check MCP integration for Spinach in the OS platform', dueDate: '2026-05-12' }),
  task({ id: 't-os-6', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'OS build started (half done)', dueDate: '2026-05-13' }),
  task({ id: 't-os-7', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'OS build ~30%', dueDate: '2026-05-14' }),
  task({ id: 't-os-8', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'OS end-to-end build ~40%', dueDate: '2026-05-15' }),
  task({ id: 't-os-9', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'OS workflow check with real data (~40%)', dueDate: '2026-05-16' }),
  blocked({ id: 't-os-10', projectId: 'p-os', milestoneId: 'ms-os-build', title: 'Build stuck at 80% — need the Assessment module', description: 'On hold: to build the dynamic timetable we first need the Assessment module. Skill/build stuck at ~80%.', dueDate: '2026-05-20', reason: 'On hold — needs the Assessment module to build the dynamic timetable. Build stuck at ~80%.', waitingOnId: null }),

  // ═══ Website Redesign ═══
  task({ id: 't-web-1', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Review old website — what to remove / change', dueDate: '2026-05-23' }),
  task({ id: 't-web-2', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Start creating new website pages (UI)', dueDate: '2026-05-25' }),
  task({ id: 't-web-3', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Create main page + about section', dueDate: '2026-05-26' }),
  task({ id: 't-web-4', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Complete page designs (testimonials, contact, candidates, team)', dueDate: '2026-05-28' }),
  task({ id: 't-web-5', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Upload redesigned site to staging (local server) & review', dueDate: '2026-06-06' }),
  task({ id: 't-web-6', projectId: 'p-web', milestoneId: 'ms-web-build', title: 'Migrate staging design to the real website', dueDate: '2026-06-07' }),
  task({ id: 't-web-7', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Website redesign feedback + some changes', dueDate: '2026-06-02' }),
  task({ id: 't-web-8', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Heather reviewed content, flagged corrections', dueDate: '2026-06-08', participantIds: ['m-heather'] }),
  task({ id: 't-web-9', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Corrected pages (grammar + English)', dueDate: '2026-06-12' }),
  task({ id: 't-web-10', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Restore old testimonials from web archive; sent to Heather', dueDate: '2026-06-16' }),
  task({ id: 't-web-11', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Deploy all changes to staging; sent to Heather', dueDate: '2026-06-18' }),
  task({ id: 't-web-12', projectId: 'p-web', milestoneId: 'ms-web-content', title: 'Final website draft for review (corrections on local)', dueDate: '2026-06-20' }),
  task({ id: 't-web-13', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Learn to host the website on Hostinger', dueDate: '2026-06-03' }),
  task({ id: 't-web-14', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Take backup (download files); hosting learning complete', dueDate: '2026-06-04' }),
  task({ id: 't-web-15', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Press cards, nano-banana images, fix map-pin issue for final review', dueDate: '2026-07-01' }),
  task({ id: 't-web-17', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Press section: national → international, contact + successful-candidate page changes', dueDate: '2026-07-03' }),
  task({ id: 't-web-18', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Smaller content change on successful-candidate page (new cards)', dueDate: '2026-07-05' }),
  task({ id: 't-web-19', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Review Himanshi’s 2024-25 data — confirmed same content as old website', dueDate: '2026-07-05', participantIds: ['m-himanshi'] }),
  task({ id: 't-web-16', projectId: 'p-web', milestoneId: 'ms-web-golive', title: 'Final fixes meeting + deploy live on Hostinger', description: 'Final meet (11–12) to resolve remaining website confusion & issues, then deploy live on Hostinger.', status: 'in_progress', dueDate: '2026-07-03' }),

  // ═══ Social Media Automation ═══
  task({ id: 't-social-1', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Discuss the social media automation idea', dueDate: '2026-06-02' }),
  task({ id: 't-social-2', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Create PRD + research automation options', dueDate: '2026-06-05' }),
  task({ id: 't-social-3', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Create LinkedIn / Facebook / Insta dummy pages for testing', dueDate: '2026-06-06' }),
  task({ id: 't-social-4', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Build full backend with custom APIs (full control)', dueDate: '2026-06-07' }),
  task({ id: 't-social-5', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Test full automation pipeline (works for Insta + Facebook)', dueDate: '2026-06-08' }),
  task({ id: 't-social-6', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Prashant: provide Facebook & Instagram credentials + pages', description: 'Need the real Facebook/Instagram account credentials and pages so the automation can post to live accounts.', assigneeId: 'm-prashant', status: 'todo', priority: 'high', dueDate: '2026-06-09' }),
  blocked({ id: 't-social-7', projectId: 'p-social', milestoneId: 'ms-social-build', title: 'Blocked: no FB/IG credentials or page to run automation', dueDate: '2026-06-09', reason: 'Can’t get the Facebook credentials / Instagram page where the automation should run. Waiting on Prashant Bhaiya.', waitingOnId: 'm-prashant' }),

  // ═══ Vocabulary App ═══
  task({ id: 't-vocab-1', projectId: 'p-vocab', milestoneId: 'ms-vocab-build', title: 'Create plan for Vocabulary app', dueDate: '2026-06-07' }),
  task({ id: 't-vocab-2', projectId: 'p-vocab', milestoneId: 'ms-vocab-build', title: 'Deploy Vocab app live (5000 words + assessment)', dueDate: '2026-06-08' }),
  task({ id: 't-vocab-3', projectId: 'p-vocab', milestoneId: 'ms-vocab-build', title: 'Send Vocab app link to Prashant Bhaiya', dueDate: '2026-06-10', participantIds: ['m-prashant'] }),
  task({ id: 't-vocab-4', projectId: 'p-vocab', milestoneId: 'ms-vocab-build', title: 'Counsellor/Admin dashboard to change words to learn', dueDate: '2026-06-11' }),
  task({ id: 't-vocab-5', projectId: 'p-vocab', milestoneId: 'ms-vocab-fb', title: 'Add pronunciation, multiple meaning & usage, “I know” button', dueDate: '2026-07-01' }),
  task({ id: 't-vocab-6', projectId: 'p-vocab', milestoneId: 'ms-vocab-fb', title: 'Per-student word choice + counsellor insights (sessions, tests, gaps)', dueDate: '2026-07-02' }),
  task({ id: 't-vocab-8', projectId: 'p-vocab', milestoneId: 'ms-vocab-fb', title: 'Aditya-specific change — allow unlimited sessions in a day', dueDate: '2026-07-03' }),
  task({ id: 't-vocab-9', projectId: 'p-vocab', milestoneId: 'ms-vocab-fb', title: 'Fix “I know this” button + add counsellor-dashboard insights (session gaps, left-behind)', dueDate: '2026-07-04' }),
  task({ id: 't-vocab-7', projectId: 'p-vocab', milestoneId: 'ms-vocab-fb', title: 'On hold — still in feedback & changes phase', description: 'Collecting and applying feedback; iterating on changes.', status: 'in_progress', dueDate: '2026-07-02' }),

  // ═══ English App ═══
  task({ id: 't-eng-1', projectId: 'p-eng', milestoneId: 'ms-eng-research', title: 'Meet Vivek (1): read doc, define what to build', dueDate: '2026-06-11', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-2', projectId: 'p-eng', milestoneId: 'ms-eng-research', title: 'Research developer APIs for eng app; meet Vivek (2)', dueDate: '2026-06-14', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-3', projectId: 'p-eng', milestoneId: 'ms-eng-research', title: 'Read CEFR doc, extract key points, create milestones; meet Vivek (3)', dueDate: '2026-06-16', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-4', projectId: 'p-eng', milestoneId: 'ms-eng-build', title: 'Build basic diagnosis + assessment + lesson plan + loop workflows; Vivek (4)', dueDate: '2026-06-18', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-5', projectId: 'p-eng', milestoneId: 'ms-eng-build', title: 'Design UI (desktop + mobile); Vivek (5)', dueDate: '2026-06-20', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-6', projectId: 'p-eng', milestoneId: 'ms-eng-build', title: 'Test full onboarding, test & diagnosis flow, lesson plan; Vivek (6)', dueDate: '2026-06-22', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-7', projectId: 'p-eng', milestoneId: 'ms-eng-build', title: 'Writing evaluator + reading-comprehension evaluator docs (with Prashant)', dueDate: '2026-06-26', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-8', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Show prototype to Prashant; discuss good / improve / V2', dueDate: '2026-06-23', participantIds: ['m-vivek', 'm-prashant'] }),
  task({ id: 't-eng-9', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Competitive / market-analysis research for the English app (meet Prashant)', dueDate: '2026-06-24', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-13', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Create English-app deck (current prototype + market research + roadmap)', dueDate: '2026-06-24', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-10', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Create word-difficulty document (meet Prashant)', dueDate: '2026-06-25', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-14', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Explain word-difficulty doc to Vivek; plan V2 + build 5000-word difficulty/loop excel', dueDate: '2026-06-25', participantIds: ['m-vivek'] }),
  task({ id: 't-eng-11', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Organize all eng-app docs into a master doc (with Prashant)', dueDate: '2026-07-02', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-15', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Data review + final master document from all context (9–10 meet with Prashant)', dueDate: '2026-07-03', participantIds: ['m-prashant'] }),
  task({ id: 't-eng-12', projectId: 'p-eng', milestoneId: 'ms-eng-v2', title: 'Working on V2', description: 'Building the next version of the English app.', status: 'in_progress', dueDate: '2026-07-02' }),

  // ═══ Zoho CRM Integration ═══
  task({ id: 't-crm-1', projectId: 'p-crm', milestoneId: 'ms-crm-plan', title: 'Understand the idea & need of CRM integration', dueDate: '2026-06-08' }),
  task({ id: 't-crm-2', projectId: 'p-crm', milestoneId: 'ms-crm-plan', title: 'Understand requirements; interviews with Prashant & Heather', dueDate: '2026-06-10', participantIds: ['m-prashant', 'm-heather'] }),
  task({ id: 't-crm-3', projectId: 'p-crm', milestoneId: 'ms-crm-plan', title: 'Ask Himanshi about her process & pain points to automate', dueDate: '2026-06-11', participantIds: ['m-himanshi'] }),
  task({ id: 't-crm-4', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Create Student schema + 3 modules in Zoho (Lead, Contact, etc.)', dueDate: '2026-06-12' }),
  task({ id: 't-crm-5', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Build full Lead flow (start → end)', dueDate: '2026-06-13' }),
  task({ id: 't-crm-6', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Build follow-up flows + flagging + email messaging in Zoho', dueDate: '2026-06-14' }),
  task({ id: 't-crm-7', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Connect Zoho Books; folder creation; resumes → one source of truth', dueDate: '2026-06-18' }),
  task({ id: 't-crm-8', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Heather & Himanshi: prepare students Excel sheet in given schema', description: 'Need an Excel sheet of all students in the given schema so we can load real data into the CRM.', assigneeId: 'm-heather', participantIds: ['m-himanshi'], status: 'todo', priority: 'high', dueDate: '2026-06-19' }),
  blocked({ id: 't-crm-9', projectId: 'p-crm', milestoneId: 'ms-crm-build', title: 'Blocked: need the real student data sheet to go live', description: 'After this we can connect the CRM to the real website chatbot and test on a real client.', dueDate: '2026-06-19', reason: 'Need the Excel sheet of all students (given schema) from Heather & Himanshi before the CRM can hold real data.', waitingOnId: 'm-heather' }),

  // ═══ College Application Tracker ═══
  task({ id: 't-at-1', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Turn Mehak’s Excel into a static review dashboard', dueDate: '2026-06-13', participantIds: ['m-mehak'] }),
  task({ id: 't-at-2', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Understand data; validate Mehak’s university data vs official sources', dueDate: '2026-06-14' }),
  task({ id: 't-at-3', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Make dashboard editable for counsellor', dueDate: '2026-06-17' }),
  task({ id: 't-at-4', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Fetch more details per essay session; plan safe data ingestion', dueDate: '2026-06-18' }),
  task({ id: 't-at-5', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Safe human data-fetch + verification pipeline (scheduled + interval re-check)', dueDate: '2026-06-19' }),
  task({ id: 't-at-6', projectId: 'p-apptracker', milestoneId: 'ms-at-build', title: 'Multi-student onboarding + student essay-editing UI', dueDate: '2026-06-20' }),
  task({ id: 't-at-7', projectId: 'p-apptracker', milestoneId: 'ms-at-data', title: 'Add universities (LLM, MBA, UG) with official data + counsellor review/versioning', dueDate: '2026-06-21' }),
  blocked({ id: 't-at-8', projectId: 'p-apptracker', milestoneId: 'ms-at-data', title: 'Blocked: need someone to verify fetched university data', description: 'App is otherwise more or less complete; some refinement left after data is verified.', dueDate: '2026-06-21', reason: 'Need someone to verify the fetched university data and confirm it’s correct before putting it in the system.', waitingOnId: 'm-heather' }),

  // ═══ Project Management App (this tool) ═══
  task({ id: 't-pm-1', projectId: 'p-pm', milestoneId: 'ms-pm-proto', title: 'Ideation & planning for the project-management app', dueDate: '2026-06-22' }),
  task({ id: 't-pm-2', projectId: 'p-pm', milestoneId: 'ms-pm-proto', title: 'Start building the UI', dueDate: '2026-06-24' }),
  task({ id: 't-pm-3', projectId: 'p-pm', milestoneId: 'ms-pm-proto', title: 'Basic app prototype ready (look & feel; no real data yet)', dueDate: '2026-06-26' }),
  task({ id: 't-pm-4', projectId: 'p-pm', milestoneId: 'ms-pm-data', title: 'Start adding projects — Done / In-progress / day-wise tasks (~10%)', dueDate: '2026-06-30' }),
  task({ id: 't-pm-5', projectId: 'p-pm', milestoneId: 'ms-pm-data', title: 'Log & add the first 3 projects’ real data', dueDate: '2026-07-03' }),
  task({ id: 't-pm-6', projectId: 'p-pm', milestoneId: 'ms-pm-data', title: 'Add the remaining 5 projects’ real data', dueDate: '2026-07-05' }),
  task({ id: 't-pm-7', projectId: 'p-pm', milestoneId: 'ms-pm-data', title: 'Full app working with real data — handover to Prashant for review', description: 'Project-management app now runs on real project data; handing over to Prashant Bhaiya for review.', status: 'in_progress', dueDate: '2026-07-06', participantIds: ['m-prashant'] }),

  // ═══ General (tasks not tied to a specific project) ═══
  task({ id: 't-gen-1', projectId: 'p-general', milestoneId: null, title: 'Brainstorm with Claude: review work done so far, how to organize it, and set deadlines', dueDate: '2026-07-05' }),
]

// ── Auto-generate the Activity feed from the task/phase data ──────────────────
function mkEv(
  id: string,
  at: string,
  actorId: string,
  kind: ActivityKind,
  summary: string,
  ref: Partial<ActivityEvent> = {},
): ActivityEvent {
  return {
    id,
    at,
    actorId,
    kind,
    projectId: ref.projectId ?? null,
    taskId: ref.taskId ?? null,
    milestoneId: ref.milestoneId ?? null,
    phaseId: ref.phaseId ?? null,
    summary,
    detail: ref.detail ?? null,
  }
}

function generateActivity(d: TimelineData): ActivityEvent[] {
  const evs: ActivityEvent[] = []
  const ownerOf = (projectId: string) => d.projects.find((p) => p.id === projectId)?.ownerId ?? 'm-durgesh'
  for (const p of d.projects) {
    evs.push(mkEv('c-' + p.id, p.startDate + 'T09:00:00.000Z', p.ownerId, 'project_created', `Created project “${p.name}”`, { projectId: p.id }))
  }
  for (const ph of d.phases) {
    if (ph.completedDate)
      evs.push(mkEv('pc-' + ph.id, ph.completedDate + 'T18:00:00.000Z', ownerOf(ph.projectId), 'phase_completed', `${ph.label} phase completed`, { projectId: ph.projectId, phaseId: ph.id }))
  }
  for (const t of d.tasks) {
    if (t.status === 'done' && t.completedAt)
      evs.push(mkEv('td-' + t.id, t.completedAt, t.assigneeId, 'task_completed', `Completed “${t.title}”`, { projectId: t.projectId, taskId: t.id, detail: t.completionNote ?? null }))
    else if (t.status === 'blocked' && t.blocker)
      evs.push(mkEv('tb-' + t.id, t.blocker.raisedAt, t.blocker.raisedById, 'task_blocked', `Blocked “${t.title}”`, { projectId: t.projectId, taskId: t.id, detail: t.blocker.reason }))
  }
  return evs
}

/** Fill completedAt/startedAt for done tasks and startedAt for in-progress. */
function finalize(list: Task[]): Task[] {
  return list.map((t) => {
    if (t.status === 'done' && t.dueDate && !t.completedAt) {
      const at = t.dueDate + 'T13:00:00.000Z'
      return { ...t, startedAt: t.startedAt ?? at, completedAt: at }
    }
    if (t.status === 'in_progress' && !t.startedAt) {
      return { ...t, startedAt: (t.dueDate ?? todayISO()) + 'T10:00:00.000Z' }
    }
    return t
  })
}

export function buildSeed(): TimelineData {
  const base = recompute({ members, projects, phases, milestones, tasks: finalize(tasks), activity: [] })
  const activity = generateActivity(base)
  return JSON.parse(JSON.stringify({ ...base, activity, seedVersion: SEED_VERSION })) as TimelineData
}

export const SEED_VERSION = 7

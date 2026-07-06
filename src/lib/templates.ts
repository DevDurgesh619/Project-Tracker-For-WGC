// Reusable project templates — spin up a project pre-loaded with the milestones
// and starter tasks for work the team does repeatedly. Used by NewProjectModal +
// store.addProjectFromTemplate(). All templates seed a single Prototype phase;
// advance to Testing/Pilot/etc. from the project page.

export interface TemplateMilestone {
  key: string
  label: string
}

export interface TemplateTask {
  title: string
  milestone: string
  /** due date = project start + dueOffset days */
  dueOffset: number
  description?: string
}

export interface ProjectTemplate {
  id: string
  name: string
  tagline: string
  color: string
  milestones: TemplateMilestone[]
  tasks: TemplateTask[]
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    tagline: 'Discovery → design system → build → launch',
    color: '#4f46e5',
    milestones: [
      { key: 'discovery', label: 'Discovery & audit' },
      { key: 'design', label: 'Design system' },
      { key: 'build', label: 'Build pages' },
      { key: 'launch', label: 'Launch readiness' },
    ],
    tasks: [
      { title: 'Audit current site & gather requirements', milestone: 'discovery', dueOffset: 3 },
      { title: 'Define sitemap & content needs', milestone: 'discovery', dueOffset: 5 },
      { title: 'Design system: type, colour, components', milestone: 'design', dueOffset: 12 },
      { title: 'Build all pages (responsive)', milestone: 'build', dueOffset: 24 },
      { title: 'Verify & finalize all copy', milestone: 'launch', dueOffset: 28, description: 'Get founder sign-off on website text before deploy.' },
      { title: 'Set up deployment pipeline', milestone: 'launch', dueOffset: 30 },
    ],
  },
  {
    id: 'crm-integration',
    name: 'CRM Integration',
    tagline: 'Set up CRM, migrate data, automate',
    color: '#0891b2',
    milestones: [
      { key: 'setup', label: 'CRM setup' },
      { key: 'data', label: 'Data migration' },
      { key: 'automation', label: 'Automation & training' },
    ],
    tasks: [
      { title: 'Create account & configure modules', milestone: 'setup', dueOffset: 3 },
      { title: 'Configure pipeline stages & custom fields', milestone: 'setup', dueOffset: 6 },
      { title: 'Prepare cleaned historical data sheet', milestone: 'data', dueOffset: 9, description: 'Compile old records into the import template.' },
      { title: 'Build data import + field mapping', milestone: 'data', dueOffset: 12 },
      { title: 'Set up workflows & notifications', milestone: 'automation', dueOffset: 16 },
      { title: 'Train the team on the new CRM', milestone: 'automation', dueOffset: 18 },
    ],
  },
  {
    id: 'app-prototype',
    name: 'App Prototype',
    tagline: 'Specs → core flows → polish',
    color: '#16a34a',
    milestones: [
      { key: 'specs', label: 'Idea & specs' },
      { key: 'flows', label: 'Core flows' },
      { key: 'polish', label: 'Polish & demo' },
    ],
    tasks: [
      { title: 'Write feature list & user stories', milestone: 'specs', dueOffset: 3 },
      { title: 'Wireframes & approval', milestone: 'specs', dueOffset: 6 },
      { title: 'Build primary flow', milestone: 'flows', dueOffset: 12 },
      { title: 'Build secondary flows', milestone: 'flows', dueOffset: 18 },
      { title: 'Wire clickable prototype', milestone: 'polish', dueOffset: 22 },
      { title: 'Prepare founder demo', milestone: 'polish', dueOffset: 24 },
    ],
  },
  {
    id: 'content-engine',
    name: 'Content Engine',
    tagline: 'Plan → produce → publish',
    color: '#d97706',
    milestones: [
      { key: 'plan', label: 'Plan' },
      { key: 'produce', label: 'Production' },
      { key: 'publish', label: 'Publish & measure' },
    ],
    tasks: [
      { title: 'Keyword research & content plan', milestone: 'plan', dueOffset: 4 },
      { title: 'Draft first 3 articles', milestone: 'produce', dueOffset: 12 },
      { title: 'Edit & add visuals', milestone: 'produce', dueOffset: 16 },
      { title: 'Publish & set up analytics', milestone: 'publish', dueOffset: 20 },
    ],
  },
]

export function templateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

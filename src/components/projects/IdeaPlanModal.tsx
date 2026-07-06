import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Target, Wand2 } from 'lucide-react'
import { Badge, Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import type { ProjectTemplate } from '@/lib/templates'
import { todayISO } from '@/lib/utils'

interface Parsed {
  milestones: { key: string; label: string }[]
  tasks: { title: string; milestone: string; dueOffset: number }[]
}

/** Deterministic outline → plan. Headers (#, **bold**, or "label:") become
 *  milestones; other lines become tasks. Real AI generation arrives with the
 *  Supabase backend (server-side, so no API key in the browser). */
function parseOutline(text: string): Parsed {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const milestones: Parsed['milestones'] = []
  const tasks: Parsed['tasks'] = []
  let current: string | null = null
  let tcount = 0
  for (const line of lines) {
    const isHeader = /^#{1,}\s/.test(line) || /:\s*$/.test(line) || /^\*\*.*\*\*$/.test(line)
    if (isHeader) {
      const label = line.replace(/^#+\s*/, '').replace(/:\s*$/, '').replace(/\*\*/g, '').trim()
      const key = 'm' + milestones.length
      milestones.push({ key, label })
      current = key
    } else {
      const title = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim()
      if (!current) {
        current = 'm0'
        if (!milestones.some((m) => m.key === 'm0')) milestones.unshift({ key: 'm0', label: 'General' })
      }
      tasks.push({ title, milestone: current, dueOffset: 2 + tcount * 2 })
      tcount++
    }
  }
  return { milestones, tasks }
}

/** A neutral scaffold derived from the idea (heuristic placeholder for real AI). */
function suggestOutline(idea: string): string {
  const subject = idea.trim().split('\n')[0]?.slice(0, 60) || 'this'
  return [
    'Discovery & planning:',
    `- Clarify goals and scope for ${subject}`,
    '- List required features',
    'Build:',
    '- Build the core flow',
    '- Build secondary pieces',
    'Test & launch:',
    '- Review and test',
    '- Ship / hand off',
  ].join('\n')
}

export function IdeaPlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData()
  const navigate = useNavigate()
  const addProjectFromTemplate = useStore((s) => s.addProjectFromTemplate)

  const [name, setName] = useState('')
  const [idea, setIdea] = useState('')
  const [outline, setOutline] = useState('')
  const [ownerId, setOwnerId] = useState(data.members[0]?.id ?? '')

  const parsed = useMemo(() => parseOutline(outline), [outline])
  const canCreate = name.trim() && parsed.tasks.length > 0

  function create() {
    if (!canCreate) return
    const tpl: ProjectTemplate = {
      id: 'from-idea',
      name: name.trim(),
      tagline: idea.trim().slice(0, 120) || 'Drafted from an idea',
      color: '#7c3aed',
      milestones: parsed.milestones,
      tasks: parsed.tasks,
    }
    const id = addProjectFromTemplate(
      { name: name.trim(), description: idea.trim(), startDate: todayISO(), ownerId },
      tpl,
    )
    onClose()
    navigate(`/projects/${id}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--brand)]" /> New project from an idea
        </span>
      }
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={!canCreate}>
            Create project &amp; tasks
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Client referral program" />
        </Field>
        <Field label="Owner">
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="The idea" hint="Paste the founder's raw idea or your notes.">
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe what we want to build and why…" />
      </Field>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--muted)]">Outline → plan</span>
        <div className="flex gap-2">
          <Button size="sm" variant="subtle" onClick={() => setOutline(suggestOutline(idea))}>
            <Wand2 size={14} /> Suggest outline
          </Button>
          <Button size="sm" variant="ghost" disabled title="Arrives with the Supabase backend">
            <Sparkles size={14} /> Auto-plan with AI (soon)
          </Button>
        </div>
      </div>
      <Textarea
        value={outline}
        onChange={(e) => setOutline(e.target.value)}
        className="min-h-[140px] font-mono text-[13px]"
        placeholder={'Milestone headers end with “:” — lines under them become tasks.\n\nDiscovery:\n- Define scope\n- List features\nBuild:\n- Build core flow'}
      />

      {/* Live preview */}
      {parsed.tasks.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] p-3.5">
          <div className="text-[12px] font-semibold text-[var(--muted)] mb-2">
            Preview · {parsed.milestones.length} milestones · {parsed.tasks.length} tasks
          </div>
          <div className="space-y-2">
            {parsed.milestones.map((m) => (
              <div key={m.key}>
                <div className="flex items-center gap-1.5 text-[13px] font-medium">
                  <Target size={13} className="text-[var(--brand)]" /> {m.label}
                  <Badge tone="neutral">{parsed.tasks.filter((t) => t.milestone === m.key).length}</Badge>
                </div>
                <ul className="ml-5 mt-1 space-y-0.5">
                  {parsed.tasks
                    .filter((t) => t.milestone === m.key)
                    .map((t, i) => (
                      <li key={i} className="text-[12.5px] text-[var(--muted)]">• {t.title}</li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import { useData } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { TEMPLATES, templateById } from '@/lib/templates'
import { todayISO } from '@/lib/utils'

export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const data = useData()
  const navigate = useNavigate()
  const addProject = useStore((s) => s.addProject)
  const addProjectFromTemplate = useStore((s) => s.addProjectFromTemplate)

  const [templateId, setTemplateId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [deadline, setDeadline] = useState('')
  const [ownerId, setOwnerId] = useState(data.members[0]?.id ?? '')
  const [workingLink, setWorkingLink] = useState('')
  const [isHistorical, setIsHistorical] = useState(false)

  const canSave = name.trim() && startDate && ownerId

  function handleSave() {
    if (!canSave) return
    const input = {
      name: name.trim(),
      description: description.trim(),
      startDate,
      deadline: deadline || null,
      ownerId,
      workingLink: workingLink.trim() || null,
      isHistorical,
    }
    const tpl = templateId ? templateById(templateId) : undefined
    const id = tpl ? addProjectFromTemplate({ ...input, isHistorical: false }, tpl) : addProject(input)
    onClose()
    navigate(`/projects/${id}`)
  }

  return (
    <Modal
      key={open ? 'open' : 'closed'}
      open={open}
      onClose={onClose}
      title="New project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Create project
          </Button>
        </>
      }
    >
      <Field label="Start from" hint={templateId ? templateById(templateId)?.tagline : 'A template pre-loads milestones + starter tasks.'}>
        <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">Blank project</option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Project name">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Counselling App Prototype"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this product / piece of work?"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Started on">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Deadline">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
        <Field label="Working link">
          <Input
            value={workingLink}
            onChange={(e) => setWorkingLink(e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>
      <label className={`flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 cursor-pointer ${templateId ? 'hidden' : ''}`}>
        <input
          type="checkbox"
          checked={isHistorical}
          onChange={(e) => setIsHistorical(e.target.checked)}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        <span className="text-sm">
          <span className="font-medium">This is old / past work</span>
          <span className="block text-[13px] text-[var(--muted)]">
            Backfill a completed project so the team can see history.
          </span>
        </span>
      </label>
    </Modal>
  )
}

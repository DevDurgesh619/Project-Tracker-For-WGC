import { useEffect, useState } from 'react'
import { Check, Cloud, CloudOff, Loader2, LogIn, LogOut, Lock } from 'lucide-react'
import { Button, Field, Input, Modal } from '@/components/ui'
import { cloudEnabled, signIn, signOut, useCanEdit, useSession } from '@/lib/auth'
import { onSyncStatus, type SyncStatus } from '@/lib/sync'

export function CloudBar() {
  const canEdit = useCanEdit()
  const session = useSession()
  const [status, setStatus] = useState<SyncStatus>('off')
  const [showSignIn, setShowSignIn] = useState(false)

  useEffect(() => onSyncStatus(setStatus), [])

  if (!cloudEnabled) return null

  return (
    <div className="px-3 py-2 border-t border-[var(--border)]">
      <div className="flex items-center justify-between gap-2">
        <SyncPill status={status} canEdit={canEdit} />
        {canEdit ? (
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1 text-[12px] text-[var(--muted)] hover:text-[var(--text)]"
            title={session?.user?.email ?? undefined}
          >
            <LogOut size={13} /> Sign out
          </button>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--brand)] hover:underline"
          >
            <LogIn size={13} /> Sign in to edit
          </button>
        )}
      </div>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  )
}

function SyncPill({ status, canEdit }: { status: SyncStatus; canEdit: boolean }) {
  const map: Record<SyncStatus, { icon: typeof Cloud; label: string; color: string }> = {
    off: { icon: CloudOff, label: 'Local only', color: 'var(--faint)' },
    connecting: { icon: Loader2, label: 'Connecting…', color: 'var(--muted)' },
    synced: { icon: canEdit ? Check : Lock, label: canEdit ? 'Synced' : 'Live (view-only)', color: 'var(--ok)' },
    saving: { icon: Loader2, label: 'Saving…', color: 'var(--info)' },
    readonly: { icon: Lock, label: 'Live (view-only)', color: 'var(--muted)' },
    error: { icon: CloudOff, label: 'Sync error', color: 'var(--danger)' },
  }
  const m = map[status]
  const Icon = m.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: m.color }} title="Cloud sync status">
      <Icon size={13} className={status === 'saving' || status === 'connecting' ? 'animate-spin' : ''} />
      {m.label}
    </span>
  )
}

function SignInModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Cloud size={18} className="text-[var(--brand)]" /> Sign in to edit
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !email || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--muted)] -mt-1">
        Only the editor signs in. Everyone else viewing this link stays read-only.
      </p>
      <Field label="Email">
        <Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </Field>
      <Field label="Password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </Field>
      {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}
    </Modal>
  )
}

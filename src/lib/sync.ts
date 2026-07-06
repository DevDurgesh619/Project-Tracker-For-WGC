import type { TimelineData } from './types'
import { STATE_ROW_ID, supabase } from './supabase'
import { useStore } from './store'

// ─────────────────────────────────────────────────────────────────────────────
// Cloud sync — the whole app graph is stored as one JSON row in Postgres.
//   • On start: load the remote row (or push local up if the row is empty).
//   • On change: debounced save (only when the user can edit).
//   • Realtime: other viewers get updates pushed live.
// Echo-guarded so our own saves don't bounce back and cause loops.
// ─────────────────────────────────────────────────────────────────────────────

let lastSyncedJson = ''
let applyingRemote = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

export type SyncStatus = 'off' | 'connecting' | 'synced' | 'saving' | 'error' | 'readonly'
type Listener = (s: SyncStatus) => void
const listeners = new Set<Listener>()
let status: SyncStatus = 'off'

export function onSyncStatus(fn: Listener): () => void {
  listeners.add(fn)
  fn(status)
  return () => listeners.delete(fn)
}
function setStatus(s: SyncStatus) {
  status = s
  listeners.forEach((l) => l(s))
}

function isEmpty(state: unknown): boolean {
  return !state || typeof state !== 'object' || Object.keys(state as object).length === 0
}

async function loadRemote(): Promise<TimelineData | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('app_state').select('state').eq('id', STATE_ROW_ID).maybeSingle()
  if (error) {
    console.error('[sync] load failed', error)
    return null
  }
  if (!data || isEmpty(data.state)) return null
  return data.state as TimelineData
}

/** Push the given graph to the DB. Returns false if blocked (read-only viewer). */
export async function saveRemote(state: TimelineData): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('app_state')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('id', STATE_ROW_ID)
    .select('id')
  if (error) {
    console.error('[sync] save failed', error)
    setStatus('error')
    return false
  }
  // RLS returns 0 rows for a viewer who isn't allowed to write.
  if (!data || data.length === 0) {
    setStatus('readonly')
    return false
  }
  return true
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  setStatus('saving')
  saveTimer = setTimeout(async () => {
    const state = useStore.getState().data
    const json = JSON.stringify(state)
    lastSyncedJson = json
    const ok = await saveRemote(state)
    if (ok) setStatus('synced')
  }, 900)
}

let remoteWasEmpty = false

async function seedFromLocal() {
  const local = useStore.getState().data
  lastSyncedJson = JSON.stringify(local)
  const ok = await saveRemote(local)
  if (ok) {
    remoteWasEmpty = false
    setStatus('synced')
  }
}

/** Whether the signed-in user may write. Set by the auth layer. */
let canEdit = false
export function setCanEdit(v: boolean) {
  canEdit = v
  // First editor to arrive seeds an empty database from the real bundled data.
  if (v && remoteWasEmpty) void seedFromLocal()
  if (status !== 'off') setStatus(v ? 'synced' : 'readonly')
}

/** Call once on app start. Idempotent-ish; safe to await. */
export async function initSync(): Promise<void> {
  if (!supabase) {
    setStatus('off')
    return
  }
  setStatus('connecting')

  const remote = await loadRemote()
  if (remote) {
    lastSyncedJson = JSON.stringify(remote)
    applyingRemote = true
    useStore.setState({ data: remote })
    applyingRemote = false
  } else {
    // DB row is empty → seed it now if an editor is present, else wait for one.
    remoteWasEmpty = true
    if (canEdit) await seedFromLocal()
  }
  setStatus(canEdit ? 'synced' : 'readonly')

  // Push local changes up (debounced), only if this user can edit.
  useStore.subscribe((state, prev) => {
    if (applyingRemote || !canEdit) return
    if (state.data === prev.data) return
    if (JSON.stringify(state.data) === lastSyncedJson) return
    scheduleSave()
  })

  // Pull remote changes down (realtime).
  supabase
    .channel('app_state')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'app_state', filter: `id=eq.${STATE_ROW_ID}` },
      (payload) => {
        const next = (payload.new as { state?: TimelineData }).state
        if (!next) return
        const json = JSON.stringify(next)
        if (json === lastSyncedJson) return // our own echo
        lastSyncedJson = json
        applyingRemote = true
        useStore.setState({ data: next })
        applyingRemote = false
      },
    )
    .subscribe()
}

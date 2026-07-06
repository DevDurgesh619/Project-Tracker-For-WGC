import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import { setCanEdit } from './sync'
import { useStore } from './store'

// Editing is gated by auth: signed-in = editor (can write), everyone else = viewer.
// When Supabase isn't configured (pure local dev), the app is editable locally.

interface AuthState {
  session: Session | null
  ready: boolean
  canEdit: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  ready: !isSupabaseConfigured,
  canEdit: !isSupabaseConfigured,
}))

function apply(session: Session | null) {
  const canEdit = !!session
  useAuthStore.setState({ session, canEdit })
  setCanEdit(canEdit)
  // The only account that can edit is Durgesh — pin the identity on sign-in so
  // greetings / "my" views always read as Durgesh (never a stale switched user).
  if (canEdit) useStore.getState().setCurrentUser('m-durgesh')
}

export function initAuth() {
  if (!supabase) {
    setCanEdit(true)
    return
  }
  supabase.auth.getSession().then(({ data }) => {
    apply(data.session)
    useAuthStore.setState({ ready: true })
  })
  supabase.auth.onAuthStateChange((_event, session) => apply(session))
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Cloud not configured' }
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

export const useCanEdit = () => useAuthStore((s) => s.canEdit)
export const useSession = () => useAuthStore((s) => s.session)
export const cloudEnabled = isSupabaseConfigured

/** True for a read-only cloud viewer (not signed in). Used to show a generic
 *  "Team" identity instead of any individual's name. */
export const useViewerMode = () => {
  const canEdit = useCanEdit()
  return cloudEnabled && !canEdit
}

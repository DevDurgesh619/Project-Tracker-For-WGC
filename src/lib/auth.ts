import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import { setCanEdit } from './sync'

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

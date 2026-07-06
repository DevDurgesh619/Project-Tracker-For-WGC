import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both env vars are present — otherwise the app runs local-only. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** The shared browser client (null when not configured). */
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

/** The single row that holds the whole app graph. */
export const STATE_ROW_ID = 'main'

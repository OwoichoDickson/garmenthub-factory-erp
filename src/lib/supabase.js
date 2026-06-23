import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Surfaced in the UI by <ConfigNotice/>; we still create a stub so imports don't crash.
  // eslint-disable-next-line no-console
  console.warn(
    '[GarmentHub] Supabase env vars missing. Add VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY to a .env file (see .env.example).',
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

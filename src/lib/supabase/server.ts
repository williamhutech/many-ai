import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase server client using the service_role key.
 * If you prefer to use the anon key, replace SUPABASE_SERVICE_ROLE_KEY
 * with NEXT_PUBLIC_SUPABASE_ANON_KEY or something similar.
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

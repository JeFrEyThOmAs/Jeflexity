import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

export function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_API_SECRET!
  )
}

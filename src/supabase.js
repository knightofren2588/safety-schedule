import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table structure:
// schedules: { id, week_num, day, location, staff, start_time, end_time, hours, created_at, updated_at }
// call_offs: { id, date, staff, reason, created_at }
// pto_requests: { id, date, staff, reason, created_at }
// pickup_shifts: { id, week_num, day, location, staff, created_at } 
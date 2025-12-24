import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we are using the placeholder to provide better error feedback later
export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.openstreetmap.org' && supabaseUrl !== 'https://placeholder.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

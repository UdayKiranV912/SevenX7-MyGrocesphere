import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables. 
const rawUrl = (process.env as any).SUPABASE_URL;
const rawKey = (process.env as any).SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl && rawUrl.length > 10 ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey && rawKey.length > 10 ? rawKey : 'placeholder-key';

// Check if we are using the placeholder to provide better error feedback later
export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
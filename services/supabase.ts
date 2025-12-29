
import { createClient } from '@supabase/supabase-js';

// Connection details updated as per user request to match the specific backend database
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL || 'https://tsadkqjvcdhjdqrwurbx.supabase.co';
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_CZnad3HNfL14Ov2bKpu7nQ_bGyh7jmr';

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

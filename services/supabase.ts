
import { createClient } from '@supabase/supabase-js';

// Connection details provided for the live Supabase project
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL || 'https://tvywzlolrjukfkukxjpr.supabase.co';
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_LdempZ18AsyBTVrBI8wkHw_E-sq5GQb';

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


import { createClient } from '@supabase/supabase-js';

// User-provided Supabase credentials
const supabaseUrl = 'https://tobdllelnheqtnnmaxxr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Bgj45OANboOHclsXDeDpEA_6D_YLpIR';

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

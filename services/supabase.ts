
import { createClient } from '@supabase/supabase-js';

// Connection details updated to the newest provided project (bgavgglaktkwncibfelu)
const supabaseUrl = 'https://bgavgglaktkwncibfelu.supabase.co';
const supabaseAnonKey = 'sb_publishable_7xzUVmYovc_w_I4baegEYg_bUQkvQwy';

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

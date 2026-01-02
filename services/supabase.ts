
import { createClient } from '@supabase/supabase-js';

// Connection details updated to the newest provided project
const supabaseUrl = 'https://xhfmqktjfhgvvdouafsm.supabase.co';
const supabaseAnonKey = 'sb_publishable_8bI-iu52FZyuNRygZFkRJA_FwbwdTk4';

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

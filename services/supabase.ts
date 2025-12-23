
import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables. 
// We provide valid-structured placeholders to prevent library initialization errors (like 'supabaseUrl is required').
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize the client. If placeholders are used, actual network requests will fail gracefully 
// but the application won't crash on load.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Ensure strict environment validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
// Using service role for backend operations, but we MUST secure endpoints. 
// Alternatively, passing user's Auth Bearer token to create a scoped client per request is the production way,
// but for MVP backend worker tasks (e.g. creating withdrawal and sending SMS), service role or anon key with RLS is used.
// If using service_role, the backend script has full DB access, so input validation before querying is PARAMOUNT.

if (!supabaseUrl || !supabaseKey) {
  console.warn('[WARNING] Supabase environment variables are missing. Define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
  auth: { autoRefreshToken: false, persistSession: false }
});

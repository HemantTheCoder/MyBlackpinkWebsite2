const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in environment');
}

// Service-role client: bypasses RLS, used for all data access and admin auth operations.
const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Anon-key client: used only for GoTrue auth flows (sign in, token verification, password reset)
// so those calls go through the standard, non-privileged auth path.
const supabaseAuth = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { supabaseAdmin, supabaseAuth };

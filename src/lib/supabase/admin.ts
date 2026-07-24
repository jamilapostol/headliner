import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only operations that must bypass RLS
// (avatar uploads to a bucket scoped by user id). Never import this from
// client components.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

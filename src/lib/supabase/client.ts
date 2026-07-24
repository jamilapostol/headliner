import { createBrowserClient } from "@supabase/ssr";

// For future Client Component use (e.g. real-time subscriptions). The app
// currently drives all auth through Server Actions, so nothing calls this yet.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

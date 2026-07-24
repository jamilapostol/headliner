import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// One client per request — Server Components/Actions call this fresh each
// time. Cookie writes here are best-effort: if called from a Server
// Component render (where cookies() is read-only), the write silently
// no-ops and proxy.ts is responsible for keeping the session refreshed.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — no-op, proxy.ts refreshes instead.
        }
      },
    },
  });
}

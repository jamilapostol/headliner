import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type Session = { userId: string; workspaceId: string; email: string; name: string };

// Resolves the Supabase-authenticated user plus their workspace membership.
// Keeps the same {userId, workspaceId} shape the rest of the app (all the
// server actions in lib/actions/*) already depends on, so swapping the auth
// backend didn't require touching those call sites.
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await db.membership.findFirst({ where: { userId: user.id } });
  if (!membership) return null;

  const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? "";
  return { userId: user.id, workspaceId: membership.workspaceId, email: user.email ?? "", name };
}

import { cache } from "react";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type Session = {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  membershipAccepted: boolean;
};

// Resolves the Supabase-authenticated user plus their workspace membership.
// Keeps the same {userId, workspaceId} shape the rest of the app (all the
// server actions in lib/actions/*) already depends on, so swapping the auth
// backend didn't require touching those call sites.
//
// Wrapped in React's cache() so the layout and the page it wraps (both of
// which call this, directly or via requireWorkspace()) share one result per
// request instead of re-running the auth check and membership query twice.
//
// Uses getSession() (reads + verifies the local JWT) rather than getUser()
// (which round-trips to Supabase's Auth API to check for revocation). For
// requests proxy.ts already covers, that network check already happened on
// the way in; for the few routes it doesn't cover, this trades a bounded
// revocation-detection lag (up to the access token's ~1hr TTL) for cutting
// out a network hop on every request — an acceptable tradeoff here.
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const membership = await db.membership.findFirst({ where: { userId: user.id } });
  if (!membership) return null;

  const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  return {
    userId: user.id,
    workspaceId: membership.workspaceId,
    email: user.email ?? "",
    name,
    avatarUrl,
    role: membership.role,
    membershipAccepted: membership.acceptedAt !== null,
  };
});

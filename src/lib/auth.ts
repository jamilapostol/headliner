import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { IMPERSONATION_COOKIE } from "@/lib/impersonation";

export type Session = {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  membershipAccepted: boolean;
  // Set when an admin is viewing the app as another workspace. The rest of
  // the session (userId/workspaceId/role) already reflects the target
  // workspace's owner — this just carries the real admin's identity through
  // for the "viewing as" banner and the exit action.
  impersonatedBy?: { email: string };
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

  const realEmail = user.email ?? "";
  let membership = await db.membership.findFirst({ where: { userId: user.id } });
  if (!membership) return null;

  let impersonatedBy: { email: string } | undefined;
  if (isAdminEmail(realEmail)) {
    const targetWorkspaceId = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
    if (targetWorkspaceId && targetWorkspaceId !== membership.workspaceId) {
      const targetMembership = await db.membership.findFirst({
        where: { workspaceId: targetWorkspaceId },
        orderBy: { createdAt: "asc" },
      });
      if (targetMembership) {
        membership = targetMembership;
        impersonatedBy = { email: realEmail };
      }
    }
  }

  const name = impersonatedBy ? "Support" : ((user.user_metadata?.name as string | undefined) ?? user.email ?? "");
  const avatarUrl = impersonatedBy ? null : ((user.user_metadata?.avatar_url as string | undefined) ?? null);
  return {
    userId: membership.userId,
    workspaceId: membership.workspaceId,
    email: realEmail,
    name,
    avatarUrl,
    role: membership.role,
    membershipAccepted: membership.acceptedAt !== null,
    impersonatedBy,
  };
});

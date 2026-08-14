// Invite-code decisions, pulled out of the signup action so they can be
// tested without a database — and, more importantly, so the cheap pre-check
// and the atomic claim inside the transaction express "redeemable" exactly
// once. When those two drift apart you get the worst kind of bug: a code the
// UI accepts and the transaction then refuses, or vice versa.

export type InviteState = { active: boolean; usedCount: number; maxUses: number | null };

/** Codes are handed out in print and over the phone, so accept whatever
 *  casing and stray whitespace arrives. */
export function normalizeInviteCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase();
}

/** maxUses null means unlimited — not zero. */
export function inviteRedeemable(invite: InviteState): boolean {
  if (!invite.active) return false;
  if (invite.maxUses === null) return true;
  return invite.usedCount < invite.maxUses;
}

/** The conditional-increment predicate. Passing this to updateMany is what
 *  makes redemption race-safe: two requests claiming the last seat both
 *  match zero rows for the loser, which rolls its transaction back rather
 *  than handing out a seat that no longer exists. */
export function redeemableWhere(code: string, maxUses: number | null) {
  return {
    code,
    active: true,
    ...(maxUses !== null ? { usedCount: { lt: maxUses } } : {}),
  };
}

/** Remaining uses, or null for unlimited. Never negative — an over-redeemed
 *  code (possible only if a row were edited by hand) reports 0, not -1. */
export function invitesRemaining(invite: InviteState): number | null {
  if (invite.maxUses === null) return null;
  return Math.max(0, invite.maxUses - invite.usedCount);
}

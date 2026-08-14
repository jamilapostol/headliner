import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeInviteCode, inviteRedeemable, redeemableWhere, invitesRemaining } from "../invites";

// Invite codes are the only thing standing between a closed beta and open
// registration — bots were signing up before this gate existed. These cover
// the decisions; see the note at the bottom for what they deliberately don't.

test("codes normalize the way people actually type them", () => {
  assert.equal(normalizeInviteCode("  beta-abc12345 "), "BETA-ABC12345");
  assert.equal(normalizeInviteCode("BETA-ABC12345"), "BETA-ABC12345");
  assert.equal(normalizeInviteCode(null), "");
  assert.equal(normalizeInviteCode(undefined), "");
});

test("an unlimited code (maxUses null) never runs out", () => {
  const invite = { active: true, usedCount: 9999, maxUses: null };
  assert.equal(inviteRedeemable(invite), true);
  assert.equal(invitesRemaining(invite), null, "null means unlimited, not zero");
});

test("a limited code is redeemable up to but not past its cap", () => {
  assert.equal(inviteRedeemable({ active: true, usedCount: 0, maxUses: 1 }), true);
  assert.equal(inviteRedeemable({ active: true, usedCount: 4, maxUses: 5 }), true, "the last seat is still a seat");
  assert.equal(inviteRedeemable({ active: true, usedCount: 5, maxUses: 5 }), false, "exactly at the cap is spent");
  assert.equal(inviteRedeemable({ active: true, usedCount: 6, maxUses: 5 }), false);
});

test("a deactivated code is never redeemable, however many uses remain", () => {
  assert.equal(inviteRedeemable({ active: false, usedCount: 0, maxUses: 100 }), false);
  assert.equal(inviteRedeemable({ active: false, usedCount: 0, maxUses: null }), false);
});

test("a zero-use code is dead on arrival rather than unlimited", () => {
  // The bug this guards: treating a falsy maxUses as "no limit".
  assert.equal(inviteRedeemable({ active: true, usedCount: 0, maxUses: 0 }), false);
  assert.equal(invitesRemaining({ active: true, usedCount: 0, maxUses: 0 }), 0);
});

test("remaining uses never go negative", () => {
  assert.equal(invitesRemaining({ active: true, usedCount: 7, maxUses: 5 }), 0);
});

test("the claim predicate constrains usedCount only for limited codes", () => {
  assert.deepEqual(redeemableWhere("BETA-X", 5), { code: "BETA-X", active: true, usedCount: { lt: 5 } });
  assert.deepEqual(redeemableWhere("BETA-X", null), { code: "BETA-X", active: true });
});

test("the pre-check and the atomic claim agree on every state", () => {
  // The real hazard isn't either predicate alone — it's drift between them.
  // If the cheap pre-check accepts a code the transaction's conditional
  // increment then refuses, a user gets "that code was just redeemed" for a
  // code nobody else touched. This asserts they stay in lockstep.
  for (const active of [true, false]) {
    for (const maxUses of [null, 0, 1, 5]) {
      for (const usedCount of [0, 1, 4, 5, 6]) {
        const invite = { active, usedCount, maxUses };
        const where = redeemableWhere("BETA-X", maxUses);
        // Would the updateMany predicate match this row?
        const claimWouldMatch =
          where.active === active && (where.usedCount === undefined || usedCount < (where.usedCount as { lt: number }).lt);
        assert.equal(
          inviteRedeemable(invite),
          claimWouldMatch,
          `disagreement at active=${active} used=${usedCount} max=${maxUses}`
        );
      }
    }
  }
});

// Not covered here: that two concurrent redemptions of the last seat produce
// exactly one workspace. That's a property of the conditional UPDATE inside a
// transaction, and asserting it needs a real database with real concurrency —
// mocking Prisma would only test the mock. It stays an integration gap.

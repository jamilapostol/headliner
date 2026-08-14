import { test } from "node:test";
import assert from "node:assert/strict";
import { aiCapFor, aiQuotaExceeded, usageMonth, MONTHLY_AI_CAP } from "../plan-limits";

// Roadie quota. Each allowed call costs real money at the Anthropic API, and
// the same table decides entitlement — so an off-by-one here either bills the
// platform for calls it didn't sell or blocks a plan that paid for them.

test("an unknown or unentitled plan gets a zero cap, not a free pass", () => {
  // aiCapFor must fail closed: consumeAiQuota treats cap <= 0 as "not
  // entitled", so a permissive default would hand Roadie to every plan.
  for (const plan of ["free", "pro", "", "enterprise", "TOURING"]) {
    assert.equal(aiCapFor(plan), 0, `"${plan}" must not get a quota`);
  }
});

test("entitled plans get their advertised allowance", () => {
  assert.equal(aiCapFor("touring"), 200);
  assert.equal(aiCapFor("team"), 500);
  assert.equal(aiCapFor("beta"), MONTHLY_AI_CAP.touring, "unbilled beta stays on the smaller allowance");
});

test("the cap is inclusive — the nth call of n is allowed", () => {
  // consumeAiQuota increments first and then checks, so `count` is the
  // number of calls including this one. Getting this boundary wrong either
  // gives away one free call a month or silently withholds the last paid one.
  assert.equal(aiQuotaExceeded(1, 200), false, "first call");
  assert.equal(aiQuotaExceeded(200, 200), false, "the 200th call is the last allowed one");
  assert.equal(aiQuotaExceeded(201, 200), true, "the 201st is over");
  assert.equal(aiQuotaExceeded(5000, 200), true);
});

test("a zero cap rejects even the first call", () => {
  assert.equal(aiQuotaExceeded(1, 0), true);
});

test("usage months are calendar months in UTC", () => {
  assert.equal(usageMonth(new Date("2026-08-14T19:00:00Z")), "2026-08");
  assert.equal(usageMonth(new Date("2026-01-01T00:00:00Z")), "2026-01");
  // A workspace's quota must not reset early for anyone west of UTC: the
  // last instant of December is still December's quota.
  assert.equal(usageMonth(new Date("2026-12-31T23:59:59Z")), "2026-12");
  assert.equal(usageMonth(new Date("2027-01-01T00:00:00Z")), "2027-01");
});

// Not covered here: that parallel calls can't overshoot the cap. That relies
// on the upsert's atomic increment in Postgres, which needs a real database
// to exercise — a mock would assert only that the mock increments.

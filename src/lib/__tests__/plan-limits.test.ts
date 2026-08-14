import { test } from "node:test";
import assert from "node:assert/strict";
import { planAtLeast, MIN_PLAN, MONTHLY_AI_CAP, MONTHLY_EMAIL_CAP, CAMPAIGN_RECIPIENT_CAP, BOOKING_LIMITS, CONTACT_LIMITS } from "../plan-limits";

// These are the checks that decide who gets paid features. They run
// server-side in requireMinPlan, so a wrong answer here is a billing or
// access bug, not a cosmetic one.

test("plan ranking is ordered free < pro < touring < team", () => {
  assert.equal(planAtLeast("free", "pro"), false);
  assert.equal(planAtLeast("pro", "pro"), true);
  assert.equal(planAtLeast("pro", "touring"), false);
  assert.equal(planAtLeast("touring", "touring"), true);
  assert.equal(planAtLeast("touring", "team"), false);
  assert.equal(planAtLeast("team", "team"), true);
  assert.equal(planAtLeast("team", "pro"), true);
});

test("beta ranks with pro, not above it", () => {
  // Documented intent: beta is admin-granted and unbilled, with Pro-level
  // access. If beta is ever meant to reach Touring features, PLAN_RANK and
  // MONTHLY_AI_CAP both have to change — this test should fail first.
  assert.equal(planAtLeast("beta", "pro"), true);
  assert.equal(planAtLeast("beta", "touring"), false);
  assert.equal(planAtLeast("beta", "team"), false);
});

test("an unknown or empty plan gets nothing above free", () => {
  for (const plan of ["", "enterprise", "PRO", "admin"]) {
    assert.equal(planAtLeast(plan, "pro"), false, `"${plan}" must not unlock pro`);
  }
});

test("module gates match the advertised pricing tiers", () => {
  assert.equal(MIN_PLAN.merch, "pro");
  assert.equal(MIN_PLAN.finance, "pro");
  assert.equal(MIN_PLAN.campaigns, "pro");
  assert.equal(MIN_PLAN.contracts, "touring");
  assert.equal(MIN_PLAN.export, "team");
});

test("every gated module is reachable by the top plan", () => {
  for (const [feature, min] of Object.entries(MIN_PLAN)) {
    assert.equal(planAtLeast("team", min), true, `team should unlock ${feature}`);
  }
});

test("free plan is capped and paid plans are not", () => {
  assert.equal(BOOKING_LIMITS.free, 5);
  assert.equal(CONTACT_LIMITS.free, 50);
  for (const plan of ["pro", "touring", "team", "beta"]) {
    assert.equal(BOOKING_LIMITS[plan], Infinity, `${plan} bookings uncapped`);
    assert.equal(CONTACT_LIMITS[plan], Infinity, `${plan} contacts uncapped`);
  }
});

test("email caps rise with plan and never leave a paying plan unbounded", () => {
  assert.ok(MONTHLY_EMAIL_CAP.pro < MONTHLY_EMAIL_CAP.touring);
  assert.ok(MONTHLY_EMAIL_CAP.touring < MONTHLY_EMAIL_CAP.team);
  for (const plan of ["pro", "beta", "touring", "team"]) {
    assert.ok(Number.isFinite(MONTHLY_EMAIL_CAP[plan]) && MONTHLY_EMAIL_CAP[plan] > 0, `${plan} needs a finite email cap`);
  }
});

test("Roadie quotas exist for exactly the plans that can reach Roadie", () => {
  // consumeAiQuota treats a missing/zero cap as "not entitled", so this
  // table is load-bearing for access, not just for spend.
  for (const plan of ["touring", "team"]) {
    assert.ok((MONTHLY_AI_CAP[plan] ?? 0) > 0, `${plan} must have a Roadie quota`);
  }
  for (const plan of ["free", "pro", "beta"]) {
    assert.ok(!(MONTHLY_AI_CAP[plan] > 0), `${plan} must not have a Roadie quota`);
  }
  assert.ok(MONTHLY_AI_CAP.touring < MONTHLY_AI_CAP.team);
});

test("campaign recipient cap is finite for pro and beta only", () => {
  assert.ok(Number.isFinite(CAMPAIGN_RECIPIENT_CAP.pro));
  assert.equal(CAMPAIGN_RECIPIENT_CAP.beta, CAMPAIGN_RECIPIENT_CAP.pro);
  assert.equal(CAMPAIGN_RECIPIENT_CAP.touring, Infinity);
  assert.equal(CAMPAIGN_RECIPIENT_CAP.team, Infinity);
});

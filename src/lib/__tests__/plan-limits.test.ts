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

test("beta reaches every gated module", () => {
  // Beta is admin-granted, unbilled, and exists to gather feedback — a
  // tester who can't open Contracts or Roadie can only report on half the
  // product. Feature access is full; spend is bounded by the cap tables
  // instead, which the quota tests below cover.
  for (const min of ["pro", "touring", "team"] as const) {
    assert.equal(planAtLeast("beta", min), true, `beta should unlock ${min} features`);
  }
  for (const [feature, min] of Object.entries(MIN_PLAN)) {
    assert.equal(planAtLeast("beta", min), true, `beta should unlock ${feature}`);
  }
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
  // table is load-bearing for access, not just for spend. Any plan that
  // passes the server-side gate must have a quota, or the feature is
  // unreachable no matter what PLAN_RANK says.
  for (const plan of ["touring", "team", "beta"]) {
    assert.ok((MONTHLY_AI_CAP[plan] ?? 0) > 0, `${plan} must have a Roadie quota`);
    assert.equal(planAtLeast(plan, MIN_PLAN.contracts), true, `${plan} must pass the Roadie gate`);
  }
  for (const plan of ["free", "pro"]) {
    assert.ok(!(MONTHLY_AI_CAP[plan] > 0), `${plan} must not have a Roadie quota`);
  }
  assert.ok(MONTHLY_AI_CAP.touring < MONTHLY_AI_CAP.team);
  // Unbilled beta stays on the smaller allowance.
  assert.equal(MONTHLY_AI_CAP.beta, MONTHLY_AI_CAP.touring);
});

test("beta's spend ceilings stay conservative despite full access", () => {
  // Full feature access must not mean an unbilled workspace can run up an
  // uncapped Resend or Anthropic bill.
  assert.ok(Number.isFinite(MONTHLY_EMAIL_CAP.beta));
  assert.ok(MONTHLY_EMAIL_CAP.beta <= MONTHLY_EMAIL_CAP.touring);
  assert.ok(MONTHLY_AI_CAP.beta <= MONTHLY_AI_CAP.team);
});

test("campaign recipient cap is finite for pro and beta only", () => {
  assert.ok(Number.isFinite(CAMPAIGN_RECIPIENT_CAP.pro));
  assert.equal(CAMPAIGN_RECIPIENT_CAP.beta, CAMPAIGN_RECIPIENT_CAP.pro);
  assert.equal(CAMPAIGN_RECIPIENT_CAP.touring, Infinity);
  assert.equal(CAMPAIGN_RECIPIENT_CAP.team, Infinity);
});

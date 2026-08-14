import { test } from "node:test";
import assert from "node:assert/strict";
import { draftFollowupEmail, summarizeContract, planUnlocksAI } from "../ai";

// Regression guard for the class of bug fixed in 351fd22: these templates run
// when ANTHROPIC_API_KEY is unset, having read neither the workspace's data
// nor the uploaded document. Anything specific they assert is a fabrication
// shown to the user as a finding about their real booking or contract.

const KINDS = ["Performance", "Sponsorship", "Licensing", "Insurance", "Work-for-hire", "Other"];

test("the follow-up template invents no performance statistics", () => {
  const email = draftFollowupEmail({
    contactName: "Dana",
    venue: "The Empty Bottle",
    city: "Chicago, IL",
    date: "2026-09-14T00:00:00.000Z",
    artistName: "Jamil",
  });
  assert.doesNotMatch(email, /\d[\d,]*\s*(tickets?|attendees?|fans?|people)/i, "no invented attendance");
  assert.doesNotMatch(email, /\$[\d,]/, "no invented money");
  assert.doesNotMatch(email, /\b(sold out|averag\w+|capacity)\b/i, "no invented track record");
  // It should still be a usable email addressed to the real contact.
  assert.match(email, /Dana/);
  assert.match(email, /The Empty Bottle/);
});

test("the follow-up template uses the real booking details it was given", () => {
  const email = draftFollowupEmail({
    contactName: null,
    venue: "Bootleg Theater",
    city: "Los Angeles, CA",
    date: "2026-09-14T00:00:00.000Z",
    artistName: "Jamil",
  });
  assert.match(email, /there/, "falls back to a neutral greeting without a contact name");
  assert.match(email, /Los Angeles/, "uses the city, not a guess");
  assert.doesNotMatch(email, /null|undefined|NaN/);
});

test("the contract fallback never claims a document was reviewed", () => {
  for (const kind of KINDS) {
    for (const status of ["DRAFT", "SIGNED", "ACTIVE"]) {
      const facts = summarizeContract(kind, status, "$5,000");
      assert.ok(facts.length > 0, `${kind}/${status} should return guidance`);
      for (const f of facts) {
        // "✓" reads as "reviewed and clear" — unavailable to a function that
        // has not opened the file.
        assert.equal(f.flag, "!", `${kind}/${status}: no ✓ flags in the fallback`);
        assert.doesNotMatch(f.text, /\$[\d,]/, `${kind}/${status}: no invented amounts`);
        assert.doesNotMatch(f.text, /\d+\s*(mi|miles|days|%)\b/i, `${kind}/${status}: no invented terms`);
        assert.doesNotMatch(f.text, /no flagged risks/i, `${kind}/${status}: never assert all-clear`);
      }
    }
  }
});

test("the contract fallback ignores the stated value it cannot verify", () => {
  const withValue = summarizeContract("Sponsorship", "ACTIVE", "$50,000");
  const withoutValue = summarizeContract("Sponsorship", "ACTIVE", "");
  assert.deepEqual(withValue, withoutValue, "output must not vary with unverified metadata");
});

test("planUnlocksAI agrees with the server-side Roadie gate", () => {
  assert.equal(planUnlocksAI("touring"), true);
  assert.equal(planUnlocksAI("team"), true);
  assert.equal(planUnlocksAI("beta"), true, "beta has full feature access");
  assert.equal(planUnlocksAI("pro"), false);
  assert.equal(planUnlocksAI("free"), false);
});

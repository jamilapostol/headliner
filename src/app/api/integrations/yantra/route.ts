import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getCohort, daysSince } from "@/lib/cohort";

// Read-only bridge for YANTRA OS agents.
//
// YANTRA runs on a separate Supabase project, so rather than handing it this
// database's service-role key — which bypasses RLS and reads every workspace —
// it gets this endpoint: one narrow, auditable surface returning only the
// aggregates an agent needs to brief the founder or draft outreach. Adding a
// field here is a deliberate act; leaking the whole database is not possible.
//
// GET only. Nothing here mutates anything. A write surface, if it ever
// exists, belongs on its own route with its own secret and an Approvals gate
// on the YANTRA side — not bolted onto this one.
//
// The response is self-documenting on purpose. A consuming system should not
// need to be told out-of-band that booking value isn't revenue, or that a
// missing number means "not measured" rather than "zero".

export const dynamic = "force-dynamic";

/** Bumped when the response shape changes incompatibly, so YANTRA can tell
 *  a stale deployment from a broken one. */
const SCHEMA_VERSION = 2;

function authorized(request: Request): boolean {
  const secret = process.env.YANTRA_BRIDGE_SECRET;
  // Unset secret means the bridge is closed, not open to everyone.
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  // Compare lengths first: timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const month = new Date().toISOString().slice(0, 7);

  const [cohort, invites, aiUsage, campaigns, zeroRecipientSends, bookingsByStage, workspacesByPlan, subscriptions] =
    await Promise.all([
      getCohort(),
      db.betaInvite.findMany({ select: { code: true, maxUses: true, usedCount: true, active: true } }),
      db.aiUsage.aggregate({ where: { month }, _sum: { count: true } }),
      db.campaign.aggregate({ where: { sentAt: { not: null } }, _sum: { recipientCount: true }, _count: true }),
      db.campaign.count({ where: { sentAt: { not: null }, recipientCount: 0 } }),
      db.booking.groupBy({ by: ["stage"], _count: true, _sum: { fee: true } }),
      db.workspace.groupBy({ by: ["plan"], _count: true }),
      db.workspace.count({ where: { stripeSubId: { not: null } } }),
    ]);

  const beta = cohort.rows.filter((r) => r.plan === "beta");

  return NextResponse.json({
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),

    // Every workspace, not just the beta ones. Reporting six in `plans` while
    // describing only two left four accounts as a bare count.
    workspaces: {
      total: cohort.rows.length,
      byPlan: workspacesByPlan.map((w) => ({ plan: w.plan, workspaces: w._count })),
      detail: cohort.rows.map((r) => ({
        name: r.name,
        email: r.email,
        plan: r.plan,
        joinedDaysAgo: daysSince(r.createdAt),
        confirmed: r.confirmed,
        counts: { bookings: r.bookings, contacts: r.contacts, transactions: r.transactions, fans: r.fans },
        lastActivityDaysAgo: r.lastActivity ? daysSince(r.lastActivity) : null,
        status: r.status,
      })),
    },

    // Summary only — the beta workspaces themselves are in workspaces.detail
    // with plan === "beta".
    beta: {
      total: beta.length,
      activated: beta.filter((r) => r.status === "activated").length,
      idle: beta.filter((r) => r.status === "idle").length,
      neverConfirmed: beta.filter((r) => r.status === "unconfirmed").length,
    },

    invites: {
      active: invites.filter((i) => i.active).length,
      redeemed: invites.reduce((n, i) => n + i.usedCount, 0),
      // maxUses null means unlimited. Summing it as zero would report "no
      // invites left" to an agent that has plenty, so unlimited is null.
      remaining: invites.filter((i) => i.active).some((i) => i.maxUses === null)
        ? null
        : invites.filter((i) => i.active).reduce((n, i) => n + Math.max(0, (i.maxUses ?? 0) - i.usedCount), 0),
    },

    roadie: { month, actionsUsed: aiUsage._sum.count ?? 0 },

    campaigns: {
      sent: campaigns._count,
      recipients: campaigns._sum.recipientCount ?? 0,
      // Sent-but-nobody-received. Without this the pair (sent: 5,
      // recipients: 0) looks like a broken send path; it is in fact seeded
      // demo rows plus one real send made before the empty-audience guard
      // existed. See the note.
      sentWithZeroRecipients: zeroRecipientSends,
      note:
        "recipientCount is set from the number of emails Resend accepted. Campaigns recorded as sent with zero recipients are historical: four are seeded demo rows (their sentAt predates their createdAt) and one was a real send against an audience with no mailable fans, before the empty-audience guard shipped 2026-08-11. The send path is not broken — that case is now rejected before sending.",
    },

    // GMV, not income. Named and documented so no consumer has to be told.
    pipeline: {
      note:
        "grossBookingValueCents is gross booking value — money moving between artists and venues (GMV). HEADLINE.WORLD takes no cut of it and never touches it. It is NOT platform revenue; see `revenue` for that.",
      stages: bookingsByStage.map((b) => ({
        stage: b.stage,
        count: b._count,
        grossBookingValueCents: b._sum.fee ?? 0,
      })),
    },

    // Absence stated rather than omitted: a missing field reads as an
    // oversight, while null-with-a-reason is a fact.
    revenue: {
      // Always null today, for one of two different reasons — both stated,
      // because "no revenue yet" and "revenue exists but this endpoint can't
      // measure it" are opposite facts that a bare 0 would blur together.
      monthlyRecurringCents: null,
      currency: "usd",
      activeSubscriptions: subscriptions,
      /** Basis points HEADLINE.WORLD takes of gross booking value. Zero — no take-rate field exists in the schema. */
      takeRateBps: 0,
      reason:
        subscriptions > 0
          ? `${subscriptions} workspace(s) hold a Stripe subscription, but this endpoint does not compute MRR: billed amounts live in Stripe and inferring them from plan tiers would ignore annual billing, proration and discounts. Read Stripe directly for a revenue figure.`
          : "No monetization is live. No workspace holds a Stripe subscription, so nothing has ever been billed — reported as null rather than 0 to distinguish 'never charged' from 'charged and collected nothing'. HEADLINE.WORLD also takes no percentage of bookings, so gross booking value produces no platform income.",
    },
  });
}

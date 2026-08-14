import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getBetaCohort, daysSince } from "@/lib/beta-cohort";

// Read-only bridge for YANTRA OS agents.
//
// Yantra runs on a separate Supabase project, so rather than handing it this
// database's service-role key — which bypasses RLS and reads every workspace —
// it gets this endpoint: one narrow, auditable surface that returns only the
// aggregates an agent needs to brief the founder or draft outreach. Adding a
// field here is a deliberate act; leaking the whole database is not possible.
//
// GET only. Nothing here mutates anything. If Yantra ever needs to *act* on
// HEADLINE.WORLD, that belongs behind a separate authenticated route with an
// Approvals gate on the Yantra side, not bolted onto this one.

export const dynamic = "force-dynamic";

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

  const [cohort, invites, aiUsage, campaigns, bookingsByStage, workspacesByPlan] = await Promise.all([
    getBetaCohort(),
    db.betaInvite.findMany({ select: { code: true, maxUses: true, usedCount: true, active: true } }),
    db.aiUsage.aggregate({ where: { month }, _sum: { count: true } }),
    db.campaign.aggregate({ where: { sentAt: { not: null } }, _sum: { recipientCount: true }, _count: true }),
    db.booking.groupBy({ by: ["stage"], _count: true, _sum: { fee: true } }),
    db.workspace.groupBy({ by: ["plan"], _count: true }),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    beta: {
      total: cohort.rows.length,
      activated: cohort.activated.length,
      idle: cohort.confirmedOnly.length,
      neverConfirmed: cohort.neverConfirmed.length,
      // Enough to decide who to contact and what to say — no workspace
      // contents, just the shape of their usage.
      workspaces: cohort.rows.map((r) => ({
        name: r.name,
        email: r.email,
        joinedDaysAgo: daysSince(r.createdAt),
        confirmed: r.confirmed,
        counts: { bookings: r.bookings, contacts: r.contacts, transactions: r.transactions, fans: r.fans },
        lastActivityDaysAgo: r.lastActivity ? daysSince(r.lastActivity) : null,
        status: r.bookings > 0 ? "activated" : r.confirmed ? "idle" : "unconfirmed",
      })),
    },
    invites: {
      active: invites.filter((i) => i.active).length,
      redeemed: invites.reduce((n, i) => n + i.usedCount, 0),
      // maxUses null means unlimited. Summing it as zero would report "no
      // invites left" to an agent that has plenty — so unlimited is reported
      // as null and rendered as such, never collapsed into a number.
      remaining: invites.filter((i) => i.active).some((i) => i.maxUses === null)
        ? null
        : invites.filter((i) => i.active).reduce((n, i) => n + Math.max(0, (i.maxUses ?? 0) - i.usedCount), 0),
    },
    roadie: { month, actionsUsed: aiUsage._sum.count ?? 0 },
    campaigns: { sent: campaigns._count, recipients: campaigns._sum.recipientCount ?? 0 },
    pipeline: bookingsByStage.map((b) => ({ stage: b.stage, count: b._count, valueCents: b._sum.fee ?? 0 })),
    plans: workspacesByPlan.map((w) => ({ plan: w.plan, workspaces: w._count })),
  });
}

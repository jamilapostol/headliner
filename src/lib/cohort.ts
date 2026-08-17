import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

// Workspace cohort computation, shared by the /admin/beta screen and the
// YANTRA bridge. Both need the same answer to "who signed up, and did they do
// anything after" — one implementation means the console and the agent
// briefings can't disagree.
//
// Was beta-only; it now covers every plan, because reporting a total of six
// workspaces while only describing two of them left four accounts visible to
// YANTRA as a bare count.

export type CohortRow = {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  email: string;
  confirmed: boolean;
  bookings: number;
  contacts: number;
  transactions: number;
  fans: number;
  lastActivity: Date | null;
  /** activated = did real work; idle = confirmed but never did; unconfirmed = never clicked the email link. */
  status: "activated" | "idle" | "unconfirmed";
};

export type Cohort = {
  rows: CohortRow[];
  activated: CohortRow[];
  confirmedOnly: CohortRow[];
  neverConfirmed: CohortRow[];
};

export function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

/** Pass a plan to narrow (the beta console does); omit for every workspace. */
export async function getCohort(plan?: Plan): Promise<Cohort> {
  const workspaces = await db.workspace.findMany({
    ...(plan ? { where: { plan } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { orderBy: { createdAt: "asc" }, take: 1 },
      _count: { select: { bookings: true, contacts: true, transactions: true, fans: true } },
    },
  });

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usersById = new Map(usersData?.users.map((u) => [u.id, u]) ?? []);

  // Most-recent write across the tables a real user touches first — a stand-in
  // for "last seen" without adding session tracking.
  const rows: CohortRow[] = await Promise.all(
    workspaces.map(async (w) => {
      const [booking, contact, txn] = await Promise.all([
        db.booking.findFirst({ where: { workspaceId: w.id }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
        db.contact.findFirst({ where: { workspaceId: w.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
        db.transaction.findFirst({ where: { workspaceId: w.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ]);
      const stamps = [booking?.updatedAt, contact?.createdAt, txn?.createdAt].filter(Boolean) as Date[];
      const user = w.memberships[0] ? usersById.get(w.memberships[0].userId) : undefined;
      const confirmed = !!user?.email_confirmed_at;

      return {
        id: w.id,
        name: w.name,
        plan: w.plan,
        createdAt: w.createdAt,
        email: user?.email ?? "—",
        confirmed,
        bookings: w._count.bookings,
        contacts: w._count.contacts,
        transactions: w._count.transactions,
        fans: w._count.fans,
        lastActivity: stamps.length ? new Date(Math.max(...stamps.map((s) => s.getTime()))) : null,
        // Activation = created at least one booking. It's the one action that
        // means they're using this for real work rather than looking around.
        status: w._count.bookings > 0 ? "activated" : confirmed ? "idle" : "unconfirmed",
      };
    })
  );

  return {
    rows,
    activated: rows.filter((r) => r.status === "activated"),
    confirmedOnly: rows.filter((r) => r.status === "idle"),
    neverConfirmed: rows.filter((r) => r.status === "unconfirmed"),
  };
}

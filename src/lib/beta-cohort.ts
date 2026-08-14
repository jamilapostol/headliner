import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

// Beta cohort computation, shared by the /admin/beta screen and the Yantra
// bridge (src/app/api/integrations/yantra/route.ts). Both need the same
// answer to "who signed up, and did they do anything after" — keeping one
// implementation means the console and the agent briefings can't disagree.

export type BetaCohortRow = {
  id: string;
  name: string;
  createdAt: Date;
  email: string;
  confirmed: boolean;
  bookings: number;
  contacts: number;
  transactions: number;
  fans: number;
  lastActivity: Date | null;
};

export type BetaCohort = {
  rows: BetaCohortRow[];
  /** Created at least one booking — the action that means real use, not a look around. */
  activated: BetaCohortRow[];
  /** Confirmed their email but never created a booking: the follow-up list. */
  confirmedOnly: BetaCohortRow[];
  /** Never confirmed their email — stuck before they ever saw the product. */
  neverConfirmed: BetaCohortRow[];
};

export function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export async function getBetaCohort(): Promise<BetaCohort> {
  const workspaces = await db.workspace.findMany({
    where: { plan: "beta" },
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
  const rows: BetaCohortRow[] = await Promise.all(
    workspaces.map(async (w) => {
      const [booking, contact, txn] = await Promise.all([
        db.booking.findFirst({ where: { workspaceId: w.id }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
        db.contact.findFirst({ where: { workspaceId: w.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
        db.transaction.findFirst({ where: { workspaceId: w.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ]);
      const stamps = [booking?.updatedAt, contact?.createdAt, txn?.createdAt].filter(Boolean) as Date[];
      const user = w.memberships[0] ? usersById.get(w.memberships[0].userId) : undefined;

      return {
        id: w.id,
        name: w.name,
        createdAt: w.createdAt,
        email: user?.email ?? "—",
        confirmed: !!user?.email_confirmed_at,
        bookings: w._count.bookings,
        contacts: w._count.contacts,
        transactions: w._count.transactions,
        fans: w._count.fans,
        lastActivity: stamps.length ? new Date(Math.max(...stamps.map((s) => s.getTime()))) : null,
      };
    })
  );

  return {
    rows,
    activated: rows.filter((r) => r.bookings > 0),
    confirmedOnly: rows.filter((r) => r.confirmed && r.bookings === 0),
    neverConfirmed: rows.filter((r) => !r.confirmed),
  };
}

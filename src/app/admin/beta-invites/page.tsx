import { db } from "@/lib/db";
import { BetaInvitesAdmin } from "@/components/beta-invites-admin";

export default async function AdminBetaInvitesPage() {
  const invites = await db.betaInvite.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-[560px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Beta invites</h1>
      <div className="mb-6 text-[13px] text-text/50">The beta plan is invite-only — generate codes to share with early testers.</div>

      <BetaInvitesAdmin
        invites={invites.map((i) => ({
          code: i.code,
          maxUses: i.maxUses,
          usedCount: i.usedCount,
          active: i.active,
          createdBy: i.createdBy,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

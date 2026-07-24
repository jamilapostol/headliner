import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEAM_MANAGER_ROLES, SEAT_LIMITS } from "@/lib/roles";
import { AccountView } from "@/components/account-view";
import { TeamSection, type MemberRow } from "@/components/team-section";

export default async function AccountPage() {
  const { user, workspace } = await requireWorkspace();

  const memberships = await db.membership.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  const admin = createAdminClient();
  const members: MemberRow[] = await Promise.all(
    memberships.map(async (m) => {
      if (m.userId === user.id) {
        return { id: m.id, name: user.name, email: user.email, role: m.role, accepted: m.acceptedAt !== null, isSelf: true };
      }
      const { data } = await admin.auth.admin.getUserById(m.userId);
      const name = (data.user?.user_metadata?.name as string | undefined) ?? data.user?.email ?? "Invited";
      return { id: m.id, name, email: data.user?.email ?? "", role: m.role, accepted: m.acceptedAt !== null, isSelf: false };
    })
  );

  const canManage = TEAM_MANAGER_ROLES.includes(user.role);
  const limit = SEAT_LIMITS[workspace.plan] ?? 1;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Profile</h1>
      <div className="mb-6 text-[13px] text-white/50">Manage your photo, contact details, password and business address.</div>
      <div className="flex flex-col gap-8">
        <AccountView
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          address={{
            addressLine1: workspace.addressLine1,
            addressLine2: workspace.addressLine2,
            city: workspace.city,
            state: workspace.state,
            postalCode: workspace.postalCode,
            country: workspace.country,
          }}
        />
        <TeamSection members={members} canManage={canManage} seatLabel={`${memberships.length} / ${limit} seats`} />
      </div>
    </div>
  );
}

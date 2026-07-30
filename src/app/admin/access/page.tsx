import { db } from "@/lib/db";
import { requireAdmin, envAdminEmails } from "@/lib/admin";
import { AdminAccessList } from "@/components/admin-access-list";

export default async function AdminAccessPage() {
  const session = await requireAdmin();
  const rows = await db.adminUser.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-[560px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Admin access</h1>
      <div className="mb-6 text-[13px] text-text/50">Control who can sign in to this admin panel.</div>

      <AdminAccessList
        envEmails={envAdminEmails()}
        dbEmails={rows.map((r) => ({ email: r.email, addedBy: r.addedBy, createdAt: r.createdAt.toISOString() }))}
        currentEmail={session.email}
      />
    </div>
  );
}

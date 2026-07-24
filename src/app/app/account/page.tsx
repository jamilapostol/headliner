import { requireWorkspace } from "@/lib/workspace";
import { AccountView } from "@/components/account-view";

export default async function AccountPage() {
  const { user, workspace } = await requireWorkspace();

  return (
    <div className="mx-auto max-w-[720px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Profile</h1>
      <div className="mb-6 text-[13px] text-white/50">Manage your photo, contact details, password and business address.</div>
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
    </div>
  );
}

import { requireWorkspace } from "@/lib/workspace";
import { AppSidebar } from "@/components/app-sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { PastDueBanner } from "@/components/past-due-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, impersonatedBy } = await requireWorkspace();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {impersonatedBy && <ImpersonationBanner adminEmail={impersonatedBy.email} workspaceName={workspace.name} />}
      {workspace.paymentPastDue && <PastDueBanner />}
      <div className="flex min-h-0 flex-1 overflow-hidden md:flex-row">
        <AppSidebar userName={user.name} plan={workspace.plan} avatarUrl={user.avatarUrl} />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

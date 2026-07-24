import { requireWorkspace } from "@/lib/workspace";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas md:flex-row">
      <AppSidebar userName={user.name} plan={workspace.plan} avatarUrl={user.avatarUrl} />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

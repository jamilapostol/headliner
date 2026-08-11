import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-canvas text-text">
      <div className="w-[200px] flex-none border-r border-border px-4 py-6">
        <div className="mb-6 px-2">
          <div className="text-[13px] font-bold">HEADLINE.WORLD</div>
          <div className="font-mono text-[10px] tracking-[.14em] text-orange">ADMIN</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          <Link href="/admin" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Overview
          </Link>
          <Link href="/admin/workspaces" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Workspaces
          </Link>
          <Link href="/admin/pages" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Web pages
          </Link>
          <Link href="/admin/content" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Landing page content
          </Link>
          <Link href="/admin/data" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Data browser
          </Link>
          <Link href="/admin/billing" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Billing health
          </Link>
          <Link href="/admin/audit" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Audit log
          </Link>
          <Link href="/admin/access" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Admin access
          </Link>
          <Link href="/admin/beta-invites" className="rounded-lg px-2.5 py-2 text-[13px] font-medium hover:bg-text/5">
            Beta invites
          </Link>
        </nav>
        <div className="mt-8 border-t border-border pt-4 px-2">
          <Link href="/app" className="text-[12px] text-text/50 hover:text-text">
            ← Back to app
          </Link>
        </div>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto px-8 py-7">{children}</div>
    </div>
  );
}

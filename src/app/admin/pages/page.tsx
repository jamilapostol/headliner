import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/lib/web-pages";
import { AdminWebPages } from "@/components/admin-web-pages";

export const metadata = { title: "Web pages — Admin" };

export default async function AdminPagesPage() {
  await requireAdmin();

  // Make sure the three system gate rows exist so they always show up here.
  // createMany+skipDuplicates keeps this idempotent and race-safe.
  await db.webPage.createMany({
    data: SYSTEM_PAGES.map((p) => ({ slug: p.slug, title: p.title, kind: "system", visibility: "private" })),
    skipDuplicates: true,
  });

  const pages = await db.webPage.findMany({ orderBy: [{ kind: "desc" }, { createdAt: "asc" }] });

  return (
    <div>
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Web pages</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Flip any page public or private, and build new pages without touching code. Private pages show a &ldquo;setting the
        stage&rdquo; screen (marketing pages) or a 404 (custom pages).
      </div>
      <AdminWebPages
        pages={pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          kind: p.kind,
          visibility: p.visibility,
          heading: p.heading,
          body: p.body,
          path: SYSTEM_PAGES.find((s) => s.slug === p.slug)?.path ?? `/${p.slug}`,
        }))}
      />
    </div>
  );
}

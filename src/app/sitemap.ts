import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/lib/web-pages";
import { withErrorFallback } from "@/lib/action-error";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only advertise pages that are actually public; a DB hiccup degrades to
  // the always-public auth/legal routes rather than failing the whole sitemap.
  const publicPages = await withErrorFallback("sitemap", [] as Array<{ slug: string; kind: string }>, () =>
    db.webPage.findMany({ where: { visibility: "public" }, select: { slug: true, kind: true } })
  );

  const marketingRoutes = publicPages.map((p) =>
    p.kind === "system" ? (SYSTEM_PAGES.find((s) => s.slug === p.slug)?.path ?? `/${p.slug}`) : `/${p.slug}`
  );

  // Public artist pages. Strictly those the artist switched on — a listing
  // in the sitemap is an invitation to crawl it, so a workspace that never
  // opted in must not appear here even by name.
  const artists = await withErrorFallback("sitemap:artists", [] as Array<{ publicSlug: string | null; updatedRef: Date }>, async () => {
    const rows = await db.workspace.findMany({
      where: { publicEnabled: true, publicSlug: { not: null } },
      select: {
        publicSlug: true,
        // Newest confirmed booking doubles as "when this listing last
        // changed" — a tour page is only as fresh as its dates, and
        // stamping every entry with now() teaches crawlers to ignore the
        // field entirely.
        bookings: {
          where: { stage: { in: ["Confirmed", "Paid"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
      },
    });
    return rows.map((r) => ({ publicSlug: r.publicSlug, updatedRef: r.bookings[0]?.updatedAt ?? new Date() }));
  });

  const base = siteUrl();
  const routes = [...new Set([...marketingRoutes, "/login", "/signup", "/terms", "/privacy"])];

  return [
    ...routes.map((route) => ({
      url: `${base}${route === "/" ? "" : route}`,
      lastModified: new Date(),
    })),
    ...artists
      .filter((a): a is { publicSlug: string; updatedRef: Date } => Boolean(a.publicSlug))
      .map((a) => ({
        url: `${base}/a/${a.publicSlug}`,
        lastModified: a.updatedRef,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}

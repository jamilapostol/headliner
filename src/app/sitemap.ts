import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/lib/web-pages";
import { withErrorFallback } from "@/lib/action-error";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://headline.world";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only advertise pages that are actually public; a DB hiccup degrades to
  // the always-public auth/legal routes rather than failing the whole sitemap.
  const publicPages = await withErrorFallback("sitemap", [] as Array<{ slug: string; kind: string }>, () =>
    db.webPage.findMany({ where: { visibility: "public" }, select: { slug: true, kind: true } })
  );

  const marketingRoutes = publicPages.map((p) =>
    p.kind === "system" ? (SYSTEM_PAGES.find((s) => s.slug === p.slug)?.path ?? `/${p.slug}`) : `/${p.slug}`
  );

  const routes = [...new Set([...marketingRoutes, "/login", "/signup", "/terms", "/privacy"])];
  return routes.map((route) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
  }));
}

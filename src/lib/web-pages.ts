import { db } from "@/lib/db";

// The hardcoded marketing routes that admin can flip public/private.
// "home" is the special slug for the root page.
export const SYSTEM_PAGES = [
  { slug: "home", title: "Home (headline.world)", path: "/" },
  { slug: "landing", title: "Landing (/landing)", path: "/landing" },
  { slug: "beta", title: "Beta invite (/beta)", path: "/beta" },
] as const;

// Slugs a custom page may never claim — every existing top-level route plus
// infrastructure paths. Keeps admin-created pages from shadowing the app.
export const RESERVED_SLUGS = new Set([
  "home", "landing", "beta", "app", "admin", "login", "signup", "onboarding",
  "auth", "api", "invite", "unsubscribe", "forgot-password", "reset-password",
  "privacy", "terms", "mobile", "p", "static", "_next", "public",
  "robots.txt", "sitemap.xml", "favicon.ico", "manifest.json",
]);

// Missing row reads as private: if a gate row is ever deleted, the page goes
// dark instead of silently public — the safe direction while pre-launch.
export async function isPagePublic(slug: string): Promise<boolean> {
  const row = await db.webPage.findUnique({ where: { slug }, select: { visibility: true } });
  return row?.visibility === "public";
}

// One source of truth for this app's own address.
//
// NEXT_PUBLIC_APP_URL was read in eight places with FOUR different
// fallbacks: the apex in robots/sitemap, www in metadataBase, and
// http://localhost:3000 in the five that build links for emails, invites,
// Stripe returns and password resets. That last group is the dangerous
// one — if the variable were ever unset in production, password-reset and
// team-invite emails would carry localhost links and simply not work for
// the person receiving them, with nothing failing loudly to say so.
//
// The fallback here is the host that actually serves 200. The apex
// 308-redirects to www, so a self-reference pointing at it is a redirect
// every crawler and client has to follow, and a canonical URL pointing at
// a redirect is worse than none.

const CANONICAL_ORIGIN = "https://www.headline.world";

/** Absolute origin, no trailing slash. Env wins; the constant is the floor. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return CANONICAL_ORIGIN;
  return configured.replace(/\/+$/, "");
}

/** An absolute URL for a root-relative path, for canonicals and feeds. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

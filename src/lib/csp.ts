// Content Security Policy, in two tiers.
//
// The app is half static marketing pages and half authenticated, per-request
// app pages. A nonce-based policy forces every page it covers to render
// dynamically — Next injects the nonce during SSR, so a statically generated
// page's scripts would carry no nonce and the browser would block them. That
// would break /beta and /landing and give up static generation and CDN
// caching on exactly the pages that need them.
//
// So the enforced policy everywhere is a static-safe baseline that still
// blocks what matters most — remote script origins, object/embed, base-tag
// hijacking and cross-origin form posts.
//
// The strict nonce policy ships alongside it in Report-Only mode on the
// authenticated routes, which are already dynamic (see proxy.ts). Report-Only
// never blocks, so if the nonce doesn't reach the renderer the app keeps
// working and the browser console names the violation instead. Flip it to
// the enforcing header once a signed-in page loads clean — that check needs
// a real session, which is why it isn't enforced yet.
//
// style-src carries 'unsafe-inline' in both tiers on purpose: this codebase
// uses ~64 React style={{...}} attributes, and a nonce cannot authorize a
// style *attribute* — only a <style> element. Inline styles are a far
// smaller risk than inline scripts, which the strict tier does lock down.

const SUPABASE = "https://*.supabase.co";

const SHARED = [
  `img-src 'self' blob: data: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} wss://*.supabase.co`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

function join(directives: string[]): string {
  return directives.join("; ") + ";";
}

// Public pages. 'unsafe-inline' for scripts is the price of keeping these
// statically generated; 'self' still means an injected <script src> pointing
// at an attacker's origin will not load.
export function baselineCsp(isDev: boolean): string {
  return join([
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    ...SHARED,
  ]);
}

// Authenticated pages, where the sensitive data is. 'strict-dynamic' means
// only scripts carrying this request's nonce (and anything they load) can
// execute, so an injected inline script is inert.
export function strictCsp(nonce: string, isDev: boolean): string {
  return join([
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    ...SHARED,
  ]);
}

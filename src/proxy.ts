import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { strictCsp } from "@/lib/csp";

export async function proxy(request: NextRequest) {
  // A fresh nonce per request — Next reads it back out of the CSP header
  // during SSR and stamps it onto its own scripts. These routes are already
  // dynamic (they depend on the session), so the dynamic-rendering cost the
  // nonce approach carries is one we're already paying here.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = strictCsp(nonce, process.env.NODE_ENV === "development");

  // Next reads the nonce off the *request* while rendering, so it has to be
  // set before updateSession builds the response from this request.
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy-Report-Only", csp);

  const { response, user } = await updateSession(request);

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Report-Only until a signed-in page is confirmed to load without
  // violations; see src/lib/csp.ts. The enforced baseline comes from
  // next.config.ts and applies here too.
  response.headers.set("Content-Security-Policy-Report-Only", csp);

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/mobile"],
};

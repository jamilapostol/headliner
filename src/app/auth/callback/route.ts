import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase email links (invites, email confirmations)
// that use the PKCE `code` flow — exchanges the code for a session cookie,
// then continues on to whatever page the link was meant to open.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLockup } from "@/components/brand-lockup";
import { MfaVerifyForm } from "@/components/mfa-verify-form";

export const metadata = { title: "Two-factor check — HEADLINE.WORLD" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Already at AAL2 (or no factor enrolled) — nothing to verify here.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.currentLevel === aal.nextLevel) {
    redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <BrandLockup size={28} centered />
        </div>
        <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Two-factor check</h1>
        <p className="mb-7 text-center text-[13.5px] text-muted">Enter the 6-digit code from your authenticator app.</p>
        <MfaVerifyForm next={next} />
      </div>
    </div>
  );
}

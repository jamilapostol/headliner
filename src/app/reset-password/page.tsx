import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { ClosePageButton } from "@/components/close-page-button";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <ClosePageButton />
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.svg" alt="HEADLINE." width={28} height={28} />
          <span className="text-[15px] font-bold">HEADLINE.</span>
        </Link>
        {user ? (
          <>
            <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Set a new password</h1>
            <p className="mb-7 text-center text-[13.5px] text-muted">Make it something you haven&rsquo;t used before.</p>
            <ResetPasswordForm />
          </>
        ) : (
          <>
            <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Link expired</h1>
            <p className="mb-7 text-center text-[13.5px] text-muted">
              This reset link is no longer valid.{" "}
              <Link href="/forgot-password" className="text-accent">
                Request a new one
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

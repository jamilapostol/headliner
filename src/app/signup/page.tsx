import { BrandLockup } from "@/components/brand-lockup";
import { AuthForm } from "@/components/auth-form";
import { ClosePageButton } from "@/components/close-page-button";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <ClosePageButton />
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <BrandLockup size={28} centered href="/" />
        </div>
        <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Start free</h1>
        <p className="mb-7 text-center text-[13.5px] text-muted">
          Your first 5 bookings are on us. No card required.
        </p>
        <AuthForm mode="signup" action={signUp} referralCode={ref} />
      </div>
    </div>
  );
}

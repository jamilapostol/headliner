import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ClosePageButton } from "@/components/close-page-button";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <ClosePageButton />
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.svg" alt="HEADLINE." width={28} height={28} />
          <span className="text-[15px] font-bold">HEADLINE.</span>
        </Link>
        <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Start free</h1>
        <p className="mb-7 text-center text-[13.5px] text-muted">
          Your first 5 bookings are on us. No card required.
        </p>
        <AuthForm mode="signup" action={signUp} referralCode={ref} />
      </div>
    </div>
  );
}

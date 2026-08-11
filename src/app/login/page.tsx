import { BrandLockup } from "@/components/brand-lockup";
import { AuthForm } from "@/components/auth-form";
import { ClosePageButton } from "@/components/close-page-button";
import { logIn } from "@/lib/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const isAdmin = next === "/admin";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <ClosePageButton />
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <BrandLockup size={28} centered href="/" />
        </div>
        <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">
          {isAdmin ? "Admin sign in" : "Welcome back"}
        </h1>
        <p className="mb-7 text-center text-[13.5px] text-muted">
          {isAdmin ? "Log in with an admin account to continue." : "Log in to your soundboard."}
        </p>
        <AuthForm mode="login" action={logIn} next={next} />
      </div>
    </div>
  );
}

import { BrandLockup } from "@/components/brand-lockup";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { ClosePageButton } from "@/components/close-page-button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <ClosePageButton />
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <BrandLockup size={28} centered href="/" />
        </div>
        <h1 className="mb-1 text-center text-[26px] font-semibold tracking-tight">Reset your password</h1>
        <p className="mb-7 text-center text-[13.5px] text-muted">We&rsquo;ll email you a link to set a new one.</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

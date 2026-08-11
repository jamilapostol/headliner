import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-text">
      <div className="mb-8">
        <BrandLockup size={28} centered href="/" />
      </div>
      <div className="mb-2 font-sans text-[13px] tracking-[.1em] text-text/40">404</div>
      <h1 className="mb-2 text-[26px] font-semibold tracking-tight">Page not found</h1>
      <p className="mb-7 max-w-[380px] text-[13.5px] text-muted">
        That page doesn&rsquo;t exist, or it moved somewhere we haven&rsquo;t mapped yet.
      </p>
      <Link href="/" className="rounded-[10px] bg-accent px-6 py-3 text-[14px] font-semibold text-ink">
        Back to home
      </Link>
    </div>
  );
}

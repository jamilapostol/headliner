import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";

// Shown in place of a marketing page whose visibility is "private".
// Deliberately says nothing about the product — the page is dark on purpose.
export function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-text" data-theme="dark">
      <BrandLockup size={30} centered />
      <p className="mt-4 text-[14px] text-muted">We&apos;re setting the stage. Check back soon.</p>
      <Link href="/login" className="mt-8 text-[12.5px] text-muted/70 hover:text-text">
        Artist login →
      </Link>
    </div>
  );
}
